// Country of the visitor, read from the request IP by Netlify (nothing is stored).
// Used to show where a film is streamable ("Disponible sur") in the visitor's own country.
export default (_request: Request, context: { geo?: { country?: { code?: string } } }) =>
  new Response(JSON.stringify({ country: context.geo?.country?.code || null }), {
    headers: { "content-type": "application/json", "cache-control": "private, max-age=3600" },
  });

export const config = { path: "/_geo" };
