import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KanbanData, KanbanColumn, KanbanTask, KanbanMember, KanbanLabel, Attachment, Comment, Subtask } from '@/types';
import { useSettingsStore } from './settings-store';
import { getUserStorageKey } from '@/utils/storage';
import { createUserPersistConfig } from '@/utils/user-persistence';

export interface KanbanBoardStore {
  // Estado do board
  board: KanbanData['board'] | null;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  members: KanbanMember[];
  labels: KanbanLabel[];
  
  // Estado da UI
  selectedTask: KanbanTask | null;
  isTaskDialogOpen: boolean;
  isImportDialogOpen: boolean;
  
  // Ações do board
  loadBoard: (data: KanbanData) => void;
  clearBoard: () => void;
  
  // Ações das colunas
  addColumn: (column: Omit<KanbanColumn, 'id'>) => void;
  updateColumn: (id: string, updates: Partial<KanbanColumn>) => void;
  deleteColumn: (id: string) => void;
  clearColumn: (id: string) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;
  
  // Ações das tasks
  addTask: (task: Omit<KanbanTask, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<KanbanTask>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newColumnId: string) => void;
  autoAssociateTasksByLabels: (userStories: Array<{id: string, title: string}>) => void;
  
  // Ações dos membros
  addMember: (member: KanbanMember) => void;
  updateMember: (name: string, updates: Partial<KanbanMember>) => void;
  deleteMember: (name: string) => void;
  
  // Ações das labels
  addLabel: (label: Omit<KanbanLabel, 'id'>) => void;
  updateLabel: (id: string, updates: Partial<KanbanLabel>) => void;
  deleteLabel: (id: string) => void;
  
  // Ações da UI
  selectTask: (task: KanbanTask | null) => void;
  openTaskDialog: (task?: KanbanTask) => void;
  closeTaskDialog: () => void;
  openImportDialog: () => void;
  closeImportDialog: () => void;
  
  // Ações de comentários e subtarefas
  addComment: (taskId: string, content: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  
  // Ações de anexos
  addAttachment: (taskId: string, attachment: Attachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  
  // Ações de labels dinâmicos
  createLabel: (name: string, color: string) => void;
  
  // Utilitários
  getTasksByColumn: (columnName: string) => KanbanTask[];
  getTaskById: (id: string) => KanbanTask | undefined;
  getMemberByName: (name: string) => KanbanMember | undefined;
  getLabelById: (id: string) => KanbanLabel | undefined;
  
  // Get members from settings
  getTeamMembers: () => KanbanMember[];
}

export const useKanbanBoardStore = create<KanbanBoardStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      board: null,
      columns: [],
      tasks: [],
      members: [],
      labels: [],
      selectedTask: null,
      isTaskDialogOpen: false,
      isImportDialogOpen: false,
      
      // Ações do board
      loadBoard: (data: KanbanData) => {
        set({
          board: data.board,
          columns: data.columns,
          tasks: data.tasks,
          members: data.members,
          labels: data.labels,
        });
      },
      
      clearBoard: () => {
        set({
          board: null,
          columns: [],
          tasks: [],
          members: [],
          labels: [],
          selectedTask: null,
          isTaskDialogOpen: false,
        });
      },
      
      // Ações das colunas
      addColumn: (columnData) => {
        const newColumn: KanbanColumn = {
          ...columnData,
          id: `column_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({ columns: [...state.columns, newColumn] }));
      },
      
      updateColumn: (id, updates) => {
        set((state) => ({
          columns: state.columns.map((column) =>
            column.id === id ? { ...column, ...updates } : column
          ),
        }));
      },
      
      deleteColumn: (id) => {
        set((state) => ({
          columns: state.columns.filter((column) => column.id !== id),
          tasks: state.tasks.filter((task) => task.column !== state.columns.find(c => c.id === id)?.name),
        }));
      },
      
      clearColumn: (id) => {
        set((state) => {
          const column = state.columns.find(c => c.id === id);
          if (!column) return state;
          
          return {
            ...state,
            tasks: state.tasks.filter((task) => task.column !== column.name),
          };
        });
      },
      
      moveColumn: (fromIndex, toIndex) => {
        set((state) => {
          const newColumns = [...state.columns];
          const [movedColumn] = newColumns.splice(fromIndex, 1);
          newColumns.splice(toIndex, 0, movedColumn);
          return { columns: newColumns };
        });
      },
      
      // Ações das tasks
      addTask: (taskData) => {
        const newTask: KanbanTask = {
          ...taskData,
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },
      
      moveTask: (taskId, newColumnName) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              // Determinar se a nova coluna indica conclusão
              const isCompleted = newColumnName.toLowerCase().includes('done') || 
                                newColumnName.toLowerCase().includes('validation');
              
              return { 
                ...task, 
                column: newColumnName,
                isCompleted: isCompleted
              };
            }
            return task;
          }),
        }));
      },
      
      // Auto-associar tasks baseado nas labels "US x"
      autoAssociateTasksByLabels: (userStories) => {
        set((state) => {
          const updatedTasks = state.tasks.map((task) => {
            // Se a task já tem userStoryId, não altera
            if (task.userStoryId) return task;
            
            // Procura por labels "US x" nas labels da task
            const usLabel = task.labels.find(label => {
              const match = label.match(/^US\s*(\d+)$/i);
              return match;
            });
            
            if (usLabel) {
              // Extrai o número da label (ex: "US 5" -> 5)
              const match = usLabel.match(/^US\s*(\d+)$/i);
              if (match) {
                const usNumber = parseInt(match[1]);
                
                // Procura a User Story correspondente pelo número
                const userStory = userStories.find(story => {
                  const storyMatch = story.title.match(/US(\d+)/i);
                  if (storyMatch) {
                    const storyNumber = parseInt(storyMatch[1]);
                    return storyNumber === usNumber;
                  }
                  return false;
                });
                
                if (userStory) {
                  console.log(`🔗 Auto-associando task "${task.title}" à User Story "${userStory.title}" (label: ${usLabel})`);
                  return { ...task, userStoryId: userStory.id };
                }
              }
            }
            
            return task;
          });
          
          return { tasks: updatedTasks };
        });
      },
      
      // Ações dos membros
      addMember: (member) => {
        set((state) => ({ members: [...state.members, member] }));
      },
      
      updateMember: (name, updates) => {
        set((state) => ({
          members: state.members.map((member) =>
            member.name === name ? { ...member, ...updates } : member
          ),
        }));
      },
      
      deleteMember: (name) => {
        set((state) => ({
          members: state.members.filter((member) => member.name !== name),
        }));
      },
      
      // Ações das labels
      addLabel: (labelData) => {
        const newLabel: KanbanLabel = {
          ...labelData,
          id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({ labels: [...state.labels, newLabel] }));
      },
      
      updateLabel: (id, updates) => {
        set((state) => ({
          labels: state.labels.map((label) =>
            label.id === id ? { ...label, ...updates } : label
          ),
        }));
      },
      
      deleteLabel: (id) => {
        set((state) => ({
          labels: state.labels.filter((label) => label.id !== id),
        }));
      },
      
      
      // Ações da UI
      selectTask: (task) => {
        set({ selectedTask: task });
      },
      
      openTaskDialog: (task) => {
        set({ 
          selectedTask: task || null,
          isTaskDialogOpen: true 
        });
      },
      
      closeTaskDialog: () => {
        set({ 
          isTaskDialogOpen: false,
          selectedTask: null 
        });
      },
      
      openImportDialog: () => {
        set({ isImportDialogOpen: true });
      },
      
      closeImportDialog: () => {
        set({ isImportDialogOpen: false });
      },
      
      // Utilitários
      getTasksByColumn: (columnName) => {
        return get().tasks.filter((task) => task.column === columnName);
      },
      
      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id);
      },
      
      getMemberByName: (name) => {
        return get().members.find((member) => member.name === name);
      },
      
      getLabelById: (id) => {
        return get().labels.find((label) => label.id === id);
      },
      
      // Ações de comentários e subtarefas
      addComment: (taskId, content) => {
        const newComment: Comment = {
          id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content,
          author: 'Current User',
          authorAvatar: '/placeholder-avatar.jpg',
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId 
              ? { ...task, comments: [...task.comments, newComment] }
              : task
          ),
        }));
      },
      
      addSubtask: (taskId, title) => {
        const newSubtask: Subtask = {
          id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId 
              ? { ...task, subtasks: [...task.subtasks, newSubtask] }
              : task
          ),
        }));
      },
      
      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId 
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId 
                      ? { ...subtask, completed: !subtask.completed }
                      : subtask
                  )
                }
              : task
          ),
        }));
      },
      
      // Ações de anexos
      addAttachment: (taskId, attachment) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId 
              ? { ...task, attachments: [...task.attachments, attachment] }
              : task
          ),
        }));
      },
      
      removeAttachment: (taskId, attachmentId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId 
              ? { ...task, attachments: task.attachments.filter(att => att.id !== attachmentId) }
              : task
          ),
        }));
      },
      
      // Ações de labels dinâmicos
      createLabel: (name, color) => {
        const newLabel: KanbanLabel = {
          id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          color,
        };
        set((state) => ({ labels: [...state.labels, newLabel] }));
      },
      
      // Get members from settings
      getTeamMembers: () => {
        const settingsStore = useSettingsStore.getState();
        return settingsStore.teamMembers.map(member => ({
          name: member.name,
          initials: member.initials,
          avatar: member.avatar || '',
        }));
      },
    }),
    {
      name: 'kanban-board-storage', // Será sobrescrito dinamicamente
      partialize: (state) => ({
        board: state.board,
        columns: state.columns,
        tasks: state.tasks,
        members: state.members,
        labels: state.labels,
      }),
    }
  )
);

// Função para criar uma instância do store com chave única por usuário
export const createUserKanbanBoardStore = (userId: number | null) => {
  return create<KanbanBoardStore>()(
    persist(
      (set, get) => ({
        // Estado inicial
        board: null,
        columns: [],
        tasks: [],
        members: [],
        labels: [],
        selectedTask: null,
        isTaskDialogOpen: false,
        isImportDialogOpen: false,
        
        // Ações do board
        loadBoard: (data: KanbanData) => {
          set({
            board: data.board,
            columns: data.columns,
            tasks: data.tasks,
            members: data.members,
            labels: data.labels,
          });
        },
        
        clearBoard: () => {
          set({
            board: null,
            columns: [],
            tasks: [],
            members: [],
            labels: [],
            selectedTask: null,
            isTaskDialogOpen: false,
          });
        },
        
        // Ações das colunas
        addColumn: (columnData) => {
          const newColumn: KanbanColumn = {
            ...columnData,
            id: `column_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          set((state) => ({ columns: [...state.columns, newColumn] }));
        },
        
        updateColumn: (id, updates) => {
          set((state) => ({
            columns: state.columns.map((column) =>
              column.id === id ? { ...column, ...updates } : column
            ),
          }));
        },
        
        deleteColumn: (id) => {
          set((state) => ({
            columns: state.columns.filter((column) => column.id !== id),
            tasks: state.tasks.filter((task) => task.column !== state.columns.find(c => c.id === id)?.name),
          }));
        },
        
        clearColumn: (id) => {
          set((state) => {
            const column = state.columns.find(c => c.id === id);
            if (!column) return state;
            
            return {
              ...state,
              tasks: state.tasks.filter((task) => task.column !== column.name),
            };
          });
        },
        
        moveColumn: (fromIndex, toIndex) => {
          set((state) => {
            const newColumns = [...state.columns];
            const [movedColumn] = newColumns.splice(fromIndex, 1);
            newColumns.splice(toIndex, 0, movedColumn);
            return { columns: newColumns };
          });
        },
        
        // Ações das tasks
        addTask: (taskData) => {
          const newTask: KanbanTask = {
            ...taskData,
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ tasks: [...state.tasks, newTask] }));
        },
        
        updateTask: (id, updates) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, ...updates } : task
            ),
          }));
        },
        
        deleteTask: (id) => {
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
          }));
        },
        
        moveTask: (taskId, newColumnId) => {
          set((state) => {
            const column = state.columns.find(c => c.id === newColumnId);
            if (!column) return state;
            
            return {
              ...state,
              tasks: state.tasks.map((task) =>
                task.id === taskId ? { ...task, column: column.name } : task
              ),
            };
          });
        },
        
        autoAssociateTasksByLabels: (userStories) => {
          set((state) => {
            const updatedTasks = state.tasks.map((task) => {
              // Lógica de associação automática baseada em labels
              const associatedStory = userStories.find(story => 
                task.labels.some(label => 
                  story.title.toLowerCase().includes(label.toLowerCase()) ||
                  label.toLowerCase().includes(story.title.toLowerCase())
                )
              );
              
              return associatedStory ? { ...task, userStoryId: associatedStory.id } : task;
            });
            
            return { ...state, tasks: updatedTasks };
          });
        },
        
        // Ações dos membros
        addMember: (member) => {
          set((state) => ({ members: [...state.members, member] }));
        },
        
        updateMember: (name, updates) => {
          set((state) => ({
            members: state.members.map((member) =>
              member.name === name ? { ...member, ...updates } : member
            ),
          }));
        },
        
        deleteMember: (name) => {
          set((state) => ({
            members: state.members.filter((member) => member.name !== name),
            tasks: state.tasks.map((task) => ({
              ...task,
              assignedMembers: task.assignedMembers.filter(m => m.name !== name),
            })),
          }));
        },
        
        // Ações das labels
        addLabel: (labelData) => {
          const newLabel: KanbanLabel = {
            ...labelData,
            id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          set((state) => ({ labels: [...state.labels, newLabel] }));
        },
        
        updateLabel: (id, updates) => {
          set((state) => ({
            labels: state.labels.map((label) =>
              label.id === id ? { ...label, ...updates } : label
            ),
          }));
        },
        
        deleteLabel: (id) => {
          set((state) => {
            const label = state.labels.find(l => l.id === id);
            if (!label) return state;
            
            return {
              ...state,
              labels: state.labels.filter((label) => label.id !== id),
              tasks: state.tasks.map((task) => ({
                ...task,
                labels: task.labels.filter(l => l !== label.name),
              })),
            };
          });
        },
        
        // Ações da UI
        selectTask: (task) => {
          set({ selectedTask: task });
        },
        
        openTaskDialog: (task) => {
          set({ 
            selectedTask: task || null, 
            isTaskDialogOpen: true 
          });
        },
        
        closeTaskDialog: () => {
          set({ 
            selectedTask: null, 
            isTaskDialogOpen: false 
          });
        },
        
        openImportDialog: () => {
          set({ isImportDialogOpen: true });
        },
        
        closeImportDialog: () => {
          set({ isImportDialogOpen: false });
        },
        
        // Ações de comentários e subtarefas
        addComment: (taskId, content) => {
          const newComment: Comment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content,
            author: 'Usuário Atual', // TODO: Pegar do contexto de auth
            authorAvatar: '',
            createdAt: new Date().toISOString(),
          };
          
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, comments: [...task.comments, newComment] }
                : task
            ),
          }));
        },
        
        addSubtask: (taskId, title) => {
          const newSubtask: Subtask = {
            id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            completed: false,
            createdAt: new Date().toISOString(),
          };
          
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, subtasks: [...task.subtasks, newSubtask] }
                : task
            ),
          }));
        },
        
        updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    subtasks: task.subtasks.map((subtask) =>
                      subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
                    ),
                  }
                : task
            ),
          }));
        },
        
        deleteSubtask: (taskId: string, subtaskId: string) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
                  }
                : task
            ),
          }));
        },
        
        // Ações de anexos
        addAttachment: (taskId, attachmentData) => {
          const newAttachment: Attachment = {
            ...attachmentData,
            id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            uploadedAt: new Date().toISOString(),
          };
          
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, attachments: [...task.attachments, newAttachment] }
                : task
            ),
          }));
        },
        
        deleteAttachment: (taskId: string, attachmentId: string) => {
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    attachments: task.attachments.filter((attachment) => attachment.id !== attachmentId),
                  }
                : task
            ),
          }));
        },
        
      // Get members from settings
      getTeamMembers: () => {
        const { teamMembers } = useSettingsStore.getState();
        return teamMembers.map((member) => ({
          name: member.name,
          initials: member.initials,
          avatar: member.avatar || '',
        }));
      },
      
      // Helper para obter tasks por coluna
      getTasksByColumn: (columnName: string) => {
        return get().tasks.filter(task => task.column === columnName);
      },
      
      // Métodos adicionais que estavam faltando
      toggleSubtask: (taskId: string, subtaskId: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
                  ),
                }
              : task
          ),
        }));
      },
      
      removeAttachment: (taskId: string, attachmentId: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  attachments: task.attachments.filter((attachment) => attachment.id !== attachmentId),
                }
              : task
          ),
        }));
      },
      
      createLabel: (name: string, color: string) => {
        const newLabel: KanbanLabel = {
          id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          color,
        };
        set((state) => ({ labels: [...state.labels, newLabel] }));
      },
      
      getTaskById: (id: string) => {
        return get().tasks.find(task => task.id === id);
      },
      
      getMemberByName: (name: string) => {
        return get().members.find(member => member.name === name);
      },
      
      getLabelById: (id: string) => {
        return get().labels.find(label => label.id === id);
      },
      }),
      createUserPersistConfig('kanban-board-storage', userId, (state) => ({
        board: state.board,
        columns: state.columns,
        tasks: state.tasks,
        members: state.members,
        labels: state.labels,
      }))
    )
  );
};
