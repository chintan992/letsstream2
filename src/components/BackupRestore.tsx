import React, { useState, useRef } from "react";
import { useAuth } from "@/hooks";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
} from "lucide-react";
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
import {
  createBackup,
  downloadBackup,
  parseBackupFile,
  restoreBackup,
  clearUserData,
  validateBackupData,
  generateBackupFilenameSuggestions,
  type BackupData,
  type RestoreResult,
  type ValidationResult,
} from "@/utils/services/backup-restore";

export function BackupRestore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(
    null
  );
  const [customFilename, setCustomFilename] = useState("");
  const [filenameSuggestions, setFilenameSuggestions] = useState<string[]>([]);
  const [showFilenameOptions, setShowFilenameOptions] = useState(false);
  const [isValidatingFile, setIsValidatingFile] = useState(false);

  const handleCreateBackup = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a backup.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingBackup(true);
    try {
      const backupData = await createBackup(user.uid);

      // Generate filename suggestions
      const suggestions = generateBackupFilenameSuggestions(
        backupData,
        user.email
      );
      setFilenameSuggestions(suggestions);

      // Use custom filename if provided, otherwise use first suggestion
      const filename = customFilename.trim() || suggestions[0];
      downloadBackup(backupData, filename);

      toast({
        title: "Backup created successfully",
        description: `Backup file "${filename}" downloaded with ${backupData.data.watchHistory.length} watch history items, ${backupData.data.favorites.length} favorites, and ${backupData.data.watchlist.length} watchlist items.`,
      });

      // Show filename options after successful backup
      setShowFilenameOptions(true);
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Backup failed",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while creating the backup.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic file type check
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setValidationResult(null);
    setRestoreResult(null);
    setIsValidatingFile(true);

    try {
      const backupData = await parseBackupFile(file);
      const validation = validateBackupData(backupData);
      setValidationResult(validation);

      if (!validation.isValid) {
        toast({
          title: "Invalid backup file",
          description: "The selected file is not a valid backup file.",
          variant: "destructive",
        });
      } else if (validation.warnings.length > 0) {
        toast({
          title: "Backup file validated with warnings",
          description: validation.warnings.join(", "),
          variant: "default",
        });
      } else {
        toast({
          title: "Backup file validated",
          description: "The backup file is valid and ready for restore.",
        });
      }
    } catch (error) {
      console.error("Error parsing backup file:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to read the backup file.";
      toast({
        title: "Error reading file",
        description: errorMessage,
        variant: "destructive",
      });
      setSelectedFile(null);
      setValidationResult(null);
    } finally {
      setIsValidatingFile(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!user || !selectedFile || !validationResult?.isValid) return;

    setIsRestoringBackup(true);
    setRestoreProgress(0);
    setRestoreResult(null);

    try {
      const backupData = await parseBackupFile(selectedFile);
      setRestoreProgress(25);

      const result = await restoreBackup(backupData, user.uid);
      setRestoreProgress(100);
      setRestoreResult(result);

      if (result.success) {
        toast({
          title: "Restore completed",
          description: result.message,
        });
      } else {
        toast({
          title: "Restore failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      setRestoreResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        stats: {
          watchHistory: { added: 0, updated: 0, errors: 0 },
          favorites: { added: 0, updated: 0, errors: 0 },
          watchlist: { added: 0, updated: 0, errors: 0 },
        },
      });
      toast({
        title: "Restore failed",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred during restore.",
        variant: "destructive",
      });
    } finally {
      setIsRestoringBackup(false);
      setRestoreProgress(0);
    }
  };

  const handleClearData = async () => {
    if (!user) return;

    try {
      await clearUserData(user.uid);
      toast({
        title: "Data cleared",
        description:
          "All your watch history, favorites, and watchlist have been cleared.",
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({
        title: "Error clearing data",
        description:
          error instanceof Error ? error.message : "Failed to clear data.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>Manage your data backups</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access backup and restore functionality.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Create backups of your watch history, favorites, and watchlist, or
          restore from a previous backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Backup Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Create Backup</h3>
            <p className="text-sm text-muted-foreground">
              Download a JSON file containing all your watch history, favorites,
              and watchlist data.
            </p>
          </div>
          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isCreatingBackup
              ? "Creating Backup..."
              : "Create & Download Backup"}
          </Button>

          {/* Filename Customization */}
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
                <Label className="text-sm font-medium">
                  Suggested Filenames
                </Label>
                <Select onValueChange={value => setCustomFilename(value)}>
                  <SelectTrigger className="mt-1">
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

        {/* Restore Backup Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Restore Backup</h3>
            <p className="text-sm text-muted-foreground">
              Upload a backup file to restore your data. This will merge with
              existing data.
            </p>
          </div>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Select backup file"
                disabled={isValidatingFile}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isValidatingFile}
                aria-describedby="file-input-help"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isValidatingFile
                  ? "Validating..."
                  : selectedFile
                    ? selectedFile.name
                    : "Select Backup File"}
              </Button>
              <p
                id="file-input-help"
                className="mt-1 text-xs text-muted-foreground"
              >
                Only JSON files are supported. Maximum file size: 50MB
              </p>
            </div>

            {validationResult && (
              <Alert
                variant={validationResult.isValid ? "default" : "destructive"}
              >
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {validationResult.isValid ? (
                    <div>
                      <p>Backup file is valid.</p>
                      {validationResult.warnings.length > 0 && (
                        <ul className="mt-2 list-inside list-disc">
                          {validationResult.warnings.map((warning, i) => (
                            <li key={`${warning}-${i}`} className="text-sm">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>Backup file has errors:</p>
                      <ul className="mt-2 list-inside list-disc">
                        {validationResult.errors.map((error, i) => (
                          <li key={`${error}-${i}`} className="text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {isRestoringBackup && (
              <div className="space-y-2">
                <Progress value={restoreProgress} />
                <p className="text-sm text-muted-foreground">
                  Restoring backup...
                </p>
              </div>
            )}

            <Button
              onClick={handleRestoreBackup}
              disabled={
                !selectedFile || !validationResult?.isValid || isRestoringBackup
              }
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isRestoringBackup ? "Restoring..." : "Restore Backup"}
            </Button>
          </div>
        </div>

        {/* Restore Results */}
        {restoreResult && (
          <Alert variant={restoreResult.success ? "default" : "destructive"}>
            {restoreResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div>
                <p className="font-semibold">{restoreResult.message}</p>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Watch History</p>
                    <p>Added: {restoreResult.stats.watchHistory.added}</p>
                    <p>Errors: {restoreResult.stats.watchHistory.errors}</p>
                  </div>
                  <div>
                    <p className="font-medium">Favorites</p>
                    <p>Added: {restoreResult.stats.favorites.added}</p>
                    <p>Errors: {restoreResult.stats.favorites.errors}</p>
                  </div>
                  <div>
                    <p className="font-medium">Watchlist</p>
                    <p>Added: {restoreResult.stats.watchlist.added}</p>
                    <p>Errors: {restoreResult.stats.watchlist.errors}</p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Clear Data Section */}
        <div className="space-y-4 border-t pt-4">
          <div>
            <h3 className="text-lg font-semibold text-destructive">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground">
              Clear all your data. This action cannot be undone.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
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
      </CardContent>
    </Card>
  );
}
