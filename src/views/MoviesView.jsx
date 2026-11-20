import { useEffect, useState } from "react";
import { api, errorText } from "../api.js";
import PrereqPicker from "./PrereqPicker.jsx";

const EMPTY_FORM = { title: "", release_year: "", runtime_minutes: "", prerequisites: [] };

export default function MoviesView() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [draftPrereqs, setDraftPrereqs] = useState([]);
  const [editError, setEditError] = useState("");

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

  const titleOf = (id) => movies.find((m) => m.id === id)?.title ?? `#${id}`;

  async function addMovie(e) {
    e.preventDefault();
    try {
      await api.createMovie({
        title: form.title,
        release_year: Number(form.release_year),
        runtime_minutes: Number(form.runtime_minutes),
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
    setEditError("");
  }

  async function savePrereqs(movie) {
    try {
      await api.updateMovie(movie.id, { prerequisites: draftPrereqs });
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

      <ul className="list">
        {movies.map((m) => (
          <li key={m.id} className="card movie">
            <div className="movie-top">
              <label className="check">
                <input type="checkbox" checked={m.watched} onChange={() => toggleWatched(m)} />
                <span className={m.watched ? "title done" : "title"}>{m.title}</span>
              </label>
              <span className="muted">
                {m.release_year} · {m.runtime_minutes} min
              </span>
            </div>

            <div className="prereqs">
              {m.prerequisites.length === 0 ? (
                <span className="muted">No prerequisites</span>
              ) : (
                <>
                  <span className="muted">Watch first: </span>
                  {m.prerequisites.map((id) => (
                    <span key={id} className="tag">
                      {titleOf(id)}
                    </span>
                  ))}
                </>
              )}
              {editingId !== m.id && (
                <button className="link" onClick={() => startEdit(m)}>
                  Edit prerequisites
                </button>
              )}
            </div>

            {editingId === m.id && (
              <div className="editor">
                {editError && <div className="error">{editError}</div>}
                <PrereqPicker
                  movies={movies}
                  selected={draftPrereqs}
                  onChange={setDraftPrereqs}
                  excludeId={m.id}
                />
                <div className="row">
                  <button className="primary" onClick={() => savePrereqs(m)}>
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
