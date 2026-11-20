import { useCallback, useEffect, useState } from "react";
import { api, errorText, formatMinutes } from "../api.js";

export default function RewatchView() {
  const [movies, setMovies] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listMovies()
      .then((list) => {
        setMovies(list);
        if (list.length) setTargetId(String(list[list.length - 1].id));
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  const loadPlan = useCallback(async () => {
    if (!targetId) return;
    try {
      setPlan(await api.rewatchOrder(targetId));
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }, [targetId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  async function toggleWatched(movie) {
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await loadPlan();
    } catch (e) {
      setError(errorText(e));
    }
  }

  const percent = plan && plan.total_count ? (plan.watched_count / plan.total_count) * 100 : 0;
  const allDone = plan && plan.watched_count === plan.total_count;

  return (
    <section>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <label className="label" htmlFor="target">
          I want to watch
        </label>
        <select id="target" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {movies.length === 0 && <p className="muted">Add some movies first.</p>}

      {plan && (
        <div className="card">
          {plan.total_count === 0 ? (
            <p>Nothing to rewatch. You are ready for {plan.target.title}!</p>
          ) : (
            <>
              <div className="progress-text">
                <strong>
                  {plan.watched_count} of {plan.total_count} watched
                </strong>
                <span className="muted">
                  {allDone
                    ? "All caught up"
                    : `${formatMinutes(plan.unwatched_runtime_minutes)} left to watch`}
                </span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${percent}%` }} />
              </div>

              <ol className="plan">
                {plan.order.map((m) => (
                  <li key={m.id}>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={m.watched}
                        onChange={() => toggleWatched(m)}
                      />
                      <span className={m.watched ? "title done" : "title"}>{m.title}</span>
                    </label>
                    <span className="muted">
                      {m.release_year} · {formatMinutes(m.runtime_minutes)}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </section>
  );
}
