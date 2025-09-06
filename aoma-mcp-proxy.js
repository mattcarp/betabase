#!/usr/bin/env node

/**
 * AOMA MCP Proxy for Railway Server
 * Bridges MCP stdio protocol to Railway HTTP API
 */

const readline = require("readline");
const fetch = require("node-fetch");

// Use Railway production deployment - AOMA is ALWAYS UP!
const RAILWAY_URL = "https://luminous-dedication-production.up.railway.app";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Send initialization response
const initResponse = {
  jsonrpc: "2.0",
  id: "init",
  result: {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "aoma-mesh-proxy",
      version: "1.0.0",
    },
  },
};

// Log to stderr for debugging
function log(message) {
  process.stderr.write(`[AOMA Proxy] ${message}\n`);
}

log("Starting AOMA MCP Proxy...");

rl.on("line", async (line) => {
  try {
    const request = JSON.parse(line);
    log(`Received: ${request.method}`);

    let response;

    switch (request.method) {
      case "initialize":
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "aoma-mesh-proxy",
              version: "1.0.0",
            },
          },
        };
        break;

      case "tools/list":
        response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: [
              {
                name: "query_aoma_knowledge",
                description: "Query Sony Music AOMA knowledge base",
                inputSchema: {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    strategy: {
                      type: "string",
                      enum: ["comprehensive", "focused", "rapid"],
                      default: "focused",
                    },
                  },
                  required: ["query"],
                },
              },
            ],
          },
        };
        break;

      case "tools/call":
        try {
          const railwayResponse = await fetch(`${RAILWAY_URL}/rpc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: request.params,
            }),
          });

          const railwayData = await railwayResponse.json();

          response = {
            jsonrpc: "2.0",
            id: request.id,
            result: railwayData.result,
          };
        } catch (error) {
          response = {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32603,
              message: error.message,
            },
          };
        }
        break;

      default:
        response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
    }

    process.stdout.write(JSON.stringify(response) + "\n");
    log(`Sent response for: ${request.method}`);
  } catch (error) {
    log(`Error: ${error.message}`);
    const errorResponse = {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error",
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + "\n");
  }
});

// Handle shutdown
process.on("SIGINT", () => {
  log("Shutting down...");
  process.exit(0);
});
