import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, Task, SprintConfig, KanbanStore } from '@/types';

const defaultSprintConfig: SprintConfig = {
  startDate: '2025-09-16',
  endDate: '2025-10-02',
  workingDays: ['16/09', '18/09', '22/09', '24/09', '26/09', '30/09', '02/10']
};

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set, get) => ({
      cards: [],
      tasks: [],
      sprintConfig: defaultSprintConfig,

      // Card actions
      addCard: (cardData) => {
        const newCard: Card = {
          ...cardData,
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ cards: [...state.cards, newCard] }));
      },

      updateCard: (id, updates) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, ...updates, updatedAt: new Date().toISOString() }
              : card
          ),
        }));
      },

      deleteCard: (id) => {
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
          tasks: state.tasks.filter((task) => task.cardId !== id),
        }));
      },

      moveCard: (id, status) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id
              ? { ...card, status, updatedAt: new Date().toISOString() }
              : card
          ),
        }));
      },

      // Task actions
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
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

      toggleTaskCompletion: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedDate: !task.completed ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
      },

      // Sprint config
      updateSprintConfig: (config) => {
        set((state) => ({
          sprintConfig: { ...state.sprintConfig, ...config },
        }));
      },

      // Burndown data
      getBurndownData: () => {
        const { tasks, sprintConfig } = get();
        
        const totalPoints = tasks.reduce((sum, task) => sum + task.storyPoints, 0);

        return {
          labels: sprintConfig.workingDays,
          pontosCompletados: calculateCompletedPointsByDay(tasks, sprintConfig.workingDays),
          cardsCompletados: calculateCompletedCardsByDay(tasks, sprintConfig.workingDays),
          totalPontos: totalPoints,
          totalCards: tasks.length,
          totalDias: sprintConfig.workingDays.length,
          diasTrabalhados: calculateWorkedDays(sprintConfig.workingDays),
          membrosEquipe: 6,
        };
      },
    }),
    {
      name: 'kanban-storage',
      partialize: (state) => ({
        cards: state.cards,
        tasks: state.tasks,
        sprintConfig: state.sprintConfig,
      }),
    }
  )
);

// Helper functions
function calculateCompletedPointsByDay(tasks: Task[], workingDays: string[]): number[] {
  const completedTasks = tasks.filter(task => task.completed);
  
  if (completedTasks.length === 0) {
    return new Array(workingDays.length).fill(0);
  }

  const pointsPerDay = completedTasks.reduce((sum, task) => sum + task.storyPoints, 0) / workingDays.length;
  const result: number[] = [];
  let accumulatedPoints = 0;

  for (let i = 0; i < workingDays.length; i++) {
    accumulatedPoints += pointsPerDay;
    result.push(Math.round(accumulatedPoints));
  }

  return result;
}

function calculateCompletedCardsByDay(tasks: Task[], workingDays: string[]): number[] {
  const completedTasks = tasks.filter(task => task.completed);
  
  if (completedTasks.length === 0) {
    return new Array(workingDays.length).fill(0);
  }

  const cardsPerDay = completedTasks.length / workingDays.length;
  const result: number[] = [];
  let accumulatedCards = 0;

  for (let i = 0; i < workingDays.length; i++) {
    accumulatedCards += cardsPerDay;
    result.push(Math.round(accumulatedCards));
  }

  return result;
}

function calculateWorkedDays(workingDays: string[]): number {
  const today = new Date();
  let workedDays = 0;
  
  for (const day of workingDays) {
    const [dayStr, monthStr] = day.split('/');
    const dayDate = new Date(2025, parseInt(monthStr) - 1, parseInt(dayStr));
    
    if (dayDate <= today) {
      workedDays++;
    }
  }
  
  return workedDays;
}
