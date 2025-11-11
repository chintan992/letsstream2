import { Tv } from "lucide-react";

const TVShowsHeader = () => {
  return (
    <div className="mb-8 flex items-center gap-3 pt-10">
      <Tv className="h-8 w-8 animate-pulse-slow text-accent" />
      <h1 className="text-3xl font-bold text-white">TV Shows</h1>
    </div>
  );
};

export default TVShowsHeader;
