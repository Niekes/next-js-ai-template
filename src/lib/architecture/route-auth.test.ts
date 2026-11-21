import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vite-plus/test";

// Every route handler in src/app (Next.js serves route.ts from any folder) checks auth
// before it does anything else. A handler passes when it is wrapped in a withAdmin*
// helper from @/lib/auth/middleware, or when its body opens with
// `const user = await getUser(); if (!user) return ...` with getUser from
// @/lib/db/queries. Any other app file may read data only under the proxy-guarded
// dashboard/. Anything else fails here, so a route or page that reads data without an
// auth check cannot land unnoticed.

const ROOT = path.resolve(__dirname, "../../..");
const APP = path.join(ROOT, "src/app");
// src/proxy.ts requires a session for every page under it
const DASHBOARD = "src/app/dashboard/";
// every method Next.js routes to a handler export
const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
// better-auth's own handler is the sign-in endpoint, so it is public by design
const PUBLIC_ROUTES = ["src/app/api/auth/[...all]/route.ts"];

// Next.js serves every extension in its default pageExtensions
const isRouteFile = (name: string) => /^route\.[jt]sx?$/.test(name);

const appFiles = () =>
  readdirSync(APP, { recursive: true, encoding: "utf8" }).map((file) =>
    path.relative(ROOT, path.join(APP, file)),
  );

const routeFiles = () => appFiles().filter((file) => isRouteFile(path.basename(file)));

// parent nodes let getText() read each node's source
const parse = (code: string) => ts.createSourceFile("route.ts", code, ts.ScriptTarget.Latest, true);

// A name only counts when the real module provides it; a local look-alike does not
const importsFrom = (code: string, name: string, module: string) =>
  new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "${module}"`).test(code);

const isAdminWrapper = (init: ts.Expression, code: string) => {
  if (!ts.isCallExpression(init)) return false;
  const name = init.expression.getText();
  return /^withAdmin\w*$/.test(name) && importsFrom(code, name, "@/lib/auth/middleware");
};

// Matched on each statement's own source text: the first two statements of the body
// must read `const user = await getUser();` and `if (!user) return ...` (braces allowed)
const opensWithUserCheck = (first?: string, second?: string) => {
  const name = /^const (\w+) = await getUser\(\);$/.exec(first ?? "")?.[1];
  return !!name && new RegExp(`^if \\(!${name}\\)\\s*(\\{\\s*)?return\\b`).test(second ?? "");
};

const checksUserFirst = (init: ts.Expression, code: string) => {
  if (!ts.isArrowFunction(init) || !ts.isBlock(init.body)) return false;
  const [first, second] = init.body.statements.map((s) => s.getText());
  return opensWithUserCheck(first, second) && importsFrom(code, "getUser", "@/lib/db/queries");
};

type Handler = { name: string; init?: ts.Expression | undefined };

const isExported = (statement: ts.Statement) =>
  ts.canHaveModifiers(statement) &&
  !!ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

// Every way a module can export a name. Only `export const GET = ...` carries an
// initializer to check; any other form (function, destructuring, `export { x as GET }`,
// `export *`) has none, so it fails rather than slipping past unchecked.
const reExports = (statement: ts.ExportDeclaration): Handler[] => {
  const clause = statement.exportClause;
  return clause && ts.isNamedExports(clause)
    ? clause.elements.map((e) => ({ name: e.name.text }))
    : [{ name: "*" }];
};

const declared = (statement: ts.VariableStatement): Handler[] =>
  statement.declarationList.declarations.flatMap((d) =>
    ts.isIdentifier(d.name)
      ? [{ name: d.name.text, init: d.initializer }]
      : d.name.elements.map((e) => ({ name: e.getText() })),
  );

const exportsOf = (statement: ts.Statement): Handler[] => {
  if (ts.isExportDeclaration(statement)) return reExports(statement);
  if (!isExported(statement)) return [];
  if (ts.isFunctionDeclaration(statement)) return [{ name: statement.name?.text ?? "default" }];
  return ts.isVariableStatement(statement) ? declared(statement) : [];
};

const unguardedIn = (code: string): string[] =>
  parse(code)
    .statements.flatMap(exportsOf)
    .filter(({ name }) => METHODS.has(name) || name === "*")
    .filter(({ init }) => !init || !(isAdminWrapper(init, code) || checksUserFirst(init, code)))
    .map(({ name }) => name);

// Static, dynamic and require imports of the database or a feature's server/, by @/ or relative
// path (lint bans relative imports only in .ts/.tsx). Type-only imports count too: kept simple, safe side
const DATA_IMPORT =
  /(from|import|require)\s*\(?\s*["'](@|\.\.?(\/\.\.)*)\/(lib\/db|features\/[^"']*\/server)(?=["'/])/;
const importsData = (code: string) => DATA_IMPORT.test(code);

const publicDataReaders = () =>
  appFiles()
    .filter((file) => /\.[cm]?[jt]sx?$/.test(file) && !/\.test\.[cm]?[jt]sx?$/.test(file))
    // route handlers have their own check below, wherever they live
    .filter((file) => !isRouteFile(path.basename(file)) && !file.startsWith(DASHBOARD))
    .filter((file) => importsData(readFileSync(path.join(ROOT, file), "utf8")));

const WRAPPER_IMPORT = 'import { withAdmin, withAdminBody } from "@/lib/auth/middleware";';
const USER_IMPORT = 'import { getUser } from "@/lib/db/queries";';

describe("route auth: accepted shapes", () => {
  it("accepts a withAdmin* wrapper from the auth module", () => {
    expect(
      unguardedIn(`${WRAPPER_IMPORT}\nexport const GET = withAdminBody(schema, async () => ok());`),
    ).toEqual([]);
  });

  it("accepts an early getUser check, with or without braces or a line break", () => {
    expect(
      unguardedIn(
        [
          USER_IMPORT,
          "export const POST = async () => { const me = await getUser(); if (!me) return no(); return ok(); };",
          "export const PUT = async () => { const me = await getUser(); if (!me) { return no(); } return ok(); };",
          "export const PATCH = async () => { const me = await getUser(); if (!me)\n  return no(); return ok(); };",
        ].join("\n"),
      ),
    ).toEqual([]);
  });
});

describe("route auth: rejected shapes", () => {
  it("rejects handlers without an auth check, or with the check out of place", () => {
    expect(
      unguardedIn(
        [
          WRAPPER_IMPORT,
          USER_IMPORT,
          "export const GET = async () => ok();",
          "export const POST = async () => { const u = await getUser(); return ok(u); };",
          "export const PUT = async () => { log(); const u = await getUser(); if (!u) return no(); };",
          "export const PATCH = withUser(async () => ok());",
          "export const DELETE = async () => { try { const u = await getUser(); if (!u) return no(); } catch {} };",
          "export const OPTIONS = async () => ok();",
        ].join("\n"),
      ),
    ).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
  });

  it("rejects look-alikes that are not imported from the auth modules", () => {
    expect(
      unguardedIn(
        [
          'import { getUser } from "./stub";',
          "const withAdminLax = (h) => h;",
          "export const GET = withAdminLax(async () => ok());",
          "export const POST = async () => { const u = await getUser(); if (!u) return no(); };",
        ].join("\n"),
      ),
    ).toEqual(["GET", "POST"]);
  });

  it("rejects handlers exported in any form other than a checked const", () => {
    expect(
      unguardedIn(
        [
          USER_IMPORT,
          "export async function GET() { const u = await getUser(); if (!u) return no(); }",
          "export const { POST } = toNextJsHandler(auth);",
          "export { handler as PUT };",
          "export * from './other';",
          "export const helper = () => ok();",
        ].join("\n"),
      ),
    ).toEqual(["GET", "POST", "PUT", "*"]);
  });
});

describe("data access: import detection", () => {
  it("flags static, dynamic, require and relative imports of the database or a feature's server/", () => {
    expect(
      [
        'import { getUser } from "@/lib/db/queries";',
        'import { db } from "@/lib/db";',
        'import { listNotes } from "@/features/notes/server/notes";',
        'const m = await import("@/features/notes/server/notes");',
        'const { db } = require("@/lib/db");',
        // lint bans relative imports in src/app only for .ts/.tsx
        'import { getUser } from "../../lib/db/queries";',
        'const m = await import("../../features/notes/server/notes");',
      ].filter((code) => !importsData(code)),
    ).toEqual([]);
  });

  it("leaves other imports alone", () => {
    expect(
      [
        'import { NextResponse } from "next/server";',
        'import { authClient } from "@/lib/auth-client";',
        'import { x } from "@/lib/dbx";',
        'import { x } from "@/lib/db-utils";',
        'import { useNotes } from "@/features/notes/api/use-notes";',
      ].filter(importsData),
    ).toEqual([]);
  });
});

describe("route auth: repo routes", () => {
  it("scans every route file extension Next.js serves", () => {
    expect(["route.ts", "route.tsx", "route.js", "route.jsx"].every(isRouteFile)).toBe(true);
    expect(["route.test.ts", "page.tsx", "router.ts"].some(isRouteFile)).toBe(false);
  });

  it("leaves no route handler anywhere in src/app without an auth check", () => {
    const files = routeFiles().filter((file) => !PUBLIC_ROUTES.includes(file));
    const unguarded = files.flatMap((file) =>
      unguardedIn(readFileSync(path.join(ROOT, file), "utf8")).map((name) => `${file} ${name}`),
    );

    expect(files.length).toBeGreaterThan(0);
    expect(unguarded).toEqual([]);
  });

  it("reads data only behind an auth check: in route handlers or proxy-guarded dashboard/ files", () => {
    expect(publicDataReaders()).toEqual([]);
  });
});
