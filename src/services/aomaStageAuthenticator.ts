/*
  AOMA Staging Authenticator Service

  Responsibilities:
  - Validate env: AAD_USERNAME, AAD_PASSWORD, AOMA_STAGE_URL
  - Load Playwright storage state from tmp/aoma-stage-storage.json
  - Extract cookies to construct HTTP Cookie header
  - Validate session by hitting a lightweight authenticated endpoint on AOMA staging
  - Trigger re-authentication via scripts/aoma-stage-login.js when needed
  - Provide cookie header for Firecrawl requests
  - Basic rate limiting between auth attempts and robust logging for demos
*/

import { spawn } from "node:child_process";
import { readFile, writeFile, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { URL } from "node:url";

type PlaywrightCookie = {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
};

type PlaywrightStorageState = {
  cookies?: PlaywrightCookie[];
  origins?: Array<{
    origin: string;
    localStorage?: Array<{ name: string; value: string }>;
    sessionStorage?: Array<{ name: string; value: string }>;
  }>;
};

export class AomaStageAuthenticator {
  private readonly storageStatePath: string;
  private readonly cookieExportPath: string;
  private readonly loginScriptPath: string;
  private readonly aomaStageUrl: string;
  private readonly reauthCooldownMs: number;
  private lastAuthAttemptAt = 0;
  private lastCookieHeader: string | null = null;

  constructor() {
    this.storageStatePath = path.resolve(process.cwd(), "tmp/aoma-stage-storage.json");
    this.cookieExportPath = path.resolve(process.cwd(), "tmp/aoma-cookie.txt");
    this.loginScriptPath = path.resolve(process.cwd(), "scripts/aoma-stage-login.js");
    this.aomaStageUrl = process.env.AOMA_STAGE_URL || "https://aoma-stage.smcdp-de.net";
    this.reauthCooldownMs = 10_000;
    // Don't assert env in constructor - only when actually used to allow builds without credentials
  }

  public async ensureAuthenticated(): Promise<string> {
    // Check env only when method is called, not at instantiation
    this.assertEnv();
    const loaded = await this.tryLoadValidSession();
    if (loaded.ok && loaded.cookieHeader) {
      this.lastCookieHeader = loaded.cookieHeader;
      return loaded.cookieHeader;
    }

    const refreshed = await this.refreshAuthentication();
    if (!refreshed) {
      throw new Error("Failed to refresh AOMA staging authentication");
    }

    const after = await this.tryLoadValidSession();
    if (after.ok && after.cookieHeader) {
      this.lastCookieHeader = after.cookieHeader;
      return after.cookieHeader;
    }
    throw new Error("Authentication refresh completed but session is still invalid");
  }

  public async getCookieHeader(): Promise<string> {
    if (this.lastCookieHeader) return this.lastCookieHeader;
    return this.ensureAuthenticated();
  }

  private assertEnv() {
    const missing: string[] = [];
    if (!process.env.AAD_USERNAME) missing.push("AAD_USERNAME");
    if (!process.env.AAD_PASSWORD) missing.push("AAD_PASSWORD");
    if (!this.aomaStageUrl) missing.push("AOMA_STAGE_URL");
    if (missing.length > 0) {
      const message = `Missing required environment variables: ${missing.join(", ")}`;
      throw new Error(message);
    }
  }

  private async fileExists(p: string): Promise<boolean> {
    try {
      await access(p, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async tryLoadValidSession(): Promise<{ ok: boolean; cookieHeader?: string }> {
    const exists = await this.fileExists(this.storageStatePath);
    if (!exists) {
      return { ok: false };
    }
    const storage = await this.loadStorageState();
    const cookies = this.filterCookiesForDomain(storage.cookies || [], this.aomaStageUrl);
    if (cookies.length === 0) {
      return { ok: false };
    }
    const cookieHeader = this.buildCookieHeader(cookies);
    const valid = await this.isSessionValid(cookieHeader);
    if (!valid) {
      return { ok: false };
    }
    await this.persistCookieHeader(cookieHeader);
    return { ok: true, cookieHeader };
  }

  private async loadStorageState(): Promise<PlaywrightStorageState> {
    const raw = await readFile(this.storageStatePath, "utf8");
    const json = JSON.parse(raw) as PlaywrightStorageState;
    return json;
  }

  private filterCookiesForDomain(
    cookies: PlaywrightCookie[],
    targetUrl: string
  ): PlaywrightCookie[] {
    const u = new URL(targetUrl);
    const hostname = u.hostname;
    const now = Math.floor(Date.now() / 1000);
    return cookies.filter((c) => {
      const domain = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
      const domainMatches = hostname === domain || hostname.endsWith(`.${domain}`);
      const notExpired = typeof c.expires !== "number" || c.expires === -1 || c.expires > now;
      return domainMatches && notExpired;
    });
  }

  private buildCookieHeader(cookies: PlaywrightCookie[]): string {
    return cookies
      .map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`)
      .join("; ");
  }

  private async isSessionValid(cookieHeader: string): Promise<boolean> {
    try {
      const url = new URL(this.aomaStageUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch(url.toString(), {
        method: "HEAD",
        headers: {
          Cookie: cookieHeader,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status >= 200 && res.status < 300) return true;
      const location = res.headers.get("location") || "";
      if (/login|signin|aad|microsoftonline|azure/i.test(location)) return false;
      if (res.status === 401 || res.status === 403) return false;
      return false;
    } catch (error) {
      console.log(
        `⚠️  Session validation failed:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  private async persistCookieHeader(cookieHeader: string): Promise<void> {
    try {
      await writeFile(this.cookieExportPath, cookieHeader, "utf8");
    } catch {}
  }

  private async refreshAuthentication(): Promise<boolean> {
    const now = Date.now();
    const since = now - this.lastAuthAttemptAt;
    if (since < this.reauthCooldownMs) {
      const waitMs = this.reauthCooldownMs - since;
      await new Promise((r) => setTimeout(r, waitMs));
    }
    this.lastAuthAttemptAt = Date.now();

    const exists = await this.fileExists(this.loginScriptPath);
    if (!exists) {
      return false;
    }

    const env = {
      ...process.env,
      AAD_USERNAME: process.env.AAD_USERNAME as string,
      AAD_PASSWORD: process.env.AAD_PASSWORD as string,
      AOMA_STAGE_URL: this.aomaStageUrl,
      AOMA_LOGIN_MAX_WAIT_MS: process.env.AOMA_LOGIN_MAX_WAIT_MS || "180000",
    };

    const result = await this.runNodeScript(this.loginScriptPath, ["--non-interactive"], env);
    if (!result.ok) {
      return false;
    }
    await new Promise((r) => setTimeout(r, 1500));
    return true;
  }

  private runNodeScript(
    scriptPath: string,
    args: string[] = [],
    env?: NodeJS.ProcessEnv
  ): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn(process.execPath, [scriptPath, ...args], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr }));
      setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {}
      }, 240000);
    });
  }
}

export const aomaStageAuthenticator = new AomaStageAuthenticator();
