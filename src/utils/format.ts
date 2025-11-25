import { formatDistanceToNow } from "date-fns";

export const formatLastWatched = (dateString: string) => {
  if (!dateString) return "Recently";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date > new Date()) {
      return "Recently";
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Recently";
  }
};

export const formatTimeRemaining = (position: number, duration: number) => {
  if (!duration) return "";
  const remaining = Math.max(0, duration - position);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} remaining`;
};
