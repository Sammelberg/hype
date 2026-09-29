import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { breadcrumbSchema, type Crumb } from "@/lib/breadcrumbs";
import { absoluteUrl, JsonLd } from "@/lib/seo";

// Visible trail plus the matching BreadcrumbList — search engines only honour markup that the page shows.
export function PageBreadcrumbs({ trail, className }: { trail: Crumb[]; className?: string }) {
  const ancestors = trail.slice(0, -1);
  const current = trail.at(-1);
  if (!current) return null;

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail, absoluteUrl)} />
      <Breadcrumb className={className}>
        <BreadcrumbList>
          {ancestors.map((crumb) => (
            <Fragment key={crumb.path}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="py-0.5">
                  <Link href={crumb.path as never}>{crumb.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </Fragment>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>{current.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
