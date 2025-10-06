import { useAuth } from './useAuth';
import { useKanbanStore } from '@/store/kanban-store';
import { useEffect, useState } from 'react';
import { getUserStorageKey } from '@/utils/storage';
import { autoBackupManager } from '@/utils/auto-backup';

/**
 * Hook que retorna o store do Kanban com isolamento por usuário
 * Garante que cada usuário tenha seus próprios dados no localStorage
 */
export function useUserKanbanStore() {
  const { user, isAuthenticated } = useAuth();
  const [store, setStore] = useState(useKanbanStore);

  // Recriar o store quando o usuário mudar
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log(`🔄 Criando store Kanban isolado para usuário: ${user.id} (${user.email})`);
      
      // Criar uma nova instância do store com chave única
      const userStore = useKanbanStore.getState();
      
      // Atualizar a chave de storage do store atual
      const storageKey = getUserStorageKey('kanban-storage', user.id);
      
      // Se o store atual não tem dados, tentar carregar do localStorage do usuário
      if (userStore.cards.length === 0 && userStore.tasks.length === 0) {
        const userData = localStorage.getItem(storageKey);
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            if (parsedData.state) {
              // Carregar dados do usuário
              userStore.cards = parsedData.state.cards || [];
              userStore.tasks = parsedData.state.tasks || [];
              userStore.sprintConfig = parsedData.state.sprintConfig || {
                startDate: '',
                endDate: '',
                workingDays: []
              };
            }
          } catch (error) {
            console.error('Erro ao carregar dados do Kanban do usuário:', error);
          }
        }
      }
      
      setStore(userStore);
    } else if (!isAuthenticated) {
      // Usuário não autenticado - usar dados temporários
      console.log('🔄 Usuário não autenticado, usando dados temporários do Kanban');
      const tempStore = useKanbanStore.getState();
      setStore(tempStore);
    }
  }, [user?.id, isAuthenticated]);

  // Interceptar mudanças no store para salvar com chave do usuário
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const unsubscribe = useKanbanStore.subscribe((state) => {
        const storageKey = getUserStorageKey('kanban-storage', user.id);
        const dataToSave = {
          state: {
            cards: state.cards,
            tasks: state.tasks,
            sprintConfig: state.sprintConfig,
          },
          version: 1,
          timestamp: new Date().toISOString(),
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // Backup automático invisível
        autoBackupManager.scheduleBackup(user.id, 'kanban-storage');
      });

      return unsubscribe;
    }
  }, [user?.id, isAuthenticated]);

  return store;
}