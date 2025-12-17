
export const INITIAL_ELO = 1200;
// K_FACTOR is now dynamic in eloCalculator.ts

// Storage
export const STORAGE_KEY = 'filmelo_data_v1';

// Gemini Models
export const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';

// TMDB Configuration
// NOTE: In a production environment, these should be loaded from environment variables (process.env)
// and not hardcoded. The fallbacks are provided for this preview environment.
export const TMDB_API_KEY = process.env.TMDB_API_KEY || '73cee11127b6d7ede74c4a190b48e2d0';
export const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3M2NlZTExMTI3YjZkN2VkZTc0YzRhMTkwYjQ4ZTJkMCIsIm5iZiI6MTc2NTA3NzM5Mi44NTksInN1YiI6IjY5MzRmMTkwOTM2NzJjNzg2MGMxZjM0ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.nL6gzLXzLrGMVFiC7NqqsstSkxcHbq3Xc3aC0zOk9BM';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// CSV Headers expected from Letterboxd export
export const REQUIRED_HEADERS = ['Name', 'Year'];
export const OPTIONAL_HEADERS = ['Rating', 'Letterboxd URI'];
