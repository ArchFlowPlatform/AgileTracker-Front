const API_BASE_URL = 'http://localhost:8000/api';

// Tipos para os dados de sincronização
interface KanbanBoardData {
  id?: number;
  name: string;
  columns: Array<{
    id?: number;
    name: string;
    position: number;
    tasks: Array<{
      id?: number;
      title: string;
      description?: string;
      position: number;
      story_points?: number;
    }>;
  }>;
}

interface ScrumData {
  epics: Array<{
    id?: number;
    name: string;
    description: string;
    priority: string;
  }>;
  userStories: Array<{
    id?: number;
    title: string;
    description: string;
    story_points: number;
    priority: string;
    status: string;
    acceptance_criteria: string[];
    tags: string[];
    epic_id?: number;
  }>;
}

interface SettingsData {
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

interface UserData {
  kanbanData?: KanbanBoardData;
  scrumData?: ScrumData;
  settingsData?: SettingsData;
}

/**
 * Serviço de sincronização com banco de dados
 * Sincroniza dados do localStorage com o banco
 */
export class DatabaseSyncService {
  private static instance: DatabaseSyncService;

  static getInstance(): DatabaseSyncService {
    if (!DatabaseSyncService.instance) {
      DatabaseSyncService.instance = new DatabaseSyncService();
    }
    return DatabaseSyncService.instance;
  }

  /**
   * Sincroniza dados do Kanban Board com o banco
   */
  async syncKanbanBoard(boardData: KanbanBoardData, token: string): Promise<boolean> {
    try {
      console.log('🔄 Sincronizando Kanban Board com banco...');

      const response = await fetch(`${API_BASE_URL}/sync/kanban-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ boardData })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Kanban Board sincronizado:', result.message);
      return true;
    } catch (error) {
      console.error('❌ Erro ao sincronizar Kanban Board:', error);
      return false;
    }
  }

  /**
   * Sincroniza dados do Scrum com o banco
   */
  async syncScrumData(scrumData: ScrumData, token: string): Promise<boolean> {
    try {
      console.log('🔄 Sincronizando dados Scrum com banco...');

      const response = await fetch(`${API_BASE_URL}/sync/scrum`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scrumData })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dados Scrum sincronizados:', result.message);
      return true;
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados Scrum:', error);
      return false;
    }
  }

  /**
   * Sincroniza configurações com o banco
   */
  async syncSettings(settingsData: SettingsData, token: string): Promise<boolean> {
    try {
      console.log('🔄 Sincronizando configurações com banco...');

      const response = await fetch(`${API_BASE_URL}/sync/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settingsData })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Configurações sincronizadas:', result.message);
      return true;
    } catch (error) {
      console.error('❌ Erro ao sincronizar configurações:', error);
      return false;
    }
  }

  /**
   * Sincronização completa (todos os dados)
   */
  async syncAll(kanbanData: KanbanBoardData, scrumData: ScrumData, settingsData: SettingsData, token: string): Promise<boolean> {
    try {
      console.log('🔄 Sincronização completa com banco...');

      const response = await fetch(`${API_BASE_URL}/sync/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ kanbanData, scrumData, settingsData })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Sincronização completa:', result.message);
      return true;
    } catch (error) {
      console.error('❌ Erro na sincronização completa:', error);
      return false;
    }
  }

  /**
   * Carrega dados do banco para o localStorage
   * Nota: Este endpoint ainda não está implementado no backend
   */
  async loadUserData(): Promise<UserData | null> {
    try {
      console.log('📥 Tentando carregar dados do banco...');
      console.log('ℹ️ Endpoint /sync/load ainda não implementado no backend');

      // Por enquanto, retornar null para indicar que não há dados do banco
      // No futuro, quando o endpoint estiver implementado, descomente o código abaixo:
      
      /*
      const response = await fetch(`${API_BASE_URL}/sync/load/${userId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dados carregados do banco');
      return result.data;
      */

      return null;
    } catch (error) {
      console.error('❌ Erro ao carregar dados do banco:', error);
      return null;
    }
  }

  /**
   * Verifica se o backend está disponível
   */
  async checkBackendStatus(): Promise<boolean> {
    try {
      // Usar endpoint público para verificar se backend está rodando
      const response = await fetch(`${API_BASE_URL}/system/info`, {
        method: 'GET',
      });
      
      // Se chegou até aqui, o backend está rodando
      return response.ok;
    } catch {
      console.log('⚠️ Backend não disponível, usando apenas localStorage');
      return false;
    }
  }
}

export const databaseSyncService = DatabaseSyncService.getInstance();
