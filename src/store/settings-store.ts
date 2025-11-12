import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createUserPersistConfig } from '@/utils/user-persistence';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  email?: string;
}

export interface SettingsStore {
  // Team members
  teamMembers: TeamMember[];
  
  // Actions
  addTeamMember: (name: string, email?: string) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  
  // Utilities
  getMemberById: (id: string) => TeamMember | undefined;
  getMemberByName: (name: string) => TeamMember | undefined;
}

// Função para criar store de configurações isolado por usuário
export const createUserSettingsStore = (userId: number | null) => {
  return create<SettingsStore>()(
    persist(
      (set, get) => ({
        // Initial state
        teamMembers: [],
        
        // Actions
        addTeamMember: (name, email) => {
          const newMember: TeamMember = {
            id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            initials: name.split(' ').map(n => n[0]).join('').toUpperCase(),
            email,
          };
          set((state) => ({ teamMembers: [...state.teamMembers, newMember] }));
        },
        
        updateTeamMember: (id, updates) => {
          set((state) => ({
            teamMembers: state.teamMembers.map((member) =>
              member.id === id ? { ...member, ...updates } : member
            ),
          }));
        },
        
        removeTeamMember: (id) => {
          set((state) => ({
            teamMembers: state.teamMembers.filter((member) => member.id !== id),
          }));
        },
        
        setTeamMembers: (members) => {
          set({ teamMembers: members });
        },
        
        // Utilities
        getMemberById: (id) => {
          return get().teamMembers.find((member) => member.id === id);
        },
        
        getMemberByName: (name) => {
          return get().teamMembers.find((member) => member.name === name);
        },
      }),
      createUserPersistConfig('settings-storage', userId)
    )
  );
};

// Store padrão para compatibilidade (usuário não logado)
export const useSettingsStore = createUserSettingsStore(null);
