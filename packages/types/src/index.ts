export type PlatformPillar = { id: string; name: string; description: string };

/** Product families from the ISHTI brand architecture. Stable identifiers. */
export const platformPillars: PlatformPillar[] = [
  { id: "puja", name: "ISHTI Puja", description: "Puja guides and AI Pandit." },
  { id: "astrology", name: "ISHTI Astro", description: "Astrology and Kundli." },
  { id: "music", name: "ISHTI Bhakti", description: "Devotional music." },
  { id: "panchang", name: "ISHTI Panchang", description: "Panchang and Muhurat." },
  { id: "experts", name: "ISHTI Experts", description: "Verified Pandits and astrologers." },
  { id: "community", name: "ISHTI Community", description: "Spiritual communities and gatherings." },
];

export { brandColor, brandFont, brandInk, brandThemeStyle } from "./brand";
export * from "./user";
export * from "./canonical";
export * from "./astro";
export * from "./booking";
export * from "./subscriber";
export * from "./policy";
export * from "./consent";
export * from "./privacy";
export * from "./commerce";
export * from "./compliance";
