import * as migration_20260924_105036_initial from "./20260924_105036_initial";

export const migrations = [
  {
    up: migration_20260924_105036_initial.up,
    down: migration_20260924_105036_initial.down,
    name: "20260924_105036_initial",
  },
];
