import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSettingsStore } from '@/store/settings-store';
import { useDashboardStore } from '@/store/dashboard-store';
import { useScrumStore } from '@/store/scrum-store';
import { getUserStorageKey } from '@/utils/storage';
import { autoBackupManager } from '@/utils/auto-backup';

/**
 * Hook que gerencia backup automático para todos os stores
 * Executa backup invisível sempre que há mudanças
 */
export function useAutoBackup() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // Backup automático para Settings Store
    const unsubscribeSettings = useSettingsStore.subscribe((state) => {
      const storageKey = getUserStorageKey('settings-storage', user.id);
      const dataToSave = {
        state: {
          teamMembers: state.teamMembers,
        },
        version: 1,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      autoBackupManager.scheduleBackup(user.id, 'settings-storage');
    });

    // Backup automático para Dashboard Store
    const unsubscribeDashboard = useDashboardStore.subscribe((state) => {
      const storageKey = getUserStorageKey('dashboard-storage', user.id);
      const dataToSave = {
        state: {
          currentPage: state.currentPage,
          sidebarOpen: state.sidebarOpen,
        },
        version: 1,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      autoBackupManager.scheduleBackup(user.id, 'dashboard-storage');
    });

    // Backup automático para Scrum Store
    const unsubscribeScrum = useScrumStore.subscribe((state) => {
      const storageKey = getUserStorageKey('scrum-storage', user.id);
      const dataToSave = {
        state: {
          sprints: state.sprints,
          userStories: state.userStories,
          epics: state.epics,
        },
        version: 1,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      autoBackupManager.scheduleBackup(user.id, 'scrum-storage');
    });

    return () => {
      unsubscribeSettings();
      unsubscribeDashboard();
      unsubscribeScrum();
    };
  }, [user?.id, isAuthenticated]);

  return null; // Hook invisível
}
