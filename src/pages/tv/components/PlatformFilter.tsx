import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STREAMING_PLATFORMS } from "../constants/streamingPlatforms";

interface PlatformFilterProps {
  platformFilters: string[];
  togglePlatformFilter: (platformId: string) => void;
  clearPlatformFilters: () => void;
  togglePlatformBar: () => void;
  showPlatformBar: boolean;
}

const PlatformFilter = ({
  platformFilters,
  togglePlatformFilter,
  clearPlatformFilters,
  togglePlatformBar,
  showPlatformBar,
}: PlatformFilterProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative border-white/10 text-white hover:bg-white/10"
        >
          <Filter className="mr-2 h-4 w-4" />
          Platforms
          {platformFilters.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs">
              {platformFilters.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-white/10 bg-background text-white">
        <DropdownMenuLabel>Streaming Platforms</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {STREAMING_PLATFORMS.map(platform => (
          <DropdownMenuCheckboxItem
            key={platform.id}
            checked={platformFilters.includes(platform.id)}
            onCheckedChange={() => togglePlatformFilter(platform.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center">
              {platform.icon && (
                <platform.icon className={`h-4 w-4 ${platform.color}`} />
              )}
              {!platform.icon && (
                <div className={`h-3 w-3 rounded-full ${platform.color}`} />
              )}
              {platform.name}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
        {platformFilters.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <div className="px-2 py-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={clearPlatformFilters}
              >
                Clear Platforms
              </Button>
            </div>
          </>
        )}
        <DropdownMenuSeparator className="bg-white/10" />
        <div className="px-2 py-1.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={togglePlatformBar}
          >
            {showPlatformBar ? "Hide Platform Bar" : "Show Platform Bar"}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlatformFilter;
