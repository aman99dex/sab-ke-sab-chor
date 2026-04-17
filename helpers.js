const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

let _idCounter = 1000;
export function generateId() {
  return String(++_idCounter);
}

export { PORT };

export function now() {
  return new Date().toISOString();
}

export function imageUrl(category, filename) {
  if (!filename) return null;
  return `${BASE_URL}/uploads/${category}/${filename}`;
}
