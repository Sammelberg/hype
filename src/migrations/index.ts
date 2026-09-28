import * as migration_20260924_105036_initial from "./20260924_105036_initial";
import * as migration_20260928_184539_add_projekte_collection from "./20260928_184539_add_projekte_collection";
import * as migration_20260928_190917_add_leistungen_arbeitsweise_content from "./20260928_190917_add_leistungen_arbeitsweise_content";

export const migrations = [
  {
    up: migration_20260924_105036_initial.up,
    down: migration_20260924_105036_initial.down,
    name: "20260924_105036_initial",
  },
  {
    up: migration_20260928_184539_add_projekte_collection.up,
    down: migration_20260928_184539_add_projekte_collection.down,
    name: "20260928_184539_add_projekte_collection",
  },
  {
    up: migration_20260928_190917_add_leistungen_arbeitsweise_content.up,
    down: migration_20260928_190917_add_leistungen_arbeitsweise_content.down,
    name: "20260928_190917_add_leistungen_arbeitsweise_content",
  },
];
