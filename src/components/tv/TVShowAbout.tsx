import { posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { TVDetails } from "@/utils/types";

interface TVShowAboutProps {
  tvShow: TVDetails;
}

export const TVShowAbout = ({ tvShow }: TVShowAboutProps) => {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">About the Show</h2>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <h3 className="mb-3 text-lg font-bold text-white">Status</h3>
          <p className="text-lg text-white/90">{tvShow.status}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <h3 className="mb-3 text-lg font-bold text-white">Episodes</h3>
          <p className="text-lg text-white/90">{tvShow.number_of_episodes}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <h3 className="mb-3 text-lg font-bold text-white">Seasons</h3>
          <p className="text-lg text-white/90">{tvShow.number_of_seasons}</p>
        </div>
      </div>

      {tvShow.episode_run_time && tvShow.episode_run_time.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-white">Episode Runtime</h3>
          <div className="text-white/90">
            {tvShow.episode_run_time[0]} minutes per episode
          </div>
        </div>
      )}

      {tvShow.origin_country && tvShow.origin_country.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-white">Origin Country</h3>
          <div className="text-white/90">
            {tvShow.origin_country.join(", ")}
          </div>
        </div>
      )}

      {tvShow.production_companies.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-white">
            Production Companies
          </h3>
          <div className="flex flex-wrap gap-6">
            {tvShow.production_companies.map(company => (
              <div
                key={company.id}
                className="text-center transition-transform duration-300 hover:scale-105"
              >
                {company.logo_path ? (
                  <div className="mb-3 flex h-20 w-28 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 shadow-lg backdrop-blur-sm">
                    <img
                      src={getImageUrl(company.logo_path, posterSizes.medium)}
                      alt={company.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-20 w-28 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 shadow-lg backdrop-blur-sm">
                    <span className="text-center text-sm text-white/70">
                      {company.name}
                    </span>
                  </div>
                )}
                <p className="font-medium text-white/80">{company.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tvShow.created_by && tvShow.created_by.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-white">Created By</h3>
          <div className="flex flex-wrap gap-6">
            {tvShow.created_by.map(creator => (
              <div
                key={creator.id}
                className="text-center transition-transform duration-300 hover:scale-105"
              >
                {creator.profile_path ? (
                  <div className="mb-3 flex h-20 w-28 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 shadow-lg backdrop-blur-sm">
                    <img
                      src={getImageUrl(
                        creator.profile_path,
                        posterSizes.medium
                      )}
                      alt={creator.name}
                      className="max-h-full max-w-full rounded-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-20 w-28 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 shadow-lg backdrop-blur-sm">
                    <span className="text-center text-sm text-white/70">
                      {creator.name}
                    </span>
                  </div>
                )}
                <p className="font-bold text-white">{creator.name}</p>
                <p className="text-sm text-white/70">Creator</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TVShowAbout;
