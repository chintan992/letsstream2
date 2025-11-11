import { FC } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
// ...existing code...
import { LiveStream } from "@/pages/LiveStreams";
import { Button } from "./ui/button";

interface LiveStreamCardProps {
  stream: LiveStream;
}

const LiveStreamCard: FC<LiveStreamCardProps> = ({ stream }) => {
  const navigate = useNavigate();

  const handleWatchClick = () => {
    navigate(`/watch/live/${stream.match_id}`, { state: { stream } });
  };

  // Use direct URLs for images (proxy removed)
  const banner = stream.banner;
  const team1Flag = stream.team_1_flag;
  const team2Flag = stream.team_2_flag;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-card/30 hover:border-accent/50 flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-black/20 backdrop-blur-sm"
    >
      {/* Banner */}
      <div className="relative aspect-video w-full">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <img
          src={banner}
          alt={stream.match_name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {/* Event Category Badge */}
        <div className="absolute right-3 top-3 z-20">
          <span className="bg-accent/90 rounded px-2 py-1 text-xs font-bold uppercase tracking-wider">
            {stream.event_catagory}
          </span>
        </div>
        {/* Event Name */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <p className="text-sm text-white/80">{stream.event_name}</p>
          <h3 className="line-clamp-2 text-lg font-semibold text-white">
            {stream.match_name}
          </h3>
        </div>
      </div>

      {/* Teams */}
      <div className="flex flex-col p-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <img
              src={team1Flag}
              alt={stream.team_1}
              className="h-8 w-8 rounded-full border border-white/20 object-cover"
            />
            <span className="line-clamp-1 text-sm font-medium text-white">
              {stream.team_1}
            </span>
          </div>
          <span className="text-xs font-bold text-white/60">VS</span>
          <div className="flex items-center space-x-2">
            <span className="line-clamp-1 text-right text-sm font-medium text-white">
              {stream.team_2}
            </span>
            <img
              src={team2Flag}
              alt={stream.team_2}
              className="h-8 w-8 rounded-full border border-white/20 object-cover"
            />
          </div>
        </div>

        {/* Watch Button */}
        <Button
          onClick={handleWatchClick}
          className="hover:bg-accent/90 mt-3 w-full bg-accent text-accent-foreground"
        >
          <Play className="mr-2 h-4 w-4" />
          Watch Live
        </Button>
      </div>
    </motion.div>
  );
};

export default LiveStreamCard;
