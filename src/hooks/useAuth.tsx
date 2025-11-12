'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useDataSync } from './useDataSync';
import { useKanbanStore } from '@/store/kanban-store';
import { migrateUserData, cleanupOldDataSafe, hasOldData, backupUserData } from '@/utils/migration';
import { databaseSyncService } from '@/services/database-sync';

const API_BASE_URL = 'http://localhost:8000/api';

interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Stores para sincronização
  const { loadDataFromBackend } = useKanbanStore();
  const { syncOnLogin } = useDataSync();

  // Verificar token no localStorage ao carregar
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        
        // Migrar dados antigos para o usuário atual (SEGURO)
        if (hasOldData()) {
          console.log('🔄 Dados antigos detectados, criando backup e migrando...');
          backupUserData(userData.user.id); // Backup antes da migração
          migrateUserData(userData.user.id);
        }

        // Verificar se backend está disponível (sem tentar carregar dados ainda)
        const backendAvailable = await databaseSyncService.checkBackendStatus();
        if (backendAvailable) {
          console.log('✅ Backend disponível, sistema funcionando normalmente');
        } else {
          console.log('⚠️ Backend não disponível, usando apenas localStorage');
        }
      } else {
        // Token inválido, remover do localStorage
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      localStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const authToken = data.token;
        
        localStorage.setItem('access_token', authToken);
        setToken(authToken);
        await fetchUserProfile(authToken);
        
        // Migrar dados antigos para o sistema por usuário
        try {
          console.log('🔄 Migrando dados para sistema por usuário...');
          const { migrateUserData } = await import('@/utils/migration');
          // Aguardar fetchUserProfile completar para ter o user.id
          await fetchUserProfile(authToken);
          if (user?.id) {
            migrateUserData(user.id);
            console.log('✅ Migração de dados concluída');
          } else {
            console.warn('⚠️ Usuário não encontrado para migração');
          }
        } catch (migrationError) {
          console.warn('⚠️ Erro na migração de dados:', migrationError);
        }

        // Sincronizar dados após login bem-sucedido
        try {
          console.log('🔄 Sincronizando dados após login...');
          // Aguardar um pouco para garantir que o token está disponível
          await new Promise(resolve => setTimeout(resolve, 100));
          await loadDataFromBackend(1); // Board padrão
          await syncOnLogin(1);
          console.log('✅ Dados sincronizados com sucesso');
        } catch (syncError) {
          console.warn('⚠️ Erro na sincronização de dados:', syncError);
          // Continuar mesmo se a sincronização falhar
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (email: string, name: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          password,
        }),
      });

      if (response.ok) {
        // Após registro bem-sucedido, fazer login automaticamente
        return await login(email, password);
      }
      
      // Log do erro para debug
      const errorData = await response.text();
      console.error('Erro no registro:', response.status, errorData);
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    // NÃO limpar dados do usuário - eles devem ser mantidos para quando fizer login novamente
    // Os dados ficam isolados por usuário no localStorage
    
    // Limpar apenas dados antigos (sem isolamento por usuário) - APENAS se não há dados de usuários
    cleanupOldDataSafe();
    
    // Limpar token e dados de autenticação
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    
    // Redirecionar para login
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
