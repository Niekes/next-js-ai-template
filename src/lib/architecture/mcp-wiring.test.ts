import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

// Claude Code reads .mcp.json, opencode reads opencode.json. Both agents get the same
// MCP servers, started the same way. The list is pinned here, so adding or dropping
// a server needs approval (this file is a guardrail).

const ROOT = path.resolve(__dirname, "../../..");
const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));

const SERVERS = [
  "better-auth",
  "bulletproof-react",
  "chrome-devtools",
  "fallow",
  "next-devtools",
  "shadcn",
];

type ClaudeServer =
  | { type: "stdio"; command: string; args?: string[] }
  | { type: "http"; url: string };
type OpencodeServer = { type: "local"; command: string[] } | { type: "remote"; url: string };

// One shape for both formats: the command line of a local server, or the URL of a remote one
const fromClaude = (server: ClaudeServer) =>
  server.type === "http" ? server.url : [server.command, ...(server.args ?? [])].join(" ");
const fromOpencode = (server: OpencodeServer) =>
  server.type === "remote" ? server.url : server.command.join(" ");

// Each server keyed by name, mapped to how it starts
const launches = <S>(servers: Record<string, S>, launch: (server: S) => string) =>
  Object.fromEntries(Object.entries(servers).map(([name, server]) => [name, launch(server)]));

describe("MCP wiring", () => {
  const claude = (readJson(".mcp.json") as { mcpServers: Record<string, ClaudeServer> }).mcpServers;
  const opencode = (
    readJson("opencode.json") as { mcp: Record<string, OpencodeServer & { enabled: boolean }> }
  ).mcp;

  it("configures the pinned servers for both agents", () => {
    expect(Object.keys(claude).sort()).toEqual(SERVERS);
    expect(Object.keys(opencode).sort()).toEqual(SERVERS);
  });

  it("starts each server the same way in both agents, and opencode enables all", () => {
    expect(launches(opencode, (s) => `${fromOpencode(s)} enabled=${String(s.enabled)}`)).toEqual(
      launches(claude, (s) => `${fromClaude(s)} enabled=true`),
    );
  });

  it("enables the project servers in Claude Code without an opt-in prompt", () => {
    const settings = readJson(".claude/settings.json") as { enableAllProjectMcpServers?: boolean };
    expect(settings.enableAllProjectMcpServers).toBe(true);
  });
});
