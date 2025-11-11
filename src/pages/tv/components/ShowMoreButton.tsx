import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShowMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const ShowMoreButton = ({ onClick, isLoading }: ShowMoreButtonProps) => {
  return (
    <div className="my-8 flex justify-center">
      <Button
        onClick={onClick}
        variant="outline"
        className="hover:bg-accent/20 hover:border-accent/50 border-white/10 text-white transition-all duration-300 hover:text-white"
      >
        {isLoading ? (
          <>Loading...</>
        ) : (
          <>
            Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
          </>
        )}
      </Button>
    </div>
  );
};

export default ShowMoreButton;
