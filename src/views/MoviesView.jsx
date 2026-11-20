import { useEffect, useMemo, useState } from "react";
import { api, errorText } from "../api.js";
import PrereqPicker from "./PrereqPicker.jsx";
import CourseCard from "@/components/ui/course-design-cards";
import { HERO_IMAGES } from "@/data/heroImages";
import { requiredIds } from "@/lib/movieGraph";

const EMPTY_FORM = {
  title: "",
  release_year: "",
  runtime_minutes: "",
  description: "",
  prerequisites: [],
};
const COLORS = ["green", "orange", "red", "blue"];
const IMAGE_BY_TITLE = new Map(HERO_IMAGES.map((i) => [i.title.toLowerCase(), i]));

function imageFor(title) {
  const lower = title.toLowerCase();
  for (const [key, img] of IMAGE_BY_TITLE) {
    if (lower.includes(key) || key.includes(lower)) return img;
  }
  return null;
}

export default function MoviesView() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [draftPrereqs, setDraftPrereqs] = useState([]);
  const [draftDescription, setDraftDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [openId, setOpenId] = useState(null);

  async function load() {
    try {
      setMovies(await api.listMovies());
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byId = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);

  // Card data: "Ready" = how much of the movies needed before this one is watched.
  const cards = useMemo(
    () =>
      movies.map((m, index) => {
        const needed = requiredIds(m.id, byId);
        const done = needed.filter((id) => byId.get(id)?.watched).length;
        const pct = needed.length ? Math.round((done / needed.length) * 100) : 100;
        const direct = m.prerequisites.map((id) => byId.get(id)).filter(Boolean);
        const cover = imageFor(m.title);
        return {
          movie: m,
          data: {
            id: m.id,
            colorClass: COLORS[index % COLORS.length],
            date: String(m.release_year),
            title: m.title,
            description: `${m.runtime_minutes} min`,
            summary: m.description,
            prerequisiteNames: direct.map((d) => d.title),
            image: cover ? { src: cover.src, fallback: cover.fallback, alt: m.title } : undefined,
            label: "Ready",
            progressPercent: `${pct}%`,
            progressValue: needed.length ? `${done}/${needed.length}` : "100%",
            avatars: direct.slice(0, 3).map((d) => {
              const img = imageFor(d.title);
              return {
                src: img?.src,
                fallback: img?.fallback,
                alt: d.title,
                initial: d.title.charAt(0).toUpperCase(),
              };
            }),
            countdownText: m.watched ? "Watched ✓" : "Mark watched",
          },
        };
      }),
    [movies, byId]
  );

  async function addMovie(e) {
    e.preventDefault();
    try {
      await api.createMovie({
        title: form.title,
        release_year: Number(form.release_year),
        runtime_minutes: Number(form.runtime_minutes),
        description: form.description,
        prerequisites: form.prerequisites,
      });
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function toggleWatched(movie) {
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  function startEdit(movie) {
    setEditingId(movie.id);
    setDraftPrereqs(movie.prerequisites);
    setDraftDescription(movie.description || "");
    setEditError("");
  }

  async function savePrereqs(movie) {
    try {
      await api.updateMovie(movie.id, {
        prerequisites: draftPrereqs,
        description: draftDescription,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setEditError(errorText(err));
    }
  }

  return (
    <section>
      {error && <div className="error">{error}</div>}

      <form className="card" onSubmit={addMovie}>
        <h2>Add a movie</h2>
        <div className="row">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Year"
            min="1888"
            max="2100"
            value={form.release_year}
            onChange={(e) => setForm({ ...form, release_year: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Runtime (min)"
            min="1"
            max="300"
            value={form.runtime_minutes}
            onChange={(e) => setForm({ ...form, runtime_minutes: e.target.value })}
            required
          />
        </div>
        <input
          placeholder="Short description (optional)"
          maxLength={300}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <p className="label">Watch these first (optional)</p>
        <PrereqPicker
          movies={movies}
          selected={form.prerequisites}
          onChange={(prerequisites) => setForm({ ...form, prerequisites })}
        />
        <button className="primary" type="submit">
          Add movie
        </button>
      </form>

      <h2>All movies</h2>
      {loading && <p className="muted">Loading...</p>}
      {!loading && movies.length === 0 && <p className="muted">No movies yet. Add one above.</p>}

      <div className="cc-grid">
        {cards.map(({ movie, data }) => (
          <div key={movie.id} className="cc-cell">
            <CourseCard
              data={data}
              addLabel="Edit prerequisites"
              onAdd={() => startEdit(movie)}
              onCountdownClick={() => toggleWatched(movie)}
              countdownActive={movie.watched}
              expanded={openId === movie.id}
              onToggle={() => setOpenId(openId === movie.id ? null : movie.id)}
            />
            {editingId === movie.id && (
              <div className="card editor-card">
                {editError && <div className="error">{editError}</div>}
                <input
                  placeholder="Short description"
                  maxLength={300}
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                />
                <p className="label">Watch these first</p>
                <PrereqPicker
                  movies={movies}
                  selected={draftPrereqs}
                  onChange={setDraftPrereqs}
                  excludeId={movie.id}
                />
                <div className="row">
                  <button className="primary" onClick={() => savePrereqs(movie)}>
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
