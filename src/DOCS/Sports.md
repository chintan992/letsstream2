# Streamed API Documentation

> **Obsolete.** The sports integration now talks to ppv.st — see
> [PPV.md](./PPV.md). Streamed shut down and its API answers every request with a
> redirect to a "Streamed Closure" page, so this file is kept only as history.


This is the documentation for the API of Streamed. It is a REST API that returns JSON data. You can use this API to get information about matches, streams, and more. The API is open to anyone and is free to use.

Currently, there are no rate limits on the API, but we may add them in the future if needed (due to poor coding by developers harming website performance, etc).

Base URL: `https://api.streamed.su`n

Check the links on the left to get started.

## Matches

### Schema of a match object (APIMatch)

```json
{
  "id": string,
  "title": string,
  "category": string,
  "date": number, // unix timestamp in milliseconds
  "poster": string | undefined,
  "popular": boolean,
  "teams": undefined | {
    "home": undefined | {
      "name": string,
      "badge": string,
    },
    "away": undefined | {
      "name": string,
      "badge": string,
    },
  },
  "sources": {
    "source": string,
    "id": string,
  }[]
}
```

To get stream lists from a source, use the streams endpoint [here](...).

### Available endpoints are listed below

#### Sports

You can get a list of sports to be used in the `[SPORT]` endpoints [here](...).

- `/api/matches/[SPORT]`
- `/api/matches/[SPORT]/popular`

#### All matches

- `/api/matches/all`
- `/api/matches/all/popular`

#### All matches TODAY

- `/api/matches/all-today`
- `/api/matches/all-today/popular`

#### Live matches

- `/api/matches/live`
- `/api/matches/live/popular`

## Streams

### Schema of a stream object

```json
{
  "id": string,
  "streamNo": number,
  "language": string,
  "hd": boolean,
  "embedUrl": string,
  "source": string,
}
```

### Available endpoints are listed below according to the source

#### Alpha source

- `/api/stream/alpha/[id]`

#### Bravo source

- `/api/stream/bravo/[id]`

#### Charlie source

- `/api/stream/charlie/[id]`

#### Delta source

- `/api/stream/delta/[id]`

#### Echo source

- `/api/stream/echo/[id]`

#### Foxtrot source

- `/api/stream/foxtrot/[id]`

## Sports responses

### Schema of a sport object

```json
{
  "id": string,
  "name": string,
}
```

### Available endpoints are listed below as a list of sports

- `/api/sports`

## Images

All images are served in webp format.

### Available endpoints are listed below according to the type of video format

- `/api/images/badge/[id].webp`
- `/api/images/poster/[badge]/[badge].webp`
- `/api/images/proxy/[poster].webp`
