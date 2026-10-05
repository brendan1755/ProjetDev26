// ============================================================
// api.js — unique point d'accès au back (fetch + gestion d'erreurs)
// ============================================================
export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(window.API_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error("Impossible de joindre l'API. Le serveur back est-il lancé ?");
  }
  if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur');
  return res.status === 204 ? null : res.json(); // 204 = pas de contenu
}

// Raccourci pour envoyer un corps JSON
export const json = (method, body) => ({ method, body: JSON.stringify(body) });
