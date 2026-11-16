import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...items.filter((item) => item.label.toLowerCase() !== "home"),
  ];

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbsNav">
      <ol className="breadcrumbList">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isCurrent = item.current || isLast;

          return (
            <li key={index} className="breadcrumbItem">
              {index > 0 && (
                <span className="breadcrumbSeparator" aria-hidden="true">
                  ›
                </span>
              )}
              {isCurrent || !item.href ? (
                <span
                  className="breadcrumbCurrent"
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="breadcrumbLink">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
