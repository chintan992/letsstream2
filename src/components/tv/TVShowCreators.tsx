import { posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";

interface Creator {
  id: number;
  name: string;
  profile_path: string;
  job: string;
}

interface TVShowCreatorsProps {
  creators: Creator[];
}

export const TVShowCreators = ({ creators }: TVShowCreatorsProps) => {
  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Creators</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {creators.map(creator => (
          <div
            key={creator.id}
            className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-105"
          >
            {creator.profile_path ? (
              <img
                src={getImageUrl(creator.profile_path, posterSizes.medium)}
                alt={creator.name}
                className="mb-3 h-24 w-24 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="to-accent/30 mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-900/30 shadow-lg">
                <span className="text-sm text-white/50">No Image</span>
              </div>
            )}
            <h3 className="mb-1 font-bold text-white">{creator.name}</h3>
            <p className="text-sm text-white/70">{creator.job || "Creator"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
