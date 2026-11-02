import { afterEach, describe, expect, it, vi } from "vitest";
import { SimklService } from "./simkl";

describe("SimklService.addToHistory", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts watched movies and episodes to Simkl history sync", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          added: { movies: 1, shows: 0, episodes: 2 },
          not_found: { movies: [], shows: [], episodes: [{}] },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      SimklService.addToHistory("access-token", {
        movies: [
          {
            title: "Example Movie",
            year: 2024,
            watched_at: "2026-10-09T12:00:00.000Z",
            ids: { tmdb: 123 },
          },
        ],
        shows: [
          {
            title: "Example Show",
            ids: { tmdb: 456 },
            seasons: [
              {
                number: 1,
                episodes: [
                  { number: 1, watched_at: "2026-10-09T12:00:00.000Z" },
                  { number: 2, watched_at: "2026-10-09T12:30:00.000Z" },
                ],
              },
            ],
          },
        ],
      })
    ).resolves.toEqual({ added: 3, notFound: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.simkl.com/sync/history",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"movies"'),
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      shows: [
        {
          seasons: [{ number: 1, episodes: [{ number: 1 }, { number: 2 }] }],
        },
      ],
    });
  });

  it("reports Simkl HTTP errors with their status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        })
      )
    );

    await expect(
      SimklService.addToHistory("invalid-token", { movies: [] })
    ).rejects.toThrow("Unauthorized");
  });
});
