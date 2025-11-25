# Streamed API Documentation

The Streamed API is a free, unauthenticated REST API that provides access to sports matches, live streams, and related data in JSON format.

## API Guidelines

*   All endpoints return JSON data.
*   No authentication is required.
*   Currently, there are no rate limits (subject to change).
*   HTTP status codes follow standard conventions (e.g., 200 OK, 404 Not Found).
*   Appropriate error handling should be used in applications.

---

## Endpoints

### Matches

The Matches API provides access to sports events data, including match details, team information, and available stream sources.

#### Match Object Structure
```typescript
interface APIMatch {
    id: string;               // Unique identifier for the match
    title: string;            // Match title (e.g. "Team A vs Team B")
    category: string;         // Sport category (e.g. "football", "basketball")
    date: number;             // Unix timestamp in milliseconds
    poster?: string;          // URL path to match poster image
    popular: boolean;         // Whether the match is marked as popular
    teams?: {
        home?: {
            name: string;     // Home team name
            badge: string;    // URL path to home team badge
        },
        away?: {
            name: string;     // Away team name
            badge: string;    // URL path to away team badge
        }
    };
    sources: {
        source: string;       // Stream source identifier (e.g. "alpha", "bravo")
        id: string;           // Source-specific match ID
    }[];
}
```

#### Get Matches

*   **Endpoints:**
    *   `GET /api/matches/[SPORT]`: Get matches for a specific sport category. Replace `[SPORT]` with a sport ID from the Sports API.
    *   `GET /api/matches/[SPORT]/popular`: Get popular matches for a specific sport.
    *   `GET /api/matches/all`: Get all available matches across all sports.
    *   `GET /api/matches/all/popular`: Get all popular matches.
    *   `GET /api/matches/all-today`: Get matches scheduled for today.
    *   `GET /api/matches/all-today/popular`: Get popular matches for today.
    *   `GET /api/matches/live`: Get currently live matches.
    *   `GET /api/matches/live/popular`: Get popular live matches.
*   **Method:** `GET`
*   **Example Request (Live Matches):**
    ```bash
    curl https://streamed.pk/api/matches/live
    ```
*   **Example Response:**
    ```json
    [
      {
        "id": "match_123",
        "title": "Manchester United vs Liverpool",
        "category": "football",
        "date": 1720598400000,
        "poster": "man-utd-liverpool-poster",
        "popular": true,
        "teams": {
          "home": {
            "name": "Manchester United",
            "badge": "man-utd-badge"
          },
          "away": {
            "name": "Liverpool",
            "badge": "liverpool-badge"
          }
        },
        "sources": [
          {
            "source": "alpha",
            "id": "mu-liv-123"
          },
          {
            "source": "bravo",
            "id": "456-mu-liv"
          }
        ]
      }
    ]
    ```

### Streams

The Streams API provides access to live streaming sources for sports events.

#### Stream Object Structure
```typescript
interface Stream {
    id: string;
    streamNo: number;
    language: string;
    hd: boolean;
    embedUrl: string;
    source: string;
}
```

#### Get Stream Links

*   **Endpoints:**
    *   `GET /api/stream/alpha/[id]`
    *   `GET /api/stream/bravo/[id]`
    *   `GET /api/stream/charlie/[id]`
    *   `GET /api/stream/delta/[id]`
    *   `GET /api/stream/echo/[id]`
    *   `GET /api/stream/foxtrot/[id]`
    *   `GET /api/stream/golf/[id]`
    *   `GET /api/stream/hotel/[id]`
    *   `GET /api/stream/intel/[id]`
*   **Method:** `GET`
*   **Description:** Retrieves stream links for a specific match from a specific source. The `[id]` placeholder should be replaced with the source-specific match ID obtained from the match's `sources` array.
*   **Example Request:**
    ```bash
    curl https://streamed.pk/api/stream/alpha/mu-liv-123
    ```
*   **Example Response:**
    ```json
    [
        {
            "id": "stream_456",
            "streamNo": 1,
            "language": "English",
            "hd": true,
            "embedUrl": "https://example.com/embed/stream_456",
            "source": "alpha"
        }
    ]
    ```

### Sports

The Sports API provides access to all available sport categories on the Streamed platform.

#### Sport Object Structure
```typescript
interface Sport {
    id: string;    // Sport identifier (used in Matches API endpoints)
    name: string;  // Display name of the sport
}
```

#### Get Available Sports

*   **Endpoint:** `/api/sports`
*   **Method:** `GET`
*   **Description:** Retrieves a list of available sports categories.
*   **Example Request:**
    ```bash
    curl https://streamed.pk/api/sports
    ```
*   **Example Response:**
    ```json
    [
      {
        "id": "football",
        "name": "Football"
      },
      {
        "id": "basketball",
        "name": "Basketball"
      },
      {
        "id": "tennis",
        "name": "Tennis"
      }
    ]
    ```

### Images

The Images API provides access to visual assets like team badges and match posters in WebP format.

#### Get Team Badges

*   **Endpoint:** `/api/images/badge/[id].webp`
*   **Method:** `GET`
*   **Description:** Retrieves a team's badge. The `[id]` is found in the `team.badge` field of the match object.
*   **Example Request:**
    ```bash
    curl https://streamed.pk/api/images/badge/man-utd-badge.webp
    ```
*   **Example Response:**
    *Returns the image file.*

#### Get Match Posters

*   **Endpoint:** `/api/images/poster/[badge]/[badge].webp`
*   **Method:** `GET`
*   **Description:** Retrieves a match poster. `[badge]` values are typically derived from team badge IDs for the match.
*   **Example Request:**
    ```bash
    curl https://streamed.pk/api/images/poster/man-utd-badge/liverpool-badge.webp
    ```
*   **Example Response:**
    *Returns the image file.*

#### Get Proxied Images

*   **Endpoint:** `/api/images/proxy/[poster].webp`
*   **Method:** `GET`
*   **Description:** Retrieves a proxied image. The `[poster]` is found in the `poster` field of the match object.
*   **Example Request:**
    ```bash
    curl https://streamed.pk/api/images/proxy/custom-event-poster.webp
    ```
*   **Example Response:**
    *Returns the image file.*
