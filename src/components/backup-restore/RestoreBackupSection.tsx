import React, { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import {
  parseBackupFile,
  restoreBackup,
  validateBackupData,
  ValidationResult,
  RestoreResult,
} from "@/utils/services/backup-restore";
import { User } from "firebase/auth";

export function RestoreBackupSection({ user }: { user: User }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(
    null
  );
  const [isValidatingFile, setIsValidatingFile] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isRestoringBackup) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size: 50MB",
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
        });
      } else {
        toast({
          title: "Backup file validated",
          description: "The backup file is ready for restore.",
        });
      }
    } catch (error) {
      console.error("Error parsing backup file:", error);
      toast({
        title: "Error reading file",
        description:
          error instanceof Error
            ? error.message
            : "Failed to read the backup file.",
        variant: "destructive",
      });
      setSelectedFile(null);
      setValidationResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsValidatingFile(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedFile || !validationResult?.isValid) return;

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
        toast({ title: "Restore completed", description: result.message });
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
          error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsRestoringBackup(false);
      setRestoreProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Restore Backup</h3>
        <p className="text-sm text-muted-foreground">
          Upload a backup file to restore your data. This will merge with
          existing data.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select backup file"
            disabled={isValidatingFile || isRestoringBackup}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            disabled={isValidatingFile || isRestoringBackup}
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
          <Alert variant={validationResult.isValid ? "default" : "destructive"}>
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
                      {validationResult.warnings.map(warning => (
                        <li key={warning} className="text-sm">
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
                    {validationResult.errors.map(error => (
                      <li key={error} className="text-sm">
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
            <p className="text-sm text-muted-foreground">Restoring backup...</p>
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
                  <p>Updated: {restoreResult.stats.watchHistory.updated}</p>
                  <p>Errors: {restoreResult.stats.watchHistory.errors}</p>
                </div>
                <div>
                  <p className="font-medium">Favorites</p>
                  <p>Added: {restoreResult.stats.favorites.added}</p>
                  <p>Updated: {restoreResult.stats.favorites.updated}</p>
                  <p>Errors: {restoreResult.stats.favorites.errors}</p>
                </div>
                <div>
                  <p className="font-medium">Watchlist</p>
                  <p>Added: {restoreResult.stats.watchlist.added}</p>
                  <p>Updated: {restoreResult.stats.watchlist.updated}</p>
                  <p>Errors: {restoreResult.stats.watchlist.errors}</p>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
