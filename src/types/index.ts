export interface Card {
  id: string;
  title: string;
  description?: string;
  color: string;
  assignee?: string;
  status: 'todo' | 'inprogress' | 'done';
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  cardId: string;
  title: string;
  description?: string;
  storyPoints: number;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// Novos tipos para o kanban estilo Trello
export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  taskLimit?: number;
  isCollapsed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'other';
  size: number;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorAvatar: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  column: string;
  storyPoints: number;
  taskCode: string;
  labels: string[];
  assignedMembers: KanbanMember[];
  dueDate?: string;
  lastActivity?: string;
  isCompleted: boolean;
  createdAt: string;
  coverImage?: string;
  attachments: Attachment[];
  comments: Comment[];
  subtasks: Subtask[];
}

export interface KanbanMember {
  name: string;
  initials: string;
  avatar?: string;
}

export interface KanbanLabel {
  id: string;
  name: string;
  color: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
}

export interface KanbanData {
  board: KanbanBoard;
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  members: KanbanMember[];
  labels: KanbanLabel[];
}

export interface SprintConfig {
  startDate: string;
  endDate: string;
  workingDays: string[];
}

export interface BurndownData {
  labels: string[];
  pontosCompletados: number[];
  cardsCompletados: number[];
  totalPontos: number;
  totalCards: number;
  totalDias: number;
  diasTrabalhados: number;
  membrosEquipe: number;
}

export interface KanbanStore {
  cards: Card[];
  tasks: Task[];
  sprintConfig: SprintConfig;
  
  // Card actions
  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, status: Card['status']) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  
  // Sprint config
  updateSprintConfig: (config: Partial<SprintConfig>) => void;
  
  // Burndown data
  getBurndownData: () => BurndownData;
}
