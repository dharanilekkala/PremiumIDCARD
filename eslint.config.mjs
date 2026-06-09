import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Next.js build output
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Public assets — minified workers and third-party bundles must not be linted
    "public/**",
  ]),

  // ── Rule overrides ────────────────────────────────────────────────────────────
  // The react-hooks v5 "compiler" rules are experimental and flag valid patterns.
  // Downgrade from "error" to "warn" so they don't fail CI while the codebase
  // incrementally adopts React Compiler conventions.
  {
    rules: {
      // "Calling setState synchronously within an effect can trigger cascading renders"
      "react-hooks/set-state-in-effect": "warn",
      // "Cannot access refs during render"
      "react-hooks/refs": "warn",
      // "Cannot create components during render" (component defined inside component)
      "react-hooks/static-components": "warn",
      // Other react-hooks compiler rules
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-render": "warn",
    },
  },
]);

export default eslintConfig;
