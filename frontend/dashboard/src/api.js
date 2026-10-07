export const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export async function fetchJson(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json();
}
