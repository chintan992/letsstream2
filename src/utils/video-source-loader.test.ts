import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVideoSources, clearVideoSourcesCache, preloadVideoSources } from "@/utils/video-source-loader";

describe("Video Source Loader", () => {
  beforeEach(() => {
    clearVideoSourcesCache();
    vi.resetAllMocks();
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

  it("should preload return promise", () => {
    const result = preloadVideoSources();
    expect(result).toBeInstanceOf(Promise);
  });
});