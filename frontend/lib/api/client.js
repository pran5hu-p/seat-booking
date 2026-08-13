// Central API client. Every network call in the app goes through here; the
// base URL is taken from NEXT_PUBLIC_API_URL so no component ever sees a
// hardcoded backend address.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set. Add it to frontend/.env.local");
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// All calls return a Result-style shape ({ ok: true, data } / { ok: false,
// error }) instead of throwing, so call sites can render an error state
// instead of crashing.
export async function apiRequest(path, { method = "GET", headers, body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { ...headers },
      body,
    });
  } catch (error) {
    return {
      ok: false,
      error: { status: 0, detail: error?.message || "Network error" },
    };
  }

  const data = parseJson(await response.text());

  if (!response.ok) {
    return {
      ok: false,
      error: {
        status: response.status,
        detail: data?.detail ?? `Request failed with status ${response.status}`,
      },
    };
  }

  return { ok: true, data };
}

export function apiGet(path, headers) {
  return apiRequest(path, { method: "GET", headers });
}

export function apiPost(path, body) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
