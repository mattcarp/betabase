import type { PerformanceMetricsSnapshot } from "./systemMetricsCollector";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export type AlertSeverity = "warning" | "critical";

export interface PerformanceAlert {
  id: string;
  ruleId: string;
  category: string;
  metricLabel: string;
  severity: AlertSeverity;
  message: string;
  triggeredAt: string;
  value: number;
  valueDisplay: string;
  threshold: number;
  thresholdDisplay: string;
  comparator: "above" | "below";
  context?: Record<string, string>;
}

type AlertUnit = "ms" | "percent" | "hours" | "days" | "count";

interface NumericRule {
  id: string;
  category: string;
  metricLabel: string;
  value: number;
  warning: number;
  critical: number;
  comparator: "above" | "below";
  unit: AlertUnit;
  context?: Record<string, string>;
  triggeredAt?: string;
  helpText?: string;
}

const severityWeight: Record<AlertSeverity, number> = {
  warning: 1,
  critical: 2,
};

const REGION = process.env.AWS_REGION || "us-east-1";
let sesClient: SESClient | null = null;

function getSesClient(): SESClient | null {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }

  if (!sesClient) {
    sesClient = new SESClient({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return sesClient;
}

const DEFAULT_ALERT_FROM_EMAIL = "alerts@siam-monitoring.local";

export function evaluatePerformanceAlerts(
  snapshot: PerformanceMetricsSnapshot
): PerformanceAlert[] {
  const rules = buildRules(snapshot);
  const alerts: PerformanceAlert[] = [];

  for (const rule of rules) {
    const alert = evaluateRule(rule);
    if (alert) {
      alerts.push(alert);
    }
  }

  alerts.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
  return alerts;
}

function evaluateRule(rule: NumericRule): PerformanceAlert | null {
  if (rule.value === undefined || Number.isNaN(rule.value)) {
    return null;
  }

  const severity =
    rule.comparator === "above"
      ? rule.value >= rule.critical
        ? "critical"
        : rule.value >= rule.warning
          ? "warning"
          : null
      : rule.value <= rule.critical
        ? "critical"
        : rule.value <= rule.warning
          ? "warning"
          : null;

  if (!severity) {
    return null;
  }

  const thresholdValue = severity === "critical" ? rule.critical : rule.warning;
  const comparatorText = rule.comparator === "above" ? "exceeds" : "dropped below";
  const valueDisplay = formatValue(rule.value, rule.unit);
  const thresholdDisplay = formatValue(thresholdValue, rule.unit);

  return {
    id: buildAlertId(rule.id, rule.context),
    ruleId: rule.id,
    category: rule.category,
    metricLabel: rule.metricLabel,
    severity,
    message: `${rule.metricLabel} ${comparatorText} ${thresholdDisplay} (currently ${valueDisplay}).`,
    triggeredAt: new Date().toISOString(),
    value: rule.value,
    valueDisplay,
    threshold: thresholdValue,
    thresholdDisplay,
    comparator: rule.comparator,
    context: rule.context,
  };
}

function buildRules(snapshot: PerformanceMetricsSnapshot): NumericRule[] {
  const rules: NumericRule[] = [
    {
      id: "query.avgResponseTime",
      category: "Query Performance",
      metricLabel: "Average response time",
      value: snapshot.queryMetrics.avgResponseTime,
      warning: 800,
      critical: 1200,
      comparator: "above",
      unit: "ms",
    },
    {
      id: "query.p95ResponseTime",
      category: "Query Performance",
      metricLabel: "P95 response time",
      value: snapshot.queryMetrics.p95ResponseTime,
      warning: 1200,
      critical: 2000,
      comparator: "above",
      unit: "ms",
    },
    {
      id: "query.p99ResponseTime",
      category: "Query Performance",
      metricLabel: "P99 response time",
      value: snapshot.queryMetrics.p99ResponseTime,
      warning: 2000,
      critical: 3000,
      comparator: "above",
      unit: "ms",
    },
    {
      id: "query.errorRate",
      category: "Query Performance",
      metricLabel: "Error rate",
      value: snapshot.queryMetrics.errorRate,
      warning: 5,
      critical: 10,
      comparator: "above",
      unit: "percent",
    },
    {
      id: "query.successRate",
      category: "Query Performance",
      metricLabel: "Success rate",
      value: snapshot.queryMetrics.successRate,
      warning: 95,
      critical: 90,
      comparator: "below",
      unit: "percent",
    },
    {
      id: "system.cpuUsage",
      category: "System Health",
      metricLabel: "CPU usage",
      value: snapshot.systemMetrics.cpuUsage,
      warning: 70,
      critical: 90,
      comparator: "above",
      unit: "percent",
    },
    {
      id: "system.memoryUsage",
      category: "System Health",
      metricLabel: "Memory usage",
      value: snapshot.systemMetrics.memoryUsage,
      warning: 70,
      critical: 90,
      comparator: "above",
      unit: "percent",
    },
    {
      id: "system.diskUsage",
      category: "System Health",
      metricLabel: "Disk usage",
      value: snapshot.systemMetrics.diskUsage,
      warning: 80,
      critical: 90,
      comparator: "above",
      unit: "percent",
    },
    {
      id: "system.networkLatency",
      category: "System Health",
      metricLabel: "Network latency",
      value: snapshot.systemMetrics.networkLatency,
      warning: 200,
      critical: 400,
      comparator: "above",
      unit: "ms",
    },
    {
      id: "data.vectorStaleness",
      category: "Data Freshness",
      metricLabel: "Vector store staleness",
      value: snapshot.dataFreshness.vectorStore.staleness,
      warning: 24,
      critical: 72,
      comparator: "above",
      unit: "hours",
    },
    {
      id: "data.cacheHitRate",
      category: "Data Freshness",
      metricLabel: "AOMA cache hit rate",
      value: snapshot.dataFreshness.aomaCache.cacheHitRate * 100,
      warning: 80,
      critical: 70,
      comparator: "below",
      unit: "percent",
    },
    {
      id: "data.knowledgeBaseStaleness",
      category: "Data Freshness",
      metricLabel: "Knowledge base freshness",
      value: snapshot.dataFreshness.knowledgeBase.lastUpdate
        ? getHoursSince(snapshot.dataFreshness.knowledgeBase.lastUpdate)
        : Number.POSITIVE_INFINITY,
      warning: 24 * 3,
      critical: 24 * 7,
      comparator: "above",
      unit: "hours",
    },
  ];

  for (const apiMetric of snapshot.apiMetrics) {
    const requestCount = apiMetric.requestCount || 0;
    const errorRate = requestCount ? (apiMetric.errorCount / requestCount) * 100 : 0;
    rules.push(
      {
        id: "api.latency",
        category: "API Performance",
        metricLabel: `${apiMetric.endpoint} latency`,
        value: apiMetric.avgLatency,
        warning: 300,
        critical: 600,
        comparator: "above",
        unit: "ms",
        context: { endpoint: apiMetric.endpoint },
      },
      {
        id: "api.errorRate",
        category: "API Performance",
        metricLabel: `${apiMetric.endpoint} error rate`,
        value: errorRate,
        warning: 2,
        critical: 5,
        comparator: "above",
        unit: "percent",
        context: { endpoint: apiMetric.endpoint },
      }
    );
  }

  return rules;
}

function formatValue(value: number, unit: AlertUnit): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  switch (unit) {
    case "ms":
      return `${value.toFixed(0)}ms`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "hours":
      if (value >= 24) {
        return `${(value / 24).toFixed(1)}d`;
      }
      return `${value.toFixed(1)}h`;
    case "days":
      return `${value.toFixed(1)}d`;
    default:
      return value.toFixed(1);
  }
}

function buildAlertId(ruleId: string, context?: Record<string, string>): string {
  if (!context) {
    return ruleId;
  }

  const suffix = Object.entries(context)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
  return `${ruleId}:${suffix}`;
}

function getHoursSince(timestamp: string): number {
  return (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
}

export async function notifyPerformanceAlertChanges({
  currentAlerts = [],
  previousAlerts = [],
}: {
  currentAlerts?: PerformanceAlert[];
  previousAlerts?: PerformanceAlert[];
}) {
  const previousMap = new Map(previousAlerts.map((alert) => [alert.id, alert]));
  const currentMap = new Map(currentAlerts.map((alert) => [alert.id, alert]));

  const triggered: PerformanceAlert[] = [];
  const resolved: PerformanceAlert[] = [];

  for (const alert of currentAlerts) {
    const previous = previousMap.get(alert.id);
    if (!previous || severityWeight[alert.severity] > severityWeight[previous.severity]) {
      triggered.push(alert);
    }
  }

  for (const alert of previousAlerts) {
    if (!currentMap.has(alert.id)) {
      resolved.push(alert);
    }
  }

  if (!triggered.length && !resolved.length) {
    return;
  }

  await Promise.allSettled([
    sendSlackNotification(triggered, resolved),
    sendEmailNotification(triggered, resolved),
  ]);
}

async function sendSlackNotification(triggered: PerformanceAlert[], resolved: PerformanceAlert[]) {
  const webhook =
    process.env.PERFORMANCE_ALERT_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL;

  if (!webhook || (!triggered.length && !resolved.length)) {
    return;
  }

  const lines: string[] = [];

  if (triggered.length) {
    lines.push(
      `🚨 *${triggered.length} performance alert${triggered.length > 1 ? "s" : ""} active*`,
      ...triggered.map(
        (alert) =>
          `• *${alert.category}* – ${alert.metricLabel}: ${alert.valueDisplay} (${alert.severity.toUpperCase()})`
      )
    );
  }

  if (resolved.length) {
    lines.push(
      "",
      `✅ ${resolved.length} alert${resolved.length > 1 ? "s" : ""} resolved`,
      ...resolved.map((alert) => `• ${alert.metricLabel}`)
    );
  }

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
  } catch (error) {
    console.error("[Alerts] Failed to send Slack notification", error);
  }
}

async function sendEmailNotification(triggered: PerformanceAlert[], resolved: PerformanceAlert[]) {
  const recipients =
    process.env.PERFORMANCE_ALERT_EMAILS?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) ?? [];

  if (!recipients.length || (!triggered.length && !resolved.length)) {
    return;
  }

  const client = getSesClient();
  if (!client) {
    console.warn("[Alerts] SES credentials missing; skipping email notification");
    return;
  }

  const subject =
    triggered.length > 0
      ? `SIAM Performance Alerts (${triggered.length} active)`
      : "SIAM Performance Alerts resolved";

  const bodyLines: string[] = [];

  if (triggered.length) {
    bodyLines.push("New or escalated alerts:", "");
    triggered.forEach((alert) => {
      bodyLines.push(
        `- ${alert.metricLabel} (${alert.category}): ${alert.valueDisplay} (${alert.severity}) – threshold ${alert.thresholdDisplay}`
      );
    });
    bodyLines.push("");
  }

  if (resolved.length) {
    bodyLines.push("Resolved alerts:", "");
    resolved.forEach((alert) => {
      bodyLines.push(`- ${alert.metricLabel} (${alert.category})`);
    });
  }

  const body = bodyLines.join("\n");

  try {
    const command = new SendEmailCommand({
      Source: process.env.PERFORMANCE_ALERT_EMAIL_FROM || DEFAULT_ALERT_FROM_EMAIL,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: body },
        },
      },
    });
    await client.send(command);
  } catch (error) {
    console.error("[Alerts] Failed to send email notification", error);
  }
}

