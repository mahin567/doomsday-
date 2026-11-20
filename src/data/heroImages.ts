import type { TunnelImage } from "@/components/ui/perspective-tunnel-hero";

// Files live in frontend/public/marvel/. They are title-only placeholders now.
// To use your own photos: drop the files in that folder (same names, e.g.
// iron-man.jpg) and change the extension below from .svg to .jpg.
export const HERO_IMAGES: TunnelImage[] = [
  { src: "/marvel/iron-man.svg", title: "Iron Man" },
  { src: "/marvel/the-first-avenger.svg", title: "The First Avenger" },
  { src: "/marvel/the-avengers.svg", title: "The Avengers" },
  { src: "/marvel/civil-war.svg", title: "Civil War" },
  { src: "/marvel/ragnarok.svg", title: "Thor: Ragnarok" },
  { src: "/marvel/infinity-war.svg", title: "Infinity War" },
  { src: "/marvel/endgame.svg", title: "Endgame" },
  { src: "/marvel/doomsday.svg", title: "Doomsday" },
];
