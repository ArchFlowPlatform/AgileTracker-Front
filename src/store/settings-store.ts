import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  email?: string;
}

interface SettingsStore {
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

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      teamMembers: [
        { id: '1', name: 'João Silva', initials: 'JS', email: 'joao@empresa.com' },
        { id: '2', name: 'Maria Santos', initials: 'MS', email: 'maria@empresa.com' },
        { id: '3', name: 'Pedro Costa', initials: 'PC', email: 'pedro@empresa.com' },
        { id: '4', name: 'Ana Oliveira', initials: 'AO', email: 'ana@empresa.com' },
        { id: '5', name: 'Carlos Lima', initials: 'CL', email: 'carlos@empresa.com' },
        { id: '6', name: 'Julia Ferreira', initials: 'JF', email: 'julia@empresa.com' },
      ],
      
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
    {
      name: 'settings-storage',
      partialize: (state) => ({
        teamMembers: state.teamMembers,
      }),
    }
  )
);
