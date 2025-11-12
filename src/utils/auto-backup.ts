import { getUserStorageKey } from '@/utils/storage';

/**
 * Sistema de backup automático invisível
 * Faz backup sempre que há mudanças nos dados do usuário
 */
export class AutoBackupManager {
  private static instance: AutoBackupManager;
  private backupTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly BACKUP_DELAY = 2000; // 2 segundos de delay para evitar muitos backups

  static getInstance(): AutoBackupManager {
    if (!AutoBackupManager.instance) {
      AutoBackupManager.instance = new AutoBackupManager();
    }
    return AutoBackupManager.instance;
  }

  /**
   * Agenda backup automático para um usuário
   */
  scheduleBackup(userId: number, dataType: string) {
    const key = `${userId}-${dataType}`;
    
    // Cancelar backup anterior se existir
    const existingTimer = this.backupTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Agendar novo backup
    const timer = setTimeout(() => {
      this.performBackup(userId, dataType);
      this.backupTimers.delete(key);
    }, this.BACKUP_DELAY);

    this.backupTimers.set(key, timer);
  }

  /**
   * Executa backup imediatamente
   */
  performBackup(userId: number, dataType: string) {
    try {
      const storageKey = getUserStorageKey(dataType, userId);
      const data = localStorage.getItem(storageKey);
      
      if (data) {
        // Criar backup com timestamp
        const backupKey = `auto-backup-${dataType}-user-${userId}-${Date.now()}`;
        const backupData = {
          userId,
          dataType,
          timestamp: new Date().toISOString(),
          originalKey: storageKey,
          data: JSON.parse(data)
        };
        
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        // Manter apenas os últimos 5 backups por tipo de dados
        this.cleanupOldBackups(userId, dataType);
        
        console.log(`💾 Backup automático criado: ${dataType} para usuário ${userId}`);
      }
    } catch (error) {
      console.error('❌ Erro no backup automático:', error);
    }
  }

  /**
   * Limpa backups antigos, mantendo apenas os últimos 5
   */
  private cleanupOldBackups(userId: number, dataType: string) {
    const backupPrefix = `auto-backup-${dataType}-user-${userId}-`;
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(key => key.startsWith(backupPrefix))
      .sort((a, b) => {
        const timestampA = parseInt(a.split('-').pop() || '0');
        const timestampB = parseInt(b.split('-').pop() || '0');
        return timestampB - timestampA; // Mais recentes primeiro
      });

    // Remover backups antigos (manter apenas os 5 mais recentes)
    if (backupKeys.length > 5) {
      const keysToRemove = backupKeys.slice(5);
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Backup antigo removido: ${key}`);
      });
    }
  }

  /**
   * Restaura dados do backup mais recente
   */
  restoreFromLatestBackup(userId: number, dataType: string): boolean {
    try {
      const backupPrefix = `auto-backup-${dataType}-user-${userId}-`;
      const allKeys = Object.keys(localStorage);
      const backupKeys = allKeys
        .filter(key => key.startsWith(backupPrefix))
        .sort((a, b) => {
          const timestampA = parseInt(a.split('-').pop() || '0');
          const timestampB = parseInt(b.split('-').pop() || '0');
          return timestampB - timestampA; // Mais recente primeiro
        });

      if (backupKeys.length === 0) {
        console.log(`❌ Nenhum backup encontrado para ${dataType} do usuário ${userId}`);
        return false;
      }

      const latestBackupKey = backupKeys[0];
      const backupData = localStorage.getItem(latestBackupKey);
      
      if (backupData) {
        const parsed = JSON.parse(backupData);
        const storageKey = getUserStorageKey(dataType, userId);
        localStorage.setItem(storageKey, JSON.stringify(parsed.data));
        
        console.log(`✅ Dados restaurados do backup: ${latestBackupKey}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      return false;
    }
  }

  /**
   * Lista backups disponíveis para um usuário
   */
  listBackups(userId: number, dataType?: string): Array<{key: string, timestamp: string, dataType: string}> {
    const prefix = dataType ? `auto-backup-${dataType}-user-${userId}-` : `auto-backup-`;
    const allKeys = Object.keys(localStorage);
    
    return allKeys
      .filter(key => key.includes(`user-${userId}-`) && key.startsWith(prefix))
      .map(key => {
        const timestamp = key.split('-').pop() || '0';
        const date = new Date(parseInt(timestamp));
        return {
          key,
          timestamp: date.toLocaleString('pt-BR'),
          dataType: key.split('-')[2] || 'unknown'
        };
      })
      .sort((a, b) => b.key.localeCompare(a.key)); // Mais recentes primeiro
  }
}

// Instância global do gerenciador de backup
export const autoBackupManager = AutoBackupManager.getInstance();
