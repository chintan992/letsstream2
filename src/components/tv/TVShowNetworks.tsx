import { posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";

interface Network {
  id: number;
  name: string;
  logo_path: string;
  origin_country: string;
}

interface TVShowNetworksProps {
  networks: Network[];
}

export const TVShowNetworks = ({ networks }: TVShowNetworksProps) => {
  if (!networks || networks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Networks</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {networks.map(network => (
          <div
            key={network.id}
            className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-105"
          >
            {network.logo_path ? (
              <div className="flex h-16 w-24 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-3 shadow-lg backdrop-blur-sm">
                <img
                  src={getImageUrl(network.logo_path, posterSizes.medium)}
                  alt={network.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-16 w-24 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-3 shadow-lg backdrop-blur-sm">
                <span className="text-center text-xs text-white/70">
                  {network.name}
                </span>
              </div>
            )}
            <h3 className="mt-2 font-bold text-white">{network.name}</h3>
            <p className="text-sm text-white/70">{network.origin_country}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
