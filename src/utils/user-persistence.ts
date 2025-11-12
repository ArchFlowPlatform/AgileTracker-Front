/**
 * SISTEMA UNIVERSAL DE PERSISTÊNCIA POR USUÁRIO
 * 
 * Este sistema garante que cada usuário tenha seus dados completamente isolados
 * e que nunca percam suas configurações, independente de mudanças no código.
 */

import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { getUserStorageKey } from '@/utils/storage';

/**
 * Configuração de persistência universal por usuário
 * Usa esta configuração em TODOS os stores para garantir isolamento
 */
export function createUserPersistConfig<T>(
  storeName: string,
  userId: number | null,
  partialize?: (state: T) => Partial<T>
): PersistOptions<T> {
  return {
    name: getUserStorageKey(storeName, userId),
    partialize: partialize as ((state: T) => T) || ((state: T) => state),
    version: 1,
    migrate: (persistedState: unknown, version: number): T => {
      // Sistema de migração automática entre versões
      if (version !== 1) {
        console.log(`🔄 Migrando ${storeName} da versão ${version} para versão atual`);
      }
      return persistedState as T;
    },
    onRehydrateStorage: () => () => {
      console.log(`✅ ${storeName} reidratado para usuário ${userId}`);
    },
  };
}

/**
 * Hook universal para criar stores isolados por usuário
 * Use este hook em vez de create() diretamente
 */
export function createUserStore<T>(
  storeName: string,
  userId: number | null,
  storeConfig: (set: (partial: Partial<T>) => void, get: () => T) => T,
  partialize?: (state: T) => T
) {
  return create<T>()(
    persist(
      storeConfig,
      createUserPersistConfig(storeName, userId, partialize)
    )
  );
}

/**
 * Utilitário para migrar dados antigos para o sistema por usuário
 */
export function migrateStoreData(
  oldStoreName: string,
  newStoreName: string,
  userId: number | null
): boolean {
  const oldKey = oldStoreName;
  const newKey = getUserStorageKey(newStoreName, userId);
  
  const oldData = localStorage.getItem(oldKey);
  if (oldData && !localStorage.getItem(newKey)) {
    try {
      localStorage.setItem(newKey, oldData);
      console.log(`✅ Migrado: ${oldKey} → ${newKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao migrar ${oldKey}:`, error);
      return false;
    }
  }
  return false;
}

/**
 * Sistema de backup automático por usuário
 */
export class UserDataManager {
  private static instance: UserDataManager;
  
  static getInstance(): UserDataManager {
    if (!UserDataManager.instance) {
      UserDataManager.instance = new UserDataManager();
    }
    return UserDataManager.instance;
  }

  /**
   * Faz backup completo dos dados de um usuário
   */
  backupUserData(userId: number): Record<string, unknown> {
    const userData: Record<string, unknown> = {};
    const userPrefix = `-user-${userId}`;
    
    // Coletar todos os dados do usuário
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userPrefix)) {
        try {
          userData[key] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch (error) {
          console.warn(`⚠️ Erro ao fazer backup de ${key}:`, error);
        }
      }
    }
    
    console.log(`💾 Backup completo do usuário ${userId}:`, Object.keys(userData));
    return userData;
  }

  /**
   * Restaura dados de backup para um usuário
   */
  restoreUserData(userId: number, backupData: Record<string, unknown>): boolean {
    try {
      Object.entries(backupData).forEach(([key, data]) => {
        localStorage.setItem(key, JSON.stringify(data));
      });
      console.log(`✅ Dados restaurados para usuário ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao restaurar dados do usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Limpa todos os dados de um usuário
   */
  clearUserData(userId: number): boolean {
    try {
      const userPrefix = `-user-${userId}`;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(userPrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️ Dados do usuário ${userId} removidos`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao limpar dados do usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Lista todos os usuários com dados salvos
   */
  listUsersWithData(): number[] {
    const userIds = new Set<number>();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('-user-')) {
        const match = key.match(/-user-(\d+)/);
        if (match) {
          userIds.add(parseInt(match[1]));
        }
      }
    }
    
    return Array.from(userIds);
  }
}

/**
 * Hook para gerenciar dados do usuário atual
 */
export function useUserDataManager() {
  const dataManager = UserDataManager.getInstance();
  
  return {
    backupUserData: dataManager.backupUserData.bind(dataManager),
    restoreUserData: dataManager.restoreUserData.bind(dataManager),
    clearUserData: dataManager.clearUserData.bind(dataManager),
    listUsersWithData: dataManager.listUsersWithData.bind(dataManager),
  };
}
