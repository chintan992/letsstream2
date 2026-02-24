/**
 * Utility function to download an image from a URL
 * @param imageUrl - The URL of the image to download
 * @param filename - The filename to save the image as
 */
const downloadImage = async (
  imageUrl: string,
  filename: string
): Promise<void> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Convert the response to a blob
    const blob = await response.blob();

    // Create a temporary anchor element
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Set the download attributes
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    // Append to the document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
};

/**
 * Utility function to download an image from TMDB URL with a proper filename
 * @param filePath - The TMDB image file path
 * @param imageType - The type of image (backdrop or poster)
 * @param showName - The name of the TV show for the filename
 */
export const downloadTMDBImage = async (
  filePath: string,
  imageType: "backdrop" | "poster",
  showName: string
): Promise<void> => {
  if (!filePath) {
    throw new Error("Image file path is required");
  }

  const imageUrl = `https://image.tmdb.org/t/p/original${filePath}`;
  const filename = `${showName}_${imageType}_${filePath.split("/").pop() || "image.jpg"}`;

  await downloadImage(imageUrl, filename);
};
