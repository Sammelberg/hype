export type Crumb = { name: string; path: string };

type NestedDocsCrumb = { label?: string | null; url?: string | null };

// The home page, then every crumb nested-docs stored on the doc (which ends with the doc itself).
export function pageTrail(breadcrumbs: NestedDocsCrumb[] | null | undefined): Crumb[] {
  const nested = (breadcrumbs ?? []).flatMap((crumb) =>
    crumb.label && crumb.url ? [{ name: crumb.label, path: crumb.url }] : [],
  );
  return [{ name: "Startseite", path: "/" }, ...nested];
}

export function breadcrumbSchema(trail: Crumb[], toUrl: (path: string) => string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: toUrl(crumb.path),
    })),
  };
}
