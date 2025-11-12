'use client';

import { useEffect } from 'react';
import { cleanupOldDataSafe, hasOldData, backupUserData } from '@/utils/migration';
import { useAuth } from '@/hooks/useAuth';

/**
 * Componente que executa limpeza automática de dados antigos
 * SEGURO - não remove dados de usuários existentes
 */
export function DataCleanup() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Executar limpeza apenas uma vez e apenas se há dados antigos
    if (hasOldData()) {
      console.log('🧹 Dados antigos detectados, executando limpeza SEGURA...');
      
      // Se há usuário logado, criar backup antes da limpeza
      if (isAuthenticated && user?.id) {
        console.log(`💾 Criando backup para usuário ${user.id} antes da limpeza...`);
        backupUserData(user.id);
      }
      
      const removedCount = cleanupOldDataSafe();
      
      if (removedCount > 0) {
        console.log(`✅ Limpeza segura concluída: ${removedCount} chaves antigas removidas`);
        console.log('🔄 Dados de usuários foram preservados!');
      } else {
        console.log('ℹ️ Nenhuma chave antiga removida - dados de usuários preservados');
      }
    } else {
      console.log('✅ Nenhum dado antigo encontrado, sistema já está isolado por usuário');
    }
  }, [user?.id, isAuthenticated]);

  return null; // Componente invisível
}
