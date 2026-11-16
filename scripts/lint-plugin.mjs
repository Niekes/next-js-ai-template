// Local oxlint plugin: Oxlint has no `no-restricted-syntax`, so `local/no-restricted-syntax`
// takes ESLint's options and keeps the esquery selectors portable.
import { definePlugin, defineRule } from "vite-plus/lint/plugins";

// ahooks has no clipboard hook; the first caller adds one and exempts it in vite.config.ts
export const CLIPBOARD_MESSAGE = "Add a useCopyToClipboard hook in src/lib/hooks/";

// Turning off TLS checks lets anyone on the path rewrite the response; an approved
// exception is a file override in vite.config.ts
export const TLS_BAN = {
  selector:
    "Property[value.value=false]:matches([key.name='rejectUnauthorized'], [key.value='rejectUnauthorized'])",
  message:
    "Keep TLS certificate checks on; an exception is a file override in vite.config.ts, pinned by src/lib/architecture/security-wiring.test.ts.",
};

// A Server Action is a public POST endpoint that route-auth.test.ts does not see
const SERVER_ACTION_BAN = {
  selector: "ExpressionStatement[directive='use server']",
  message:
    "Server Actions are public POST endpoints outside route-auth.test.ts; add an API route with withAdmin* or getUser() instead.",
};

export const RESTRICTED_SYNTAX = [
  TLS_BAN,
  SERVER_ACTION_BAN,
  {
    selector: "TSEnumDeclaration",
    message: "Use a union of string literals or an `as const` object instead of an enum.",
  },
  {
    selector: "VariableDeclarator > FunctionExpression",
    message: "Use an arrow function: `const f = () => {...}`.",
  },
  {
    selector: "ExportDefaultDeclaration > FunctionDeclaration",
    message: "Use `const Name = () => {...}; export default Name;`.",
  },
  {
    // no-restricted-properties only sees navigator.clipboard, not window.navigator.clipboard
    selector: "MemberExpression[object.property.name='navigator'][property.name='clipboard']",
    message: CLIPBOARD_MESSAGE,
  },
];

const noRestrictedSyntax = defineRule({
  meta: {
    type: "suggestion",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: { selector: { type: "string" }, message: { type: "string" } },
        required: ["selector", "message"],
        additionalProperties: false,
      },
    },
  },
  create: (context) =>
    Object.fromEntries(
      context.options.map(({ selector, message }) => [
        selector,
        (node) => context.report({ node, message }),
      ]),
    ),
});

export default definePlugin({
  meta: { name: "local" },
  rules: { "no-restricted-syntax": noRestrictedSyntax },
});
