import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";

const ROOTS = ["src", "scripts"];

const isSourceFile = (entry: string) => /\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    return statSync(p).isDirectory() ? walk(p) : isSourceFile(entry) ? [p] : [];
  });

type Found = { file: string; name: string; loc: number; startLine: number };

const FUNCTION_KINDS = [
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.SetAccessor,
];

const declaredName = (node: ts.Node): string | null => {
  const named = node as ts.FunctionDeclaration | ts.MethodDeclaration | ts.AccessorDeclaration;
  return named.name ? named.name.getText(node.getSourceFile()) : null;
};

const assignedName = (node: ts.Node): string | null => {
  const parent = node.parent as { name?: ts.Node };
  return parent.name && ts.isIdentifier(parent.name) ? parent.name.text : null;
};

const nameOf = (node: ts.Node): string => declaredName(node) ?? assignedName(node) ?? "<anonymous>";

const spanOf = (node: ts.Node): { loc: number; startLine: number } => {
  const sf = node.getSourceFile();
  const start = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  return { loc: end - start + 1, startLine: start };
};

const visit = (node: ts.Node, file: string, found: Found[]): void => {
  if (FUNCTION_KINDS.includes(node.kind)) {
    const { loc, startLine } = spanOf(node);
    found.push({ file, name: nameOf(node), loc, startLine });
  }
  node.forEachChild((child) => {
    visit(child, file, found);
  });
};

const scanFile = (file: string): Found[] => {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const found: Found[] = [];
  visit(sf, file, found);
  return found;
};

const collectAll = (): Found[] => {
  const found: Found[] = [];
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      found.push(...scanFile(file));
    }
  }
  return found;
};

const byDescendingSize = (a: Found, b: Found) => b.loc - a.loc;

const report = (found: Found[]): void => {
  const band = found.filter((f) => f.loc >= 31 && f.loc <= 60).sort(byDescendingSize);
  process.stdout.write(
    `total functions: ${String(found.length)}, in 31-60 band: ${String(band.length)}\n`,
  );
  let last = "";
  for (const f of band) {
    const prefix = f.file !== last ? `\n${f.file}\n` : "";
    last = f.file;
    process.stdout.write(
      `${prefix}  ${String(f.loc).padStart(3)}  ${f.name}  (line ${String(f.startLine)})\n`,
    );
  }
};

const main = () => {
  report(collectAll());
};

main();
