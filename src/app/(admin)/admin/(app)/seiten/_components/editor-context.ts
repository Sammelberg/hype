import type { Control, UseFormSetValue } from "react-hook-form";

import type { SectionsOf } from "@/cms/content/page-sections";
import type {
  FormDoc,
  MediaDoc,
  Page,
  PageInput,
  PageSections,
  Projekt,
  SiteSettings,
} from "@/cms/content/types";

// What every section of the page editor works with: the one form of the page, its current
// values, and the documents the sections point to.
export type EditorContext = {
  control: Control<PageInput>;
  setValue: UseFormSetValue<PageInput>;
  values: Partial<PageInput>;
  page: Page | null;
  pages: Page[];
  media: MediaDoc[];
  projekte: Projekt[];
  form: FormDoc | null;
  cta: SiteSettings["cta"] | null;
  editorKey: number;
  slugTouched: boolean;
  touchSlug: () => void;
};

// The form typed for one kind of page: the section components get exact field paths.
export type KindForm<K extends PageSections["kind"]> = Omit<PageInput, "sections"> & {
  sections: SectionsOf<K>;
};
export const kindControl = <K extends PageSections["kind"]>(control: Control<PageInput>) =>
  control as unknown as Control<KindForm<K>>;

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : String(Math.random()).slice(2, 18);
