// Link previews read the raw HTML without running Angular:
// for crawlers, swap the generic meta tags of index.html for the film's or series' own.
const API = "https://backend-binge.onrender.com/api";
const IMG = "https://image.tmdb.org/t/p";
const BOTS = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|mattermost|embedly|skype|linkedin/i;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const clip = (s: string, max: number) =>
  s.length > max ? s.slice(0, max).replace(/[\s,;:—-]+\S*$/, "") + "…" : s;

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const response = await context.next();
  if (!BOTS.test(request.headers.get("user-agent") || "")) return response;

  const [, kind, id] = new URL(request.url).pathname.match(/^\/(film|serie)\/(\d+)/) || [];
  if (!id) return response;
  const isSerie = kind === "serie";

  let movie;
  try {
    // Render may be asleep: give up rather than make the crawler time out.
    const res = await fetch(`${API}/${isSerie ? "series" : "films"}/${id}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return response;
    movie = await res.json();
  } catch {
    return response;
  }

  const name = movie.title || movie.name || movie.original_title || movie.original_name;
  if (!name) return response;

  const year = (movie.release_date || movie.first_air_date || "").slice(0, 4);
  const title = year ? `${name} (${year})` : name;
  const facts = [
    (movie.genres || []).map((g: { name: string }) => g.name).slice(0, 3).join(", "),
    movie.runtime ? `${Math.floor(movie.runtime / 60)}h${String(movie.runtime % 60).padStart(2, "0")}` : "",
    movie.number_of_seasons ? `${movie.number_of_seasons} saison${movie.number_of_seasons > 1 ? "s" : ""}` : "",
    movie.vote_average ? `★ ${movie.vote_average.toFixed(1)}` : "",
  ].filter(Boolean).join(" · ");
  // Previews show about two lines: the facts, then the first sentence of the synopsis.
  const overview = (movie.overview || "").trim();
  const sentence = overview.match(/^[\s\S]*?[.!?…](?=\s|$)/)?.[0] || overview;
  const description = clip([facts, sentence].filter(Boolean).join(" — "), 170);
  // A portrait poster shows as a thumbnail beside the text; the wide backdrop is only a fallback.
  const image = movie.poster_path
    ? { url: `${IMG}/w342${movie.poster_path}`, width: 342, height: 513 }
    : movie.backdrop_path
      ? { url: `${IMG}/w1280${movie.backdrop_path}`, width: 1280, height: 720 }
      : null;

  const tags = [
    `<title>${escape(title)} • Binge</title>`,
    `<meta name="description" content="${escape(description)}">`,
    `<meta property="og:site_name" content="Binge">`,
    `<meta property="og:type" content="${isSerie ? "video.tv_show" : "video.movie"}">`,
    `<meta property="og:url" content="${escape(request.url)}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(description)}">`,
    `<meta name="twitter:card" content="${image && image.width > image.height ? "summary_large_image" : "summary"}">`,
    ...(image
      ? [
          `<meta property="og:image" content="${image.url}">`,
          `<meta property="og:image:width" content="${image.width}">`,
          `<meta property="og:image:height" content="${image.height}">`,
          `<meta property="og:image:alt" content="${escape(name)}">`,
        ]
      : []),
  ].join("\n  ");

  const html = (await response.text())
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+(name="description"|property="og:[^"]*")[^>]*>/gi, "")
    .replace(/<\/head>/i, `  ${tags}\n</head>`);

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("etag");
  return new Response(html, { status: response.status, headers });
};

export const config = { path: ["/film/*", "/serie/*"] };
