import { posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";

interface TVShowNetworksProps {
  networks: any[];
}

export const TVShowNetworks = ({ networks }: TVShowNetworksProps) => {
  if (!networks || networks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Networks</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {networks.map((network) => (
          <div 
            key={network.id} 
            className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-105"
          >
            {network.logo_path ? (
              <div className="w-24 h-16 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-3 backdrop-blur-sm shadow-lg">
                <img
                  src={getImageUrl(network.logo_path, posterSizes.medium)}
                  alt={network.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-24 h-16 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-3 backdrop-blur-sm shadow-lg">
                <span className="text-center text-xs text-white/70">
                  {network.name}
                </span>
              </div>
            )}
            <h3 className="font-bold text-white mt-2">{network.name}</h3>
            <p className="text-sm text-white/70">{network.origin_country}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TVShowNetworks;