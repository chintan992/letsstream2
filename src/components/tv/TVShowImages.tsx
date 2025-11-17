import { backdropSizes, posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { useState } from "react";
import { downloadTMDBImage } from "@/utils/image-download";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TVShowImagesProps {
  images: any;
  tvShowName: string;
}

export const TVShowImages = ({ images, tvShowName }: TVShowImagesProps) => {
  const [activeTab, setActiveTab] = useState<'backdrops' | 'posters'>('backdrops');
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);

  if (!images) {
    return null;
  }

  const backdrops = images.backdrops || [];
  const posters = images.posters || [];

  const handleDownload = async (filePath: string, imageType: 'backdrop' | 'poster') => {
    if (!filePath) return;

    const imageId = `${imageType}-${filePath}`;
    setDownloadingImage(imageId);

    try {
      await downloadTMDBImage(filePath, imageType, tvShowName);
    } catch (error) {
      console.error('Error downloading image:', error);
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
            activeTab === 'backdrops'
              ? "border-b-2 border-accent text-white"
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab('backdrops')}
        >
          Backdrops ({backdrops.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'posters'
              ? "border-b-2 border-accent text-white"
              : "text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab('posters')}
        >
          Posters ({posters.length})
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {activeTab === 'backdrops' && backdrops.map((image: any, index: number) => {
          const imageId = `backdrop-${image.file_path}`;
          return (
            <div key={`backdrop-${index}`} className="group relative overflow-hidden rounded-xl">
              <img
                src={getImageUrl(image.file_path, backdropSizes.small)}
                alt={`Backdrop ${index + 1}`}
                className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {image.vote_average > 0 && (
                <div className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white">
                  {image.vote_average.toFixed(1)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(image.file_path, 'backdrop')}
                  disabled={downloadingImage === imageId}
                  className="bg-accent hover:bg-accent/90 text-white shadow-lg"
                >
                  {downloadingImage === imageId ? (
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-white animate-ping mr-2"></span>
                      Downloading...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}

        {activeTab === 'posters' && posters.map((image: any, index: number) => {
          const imageId = `poster-${image.file_path}`;
          return (
            <div key={`poster-${index}`} className="group relative overflow-hidden rounded-xl">
              <img
                src={getImageUrl(image.file_path, posterSizes.medium)}
                alt={`Poster ${index + 1}`}
                className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {image.vote_average > 0 && (
                <div className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white">
                  {image.vote_average.toFixed(1)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(image.file_path, 'poster')}
                  disabled={downloadingImage === imageId}
                  className="bg-accent hover:bg-accent/90 text-white shadow-lg"
                >
                  {downloadingImage === imageId ? (
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-white animate-ping mr-2"></span>
                      Downloading...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
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

export default TVShowImages;