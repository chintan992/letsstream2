import { CastMember } from "@/utils/types";

interface TVShowCastProps {
  cast: CastMember[];
}

export const TVShowCast = ({ cast }: TVShowCastProps) => {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Cast</h2>
      {cast.length > 0 ? (
        <div
          className="flex flex-wrap gap-6 px-1 sm:-mx-4 sm:flex-nowrap sm:gap-4 sm:overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {cast.map(member => (
            <div
              key={member.id}
              className="w-36 min-w-[9rem] flex-shrink-0 text-center transition-transform duration-300 hover:scale-105"
            >
              <div className="group relative">
                {member.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                    alt={member.name}
                    className="mx-auto mb-3 h-40 w-28 rounded-2xl object-cover shadow-lg group-hover:shadow-xl"
                  />
                ) : (
                  <div className="to-accent/30 mx-auto mb-3 flex h-40 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/30 shadow-lg group-hover:shadow-xl">
                    <span className="text-sm text-white/50">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="w-full truncate text-sm font-medium text-white">
                    {member.name}
                  </p>
                </div>
              </div>

              <p className="mb-1 max-w-full truncate text-base font-bold text-white">
                {member.name}
              </p>
              <p className="max-w-full truncate text-sm italic text-white/80">
                {member.character}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-white/70">
          No cast information available.
        </div>
      )}
    </div>
  );
};
