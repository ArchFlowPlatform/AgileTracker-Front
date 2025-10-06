'use client';

import { useAutoBackup } from '@/hooks/useAutoBackup';

/**
 * Componente wrapper para o hook de backup automático
 */
export function AutoBackupProvider() {
  useAutoBackup();
  return null; // Componente invisível
}
