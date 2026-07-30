import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  //
  // These must be `**/`-prefixed, not root-anchored: agent worktrees under
  // .claude/worktrees/ are full checkouts of this repo and carry their own
  // build output, so a root-anchored ".next/**" leaves tens of thousands of
  // generated-code findings in the report and buries the real ones.
  globalIgnores([
    // Default ignores of eslint-config-next, un-anchored:
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/node_modules/**",
    "**/next-env.d.ts",
    // Nested checkouts of this same repo.
    ".claude/worktrees/**",
  ]),
  {
    rules: {
      // A leading underscore is the project's way of saying "required by the
      // signature, deliberately unused" — e.g. Next.js route handlers that take
      // (req) only to match the framework's shape.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
