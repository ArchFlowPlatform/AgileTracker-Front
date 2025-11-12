// Serviço centralizado para todas as operações de API
// Garante persistência completa da plataforma

const API_BASE_URL = 'http://localhost:8000/api';

// Interfaces para tipagem
interface BoardData {
  name: string;
  description?: string;
}

interface ColumnData {
  name: string;
  position: number;
  board_id: number;
}

interface TaskData {
  title: string;
  description?: string;
  position: number;
  story_points?: number;
  board_id?: number; // Opcional - backend decide automaticamente
  column_id?: number; // Opcional - backend decide automaticamente
}

interface SprintData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  board_id: number;
  working_days?: string[];
}

interface UserStoryData {
  title: string;
  description: string;
  story_points: number;
  acceptance_criteria: string[];
  priority: 'High' | 'Medium' | 'Low';
  epic_id?: number;
  tags: string[];
  board_id?: number; // Opcional - backend decide automaticamente
}

interface EpicData {
  name: string;
  description: string;
  color: string;
  board_id: number;
}

interface SettingsData {
  team_members: string[];
  story_points_scale: number[];
  sprint_duration: number;
  working_hours_per_day: number;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro do servidor: ${response.status} - ${errorData}`);
    }
    return response.json();
  }

  // ===== KANBAN BOARD =====
  async createBoard(boardData: BoardData) {
    const response = await fetch(`${API_BASE_URL}/boards`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(boardData),
    });
    return this.handleResponse(response);
  }

  async getBoards() {
    const response = await fetch(`${API_BASE_URL}/boards`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateBoard(boardId: number, boardData: Partial<BoardData>) {
    const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(boardData),
    });
    return this.handleResponse(response);
  }

  // ===== KANBAN COLUMNS =====
  async createColumn(columnData: ColumnData) {
    const response = await fetch(`${API_BASE_URL}/columns`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(columnData),
    });
    return this.handleResponse(response);
  }

  async getColumns(boardId: number) {
    const response = await fetch(`${API_BASE_URL}/columns/board/${boardId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateColumn(columnId: number, columnData: Partial<ColumnData>) {
    const response = await fetch(`${API_BASE_URL}/columns/${columnId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(columnData),
    });
    return this.handleResponse(response);
  }

  async deleteColumn(columnId: number) {
    const response = await fetch(`${API_BASE_URL}/columns/${columnId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ===== KANBAN TASKS =====
  async createTask(taskData: TaskData) {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    return this.handleResponse(response);
  }

  async getTasks(boardId: number) {
    const response = await fetch(`${API_BASE_URL}/tasks/board/${boardId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateTask(taskId: number, taskData: Partial<TaskData>) {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    return this.handleResponse(response);
  }

  async deleteTask(taskId: number) {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ===== SPRINTS =====
  async createSprint(sprintData: SprintData) {
    const response = await fetch(`${API_BASE_URL}/sprints`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(sprintData),
    });
    return this.handleResponse(response);
  }

  async getSprints(boardId: number) {
    const response = await fetch(`${API_BASE_URL}/sprints/board/${boardId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateSprint(sprintId: number, sprintData: Partial<SprintData>) {
    const response = await fetch(`${API_BASE_URL}/sprints/${sprintId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(sprintData),
    });
    return this.handleResponse(response);
  }

  async deleteSprint(sprintId: number) {
    const response = await fetch(`${API_BASE_URL}/sprints/${sprintId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ===== USER STORIES (Novo endpoint que precisaremos criar) =====
  async createUserStory(userStoryData: UserStoryData) {
    const response = await fetch(`${API_BASE_URL}/user-stories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userStoryData),
    });
    return this.handleResponse(response);
  }

  async getUserStories(boardId: number) {
    const response = await fetch(`${API_BASE_URL}/user-stories/board/${boardId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateUserStory(userStoryId: number, userStoryData: Partial<UserStoryData>) {
    const response = await fetch(`${API_BASE_URL}/user-stories/${userStoryId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userStoryData),
    });
    return this.handleResponse(response);
  }

  async deleteUserStory(userStoryId: number) {
    const response = await fetch(`${API_BASE_URL}/user-stories/${userStoryId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ===== EPICS (Novo endpoint que precisaremos criar) =====
  async createEpic(epicData: EpicData) {
    const response = await fetch(`${API_BASE_URL}/epics`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(epicData),
    });
    return this.handleResponse(response);
  }

  async getEpics(boardId: number) {
    const response = await fetch(`${API_BASE_URL}/epics/board/${boardId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateEpic(epicId: number, epicData: Partial<EpicData>) {
    const response = await fetch(`${API_BASE_URL}/epics/${epicId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(epicData),
    });
    return this.handleResponse(response);
  }

  async deleteEpic(epicId: number) {
    const response = await fetch(`${API_BASE_URL}/epics/${epicId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ===== SETTINGS/USER PREFERENCES =====
  async updateUserSettings(settingsData: SettingsData) {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settingsData),
    });
    return this.handleResponse(response);
  }

  async getUserSettings() {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ===== SINCRONIZAÇÃO COMPLETA =====
  async syncAllData(boardId: number) {
    try {
      const [boards, columns, tasks, sprints, userStories, epics, settings] = await Promise.all([
        this.getBoards(),
        this.getColumns(boardId),
        this.getTasks(boardId),
        this.getSprints(boardId),
        this.getUserStories(boardId),
        this.getEpics(boardId),
        this.getUserSettings(),
      ]);

      return {
        boards,
        columns,
        tasks,
        sprints,
        userStories,
        epics,
        settings,
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
