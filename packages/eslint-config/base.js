import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": [
        "warn",
        {
          allowList: [
            "^NODE_ENV$",
            "^DATABASE_URL$",
            "^CRON_SECRET$",
            "^ADMIN_SESSION_SECRET$",
            "^ADMIN_API_TOKEN$",
            "^COINMARKETCAP_API_KEY$",
            "^DEXTOOLS_API_KEY$",
            "^REALTIME_INGEST_URL$",
            "^REALTIME_INGEST_SECRET$",
            "^TRADING_DEBUG_USER_ID$",
            "^PLATFORM_LIQUIDITY_USER_ID$",
            "^NEXT_PUBLIC_[A-Z0-9_]+$",
          ],
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
