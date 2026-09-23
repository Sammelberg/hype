import * as migration_20260923_102047_initial from "./20260923_102047_initial";
import * as migration_20260923_104606_site_settings from "./20260923_104606_site_settings";

export const migrations = [
  {
    up: migration_20260923_102047_initial.up,
    down: migration_20260923_102047_initial.down,
    name: "20260923_102047_initial",
  },
  {
    up: migration_20260923_104606_site_settings.up,
    down: migration_20260923_104606_site_settings.down,
    name: "20260923_104606_site_settings",
  },
];
