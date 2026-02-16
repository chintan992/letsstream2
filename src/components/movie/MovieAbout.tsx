import { getImageUrl } from "@/utils/services/tmdb";
import { posterSizes } from "@/utils/api";
import { MovieDetails, CrewMember } from "@/utils/types";

interface MovieAboutProps {
  movie: MovieDetails;
  directors: CrewMember[];
}

const MovieAbout = ({ movie, directors }: MovieAboutProps) => {
  return (
    <div className="space-y-8">
      {/* Status, Budget, Revenue Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="glass rounded-xl p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Status</h3>
          <p className="text-white/80">{movie.status}</p>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Budget</h3>
          <p className="text-white/80">
            {movie.budget > 0
              ? `$${movie.budget.toLocaleString()}`
              : "Not available"}
          </p>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Revenue</h3>
          <p className="text-white/80">
            {movie.revenue > 0
              ? `$${movie.revenue.toLocaleString()}`
              : "Not available"}
          </p>
        </div>
      </div>

      {/* Production companies */}
      {movie.production_companies?.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-semibold text-white">
            Production Companies
          </h3>
          <div className="flex flex-wrap gap-6">
            {movie.production_companies.map(company => (
              <div key={company.id} className="text-center">
                {company.logo_path ? (
                  <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-lg bg-white/10 p-3">
                    <img
                      src={getImageUrl(company.logo_path, posterSizes.medium)}
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

      {/* Directors */}
      {directors && directors.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-semibold text-white">Directors</h3>
          <div className="flex flex-wrap gap-6">
            {directors.map(director => (
              <div key={director.id} className="text-center">
                {director.profile_path ? (
                  <div className="mb-2 flex h-20 w-28 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 shadow-lg backdrop-blur-sm">
                    <img
                      src={getImageUrl(
                        director.profile_path,
                        posterSizes.medium
                      )}
                      alt={director.name}
                      className="max-h-full max-w-full rounded-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-2 flex h-20 w-28 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 shadow-lg backdrop-blur-sm">
                    <span className="text-center text-sm text-white/70">
                      {director.name}
                    </span>
                  </div>
                )}
                <p className="font-bold text-white">{director.name}</p>
                <p className="text-sm text-white/70">Director</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieAbout;
