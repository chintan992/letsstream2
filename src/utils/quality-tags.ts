const QUALITY_TAGS = [
  "2160p",
  "1080p",
  "720p",
  "480p",
  "HDR",
  "HDR10+",
  "Dolby Vision",
  "HEVC",
  "x265",
  "x264",
  "WEBRip",
  "WEB-DL",
  "BluRay",
  "CAM",
  "10bit",
  "8bit",
  "DTS",
  "AAC",
  "DDP",
  "Atmos",
  "UHD",
  "4K",
  "FHD",
  "HD",
];

export const extractQualityTags = (title: string): string[] => {
  const upperTitle = title.toUpperCase();
  return QUALITY_TAGS.filter(tag => upperTitle.includes(tag.toUpperCase()));
};
