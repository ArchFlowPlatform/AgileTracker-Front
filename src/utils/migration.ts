import { getUserStorageKey } from '@/utils/storage';

/**
 * Migração segura de dados: move dados antigos para chaves isoladas por usuário
 * PRESERVA dados existentes, não os remove
 */
export function migrateUserData(userId: number) {
  console.log(`🔄 Iniciando migração SEGURA de dados para usuário ${userId}`);
  
  // Chaves antigas que precisam ser migradas
  const oldKeys = [
    'kanban-storage',
    'kanban-board-storage',
    'settings-storage',
    'dashboard-storage',
    'scrum-storage'
  ];
  
  let migratedData = false;
  
  oldKeys.forEach(oldKey => {
    const oldData = localStorage.getItem(oldKey);
    if (oldData) {
      try {
        // Validar se os dados são válidos antes de migrar
        JSON.parse(oldData);
        const newKey = getUserStorageKey(oldKey, userId);
        
        // Verificar se já existe dados para este usuário
        const existingUserData = localStorage.getItem(newKey);
        
        if (!existingUserData) {
          // Salvar dados antigos com nova chave (apenas se não existir dados do usuário)
          localStorage.setItem(newKey, oldData);
          console.log(`✅ Migrado: ${oldKey} → ${newKey}`);
          migratedData = true;
        } else {
          console.log(`ℹ️ Usuário ${userId} já tem dados em ${newKey}, mantendo dados existentes`);
        }
        
        // NÃO remover dados antigos automaticamente - deixar para limpeza manual
        console.log(`⚠️ Dados antigos mantidos em ${oldKey} para segurança`);
        
      } catch (error) {
        console.error(`❌ Erro ao migrar ${oldKey}:`, error);
      }
    }
  });
  
  if (migratedData) {
    console.log(`✅ Migração concluída para usuário ${userId}`);
  } else {
    console.log(`ℹ️ Nenhum dado antigo encontrado para migrar`);
  }
  
  return migratedData;
}

/**
 * Backup de dados antes de qualquer operação (otimizado para evitar quota exceeded)
 */
export function backupUserData(userId: number) {
  console.log(`💾 Criando backup otimizado para usuário ${userId}`);
  
  try {
    // Limpar backups antigos primeiro
    cleanupOldBackups(userId);
    
    // Backup apenas das chaves essenciais e específicas do usuário
    const userSpecificKeys = Object.keys(localStorage).filter(key => 
      key.includes(`-user-${userId}`) && !key.includes('backup-')
    );
    
    if (userSpecificKeys.length === 0) {
      console.log(`ℹ️ Nenhum dado específico do usuário ${userId} encontrado para backup`);
      return;
    }
    
    const backupData: Record<string, unknown> = {
      userId,
      timestamp: new Date().toISOString(),
      data: {} as Record<string, unknown>
    };
    
    // Backup apenas dados específicos do usuário (menor tamanho)
    userSpecificKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data && data.length < 100000) { // Limitar tamanho por chave
        try {
          (backupData.data as Record<string, unknown>)[key] = JSON.parse(data);
        } catch {
          (backupData.data as Record<string, unknown>)[key] = data;
        }
      } else if (data && data.length >= 100000) {
        console.warn(`⚠️ Chave ${key} muito grande (${data.length} chars), pulando backup`);
      }
    });
    
    // Salvar backup compacto
    const backupKey = `backup-user-${userId}-${Date.now()}`;
    const backupString = JSON.stringify(backupData);
    
    if (backupString.length > 500000) { // Limitar tamanho total do backup
      console.warn(`⚠️ Backup muito grande (${backupString.length} chars), criando backup parcial`);
      // Criar backup apenas com metadados
      const minimalBackup = {
        userId,
        timestamp: new Date().toISOString(),
        keys: userSpecificKeys,
        message: 'Backup parcial devido ao tamanho'
      };
      localStorage.setItem(backupKey, JSON.stringify(minimalBackup));
    } else {
      localStorage.setItem(backupKey, backupString);
    }
    
    console.log(`✅ Backup criado: ${backupKey}`);
    return backupKey;
  } catch (error) {
    console.error(`❌ Erro ao criar backup:`, error);
    // Em caso de erro, pelo menos registrar que tentamos
    console.log(`ℹ️ Backup falhou para usuário ${userId}, continuando sem backup`);
    return null;
  }
}

/**
 * Restaurar dados de um backup
 */
export function restoreUserData(backupKey: string) {
  console.log(`🔄 Restaurando dados do backup: ${backupKey}`);
  
  const backupData = localStorage.getItem(backupKey);
  if (!backupData) {
    console.error(`❌ Backup não encontrado: ${backupKey}`);
    return false;
  }
  
  try {
    const parsed = JSON.parse(backupData);
    
    Object.entries(parsed.data).forEach(([key, data]) => {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ Restaurado: ${key}`);
    });
    
    console.log(`✅ Restauração concluída do backup: ${backupKey}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao restaurar backup:`, error);
    return false;
  }
}

/**
 * Limpeza SEGURA de dados antigos (apenas após confirmação)
 */
export function cleanupOldDataSafe(): number {
  console.log('🧹 Iniciando limpeza SEGURA de dados antigos...');
  
  const keysToRemove = [
    'kanban-storage',
    'kanban-board-storage', 
    'settings-storage',
    'dashboard-storage',
    'scrum-storage'
  ];
  
  let removedCount = 0;
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      // Verificar se há dados de usuários antes de remover
      const hasUserData = Object.keys(localStorage).some(k => k.includes('-user-'));
      
      if (hasUserData) {
        console.log(`⚠️ Mantendo ${key} - há dados de usuários no sistema`);
      } else {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`🗑️ Removido: ${key}`);
      }
    }
  });
  
  console.log(`✅ Limpeza segura concluída: ${removedCount} chaves removidas`);
  return removedCount;
}

/**
 * Limpa backups antigos para liberar espaço
 */
function cleanupOldBackups(userId: number) {
  const backupKeys = Object.keys(localStorage).filter(key => 
    key.startsWith(`backup-user-${userId}-`) && key !== `backup-user-${userId}-${Date.now()}`
  );
  
  // Manter apenas os 3 backups mais recentes
  if (backupKeys.length > 3) {
    backupKeys
      .sort()
      .slice(0, backupKeys.length - 3)
      .forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Backup antigo removido: ${key}`);
      });
  }
}

/**
 * Verifica se há dados antigos no localStorage
 */
export function hasOldData(): boolean {
  const oldKeys = [
    'kanban-storage',
    'kanban-board-storage',
    'settings-storage',
    'dashboard-storage',
    'scrum-storage'
  ];
  
  return oldKeys.some(key => localStorage.getItem(key) !== null);
}

/**
 * Lista todos os dados do usuário atual
 */
export function listUserData(userId: number) {
  console.log(`📋 Dados do usuário ${userId}:`);
  
  const userKeys = Object.keys(localStorage).filter(key => 
    key.includes(`-user-${userId}`) || key.includes(`backup-user-${userId}`)
  );
  
  if (userKeys.length === 0) {
    console.log(`❌ Nenhum dado encontrado para usuário ${userId}`);
    return [];
  }
  
  userKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`✅ ${key}:`, Object.keys(parsed.state || parsed.data || parsed));
      } catch {
        console.log(`📄 ${key}: ${data.length} caracteres`);
      }
    }
  });
  
  return userKeys;
}
