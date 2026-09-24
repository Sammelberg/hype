import * as migration_20260923_102047_initial from "./20260923_102047_initial";
import * as migration_20260923_104606_site_settings from "./20260923_104606_site_settings";
import * as migration_20260923_115013_plugins from "./20260923_115013_plugins";
import * as migration_20260923_130321_homepage_sections from "./20260923_130321_homepage_sections";
import * as migration_20260923_131808_homepage_faq from "./20260923_131808_homepage_faq";
import * as migration_20260923_143200_hero_bento from "./20260923_143200_hero_bento";
import * as migration_20260923_150538_homepage_manifesto from "./20260923_150538_homepage_manifesto";
import * as migration_20260924_093031_hero_drop_keywords from "./20260924_093031_hero_drop_keywords";
import * as migration_20260924_095538_homepage_clients from "./20260924_095538_homepage_clients";

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
  {
    up: migration_20260923_115013_plugins.up,
    down: migration_20260923_115013_plugins.down,
    name: "20260923_115013_plugins",
  },
  {
    up: migration_20260923_130321_homepage_sections.up,
    down: migration_20260923_130321_homepage_sections.down,
    name: "20260923_130321_homepage_sections",
  },
  {
    up: migration_20260923_131808_homepage_faq.up,
    down: migration_20260923_131808_homepage_faq.down,
    name: "20260923_131808_homepage_faq",
  },
  {
    up: migration_20260923_143200_hero_bento.up,
    down: migration_20260923_143200_hero_bento.down,
    name: "20260923_143200_hero_bento",
  },
  {
    up: migration_20260923_150538_homepage_manifesto.up,
    down: migration_20260923_150538_homepage_manifesto.down,
    name: "20260923_150538_homepage_manifesto",
  },
  {
    up: migration_20260924_093031_hero_drop_keywords.up,
    down: migration_20260924_093031_hero_drop_keywords.down,
    name: "20260924_093031_hero_drop_keywords",
  },
  {
    up: migration_20260924_095538_homepage_clients.up,
    down: migration_20260924_095538_homepage_clients.down,
    name: "20260924_095538_homepage_clients",
  },
];
