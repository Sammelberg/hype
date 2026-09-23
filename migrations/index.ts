import * as migration_20260923_102047_initial from "./20260923_102047_initial";

export const migrations = [
  {
    up: migration_20260923_102047_initial.up,
    down: migration_20260923_102047_initial.down,
    name: "20260923_102047_initial",
  },
];
