import { ERAS } from './match/match.service';

// Films and series share Découverte: switching keeps the era, the search and the
// genre when it has a counterpart on the other side.
const FILM_TO_SERIES_GENRE: Record<string, string> = {
  '28': '10759', '12': '10759', '16': '16', '35': '35', '80': '80', '99': '99', '18': '18',
  '10751': '10751', '9648': '9648', '878': '10765', '14': '10765', '10752': '10768', '37': '37',
};
const SERIES_TO_FILM_GENRE: Record<string, string> = {
  '10759': '28', '16': '16', '35': '35', '80': '80', '99': '99', '18': '18',
  '10751': '10751', '9648': '9648', '10765': '878', '10768': '10752', '37': '37',
};

export interface DiscoverFilters {
  genre: string;
  era: number | null;
  query: string;
}

export function switchParams(to: 'films' | 'series', filters: DiscoverFilters): Record<string, string> {
  const genre = (to === 'series' ? FILM_TO_SERIES_GENRE : SERIES_TO_FILM_GENRE)[filters.genre];
  const params: Record<string, string> = {};
  if (filters.query.trim()) params['q'] = filters.query.trim();
  if (genre) params['genre'] = genre;
  if (filters.era) params['era'] = String(filters.era);
  return params;
}

export function readFilters(params: { get(name: string): string | null }, genres: { value: string }[]): DiscoverFilters {
  const genre = params.get('genre') || '';
  const era = Number(params.get('era'));
  return {
    genre: genres.some((option) => option.value === genre) ? genre : '',
    era: ERAS.some((option) => option.value === era) ? era : null,
    query: params.get('q') || '',
  };
}
