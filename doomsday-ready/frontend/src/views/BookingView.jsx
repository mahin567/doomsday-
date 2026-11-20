import { useEffect, useState } from "react";
import { api, errorText } from "../api.js";

export default function BookingView() {
  const [cinemas, setCinemas] = useState([]);
  const [cinemaId, setCinemaId] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newSizes, setNewSizes] = useState("");
  const [cinemaError, setCinemaError] = useState("");

  async function loadCinemas(selectId) {
    try {
      const list = await api.listCinemas();
      setCinemas(list);
      if (selectId) setCinemaId(String(selectId));
      else if (list.length) setCinemaId((current) => current || String(list[0].id));
    } catch (e) {
      setError(errorText(e));
    }
  }

  useEffect(() => {
    loadCinemas();
  }, []);

  const cinema = cinemas.find((c) => String(c.id) === cinemaId);

  async function getQuote(e) {
    e.preventDefault();
    setQuote(null);
    try {
      setQuote(await api.booking(cinemaId, groupSize));
      setError("");
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function addCinema(e) {
    e.preventDefault();
    const sizes = newSizes
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number);
    try {
      const created = await api.createCinema({ name: newName, bundle_sizes: sizes });
      setNewName("");
      setNewSizes("");
      setCinemaError("");
      setQuote(null);
      await loadCinemas(created.id);
    } catch (err) {
      setCinemaError(errorText(err));
    }
  }

  return (
    <section>
      {error && <div className="error">{error}</div>}

      <form className="card" onSubmit={getQuote}>
        <h2>Book the watch party</h2>
        <div className="row">
          <select
            value={cinemaId}
            onChange={(e) => {
              setCinemaId(e.target.value);
              setQuote(null);
            }}
            required
          >
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Group size (1-10000)"
            min="1"
            max="10000"
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            required
          />
          <button className="primary" type="submit" disabled={!cinemaId}>
            Get quote
          </button>
        </div>
        {cinema && (
          <p className="muted">
            {cinema.name} sells bundles of {cinema.bundle_sizes.join(", ")} seats.
          </p>
        )}
        {cinemas.length === 0 && <p className="muted">No cinemas yet. Add one below.</p>}

        {quote && (
          <div className={quote.possible ? "result ok" : "result bad"}>
            {quote.possible ? (
              <>
                <strong>
                  {quote.total_bundles} bundle{quote.total_bundles === 1 ? "" : "s"} for{" "}
                  {quote.group_size} seats
                </strong>
                <ul>
                  {quote.bundles.map((b) => (
                    <li key={b.size}>
                      {b.size} seats × {b.count}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <strong>Not possible for {quote.group_size} seats at this cinema.</strong>
            )}
          </div>
        )}
      </form>

      <form className="card" onSubmit={addCinema}>
        <h2>Add a cinema</h2>
        {cinemaError && <div className="error">{cinemaError}</div>}
        <div className="row">
          <input
            placeholder="Cinema name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <input
            placeholder="Bundle sizes, e.g. 2, 5"
            value={newSizes}
            onChange={(e) => setNewSizes(e.target.value)}
            required
          />
          <button type="submit">Add cinema</button>
        </div>
      </form>
    </section>
  );
}
