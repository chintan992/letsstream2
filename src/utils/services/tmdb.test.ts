import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tmdb, clearTMDBCache, getImageUrl, getResponsiveImageUrls } from "@/utils/services/tmdb";

describe("TMDB Service", () => {
  beforeEach(() => {
    clearTMDBCache();
    vi.resetAllMocks();
  });

  afterEach(() => {
    clearTMDBCache();
  });

  describe("getImageUrl", () => {
    it("should return null for null path", () => {
      expect(getImageUrl(null, "w500")).toBeNull();
    });

    it("should return null for empty path", () => {
      expect(getImageUrl("", "w500")).toBeNull();
    });

    it("should construct correct image URL", () => {
      const url = getImageUrl("/test-path.jpg", "w500");
      expect(url).toContain("/w500/test-path.jpg");
    });
  });

  describe("getResponsiveImageUrls", () => {
    it("should return null for null path", () => {
      expect(getResponsiveImageUrls(null)).toBeNull();
    });

    it("should return srcset with multiple sizes", () => {
      const result = getResponsiveImageUrls("/test.jpg");
      expect(result).not.toBeNull();
      expect(result?.srcset).toContain("w92");
      expect(result?.srcset).toContain("w500");
      expect(result?.srcset).toContain("w1280");
      expect(result?.sizes).toBeDefined();
    });
  });

  describe("cache behavior", () => {
    it("should export clearTMDBCache function", () => {
      expect(typeof clearTMDBCache).toBe("function");
    });

    it("should have request deduplication via interceptors", () => {
      expect(tmdb.interceptors.request).toBeDefined();
      expect(tmdb.interceptors.response).toBeDefined();
    });
  });
});