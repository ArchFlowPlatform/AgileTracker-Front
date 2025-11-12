import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  UserStory, 
  Epic, 
  Sprint, 
  ProductBacklog, 
  SprintBacklog, 
  Task, 
  ScrumMetrics,
  SprintPlanning,
  ExtractedUserStory
} from '../types/scrum';
import { apiService } from '@/services/api';
import { createUserPersistConfig } from '@/utils/user-persistence';

export interface ScrumStore {
  // Product Backlog
  productBacklog: ProductBacklog | null;
  
  // User Stories
  userStories: UserStory[];
  
  // Epics
  epics: Epic[];
  
  // Sprints
  sprints: Sprint[];
  activeSprint: Sprint | null;
  
  // Sprint Planning
  sprintPlanning: SprintPlanning | null;
  
  // Tasks
  tasks: Task[];
  
  // Metrics
  metrics: ScrumMetrics;
  
  // Actions - User Stories
  addUserStory: (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUserStory: (id: string, updates: Partial<UserStory>) => void;
  deleteUserStory: (id: string) => void;
  moveUserStoryToSprint: (userStoryId: string, sprintId: string) => void;
  
  // Actions - Epics
  addEpic: (epic: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEpic: (id: string, updates: Partial<Epic>) => void;
  deleteEpic: (id: string) => void;
  
  // Actions - Sprints
  addSprint: (sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  activateSprint: (id: string) => void;
  deactivateSprint: () => void;
  
  // Actions - Sprint Planning
  createSprintPlanning: (sprintId: string, capacity: number) => void;
  addUserStoryToSprint: (userStoryId: string) => void;
  removeUserStoryFromSprint: (userStoryId: string) => void;
  setSprintGoal: (goal: string) => void;
  
  // Actions - Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Actions - Import
  importUserStoriesFromPDF: (extractedStories: ExtractedUserStory[]) => void;
  
  // Actions - Metrics
  calculateMetrics: () => void;
  
  // Utilities
  getUserStoriesByEpic: (epicId: string) => UserStory[];
  getUserStoriesBySprint: (sprintId: string) => UserStory[];
  getTasksByUserStory: (userStoryId: string) => Task[];
  getSprintBacklog: (sprintId: string) => SprintBacklog;
}

// Função para criar store Scrum isolado por usuário
export const createUserScrumStore = (userId: number | null) => {
  return create<ScrumStore>()(
    persist(
      (set, get) => ({
      // Initial state
      productBacklog: null,
      userStories: [],
      epics: [],
      sprints: [],
      activeSprint: null,
      sprintPlanning: null,
      tasks: [],
      metrics: {
        velocity: 0,
        burndownRate: 0,
        storyPointsCompleted: 0,
        storyPointsRemaining: 0,
        averageStoryPointsPerSprint: 0,
        sprintGoalAchievement: 0,
      },
      
      // User Stories Actions with backend sync
      addUserStory: async (userStory) => {
        try {
          // Salvar no backend primeiro
          const backendUserStory = await apiService.createUserStory({
            title: userStory.title,
            description: userStory.description,
            story_points: userStory.storyPoints,
            acceptance_criteria: userStory.acceptanceCriteria,
            priority: userStory.priority,
            epic_id: userStory.epic ? parseInt(userStory.epic) : undefined,
            tags: userStory.tags,
            // board_id será determinado pelo backend automaticamente
          });

          // Atualizar store local com dados do backend
          const newUserStory: UserStory = {
            ...userStory,
            id: backendUserStory.id.toString(),
            createdAt: backendUserStory.created_at,
            updatedAt: backendUserStory.updated_at,
          };
          
          set((state) => ({
            userStories: [...state.userStories, newUserStory],
          }));
          
          get().calculateMetrics();
          console.log('✅ User Story criada no backend e store local');
        } catch (error) {
          console.error('❌ Erro ao criar User Story no backend:', error);
          // Fallback: criar apenas localmente
          const newUserStory: UserStory = {
            ...userStory,
            id: `us_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          set((state) => ({
            userStories: [...state.userStories, newUserStory],
          }));
          
          get().calculateMetrics();
        }
      },
      
      updateUserStory: (id, updates) => {
        set((state) => ({
          userStories: state.userStories.map((story) =>
            story.id === id 
              ? { ...story, ...updates, updatedAt: new Date().toISOString() }
              : story
          ),
        }));
        
        get().calculateMetrics();
      },
      
      deleteUserStory: (id) => {
        set((state) => ({
          userStories: state.userStories.filter((story) => story.id !== id),
          tasks: state.tasks.filter((task) => task.userStoryId !== id),
        }));
        
        get().calculateMetrics();
      },
      
      moveUserStoryToSprint: (userStoryId, sprintId) => {
        set((state) => ({
          userStories: state.userStories.map((story) =>
            story.id === userStoryId
              ? { ...story, status: 'Sprint Planning', updatedAt: new Date().toISOString() }
              : story
          ),
          sprints: state.sprints.map((sprint) =>
            sprint.id === sprintId
              ? { 
                  ...sprint, 
                  userStories: [...sprint.userStories, userStoryId],
                  updatedAt: new Date().toISOString()
                }
              : sprint
          ),
        }));
      },
      
      // Epics Actions
      addEpic: (epic) => {
        const newEpic: Epic = {
          ...epic,
          id: `epic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          epics: [...state.epics, newEpic],
        }));
      },
      
      updateEpic: (id, updates) => {
        set((state) => ({
          epics: state.epics.map((epic) =>
            epic.id === id 
              ? { ...epic, ...updates, updatedAt: new Date().toISOString() }
              : epic
          ),
        }));
      },
      
      deleteEpic: (id) => {
        set((state) => ({
          epics: state.epics.filter((epic) => epic.id !== id),
          userStories: state.userStories.map((story) =>
            story.epic === id ? { ...story, epic: '' } : story
          ),
        }));
      },
      
      // Sprints Actions
      addSprint: (sprint) => {
        const newSprint: Sprint = {
          ...sprint,
          id: `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          sprints: [...state.sprints, newSprint],
        }));
      },
      
      updateSprint: (id, updates) => {
        set((state) => ({
          sprints: state.sprints.map((sprint) =>
            sprint.id === id 
              ? { ...sprint, ...updates, updatedAt: new Date().toISOString() }
              : sprint
          ),
        }));
      },
      
      deleteSprint: (id) => {
        set((state) => ({
          sprints: state.sprints.filter((sprint) => sprint.id !== id),
          userStories: state.userStories.map((story) =>
            story.status === 'Sprint Planning' ? { ...story, status: 'Backlog' } : story
          ),
        }));
      },
      
      activateSprint: (id) => {
        set((state) => ({
          sprints: state.sprints.map((sprint) => ({
            ...sprint,
            isActive: sprint.id === id,
          })),
          activeSprint: state.sprints.find((sprint) => sprint.id === id) || null,
        }));
      },
      
      deactivateSprint: () => {
        set((state) => ({
          sprints: state.sprints.map((sprint) => ({
            ...sprint,
            isActive: false,
          })),
          activeSprint: null,
        }));
      },
      
      // Sprint Planning Actions
      createSprintPlanning: (sprintId, capacity) => {
        const sprintPlanning: SprintPlanning = {
          sprintId,
          capacity,
          selectedUserStories: [],
          goal: '',
          estimatedVelocity: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set({ sprintPlanning });
      },
      
      addUserStoryToSprint: (userStoryId) => {
        set((state) => ({
          sprintPlanning: state.sprintPlanning ? {
            ...state.sprintPlanning,
            selectedUserStories: [...state.sprintPlanning.selectedUserStories, userStoryId],
            updatedAt: new Date().toISOString(),
          } : null,
        }));
        
        get().calculateMetrics();
      },
      
      removeUserStoryFromSprint: (userStoryId) => {
        set((state) => ({
          sprintPlanning: state.sprintPlanning ? {
            ...state.sprintPlanning,
            selectedUserStories: state.sprintPlanning.selectedUserStories.filter(id => id !== userStoryId),
            updatedAt: new Date().toISOString(),
          } : null,
        }));
        
        get().calculateMetrics();
      },
      
      setSprintGoal: (goal) => {
        set((state) => ({
          sprintPlanning: state.sprintPlanning ? {
            ...state.sprintPlanning,
            goal,
            updatedAt: new Date().toISOString(),
          } : null,
        }));
      },
      
      // Tasks Actions
      addTask: (task) => {
        const newTask: Task = {
          ...task,
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id 
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },
      
      // Import Actions
      importUserStoriesFromPDF: (extractedStories) => {
        const newUserStories: UserStory[] = extractedStories.map((story, index) => ({
          id: `us_import_${Date.now()}_${index}`,
          title: story.title,
          description: story.description,
          storyPoints: story.storyPoints,
          acceptanceCriteria: story.acceptanceCriteria,
          priority: story.priority as 'High' | 'Medium' | 'Low',
          epic: story.epic,
          tags: story.tags,
          status: 'Backlog' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        set((state) => ({
          userStories: [...state.userStories, ...newUserStories],
        }));
        
        get().calculateMetrics();
      },
      
      // Metrics
      calculateMetrics: () => {
        const state = get();
        
        const completedSprints = state.sprints.filter(sprint => !sprint.isActive);
        const totalStoryPoints = state.userStories.reduce((sum, story) => sum + story.storyPoints, 0);
        const completedStoryPoints = state.userStories
          .filter(story => story.status === 'Done')
          .reduce((sum, story) => sum + story.storyPoints, 0);
        
        const velocity = completedSprints.length > 0 
          ? completedSprints.reduce((sum, sprint) => sum + sprint.velocity, 0) / completedSprints.length
          : 0;
        
        const metrics: ScrumMetrics = {
          velocity,
          burndownRate: velocity > 0 ? velocity / 7 : 0, // Por dia
          storyPointsCompleted: completedStoryPoints,
          storyPointsRemaining: totalStoryPoints - completedStoryPoints,
          averageStoryPointsPerSprint: velocity,
          sprintGoalAchievement: 0, // Calcular baseado no sprint ativo
        };
        
        set({ metrics });
      },
      
      // Utilities
      getUserStoriesByEpic: (epicId) => {
        return get().userStories.filter(story => story.epic === epicId);
      },
      
      getUserStoriesBySprint: (sprintId) => {
        const sprint = get().sprints.find(s => s.id === sprintId);
        if (!sprint) return [];
        
        return get().userStories.filter(story => sprint.userStories.includes(story.id));
      },
      
      getTasksByUserStory: (userStoryId) => {
        return get().tasks.filter(task => task.userStoryId === userStoryId);
      },
      
      getSprintBacklog: (sprintId) => {
        const sprint = get().sprints.find(s => s.id === sprintId);
        if (!sprint) return { sprintId, userStories: [], tasks: [], capacity: 0, velocity: 0 };
        
        const userStories = get().getUserStoriesBySprint(sprintId);
        const tasks = get().tasks.filter(task => task.sprintId === sprintId);
        
        return {
          sprintId,
          userStories,
          tasks,
          capacity: sprint.velocity,
          velocity: sprint.velocity,
        };
      },
      }),
      createUserPersistConfig('scrum-storage', userId)
    )
  );
};

// Store padrão para compatibilidade (usuário não logado)
export const useScrumStore = createUserScrumStore(null);
