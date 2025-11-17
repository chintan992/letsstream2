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
                  <div className="mx-auto mb-3 flex h-40 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/30 to-accent/30 shadow-lg group-hover:shadow-xl">
                    <span className="text-white/50 text-sm">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                  <p className="text-white text-sm font-medium truncate w-full">{member.name}</p>
                </div>
              </div>

              <p className="max-w-full truncate text-base font-bold text-white mb-1">
                {member.name}
              </p>
              <p className="max-w-full truncate text-sm text-white/80 italic">
                {member.character}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-white/70 text-center py-8">No cast information available.</div>
      )}
    </div>
  );
};

export default TVShowCast;
