import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

// Claude Code reads .mcp.json. The server list is fixed here, so adding or dropping
// a server needs approval (this file is a guardrail). Versions: npx servers from
// devDependencies follow the lockfile, the others carry an exact version.

const ROOT = path.resolve(__dirname, "../../..");
const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));

const SERVERS = {
  "better-auth": "https://mcp.better-auth.com/mcp",
  "bulletproof-react": "https://gitmcp.io/alan2207/bulletproof-react",
  "chrome-devtools": "npx -y chrome-devtools-mcp@1.13.0",
  fallow: "npx fallow-mcp",
  "next-devtools": "npx -y next-devtools-mcp@0.4.0",
  shadcn: "npx shadcn mcp",
};

type ClaudeServer =
  | { type: "stdio"; command: string; args?: string[] }
  | { type: "http"; url: string };

// The command line of a local server, or the URL of a remote one
const launch = (server: ClaudeServer) =>
  server.type === "http" ? server.url : [server.command, ...(server.args ?? [])].join(" ");

describe("MCP wiring", () => {
  it("configures the pinned servers, each started the pinned way", () => {
    const { mcpServers } = readJson(".mcp.json") as { mcpServers: Record<string, ClaudeServer> };
    const launches = Object.fromEntries(
      Object.entries(mcpServers).map(([name, server]) => [name, launch(server)]),
    );
    expect(launches).toEqual(SERVERS);
  });

  it("enables the project servers in Claude Code without an opt-in prompt", () => {
    const settings = readJson(".claude/settings.json") as { enableAllProjectMcpServers?: boolean };
    expect(settings.enableAllProjectMcpServers).toBe(true);
  });
});
