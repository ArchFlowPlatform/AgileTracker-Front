/**
 * HOOKS UNIVERSALES PARA STORES ISOLADOS POR USUÁRIO
 * 
 * Use estes hooks em vez dos stores diretos para garantir isolamento por usuário
 */

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useMemo } from 'react';
import { createUserSettingsStore, SettingsStore } from '@/store/settings-store';
import { createUserScrumStore, ScrumStore } from '@/store/scrum-store';
import { createUserKanbanBoardStore, KanbanBoardStore } from '@/store/kanban-board-store';
import { createUserKanbanStore } from '@/store/kanban-store';
import { KanbanStore } from '@/types';
import { migrateUserData } from '@/utils/migration';

/**
 * Hook para Settings Store isolado por usuário
 */
export function useUserSettingsStore() {
  const { user, isAuthenticated } = useAuth();
  const [store, setStore] = useState<SettingsStore | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log(`🔄 Criando Settings Store isolado para usuário: ${user.id}`);
      
      // Migrar dados antigos se necessário
      migrateUserData(user.id);
      
      const userStore = createUserSettingsStore(user.id);
      
      // Obter estado inicial
      setStore(userStore.getState());
      
      // Se inscrever nas mudanças do store
      const unsubscribe = userStore.subscribe((state) => {
        setStore(state);
      });
      
      // Cleanup na desmontagem
      return () => {
        unsubscribe();
      };
    } else {
      console.log('🔄 Usuário não autenticado, usando Settings Store temporário');
      const tempStore = createUserSettingsStore(null);
      setStore(tempStore.getState());
    }
  }, [user?.id, isAuthenticated]);

  return store;
}

/**
 * Hook para Scrum Store isolado por usuário
 */
export function useUserScrumStore() {
  const { user, isAuthenticated } = useAuth();
  const [store, setStore] = useState<ScrumStore | null>(null);

  // Criar store apenas uma vez por usuário usando useMemo
  const userStore = useMemo(() => {
    if (isAuthenticated && user?.id) {
      console.log(`🔄 Criando Scrum Store isolado para usuário: ${user.id}`);
      
      // Migrar dados antigos se necessário
      migrateUserData(user.id);
      
      return createUserScrumStore(user.id);
    } else {
      console.log('🔄 Usuário não autenticado, usando Scrum Store temporário');
      return createUserScrumStore(null);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    if (userStore) {
      // Obter estado inicial
      const initialState = userStore.getState();
      console.log(`📊 Estado inicial do Scrum Store para usuário ${user?.id}:`, {
        userStories: initialState.userStories.length,
        sprints: initialState.sprints.length,
        epics: initialState.epics.length
      });
      
      setStore(initialState);
      
      // Se inscrever nas mudanças do store
      const unsubscribe = userStore.subscribe((state) => {
        console.log(`🔄 Scrum Store atualizado para usuário ${user?.id}:`, {
          userStories: state.userStories.length,
          sprints: state.sprints.length,
          epics: state.epics.length
        });
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

/**
 * Hook para Kanban Board Store isolado por usuário
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
      
      // Se inscrever nas mudanças do store
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

/**
 * Hook para Kanban Store isolado por usuário
 */
export function useUserKanbanStore() {
  const { user, isAuthenticated } = useAuth();
  const [store, setStore] = useState<KanbanStore | null>(null);

  // Criar store apenas uma vez por usuário usando useMemo
  const userStore = useMemo(() => {
    if (isAuthenticated && user?.id) {
      console.log(`🔄 Criando Kanban Store isolado para usuário: ${user.id}`);
      
      // Migrar dados antigos se necessário
      migrateUserData(user.id);
      
      return createUserKanbanStore(user.id);
    } else {
      return createUserKanbanStore(null);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    if (userStore) {
      // Obter estado inicial
      const initialState = userStore.getState();
      console.log(`📊 Estado inicial do Kanban Store para usuário ${user?.id}:`, {
        cards: initialState.cards.length
      });
      
      setStore(initialState);
      
      // Se inscrever nas mudanças do store
      const unsubscribe = userStore.subscribe((state) => {
        // Log apenas quando há mudanças significativas
        const hasChanges = state.cards.length !== initialState.cards.length;
        
        if (hasChanges) {
          console.log(`🔄 Kanban Store atualizado para usuário ${user?.id}:`, {
            cards: state.cards.length
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

/**
 * Hook para Dashboard Store (não precisa de isolamento por usuário)
 */
export function useUserDashboardStore() {
  // Dashboard Store não precisa de isolamento pois é apenas navegação
  return null;
}
