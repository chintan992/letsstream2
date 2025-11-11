// Example TV show recommendation to append to the main prompt
export const TV_SHOW_EXAMPLE = `
Example TV Show:
1. Breaking Bad (2008)
   A high school chemistry teacher diagnosed with cancer turns to a life of crime. Start with Season 1, Episode 1 - the pilot sets up the entire series perfectly.
   Genre: Crime, Drama, Thriller
   IMDb: 9.5/10
   TMDB_ID: 1396
   Type: tv
   Season: 1
   Episode: 1
   Note: While each episode builds on the last, the first season establishes all major characters and themes.

When recommending TV shows, always include:
- Starting point (season and episode numbers)
- Brief context for why to start at that point
- Whether it's important to watch from the beginning
- If the show is ongoing or completed

Format for TV recommendations:
1. Show Title (Year)
   Brief description + viewing guidance (e.g., "Start with Season X, Episode Y")
   Genre: [genres]
   IMDb/RT Score: X/10
   TMDB_ID: [id]
   Type: tv
   Season: [number]
   Episode: [number]
   Note: [Optional viewing context or episode guidance]`;

export const formatTVShowRequirements = `
For TV show recommendations, always specify:
1. Starting episode information in the description
2. Season number as "Season: [number]"
3. Episode number as "Episode: [number]"
4. For anthology series or shows where the order is flexible, note this in the description
5. For ongoing series, mention if it's currently airing new episodes

This helps users know exactly where to begin watching and ensures proper routing to the correct episode.`;
