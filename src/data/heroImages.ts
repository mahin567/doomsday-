import type { TunnelImage } from "@/components/ui/perspective-tunnel-hero";

// Put your PNG photos in frontend/public/marvel/ with these exact names
// (iron-man.png, the-first-avenger.png, ...). Any photo that is missing
// falls back to a title-only placeholder (.svg) in the same folder.
export const HERO_IMAGES: TunnelImage[] = [
  { src: "/marvel/iron-man.png", title: "Iron Man", fallback: "/marvel/iron-man.svg" },
  { src: "/marvel/the-first-avenger.png", title: "The First Avenger", fallback: "/marvel/the-first-avenger.svg" },
  { src: "/marvel/the-avengers.png", title: "The Avengers", fallback: "/marvel/the-avengers.svg" },
  { src: "/marvel/civil-war.png", title: "Civil War", fallback: "/marvel/civil-war.svg" },
  { src: "/marvel/ragnarok.png", title: "Thor: Ragnarok", fallback: "/marvel/ragnarok.svg" },
  { src: "/marvel/infinity-war.png", title: "Infinity War", fallback: "/marvel/infinity-war.svg" },
  { src: "/marvel/endgame.png", title: "Endgame", fallback: "/marvel/endgame.svg" },
  { src: "/marvel/doomsday.png", title: "Doomsday", fallback: "/marvel/doomsday.svg" },
];
