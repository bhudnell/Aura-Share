import jsPlugin from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import html from "eslint-plugin-html";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default [
  jsPlugin.configs.recommended,
  importPlugin.flatConfigs.recommended,
  eslintConfigPrettier,
  {
    plugins: { html },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        pf1: "readonly",
        canvas: "readonly",
        foundry: "readonly",
        CONST: "readonly",
        game: "readonly",
        Hooks: "readonly",
        Roll: "readonly",
        fromUuidSync: "readonly",
        renderTemplate: "readonly",
      },
    },
    rules: {
      "no-underscore-dangle": "off",
      "import/extensions": "off",
      "class-methods-use-this": "off",
      "no-await-in-loop": "warn",
      "no-constant-binary-expression": "warn",
      "no-duplicate-imports": "warn",
      curly: "warn",
      "dot-notation": "warn",
      eqeqeq: ["warn", "smart"],
      "no-else-return": "warn",
      "no-unused-vars": "off",
      "import/order": [
        "warn",
        {
          alphabetize: { order: "asc" },
          groups: ["builtin", "external", "internal", "parent", "sibling"],
          "newlines-between": "always",
        },
      ],
    },
  },
];
