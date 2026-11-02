import { afterEach, describe, expect, it, vi } from "vitest";
import { getTVDetails } from "./tv";
import { tmdb } from "./tmdb";

describe("getTVDetails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null without logging when TMDB no longer has the show", async () => {
    const notFound = Object.assign(new Error("Not Found"), {
      isAxiosError: true,
      response: { status: 404 },
    });
    const request = vi.spyOn(tmdb, "get").mockRejectedValue(notFound);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getTVDetails(532321)).resolves.toBeNull();

    expect(request).toHaveBeenCalledTimes(1);
    expect(errorLog).not.toHaveBeenCalled();
  });
});
