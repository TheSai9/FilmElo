import { TMDB_READ_TOKEN, TMDB_IMAGE_BASE_URL } from '../constants';

interface TMDBMovieResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
}

interface TMDBSearchResponse {
  results: TMDBMovieResult[];
}

/**
 * Searches TMDB for a movie and returns the poster path if found.
 */
export const fetchMoviePoster = async (title: string, year: string): Promise<string | null> => {
  if (!TMDB_READ_TOKEN) {
    console.warn("TMDB Token missing");
    return null;
  }

  try {
    const searchParams = new URLSearchParams({
      query: title,
      include_adult: 'false',
      language: 'en-US',
      page: '1',
    });
    
    // Add year to filter if valid, helps precision significantly
    if (year && year.length === 4 && !isNaN(parseInt(year))) {
      searchParams.append('year', year);
    }

    const response = await fetch(`https://api.themoviedb.org/3/search/movie?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TMDB_READ_TOKEN}`,
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.status}`);
    }

    const data: TMDBSearchResponse = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return the first valid poster path
      const bestMatch = data.results.find(m => m.poster_path);
      if (bestMatch && bestMatch.poster_path) {
        return `${TMDB_IMAGE_BASE_URL}${bestMatch.poster_path}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch from TMDB:", error);
    return null;
  }
};