export type PlatformPillar = { id: string; name: string; description: string };

/** Product families from the YUGON brand architecture. Identifiers stay stable. */
export const platformPillars: PlatformPillar[] = [
  { id: "puja", name: "YUGON Puja", description: "Puja guides and AI Pandit." },
  { id: "astrology", name: "YUGON Astro", description: "Astrology and Kundli." },
  { id: "music", name: "YUGON Bhakti", description: "Devotional music." },
  { id: "panchang", name: "YUGON Panchang", description: "Panchang and Muhurat." },
  { id: "experts", name: "YUGON Experts", description: "Verified Pandits and astrologers." },
  { id: "community", name: "YUGON Community", description: "Spiritual communities and gatherings." },
];

export { brandColor, brandFont, brandInk, brandThemeStyle } from "./brand";
export * from "./user";
export * from "./canonical";
export * from "./astro";
export * from "./booking";
export * from "./subscriber";
