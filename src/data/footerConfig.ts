import type { CrewMember, DoodleKind, DoodleCrewFooterProps } from "@/components/ui/doodle-crew-footer";

// The word is DOOMSDAY: D0 O1 O2 M3 S4 D5 A6 Y7. Crew letters point at these.
const CREW: CrewMember[] = [
  { kind: "yeti", letter: 0, seat: "front", offset: -0.32, name: "Bruno", says: "Rewatch first. Snacks after." },
  { kind: "bird", letter: 1, seat: "top", offset: 0.02, name: "Pip", says: "Almost opening night!" },
  { kind: "mushroom", letter: 2, seat: "front", offset: 0.12, scale: 0.95, name: "Morel", says: "Book the whole row!" },
  { kind: "kid", letter: 4, seat: "top", offset: -0.05, name: "Juno", says: "Endgame before Doomsday!" },
  { kind: "ghost", letter: 6, seat: "behind", offset: 0, name: "Boo", says: "Spoilers? Boo-rrible." },
  { kind: "cat", letter: 7, seat: "front", offset: 0.42, flip: true, name: "Patch", says: "Group of 11? Try 5 + 2 + 2 + 2." },
];

// Weapon doodles that drift down around the word.
const WEAPONS: DoodleKind[] = ["hammer", "shield", "bow", "reactor", "bolt", "star", "hammer", "shield"];

export const FOOTER_PROPS: DoodleCrewFooterProps = {
  wordmark: "DOOMSDAY",
  brand: "Doomsday Ready",
  blurb: "Rewatch the right movies in the right order, then book your opening-night seats.",
  tagline: "Suit up. Rewatch. Be ready before the lights go down.",
  columns: [
    {
      title: "Rewatch first",
      links: [{ label: "Iron Man" }, { label: "The First Avenger" }, { label: "The Avengers" }, { label: "Civil War" }],
    },
    {
      title: "Then watch",
      links: [{ label: "Thor: Ragnarok" }, { label: "Infinity War" }, { label: "Endgame" }, { label: "Doomsday" }],
    },
  ],
  copyright: "© 2026 Doomsday Ready. A fan project, not affiliated with Marvel or Disney.",
  legal: [],
  socials: [],
  crew: CREW,
  doodles: WEAPONS,
  doodleCount: 14,
  preset: "night",
  palette: { accent: "#e23636" },
  height: "640px",
};
