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
              className="w-32 min-w-[7.5rem] flex-shrink-0 text-center sm:w-28 sm:min-w-[6.5rem]"
            >
              {member.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                  alt={member.name}
                  className="mx-auto mb-2 h-32 w-24 rounded-lg object-cover sm:h-28 sm:w-20"
                />
              ) : (
                <div className="mx-auto mb-2 flex h-32 w-24 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60 sm:h-28 sm:w-20">
                  No Image
                </div>
              )}
              <p className="max-w-full truncate text-sm font-medium text-white/90 sm:text-xs">
                {member.name}
              </p>
              <p className="max-w-full truncate text-xs text-white/60">
                {member.character}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-white/70">No cast information available.</div>
      )}
    </div>
  );
};

export default TVShowCast;
