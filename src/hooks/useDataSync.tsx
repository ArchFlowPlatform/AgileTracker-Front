// Hook para sincronização completa de dados com o backend
import { useState } from 'react';
import { apiService } from '@/services/api';

export function useDataSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncAllData = async (boardId: number = 1) => {
    // Verificar se há token de autenticação
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ Token de autenticação não encontrado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.syncAllData(boardId);
      console.log('✅ Dados sincronizados com sucesso:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro na sincronização:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const syncOnLogin = async (boardId: number = 1) => {
    try {
      console.log('🔄 Iniciando sincronização após login...');
      const data = await syncAllData(boardId);
      
      // Aqui você pode atualizar os stores com os dados do backend
      // Por exemplo: updateKanbanStore(data), updateScrumStore(data), etc.
      
      return data;
    } catch (syncError) {
      console.warn('⚠️ Falha na sincronização inicial, usando dados locais:', syncError);
      return null;
    }
  };

  return {
    syncAllData,
    syncOnLogin,
    isLoading,
    error,
  };
}
