import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchVideoSources,
  clearVideoSourcesCache,
  preloadVideoSources,
} from "@/utils/video-source-loader";

describe("Video Source Loader", () => {
  beforeEach(() => {
    clearVideoSourcesCache();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    clearVideoSourcesCache();
    localStorage.clear();
  });

  it("should export required functions", () => {
    expect(typeof fetchVideoSources).toBe("function");
    expect(typeof clearVideoSourcesCache).toBe("function");
    expect(typeof preloadVideoSources).toBe("function");
  });

  it("should clear cache by calling removeItem", () => {
    const removeItemSpy = vi.spyOn(localStorage, "removeItem");
    clearVideoSourcesCache();
    expect(removeItemSpy).toHaveBeenCalledWith("video_sources_cache");
  });

  it("should preload sources successfully", async () => {
    const source = {
      key: "example",
      name: "Example",
      movieUrlPattern: "https://example.test/movie/{id}",
      tvUrlPattern: "https://example.test/tv/{id}/{season}/{episode}",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ sources: [source] }), { status: 200 })
    );

    await expect(preloadVideoSources()).resolves.toEqual([
      expect.objectContaining({ key: "example", name: "Example" }),
    ]);
  });

  it("should return an empty result when the API has no sources", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ sources: [] }), { status: 200 })
    );

    await expect(preloadVideoSources()).resolves.toEqual([]);
  });
});
