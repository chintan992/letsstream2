import { posterSizes } from "@/utils/api";
import { TVDetails } from "@/utils/types";

interface TVShowAboutProps {
  tvShow: TVDetails;
}

export const TVShowAbout = ({ tvShow }: TVShowAboutProps) => {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">About the Show</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="glass rounded-xl p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Status</h3>
          <p className="text-white/80">{tvShow.status}</p>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Episodes</h3>
          <p className="text-white/80">{tvShow.number_of_episodes}</p>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Seasons</h3>
          <p className="text-white/80">{tvShow.number_of_seasons}</p>
        </div>
      </div>

      {tvShow.production_companies.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-semibold text-white">
            Production Companies
          </h3>
          <div className="flex flex-wrap gap-6">
            {tvShow.production_companies.map(company => (
              <div key={company.id} className="text-center">
                {company.logo_path ? (
                  <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-lg bg-white/10 p-3">
                    <img
                      src={`${posterSizes.small}${company.logo_path}`}
                      alt={company.name}
                      className="max-h-full max-w-full"
                    />
                  </div>
                ) : (
                  <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-lg bg-white/10 p-3">
                    <span className="text-center text-xs text-white/70">
                      {company.name}
                    </span>
                  </div>
                )}
                <p className="text-sm text-white/70">{company.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TVShowAbout;
