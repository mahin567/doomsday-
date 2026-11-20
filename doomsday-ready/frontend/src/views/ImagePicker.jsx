import { useEffect, useRef, useState } from "react";

// Pick a picture from the computer. Optional. Shows a small preview.
// `current` is an already uploaded picture (a /media/... path) that can be removed.
export default function ImagePicker({ file, onFile, current = null, onRemoveCurrent }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Clear the native input when the parent resets the file (after a save).
  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = "";
  }, [file]);

  const shown = preview || current;

  return (
    <div className="image-picker">
      {shown && <img className="image-thumb" src={shown} alt="Selected movie" />}
      <div className="image-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <button type="button" onClick={() => onFile(null)}>
            Clear
          </button>
        )}
        {!file && current && onRemoveCurrent && (
          <button type="button" onClick={onRemoveCurrent}>
            Remove uploaded image
          </button>
        )}
      </div>
    </div>
  );
}
