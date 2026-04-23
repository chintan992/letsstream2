import { m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const WatchPlaceholder = () => {
  const navigate = useNavigate();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex min-h-screen flex-col items-center justify-center bg-background"
    >
      {/* Background gradient */}
      <div className="from-background/95 pointer-events-none fixed inset-0 bg-gradient-to-b to-background" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
        {/* Icon */}
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-accent/10 mb-8 flex h-24 w-24 items-center justify-center rounded-full"
        >
          <Play className="h-12 w-12 text-accent" />
        </m.div>

        {/* Title */}
        <m.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-4 text-4xl font-bold text-white"
        >
          Feature Under Development
        </m.h1>

        {/* Description */}
        <m.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8 text-lg text-muted-foreground"
        >
          Our streaming functionality is currently being built to bring you the
          best viewing experience. Check back soon!
        </m.p>

        {/* Actions */}
        <m.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")} variant="default">
            Return to Home
          </Button>
        </m.div>
      </div>
    </m.div>
  );
};

export default WatchPlaceholder;
