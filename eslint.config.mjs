import nextConfig from "eslint-config-next";

const additionalIgnores = [
  "**/node_modules/**",
  "dist/**",
  "coverage/**",
  "out/**",
  "tests/playwright-report/**",
  "playwright-report-visual/**",
  "html/**",
  "src/hooks/usePermissions 2.ts",
  "src/hooks/usePermissions 2.tsx",
  "src/hooks/usePermissions.ts",
  "src/hooks/usePermissions.tsx",
  "src/app-backup/**",
  "**/*.backup.*",
  "**/*.old.*",
  "**/*.disabled",
];

const extendedConfig = nextConfig.map((config) => {
  if (config.name === "next") {
    return {
      ...config,
      rules: {
        ...config.rules,
        "@next/next/no-img-element": "warn",
        "@next/next/no-html-link-for-pages": "warn",
        "@next/next/no-assign-module-variable": "warn",
        "@next/next/no-document-import-in-page": "warn",
        "@next/next/no-duplicate-head": "warn",
        "@next/next/no-head-import-in-document": "warn",
        "@next/next/no-script-component-in-head": "warn",
        "no-console": "off",
        "no-debugger": "warn",
        "no-duplicate-imports": "warn",
        "prefer-const": "warn",
        "no-var": "warn",
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/no-unescaped-entities": "off",
        "react/jsx-no-duplicate-props": "warn",
        "react-hooks/rules-of-hooks": "warn",
        "react-hooks/exhaustive-deps": "warn",
        "react-hooks/immutability": "warn",
        "react-hooks/purity": "warn",
        "react-hooks/set-state-in-effect": "warn",
        "import/no-anonymous-default-export": "warn",
        camelcase: "off",
        "max-len": "off",
        complexity: "off",
        "max-depth": "off",
        "max-lines-per-function": "off",
      },
    };
  }

  if (config.name === "next/typescript") {
    return {
      ...config,
      languageOptions: {
        ...config.languageOptions,
        parserOptions: {
          ...config.languageOptions?.parserOptions,
          ecmaVersion: 2021,
          sourceType: "module",
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      rules: {
        ...config.rules,
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            ignoreRestSiblings: true,
          },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
      },
    };
  }

  if (config.ignores) {
    return {
      ...config,
      ignores: [...config.ignores, ...additionalIgnores],
    };
  }

  return config;
});

const tsPlugins = {
  ...(extendedConfig.find((config) => config.name === "next/typescript")?.plugins ?? {}),
};

export default [
  {
    name: "siam/global-ignores",
    ignores: additionalIgnores,
  },
  ...extendedConfig,
  {
    name: "siam/test-overrides",
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    plugins: tsPlugins,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "max-lines-per-function": "off",
      "no-console": "off",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
