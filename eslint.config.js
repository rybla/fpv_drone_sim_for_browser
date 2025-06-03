import { defineConfig } from "eslint/config";

export default defineConfig({
  extends: ["eslint:recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
  include: ["src"],
});
