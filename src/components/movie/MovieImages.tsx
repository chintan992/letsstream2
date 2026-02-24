import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/utils/services/tmdb";
import { backdropSizes } from "@/utils/api";
import { downloadTMDBImage } from "@/utils/image-download";

interface Image {
  file_path: string;
  vote_average: number;
}

interface MovieImagesProps {
  images: {
    backdrops: Image[];
    posters: Image[];
  } | null;
  movieName: string;
}

const MovieImages = ({ images, movieName }: MovieImagesProps) => {
  const [activeTab, setActiveTab] = useState<"backdrops" | "posters">(
    "backdrops"
  );
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);
  const { toast } = useToast();

  if (!images || (!images.backdrops?.length && !images.posters?.length)) {
    return <div className="text-white/70">No images available.</div>;
  }

  const renderImageGrid = (imageList: Image[], type: "backdrop" | "poster") => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {imageList.map(image => (
        <div
          key={image.file_path}
          className="group relative overflow-hidden rounded-xl"
        >
          <img
            src={getImageUrl(
              image.file_path,
              type === "backdrop" ? backdropSizes.small : "w342"
            )}
            alt={`${type} ${index + 1}`}
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
              onClick={async () => {
                const imageId = `${type}-${image.file_path}`;
                setDownloadingImage(imageId);

                try {
                  await downloadTMDBImage(image.file_path, type, movieName);
                } catch (error) {
                  console.error(`Error downloading ${type}:`, error);
                  toast({
                    title: "Download Failed",
                    description: `Failed to download ${type} image for ${movieName}. Please try again.`,
                    variant: "destructive",
                  });
                } finally {
                  setDownloadingImage(null);
                }
              }}
              disabled={downloadingImage === `${type}-${image.file_path}`}
              className="hover:bg-accent/90 bg-accent text-white shadow-lg"
            >
              {downloadingImage === `${type}-${image.file_path}` ? (
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
      ))}
    </div>
  );

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Images</h2>
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as "backdrops" | "posters")}
      >
        <TabsList className="mb-6 border-b border-white/10 bg-transparent">
          <TabsTrigger
            value="backdrops"
            className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
          >
            Backdrops ({images.backdrops?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="posters"
            className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-white"
          >
            Posters ({images.posters?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backdrops">
          {images.backdrops?.length > 0 ? (
            renderImageGrid(images.backdrops, "backdrop")
          ) : (
            <p className="text-white/70">No backdrops available.</p>
          )}
        </TabsContent>

        <TabsContent value="posters">
          {images.posters?.length > 0 ? (
            renderImageGrid(images.posters, "poster")
          ) : (
            <p className="text-white/70">No posters available.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MovieImages;
