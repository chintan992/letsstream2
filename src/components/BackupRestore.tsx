import React from "react";
import { useAuth } from "@/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { CreateBackupSection } from "./backup-restore/CreateBackupSection";
import { RestoreBackupSection } from "./backup-restore/RestoreBackupSection";
import { ClearDataSection } from "./backup-restore/ClearDataSection";

export function BackupRestore() {
  const { user } = useAuth();

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
        <CreateBackupSection user={user} />
        <RestoreBackupSection user={user} />
        <ClearDataSection user={user} />
      </CardContent>
    </Card>
  );
}
