/**
 * Utilitários para gerenciamento de storage isolado por usuário
 */

/**
 * Gera uma chave única de storage baseada no ID do usuário
 * @param baseKey - Chave base do storage (ex: 'kanban-storage')
 * @param userId - ID do usuário atual
 * @returns Chave única para o usuário
 */
export function getUserStorageKey(baseKey: string, userId: number | null): string {
  if (!userId) {
    // Se não há usuário logado, usar uma chave temporária
    return `${baseKey}-guest`;
  }
  return `${baseKey}-user-${userId}`;
}

/**
 * Limpa todos os dados de storage de um usuário específico
 * @param userId - ID do usuário
 */
export function clearUserStorage(userId: number | null): void {
  if (!userId) return;
  
  const keys = Object.keys(localStorage);
  const userKeys = keys.filter(key => key.includes(`-user-${userId}`));
  
  userKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`🧹 Limpeza de storage para usuário ${userId}: ${userKeys.length} chaves removidas`);
}

/**
 * Limpa todos os dados de storage de usuários convidados (guest)
 */
export function clearGuestStorage(): void {
  const keys = Object.keys(localStorage);
  const guestKeys = keys.filter(key => key.includes('-guest'));
  
  guestKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`🧹 Limpeza de storage guest: ${guestKeys.length} chaves removidas`);
}

/**
 * Limpa todos os dados de storage relacionados à aplicação
 */
export function clearAllAppStorage(): void {
  const keys = Object.keys(localStorage);
  const appKeys = keys.filter(key => 
    key.includes('kanban') || 
    key.includes('scrum') || 
    key.includes('settings') ||
    key.includes('dashboard')
  );
  
  appKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`🧹 Limpeza completa de storage: ${appKeys.length} chaves removidas`);
}
