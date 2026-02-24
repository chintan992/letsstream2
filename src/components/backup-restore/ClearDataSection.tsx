import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearUserData } from "@/utils/services/backup-restore";
import { User } from "firebase/auth";

export function ClearDataSection({ user, onSuccess }: { user: User; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClearData = async () => {
    setIsLoading(true);
    try {
      await clearUserData(user.uid);
      toast({
        title: "Data cleared",
        description:
          "All your watch history, favorites, and watchlist have been cleared.",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({
        title: "Error clearing data",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Clear all your data. This action cannot be undone.
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={isLoading}>
            <Trash2 className="mr-2 h-4 w-4" />
            {isLoading ? "Clearing Data..." : "Clear All Data"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              your:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Watch history</li>
                <li>Favorite movies and shows</li>
                <li>Watchlist items</li>
              </ul>
              <br />
              Your data will be completely removed from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="hover:bg-destructive/90 bg-destructive text-destructive-foreground"
            >
              Yes, clear all data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
