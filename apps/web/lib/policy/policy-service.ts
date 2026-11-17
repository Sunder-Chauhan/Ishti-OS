import { POLICIES } from "./policy-registry";
import type { PolicyDocument, PolicyDocumentSlug, PolicyCategory } from "@spiritual-os/types";

/**
 * Service functions for querying policies.
 */
export function getAllPolicies(): PolicyDocument[] {
  return POLICIES;
}

export function getPolicyBySlug(slug: string): PolicyDocument | undefined {
  return POLICIES.find((p) => p.slug === slug);
}

export function getPoliciesByCategory(category: PolicyCategory): PolicyDocument[] {
  return POLICIES.filter((p) => p.category === category);
}

export function getPublishedPolicies(): PolicyDocument[] {
  return POLICIES.filter((p) => p.status === "PUBLISHED");
}

export function searchPolicies(query: string, includeDrafts: boolean = true): PolicyDocument[] {
  const q = query.toLowerCase().trim();
  const pool = includeDrafts ? POLICIES : getPublishedPolicies();
  if (!q) return pool;

  return pool.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.sections.some((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)) ||
      (p.schedules &&
        p.schedules.some((sch) =>
          sch.title.toLowerCase().includes(q) ||
          sch.sections.some((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
        ))
    );
  });
}
