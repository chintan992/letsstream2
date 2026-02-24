import { backdropSizes, posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { useState } from "react";
import { downloadTMDBImage } from "@/utils/image-download";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Image {
  file_path: string;
  vote_average: number;
}

interface TVShowImagesProps {
  images: {
    backdrops: Image[];
    posters: Image[];
  };
  tvShowName: string;
}

export const TVShowImages = ({ images, tvShowName }: TVShowImagesProps) => {
  const [activeTab, setActiveTab] = useState<"backdrops" | "posters">(
    "backdrops"
  );
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);

  if (!images) {
    return null;
  }

  const backdrops = images.backdrops || [];
  const posters = images.posters || [];

  const handleDownload = async (
    filePath: string,
    imageType: "backdrop" | "poster"
  ) => {
    if (!filePath) return;

    const imageId = `${imageType}-${filePath}`;
    setDownloadingImage(imageId);

    try {
      await downloadTMDBImage(filePath, imageType, tvShowName);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setDownloadingImage(null);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Images</h2>

      <div className="mb-6 flex border-b border-white/10">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "backdrops"
              ? "border-b-2 border-accent text-white"
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("backdrops")}
        >
          Backdrops ({backdrops.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "posters"
              ? "border-b-2 border-accent text-white"
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("posters")}
        >
          Posters ({posters.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {activeTab === "backdrops" &&
          backdrops.map((image: any) => {
            const imageId = `backdrop-${image.file_path}`;
            return (
              <div
                key={imageId}
                className="group relative overflow-hidden rounded-xl"
              >
                <img
                  src={getImageUrl(image.file_path, backdropSizes.small)}
                  alt={`Backdrop ${index + 1}`}
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {image.vote_average > 0 && (
                  <div className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                    {image.vote_average.toFixed(1)}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(image.file_path, "backdrop")}
                    disabled={downloadingImage === imageId}
                    className="hover:bg-accent/90 bg-accent text-white shadow-lg"
                  >
                    {downloadingImage === imageId ? (
                      <span className="flex items-center">
                        <span className="mr-2 h-3 w-3 animate-ping rounded-full bg-white"></span>
                        Downloading...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

        {activeTab === "posters" &&
          posters.map((image: any) => {
            const imageId = `poster-${image.file_path}`;
            return (
              <div
                key={imageId}
                className="group relative overflow-hidden rounded-xl"
              >
                <img
                  src={getImageUrl(image.file_path, posterSizes.medium)}
                  alt={`Poster ${index + 1}`}
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {image.vote_average > 0 && (
                  <div className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                    {image.vote_average.toFixed(1)}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(image.file_path, "poster")}
                    disabled={downloadingImage === imageId}
                    className="hover:bg-accent/90 bg-accent text-white shadow-lg"
                  >
                    {downloadingImage === imageId ? (
                      <span className="flex items-center">
                        <span className="mr-2 h-3 w-3 animate-ping rounded-full bg-white"></span>
                        Downloading...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
