import { posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";

interface TVShowCreatorsProps {
  creators: any[];
}

export const TVShowCreators = ({ creators }: TVShowCreatorsProps) => {
  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Creators</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {creators.map((creator) => (
          <div 
            key={creator.id} 
            className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-105"
          >
            {creator.profile_path ? (
              <img
                src={getImageUrl(creator.profile_path, posterSizes.medium)}
                alt={creator.name}
                className="w-24 h-24 rounded-full object-cover mb-3 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-900/30 to-accent/30 flex items-center justify-center mb-3 shadow-lg">
                <span className="text-white/50 text-sm">No Image</span>
              </div>
            )}
            <h3 className="font-bold text-white mb-1">{creator.name}</h3>
            <p className="text-sm text-white/70">{creator.job || 'Creator'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TVShowCreators;