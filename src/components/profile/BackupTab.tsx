import React from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { BackupRestore } from '@/components/BackupRestore';
import { BackupRestoreErrorBoundary } from '@/components/BackupRestoreErrorBoundary';

const BackupTab: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Backup & Restore
        </h2>
        <p className="text-white/70">
          Create backups of your watch history, favorites, and watchlist, or restore from a previous backup.
        </p>
      </div>

      <BackupRestoreErrorBoundary>
        <BackupRestore />
      </BackupRestoreErrorBoundary>
    </motion.div>
  );
};

export default BackupTab;