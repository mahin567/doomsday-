const BASE = "/api";

async function request(path, options = {}) {
  // For FormData the browser sets the multipart Content-Type itself.
  const isForm = options.body instanceof FormData;
  const res = await fetch(BASE + path, {
    headers: isForm ? {} : { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error?.message || `Request failed (${res.status})`);
    err.code = data?.error?.code;
    err.details = data?.error?.details;
    throw err;
  }
  return data;
}

// Turn an API error into one readable line.
export function errorText(err) {
  if (err.code === "CIRCULAR_DEPENDENCY") {
    return "Circular dependency: that change would make a movie depend on itself.";
  }
  if (err.details && typeof err.details === "object") {
    const parts = Object.entries(err.details).map(
      ([field, msgs]) => `${field}: ${[].concat(msgs).join(" ")}`
    );
    return parts.join(" | ");
  }
  return err.message;
}

export const api = {
  listMovies: () => request("/movies"),
  createMovie: (body) => request("/movies", { method: "POST", body: JSON.stringify(body) }),
  updateMovie: (id, body) =>
    request(`/movies/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  uploadMovieImage: (id, file) => {
    const body = new FormData();
    body.append("image", file);
    return request(`/movies/${id}`, { method: "PATCH", body });
  },
  removeMovieImage: (id) =>
    request(`/movies/${id}`, { method: "PATCH", body: JSON.stringify({ remove_image: true }) }),
  rewatchOrder: (id) => request(`/movies/${id}/rewatch-order`),

  listCinemas: () => request("/cinemas"),
  createCinema: (body) => request("/cinemas", { method: "POST", body: JSON.stringify(body) }),
  booking: (id, groupSize) => request(`/cinemas/${id}/booking?groupSize=${groupSize}`),
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Returns an error text for a bad picked file, or "" when it is fine.
export function imageFileProblem(file) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) return "Please choose an image file.";
  if (file.size > MAX_IMAGE_BYTES) return "Image is too large (max 5 MB).";
  return "";
}

export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
