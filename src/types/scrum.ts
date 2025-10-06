// Scrum Management Types
// Estruturas de dados para gerenciamento Scrum completo

export interface UserStory {
  id: string;
  title: string;
  description: string;
  storyPoints: number;
  acceptanceCriteria: string[];
  priority: 'High' | 'Medium' | 'Low';
  epic: string;
  tags: string[];
  status: 'Backlog' | 'Sprint Planning' | 'In Progress' | 'Done';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface Epic {
  id: string;
  name: string;
  description: string;
  color: string;
  userStories: string[]; // IDs das User Stories
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  userStories: string[]; // IDs das User Stories
  goal: string;
  velocity: number;
  burndownData: BurndownPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface BurndownPoint {
  date: string;
  remainingPoints: number;
  idealPoints: number;
}

export interface ProductBacklog {
  id: string;
  name: string;
  description: string;
  epics: Epic[];
  userStories: UserStory[];
  createdAt: string;
  updatedAt: string;
}

export interface SprintBacklog {
  sprintId: string;
  userStories: UserStory[];
  tasks: Task[];
  capacity: number;
  velocity: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  userStoryId: string;
  sprintId: string;
  assignedTo: string;
  status: 'To Do' | 'In Progress' | 'Done';
  estimatedHours: number;
  actualHours: number;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
  updatedAt: string;
}

export interface ScrumMetrics {
  velocity: number;
  burndownRate: number;
  storyPointsCompleted: number;
  storyPointsRemaining: number;
  averageStoryPointsPerSprint: number;
  sprintGoalAchievement: number;
}

export interface SprintPlanning {
  sprintId: string;
  capacity: number;
  selectedUserStories: string[];
  goal: string;
  estimatedVelocity: number;
  createdAt: string;
  updatedAt: string;
}

// Tipos para importação de PDF
export interface ExtractedUserStory {
  id: string;
  title: string;
  description: string;
  storyPoints: number;
  acceptanceCriteria: string[];
  priority: string;
  epic: string;
  tags: string[];
}

export interface PDFExtractionResult {
  extractedAt: string;
  totalStories: number;
  userStories: ExtractedUserStory[];
}
