import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vite-plus/test";

// Every API route handler checks auth before it does anything else. A handler
// passes when it is wrapped in a withAdmin* helper from @/lib/auth/middleware, or
// when its body opens with `const user = await getUser(); if (!user) return ...`
// with getUser from @/lib/db/queries. Anything else fails here, so a new route
// without an auth check cannot land unnoticed.

const ROOT = path.resolve(__dirname, "../../..");
const API = path.join(ROOT, "src/app/api");
// every method Next.js routes to a handler export
const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
// better-auth's own handler is the sign-in endpoint, so it is public by design
const PUBLIC_ROUTES = ["src/app/api/auth/[...all]/route.ts"];

// Next.js serves every extension in its default pageExtensions
const isRouteFile = (name: string) => /^route\.[jt]sx?$/.test(name);

const routeFiles = () =>
  readdirSync(API, { recursive: true, encoding: "utf8" })
    .filter((file) => isRouteFile(path.basename(file)))
    .map((file) => path.relative(ROOT, path.join(API, file)));

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

describe("route auth: repo routes", () => {
  it("scans every route file extension Next.js serves", () => {
    expect(["route.ts", "route.tsx", "route.js", "route.jsx"].every(isRouteFile)).toBe(true);
    expect(["route.test.ts", "page.tsx", "router.ts"].some(isRouteFile)).toBe(false);
  });

  it("leaves no API route handler without an auth check", () => {
    const files = routeFiles().filter((file) => !PUBLIC_ROUTES.includes(file));
    const unguarded = files.flatMap((file) =>
      unguardedIn(readFileSync(path.join(ROOT, file), "utf8")).map((name) => `${file} ${name}`),
    );

    expect(files.length).toBeGreaterThan(0);
    expect(unguarded).toEqual([]);
  });
});
