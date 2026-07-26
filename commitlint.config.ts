import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-max-length": [2, "always", 80],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "test", "docs", "chore", "perf", "ci", "build", "revert"],
    ],
  },
};

export default config;
