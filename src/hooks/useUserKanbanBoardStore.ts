import { useAuth } from './useAuth';
import { createUserKanbanBoardStore } from '@/store/kanban-board-store';
import { useEffect, useState, useMemo } from 'react';
import { migrateUserData } from '@/utils/migration';
import { KanbanBoardStore } from '@/store/kanban-board-store';

/**
 * Hook que retorna o store do Kanban Board com isolamento por usuário
 * Garante que cada usuário tenha seus próprios dados no localStorage
 */
export function useUserKanbanBoardStore() {
  const { user, isAuthenticated } = useAuth();
  const [store, setStore] = useState<KanbanBoardStore | null>(null);

  // Criar store apenas uma vez por usuário usando useMemo
  const userStore = useMemo(() => {
    if (isAuthenticated && user?.id) {
      console.log(`🔄 Criando Kanban Board Store isolado para usuário: ${user.id}`);
      
      // Migrar dados antigos se necessário
      migrateUserData(user.id);
      
      return createUserKanbanBoardStore(user.id);
    } else {
      return createUserKanbanBoardStore(null);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    if (userStore) {
      // Obter estado inicial
      const initialState = userStore.getState();
      console.log(`📊 Estado inicial do Kanban Board Store para usuário ${user?.id}:`, {
        columns: initialState.columns.length,
        tasks: initialState.tasks.length,
        members: initialState.members.length
      });
      
      setStore(initialState);
      
      // Se inscrever nas mudanças do store para forçar re-render
      const unsubscribe = userStore.subscribe((state) => {
        // Log apenas quando há mudanças significativas
        const hasChanges = state.columns.length !== initialState.columns.length || 
                          state.tasks.length !== initialState.tasks.length ||
                          state.members.length !== initialState.members.length;
        
        if (hasChanges) {
          console.log(`🔄 Kanban Board Store atualizado para usuário ${user?.id}:`, {
            columns: state.columns.length,
            tasks: state.tasks.length,
            members: state.members.length
          });
        }
        setStore(state);
      });
      
      // Cleanup na desmontagem
      return () => {
        unsubscribe();
      };
    }
  }, [userStore, user?.id]);

  return store;
}