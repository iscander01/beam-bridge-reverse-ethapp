module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "react-hooks", "unused-imports"],
  ignorePatterns: ["html/", "node_modules/", "dist/", "build/", "coverage/"],
  rules: {
    "no-console": ["error", { allow: ["info", "error"] }],
    "prettier/prettier": "warn",
    "@typescript-eslint/no-unused-vars": 1,
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/ban-ts-ignore": 0,
    "import/no-unresolved": [0, { commonjs: true, amd: true }],
    //"import/named": 2,
    "import/namespace": 2,
    "import/default": 2,
    "import/export": 2,
    "import/order": [
      "warn",
      {
        groups: [
          "builtin", // Built-in types are first
          "external",
          ["sibling", "parent"], // Then sibling and parent types. They can be mingled together
          "index", // Then the index file
          "object",
          // Then the rest: internal and external type
        ],
        "newlines-between": "always",
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname,
      },
    },
  ],
  settings: {
    react: {
      version: "latest",
    },
  },
};
