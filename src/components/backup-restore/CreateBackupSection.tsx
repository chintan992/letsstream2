import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import {
  createBackup,
  downloadBackup,
  generateBackupFilenameSuggestions,
} from "@/utils/services/backup-restore";
import { User } from "firebase/auth";

export function CreateBackupSection({ user }: { user: User }) {
  const { toast } = useToast();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [customFilename, setCustomFilename] = useState("");
  const [filenameSuggestions, setFilenameSuggestions] = useState<string[]>([]);
  const [showFilenameOptions, setShowFilenameOptions] = useState(false);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupData = await createBackup(user.uid);
      const suggestions = generateBackupFilenameSuggestions(
        backupData,
        user.email || ""
      );
      setFilenameSuggestions(suggestions);

      const filename = customFilename.trim() || (suggestions.length > 0 ? suggestions[0] : `backup-${Date.now()}.json`);
      downloadBackup(backupData, filename);

      toast({
        title: "Backup created successfully",
        description: `Backup file "${filename}" downloaded with ${backupData.data.watchHistory.length} items.`,
      });

      setShowFilenameOptions(true);
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Backup failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Create Backup</h3>
        <p className="text-sm text-muted-foreground">
          Download a JSON file containing all your watch history, favorites, and
          watchlist data.
        </p>
      </div>
      <Button
        onClick={handleCreateBackup}
        disabled={isCreatingBackup}
        className="w-full"
      >
        <Download className="mr-2 h-4 w-4" />
        {isCreatingBackup ? "Creating Backup..." : "Create & Download Backup"}
      </Button>

      <div className="space-y-4 border-t pt-4">
        <div>
          <Label htmlFor="custom-filename" className="text-sm font-medium">
            Custom Filename (Optional)
          </Label>
          <Input
            id="custom-filename"
            type="text"
            placeholder="Enter custom filename or leave empty for auto-generated"
            value={customFilename}
            onChange={e => setCustomFilename(e.target.value)}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            File will automatically have .json extension added
          </p>
        </div>

        {filenameSuggestions.length > 0 && (
          <div>
            <Label htmlFor="suggested-filenames" className="text-sm font-medium">Suggested Filenames</Label>
            <Select onValueChange={value => setCustomFilename(value)}>
              <SelectTrigger id="suggested-filenames" className="mt-1">
                <SelectValue placeholder="Choose a suggested filename" />
              </SelectTrigger>
              <SelectContent>
                {filenameSuggestions.map(suggestion => (
                  <SelectItem key={suggestion} value={suggestion}>
                    <div className="flex items-center">
                      <FileText className="mr-2 h-3 w-3" />
                      {suggestion}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
