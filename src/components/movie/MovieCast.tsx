import { getImageUrl } from "@/utils/services/tmdb";
import { posterSizes } from "@/utils/api";
import { CastMember } from "@/utils/types";

interface MovieCastProps {
  cast: CastMember[];
}

const MovieCast = ({ cast }: MovieCastProps) => {
  if (cast.length === 0) {
    return <div className="text-white/70">No cast information available.</div>;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Cast</h2>
      <div className="flex flex-wrap gap-6">
        {cast.map((member, index) => (
          <div
            key={member.credit_id || `${member.id}-${index}`}
            className="w-32 text-center"
          >
            {member.profile_path ? (
              <img
                src={getImageUrl(member.profile_path, posterSizes.medium)}
                alt={member.name}
                className="mx-auto mb-2 h-32 w-24 rounded-lg object-cover"
              />
            ) : (
              <div className="mx-auto mb-2 flex h-32 w-24 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60">
                No Image
              </div>
            )}
            <p className="truncate text-sm font-medium text-white/90">
              {member.name}
            </p>
            <p className="truncate text-xs text-white/60">{member.character}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieCast;
