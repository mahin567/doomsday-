// A list of checkboxes: pick the movies you should watch first.
export default function PrereqPicker({ movies, selected, onChange, excludeId }) {
  const options = movies.filter((m) => m.id !== excludeId);

  if (options.length === 0) return <p className="muted">No other movies yet.</p>;

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <div className="picker">
      {options.map((m) => (
        <label key={m.id} className="chip">
          <input
            type="checkbox"
            checked={selected.includes(m.id)}
            onChange={() => toggle(m.id)}
          />
          {m.title}
        </label>
      ))}
    </div>
  );
}
