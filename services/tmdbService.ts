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

// --- Rate Limiting Queue System ---

const requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

/**
 * Processes the queue with a delay between requests to respect API rate limits.
 */
const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const task = requestQueue.shift();
    if (task) {
      await task();
      // Wait 300ms between requests (approx 3-4 requests/sec max)
      // This prevents hitting the 429 Rate Limit
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  isProcessingQueue = false;
};

/**
 * Enqueues a request to be executed by the rate limiter.
 */
const enqueueRequest = <T>(request: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await request();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    processQueue();
  });
};

/**
 * Searches TMDB for a movie and returns the poster path if found.
 * Uses a queue system to prevent 429 errors.
 */
export const fetchMoviePoster = async (title: string, year: string): Promise<string | null> => {
  if (!TMDB_READ_TOKEN) {
    console.warn("TMDB Token missing");
    return null;
  }

  // Wrap the actual fetch logic in the queue enqueuer
  return enqueueRequest(async () => {
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

      if (response.status === 429) {
        console.warn(`TMDB Rate Limit Hit for "${title}". Skipping.`);
        return null; 
      }

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
      console.warn("Failed to fetch from TMDB:", error);
      return null; // Return null gracefully so UI can fall back to generated art
    }
  });
};
