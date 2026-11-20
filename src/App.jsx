import { useCallback, useState } from "react";
import MoviesView from "./views/MoviesView.jsx";
import RewatchView from "./views/RewatchView.jsx";
import BookingView from "./views/BookingView.jsx";
import PerspectiveTunnelHero from "@/components/ui/perspective-tunnel-hero";
import { HERO_IMAGES } from "@/data/heroImages";
import DoodleCrewFooter from "@/components/ui/doodle-crew-footer";
import { FOOTER_PROPS } from "@/data/footerConfig";

const TABS = [
  { id: "movies", label: "Movies", Component: MoviesView },
  { id: "rewatch", label: "Rewatch Plan", Component: RewatchView },
  { id: "booking", label: "Booking", Component: BookingView },
];

export default function App() {
  const [tab, setTab] = useState("movies");
  const [showIntro, setShowIntro] = useState(true);
  const { Component } = TABS.find((t) => t.id === tab);
  const enterApp = useCallback(() => setShowIntro(false), []);

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-50">
        <PerspectiveTunnelHero
          images={HERO_IMAGES}
          eyebrow="Avengers: Doomsday"
          headline={["ARE YOU", "READY?"]}
          hint="Scroll to fly through the movies you need to rewatch first."
          onComplete={enterApp}
        />
        <button
          className="primary"
          style={{ position: "fixed", top: 20, right: 20, zIndex: 60 }}
          onClick={enterApp}
        >
          Enter app
        </button>
      </div>
    );
  }

  function goTo(id) {
    setTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="app">
        <header className="header">
          <h1>
            Doomsday <span>Ready</span>
          </h1>
          <p>Plan your MCU rewatch. Book the opening night.</p>
        </header>

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === tab ? "tab active" : "tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main>
          <Component />
        </main>
      </div>

      <DoodleCrewFooter
        {...FOOTER_PROPS}
        actions={[
          { label: "Rewatch plan", icon: "shield", variant: "outline", onClick: () => goTo("rewatch") },
          { label: "Book the watch party", icon: "hammer", variant: "solid", onClick: () => goTo("booking") },
        ]}
      />
    </>
  );
}
