'use client';

import { useState, useEffect } from 'react';
import { createUserScrumStore } from '@/store/scrum-store';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Users, 
  Target, 
  Calendar, 
  BarChart3, 
  FileText, 
  Upload,
  Plus,
  CheckCircle,
  Edit2,
  Trash2,
  Play
} from 'lucide-react';
import { UserStoriesManagement } from '@/components/user-stories-management';

export function ScrumManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, isAuthenticated } = useAuth();
  
  // Criar store diretamente usando useMemo para garantir mesma instância
  const scrumStore = useMemo(() => {
    if (isAuthenticated && user?.id) {
      return createUserScrumStore(user.id);
    }
    return createUserScrumStore(null);
  }, [user?.id, isAuthenticated]);

  // Estado para forçar re-render quando store muda
  const [storeState, setStoreState] = useState(() => scrumStore?.getState() || null);
  
  // Se inscrever nas mudanças do store para forçar re-render
  useEffect(() => {
    if (scrumStore) {
      const unsubscribe = scrumStore.subscribe((state) => {
        console.log(`🔄 Scrum Store atualizado para usuário ${user?.id}:`, {
          userStories: state.userStories.length,
          sprints: state.sprints.length,
          epics: state.epics.length
        });
        setStoreState(state);
      });
      
      return unsubscribe;
    }
  }, [scrumStore, user?.id]);
  
  // Estados para modais de sprint
  const [isEditSprintModalOpen, setIsEditSprintModalOpen] = useState(false);
  const [isSprintDetailModalOpen, setIsSprintDetailModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<{
    id: string;
    name: string;
    description: string;
    goal?: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    createdAt?: string;
  } | null>(null);
  
  // Estado para Sprint Planning
  const [sprintPlanning, setSprintPlanning] = useState({
    goal: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: 2,
    capacity: 40,
    selectedStories: [] as string[],
  });
  
  // Verificar se o store está disponível
  if (!scrumStore || !storeState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do Scrum...</p>
        </div>
      </div>
    );
  }
  
  // Usar estado do store que atualiza em tempo real
  const userStories = storeState.userStories;
  const sprints = storeState.sprints;
  const metrics = storeState.metrics;
  const addSprint = storeState.addSprint;
  const updateSprint = storeState.updateSprint;
  const deleteSprint = storeState.deleteSprint;

  // Função para converter data corretamente (evita problemas de timezone)
  const formatDate = (dateString: string) => {
    // Se a data já está no formato YYYY-MM-DD, usar diretamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    // Caso contrário, usar o método padrão
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Funções para Sprint Planning
  const updateSprintPlanning = (updates: Partial<typeof sprintPlanning>) => {
    setSprintPlanning(prev => {
      const newState = { ...prev, ...updates };
      
      // Sincronizar datas quando duração muda
      if (updates.duration && updates.duration !== prev.duration) {
        const startDate = new Date(newState.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (updates.duration * 7));
        newState.endDate = endDate.toISOString().split('T')[0];
      }
      
      // Sincronizar duração quando data de fim muda
      if (updates.endDate && updates.endDate !== prev.endDate) {
        const startDate = new Date(newState.startDate);
        const endDate = new Date(updates.endDate);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        newState.duration = Math.round(diffDays / 7);
      }
      
      return newState;
    });
  };

  const toggleUserStorySelection = (storyId: string) => {
    setSprintPlanning(prev => ({
      ...prev,
      selectedStories: prev.selectedStories.includes(storyId)
        ? prev.selectedStories.filter(id => id !== storyId)
        : [...prev.selectedStories, storyId]
    }));
  };

  const getSelectedStories = () => {
    return userStories.filter(story => sprintPlanning.selectedStories.includes(story.id));
  };

  const getTotalSelectedPoints = () => {
    return getSelectedStories().reduce((sum, story) => sum + story.storyPoints, 0);
  };

  // Funções para gerenciar sprints
  const handleEditSprint = (sprint: {
    id: string;
    name: string;
    description: string;
    goal?: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    createdAt?: string;
  }) => {
    setSelectedSprint(sprint);
    setIsEditSprintModalOpen(true);
  };

  const handleViewSprint = (sprint: {
    id: string;
    name: string;
    description: string;
    goal?: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    createdAt?: string;
  }) => {
    setSelectedSprint(sprint);
    setIsSprintDetailModalOpen(true);
  };

  const handleDeleteSprint = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    const confirmDelete = window.confirm(
      `❓ Tem certeza que deseja excluir o sprint "${sprint.name}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (confirmDelete) {
      try {
        deleteSprint(sprintId);
        alert('✅ Sprint excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir sprint:', error);
        alert('❌ Erro ao excluir sprint. Tente novamente.');
      }
    }
  };

  const handleActivateSprint = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;
    
    const confirmActivate = window.confirm(
      `🚀 Ativar o sprint "${sprint.name}"?\n\nIsso irá desativar qualquer outro sprint ativo.`
    );
    
    if (confirmActivate) {
      try {
        // Desativar todos os outros sprints
        sprints.forEach(s => {
          if (s.id !== sprintId && s.isActive) {
            updateSprint(s.id, { ...s, isActive: false });
          }
        });
        
        // Ativar o sprint selecionado
        updateSprint(sprintId, { ...sprint, isActive: true });
        alert('✅ Sprint ativado com sucesso!');
      } catch (error) {
        console.error('Erro ao ativar sprint:', error);
        alert('❌ Erro ao ativar sprint. Tente novamente.');
      }
    }
  };

  const createSprintInBackend = async (sprintData: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
  }) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Por enquanto, vamos usar um board_id fixo (você pode ajustar isso)
      const boardId = 1; // Assumindo que existe um board com ID 1

      const response = await fetch('http://localhost:8000/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: sprintData.name,
          description: sprintData.description,
          start_date: new Date(sprintData.startDate).toISOString(),
          end_date: new Date(sprintData.endDate).toISOString(),
          board_id: boardId,
          working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // Dias úteis padrão
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro do servidor: ${response.status} - ${errorData}`);
      }

      const createdSprint = await response.json();
      console.log('✅ Sprint criado no backend:', createdSprint);
      return createdSprint;
    } catch (error) {
      console.error('❌ Erro ao criar sprint no backend:', error);
      throw error;
    }
  };

  const handleCreateSprint = async () => {
    // Validações
    if (!sprintPlanning.goal.trim()) {
      alert('❌ Por favor, defina um objetivo para o sprint no campo "Objetivo do Sprint"');
      return;
    }

    if (sprintPlanning.selectedStories.length === 0) {
      alert('❌ Por favor, selecione pelo menos uma User Story do backlog');
      return;
    }

    if (sprintPlanning.capacity <= 0) {
      alert('❌ Por favor, defina a capacidade da equipe (Story Points)');
      return;
    }

    if (getTotalSelectedPoints() > sprintPlanning.capacity) {
      const confirm = window.confirm(
        `⚠️ Você selecionou ${getTotalSelectedPoints()} pontos, mas a capacidade é ${sprintPlanning.capacity} pontos.\n\nDeseja continuar mesmo assim?`
      );
      if (!confirm) return;
    }

    try {
      // Criar o sprint no store
      const selectedStories = getSelectedStories();
      const totalPoints = getTotalSelectedPoints();
      
      const sprintData = {
        name: `Sprint ${sprints.length + 1}`,
        description: `Sprint com objetivo: ${sprintPlanning.goal}`,
        goal: sprintPlanning.goal,
        startDate: sprintPlanning.startDate,
        endDate: sprintPlanning.endDate,
        userStories: sprintPlanning.selectedStories,
        velocity: 0, // Será calculada quando o sprint for completado
        isActive: false,
        burndownData: [],
      };

      // Salvar no store local primeiro
      addSprint(sprintData);

      // Enviar para o backend
      try {
        await createSprintInBackend(sprintData);
        console.log('✅ Sprint criado com sucesso no backend e store local');
      } catch (backendError) {
        console.warn('⚠️ Erro ao salvar no backend, mas sprint foi criado localmente:', backendError);
        // Continuar mesmo se o backend falhar
      }

      console.log('✅ Sprint criado e salvo no store:', {
        goal: sprintPlanning.goal,
        startDate: sprintPlanning.startDate,
        endDate: sprintPlanning.endDate,
        duration: sprintPlanning.duration,
        capacity: sprintPlanning.capacity,
        selectedStories: selectedStories,
        totalPoints: totalPoints
      });

      alert('✅ Sprint criado com sucesso!\n\n📊 Resumo:\n• Objetivo: ' + sprintPlanning.goal + '\n• Período: ' + new Date(sprintPlanning.startDate).toLocaleDateString('pt-BR') + ' - ' + new Date(sprintPlanning.endDate).toLocaleDateString('pt-BR') + '\n• Stories: ' + selectedStories.length + '\n• Pontos: ' + totalPoints + '/' + sprintPlanning.capacity);
      
      // Resetar o formulário
      setSprintPlanning({
        goal: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 2,
        capacity: 40,
        selectedStories: [],
      });
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      alert('Erro ao criar sprint. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scrum Management</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie Product Backlog, Sprints, User Stories e métricas Scrum
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="user-stories" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            User Stories
          </TabsTrigger>
          <TabsTrigger value="sprints" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sprints
          </TabsTrigger>
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="artifacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Artifacts
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            IA
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-modern hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Stories</p>
                    <p className="text-2xl font-bold text-primary">{userStories.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sprints</p>
                    <p className="text-2xl font-bold text-success">{sprints.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Story Points</p>
                    <p className="text-2xl font-bold text-warning">{userStories.reduce((sum, story) => sum + story.storyPoints, 0)}</p>
                  </div>
                  <Target className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Velocity</p>
                    <p className="text-2xl font-bold text-primary">{metrics.velocity}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="h-20 flex flex-col gap-2 hover-lift">
                  <Plus className="h-6 w-6" />
                  <span>Nova User Story</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover-lift">
                  <Calendar className="h-6 w-6" />
                  <span>Novo Sprint</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover-lift">
                  <Upload className="h-6 w-6" />
                  <span>Importar PDF</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2 hover-lift">
                  <Target className="h-6 w-6" />
                  <span>Sprint Planning</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Stories Tab */}
        <TabsContent value="user-stories" className="space-y-6">
          <UserStoriesManagement />
          
          {/* Story Points Configuration */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Configurações de Story Points
              </CardTitle>
              <p className="text-muted-foreground">
                Configure a escala de story points e critérios de estimativa
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Story Points Scale */}
              <div>
                <h4 className="font-semibold mb-3">Escala de Story Points</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="card-modern hover-lift cursor-pointer border-2 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">1</div>
                      <div className="text-sm text-muted-foreground">Muito Simples</div>
                      <div className="text-xs text-muted-foreground mt-1">1-2 horas</div>
                    </CardContent>
                  </Card>
                  <Card className="card-modern hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">2</div>
                      <div className="text-sm text-muted-foreground">Simples</div>
                      <div className="text-xs text-muted-foreground mt-1">2-4 horas</div>
                    </CardContent>
                  </Card>
                  <Card className="card-modern hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">3</div>
                      <div className="text-sm text-muted-foreground">Médio</div>
                      <div className="text-xs text-muted-foreground mt-1">4-8 horas</div>
                    </CardContent>
                  </Card>
                  <Card className="card-modern hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">5</div>
                      <div className="text-sm text-muted-foreground">Complexo</div>
                      <div className="text-xs text-muted-foreground mt-1">1-2 dias</div>
                    </CardContent>
                  </Card>
                  <Card className="card-modern hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">8</div>
                      <div className="text-sm text-muted-foreground">Muito Complexo</div>
                      <div className="text-xs text-muted-foreground mt-1">2-3 dias</div>
                    </CardContent>
                  </Card>
                  <Card className="card-modern hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">13</div>
                      <div className="text-sm text-muted-foreground">Extremamente Complexo</div>
                      <div className="text-xs text-muted-foreground mt-1">3-5 dias</div>
                    </CardContent>
                  </Card>
                  <Card className="card-modern hover-lift cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">21</div>
                      <div className="text-sm text-muted-foreground">Épico</div>
                      <div className="text-xs text-muted-foreground mt-1">1+ semana</div>
                    </CardContent>
                  </Card>
                  <Card className="card-modern hover-lift cursor-pointer border-dashed border-2 border-gray-300">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-400 mb-1">?</div>
                      <div className="text-sm text-muted-foreground">Não Estimado</div>
                      <div className="text-xs text-muted-foreground mt-1">Precisa estimar</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Estimation Guidelines */}
              <div>
                <h4 className="font-semibold mb-3">Diretrizes de Estimativa</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">📏 Tamanho Relativo</h5>
                    <p className="text-sm text-blue-800">
                      Story points medem tamanho relativo, não tempo absoluto. Uma story de 5 pontos 
                      deve ser aproximadamente 5x maior que uma story de 1 ponto.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">🎯 Foco na Complexidade</h5>
                    <p className="text-sm text-green-800">
                      Considere complexidade técnica, incerteza, esforço e risco. 
                      Não apenas o tempo de desenvolvimento.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-2">👥 Estimativa em Equipe</h5>
                    <p className="text-sm text-purple-800">
                      Use Planning Poker ou estimativa colaborativa. 
                      A experiência coletiva da equipe é mais precisa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Statistics */}
              <div>
                <h4 className="font-semibold mb-3">Estatísticas Atuais</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {userStories.reduce((sum, story) => sum + story.storyPoints, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Story Points</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-success mb-1">
                      {userStories.length > 0 ? Math.round(userStories.reduce((sum, story) => sum + story.storyPoints, 0) / userStories.length) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Média por Story</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning mb-1">
                      {userStories.filter(story => story.storyPoints === 0).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Não Estimadas</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sprints Tab */}
        <TabsContent value="sprints" className="space-y-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Sprint Management</CardTitle>
              <p className="text-muted-foreground">
                Crie e gerencie sprints do seu projeto
              </p>
            </CardHeader>
            <CardContent>
              {sprints.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum Sprint</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro sprint para começar
                  </p>
                  <Button onClick={() => setActiveTab('planning')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Sprint
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Sprints Criados ({sprints.length})</h3>
                    <Button onClick={() => setActiveTab('planning')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Sprint
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {sprints.map((sprint, index) => (
                      <Card key={sprint.id || index} className="card-modern hover-lift">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{sprint.name}</h4>
                              <p className="text-muted-foreground mb-3">{sprint.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Início:</span>
                                  <p className="font-medium">
                                    {formatDate(sprint.startDate)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Fim:</span>
                                  <p className="font-medium">
                                    {formatDate(sprint.endDate)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Objetivo:</span>
                                  <p className="font-medium">{sprint.goal || 'Não definido'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Status:</span>
                                  <Badge variant={sprint.isActive ? 'default' : 'secondary'}>
                                    {sprint.isActive ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              {!sprint.isActive && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleActivateSprint(sprint.id)}
                                  title="Ativar Sprint"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSprint(sprint)}
                                title="Editar Sprint"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewSprint(sprint)}
                                title="Ver Detalhes do Sprint"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteSprint(sprint.id)}
                                title="Excluir Sprint"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

               {/* Planning Tab */}
               <TabsContent value="planning" className="space-y-6">
                 {/* Sprint Planning */}
                 <Card className="card-modern">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Target className="h-5 w-5 text-primary" />
                       Sprint Planning
                     </CardTitle>
                     <p className="text-muted-foreground">
                       Planeje seu próximo sprint selecionando User Stories e definindo objetivos
                     </p>
                   </CardHeader>
                   <CardContent className="space-y-6">
                     {/* Sprint Goal */}
                     <div>
                       <Label htmlFor="sprintGoal" className="text-sm font-medium mb-2 block">
                         🎯 Objetivo do Sprint *
                       </Label>
                       <Textarea
                         id="sprintGoal"
                         placeholder="Ex: Implementar sistema de autenticação completo com login, registro e recuperação de senha..."
                         rows={3}
                         className="w-full"
                         value={sprintPlanning.goal}
                         onChange={(e) => updateSprintPlanning({ goal: e.target.value })}
                       />
                       <p className="text-xs text-muted-foreground mt-1">
                         Descreva o que a equipe deve alcançar neste sprint
        </p>
      </div>

                     {/* Sprint Dates */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="sprintStartDate" className="text-sm font-medium mb-2 block">
                           Data de Início
                         </Label>
                         <Input
                           id="sprintStartDate"
                           type="date"
                           value={sprintPlanning.startDate}
                           onChange={(e) => updateSprintPlanning({ startDate: e.target.value })}
                         />
                       </div>
                       <div>
                         <Label htmlFor="sprintEndDate" className="text-sm font-medium mb-2 block">
                           Data de Fim
                         </Label>
                         <Input
                           id="sprintEndDate"
                           type="date"
                           value={sprintPlanning.endDate}
                           onChange={(e) => updateSprintPlanning({ endDate: e.target.value })}
                         />
                       </div>
                     </div>

                     {/* Team Capacity */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="teamCapacity" className="text-sm font-medium mb-2 block">
                           Capacidade da Equipe (Story Points)
                         </Label>
                         <Input
                           id="teamCapacity"
                           type="number"
                           placeholder="Ex: 40"
                           min="1"
                           max="200"
                           value={sprintPlanning.capacity}
                           onChange={(e) => updateSprintPlanning({ capacity: parseInt(e.target.value) || 0 })}
                         />
                         <p className="text-xs text-muted-foreground mt-1">
                           Baseado na velocity histórica da equipe
                         </p>
                       </div>
                       <div>
                         <Label htmlFor="sprintDuration" className="text-sm font-medium mb-2 block">
                           Duração do Sprint (semanas)
                         </Label>
                         <Select 
                           value={sprintPlanning.duration.toString()}
                           onValueChange={(value) => updateSprintPlanning({ duration: parseInt(value) })}
                         >
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="1">1 semana</SelectItem>
                             <SelectItem value="2">2 semanas</SelectItem>
                             <SelectItem value="3">3 semanas</SelectItem>
                             <SelectItem value="4">4 semanas</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>

                     {/* Sprint Summary */}
                     <div className="p-4 bg-blue-50 rounded-lg">
                       <h4 className="font-semibold text-blue-900 mb-3">📊 Resumo do Sprint</h4>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                         <div>
                           <span className="text-blue-700 font-medium">📅 Período:</span>
                           <p className="text-blue-900">
                             {new Date(sprintPlanning.startDate).toLocaleDateString('pt-BR')} - {new Date(sprintPlanning.endDate).toLocaleDateString('pt-BR')}
                           </p>
                         </div>
                         <div>
                           <span className="text-blue-700 font-medium">⏱️ Duração:</span>
                           <p className="text-blue-900">{sprintPlanning.duration} semana{sprintPlanning.duration > 1 ? 's' : ''}</p>
                         </div>
                         <div>
                           <span className="text-blue-700 font-medium">📈 Capacidade:</span>
                           <p className="text-blue-900">{sprintPlanning.capacity} pontos</p>
                         </div>
                         <div>
                           <span className="text-blue-700 font-medium">🎯 Selecionados:</span>
                           <p className="text-blue-900">{getTotalSelectedPoints()} pontos ({getSelectedStories().length} stories)</p>
                         </div>
                       </div>
                     </div>

                     {/* Available User Stories */}
                     <div>
                       <h4 className="font-semibold mb-3">User Stories Disponíveis</h4>
                       <div className="space-y-3 max-h-96 overflow-y-auto">
                         {userStories.filter(story => story.status === 'Backlog').map((story) => (
                           <Card key={story.id} className="card-modern hover-lift cursor-pointer">
                             <CardContent className="p-4">
                               <div className="flex items-center justify-between">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-2">
                                     <h5 className="font-medium">{story.title}</h5>
                                     <Badge variant="outline">{story.storyPoints} pts</Badge>
                                     <Badge 
                                       variant={story.priority === 'High' ? 'destructive' : story.priority === 'Medium' ? 'default' : 'secondary'}
                                     >
                                       {story.priority}
                                     </Badge>
                                   </div>
                                   <p className="text-sm text-muted-foreground">{story.description}</p>
                                 </div>
                                 <Button 
                                   size="sm" 
                                   variant={sprintPlanning.selectedStories.includes(story.id) ? "default" : "outline"}
                                   className="ml-4"
                                   onClick={() => toggleUserStorySelection(story.id)}
                                 >
                                   {sprintPlanning.selectedStories.includes(story.id) ? (
                                     <>
                                       <CheckCircle className="h-4 w-4 mr-2" />
                                       Selecionada
                                     </>
                                   ) : (
                                     <>
                                       <Plus className="h-4 w-4 mr-2" />
                                       Adicionar
                                     </>
                                   )}
                                 </Button>
                               </div>
                             </CardContent>
                           </Card>
                         ))}
                         {userStories.filter(story => story.status === 'Backlog').length === 0 && (
                           <div className="text-center py-8 text-muted-foreground">
                             <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                             <p>Nenhuma User Story disponível no backlog</p>
                             <p className="text-sm">Crie User Stories primeiro</p>
                           </div>
                         )}
                       </div>
                     </div>

                     {/* Selected User Stories */}
                     <div>
                       <h4 className="font-semibold mb-3">User Stories Selecionadas</h4>
                       <div className="space-y-3">
                         {getSelectedStories().length === 0 ? (
                           <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
                             <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                             <p>Nenhuma User Story selecionada</p>
                             <p className="text-sm">Selecione User Stories do backlog acima</p>
                           </div>
                         ) : (
                           <>
                             {/* Summary */}
                             <div className="p-4 bg-green-50 rounded-lg">
                               <div className="flex justify-between items-center mb-2">
                                 <span className="font-medium text-green-900">Resumo da Seleção</span>
                                 <Badge variant="secondary" className="bg-green-200 text-green-800">
                                   {getSelectedStories().length} stories
                                 </Badge>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span className="text-green-700">Total Story Points:</span>
                                 <span className="font-medium text-green-900">{getTotalSelectedPoints()} pts</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span className="text-green-700">Capacidade:</span>
                                 <span className="font-medium text-green-900">{sprintPlanning.capacity} pts</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span className="text-green-700">Utilização:</span>
                                 <span className={`font-medium ${getTotalSelectedPoints() > sprintPlanning.capacity ? 'text-red-600' : 'text-green-900'}`}>
                                   {Math.round((getTotalSelectedPoints() / sprintPlanning.capacity) * 100)}%
                                 </span>
                               </div>
                             </div>
                             
                             {/* Selected Stories List */}
                             {getSelectedStories().map((story) => (
                               <Card key={story.id} className="card-modern border-green-200 bg-green-50/50">
                                 <CardContent className="p-4">
                                   <div className="flex items-center justify-between">
                                     <div className="flex-1">
                                       <div className="flex items-center gap-3 mb-2">
                                         <h5 className="font-medium">{story.title}</h5>
                                         <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                           {story.storyPoints} pts
                                         </Badge>
                                         <Badge 
                                           variant={story.priority === 'High' ? 'destructive' : story.priority === 'Medium' ? 'default' : 'secondary'}
                                         >
                                           {story.priority}
                                         </Badge>
                                       </div>
                                       <p className="text-sm text-muted-foreground">{story.description}</p>
                                     </div>
                                     <Button 
                                       size="sm" 
                                       variant="outline"
                                       className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                                       onClick={() => toggleUserStorySelection(story.id)}
                                     >
                                       <Target className="h-4 w-4 mr-2" />
                                       Remover
                                     </Button>
                                   </div>
                                 </CardContent>
                               </Card>
                             ))}
                           </>
                         )}
                       </div>
                     </div>

                     {/* Planning Actions */}
                     <div className="flex gap-3 pt-4 border-t">
                       <Button 
                         className="gradient-primary text-white hover-lift"
                         onClick={handleCreateSprint}
                       >
                         <Target className="h-4 w-4 mr-2" />
                         Criar Sprint
                       </Button>
                       <Button variant="outline">
                         Salvar Rascunho
                       </Button>
                     </div>
                   </CardContent>
                 </Card>

                 {/* Sprint Configuration */}
                 <Card className="card-modern">
                   <CardHeader>
                     <CardTitle>Configurações de Sprint</CardTitle>
                     <p className="text-muted-foreground">
                       Defina padrões para criação de sprints
                     </p>
                   </CardHeader>
                   <CardContent className="space-y-6">
                     <div>
                       <h4 className="font-semibold mb-2">Duração Padrão dos Sprints</h4>
                       <p className="text-sm text-muted-foreground mb-4">
                         Duração padrão dos sprints (em semanas)
                       </p>
                       <div className="flex gap-2">
                         <Button variant="outline" size="sm">1 semana</Button>
                         <Button size="sm">2 semanas</Button>
                         <Button variant="outline" size="sm">3 semanas</Button>
                         <Button variant="outline" size="sm">4 semanas</Button>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </TabsContent>

        {/* Artifacts Tab */}
        <TabsContent value="artifacts" className="space-y-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Scrum Artifacts</CardTitle>
              <p className="text-muted-foreground">
                Visualize burndown charts, velocity e métricas
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Artefatos Scrum</h3>
                <p className="text-muted-foreground mb-4">
                  Métricas e gráficos aparecerão aqui
                </p>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Métricas
                </Button>
              </div>
            </CardContent>
          </Card>
               </TabsContent>

               {/* AI Tab */}
               <TabsContent value="ai" className="space-y-6">
                 <Card className="card-modern">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Upload className="h-5 w-5 text-primary" />
                       Integração com Inteligência Artificial
                     </CardTitle>
                     <p className="text-muted-foreground">
                       Configure a IA para extração automática de User Stories de documentos PDF
                     </p>
                   </CardHeader>
                   <CardContent className="space-y-6">
                     {/* Provider Selection */}
                     <div>
                       <h4 className="font-semibold mb-3">Provedor de IA</h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <Card className="card-modern hover-lift cursor-pointer border-2 border-primary/20">
                           <CardContent className="p-4 text-center">
                             <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                               <Upload className="h-6 w-6 text-blue-600" />
                             </div>
                             <h5 className="font-semibold mb-1">Ollama</h5>
                             <p className="text-xs text-muted-foreground">Modelo local gratuito</p>
                           </CardContent>
                         </Card>
                         <Card className="card-modern hover-lift cursor-pointer">
                           <CardContent className="p-4 text-center">
                             <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                               <Upload className="h-6 w-6 text-purple-600" />
                             </div>
                             <h5 className="font-semibold mb-1">Hugging Face</h5>
                             <p className="text-xs text-muted-foreground">Modelos open source</p>
                           </CardContent>
                         </Card>
                         <Card className="card-modern hover-lift cursor-pointer">
                           <CardContent className="p-4 text-center">
                             <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                               <Upload className="h-6 w-6 text-green-600" />
                             </div>
                             <h5 className="font-semibold mb-1">OpenAI</h5>
                             <p className="text-xs text-muted-foreground">GPT-4, Claude</p>
                           </CardContent>
                         </Card>
                       </div>
                     </div>

                     {/* Configuration */}
                     <div>
                       <h4 className="font-semibold mb-3">Configurações</h4>
                       <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <label className="text-sm font-medium mb-2 block">API Key</label>
                             <Input placeholder="Sua chave de API..." />
                           </div>
                           <div>
                             <label className="text-sm font-medium mb-2 block">Modelo</label>
                             <Select>
                               <SelectTrigger>
                                 <SelectValue placeholder="Selecione o modelo" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="llama2">Llama2 7B</SelectItem>
                                 <SelectItem value="llama2-13b">Llama2 13B</SelectItem>
                                 <SelectItem value="gpt-4">GPT-4</SelectItem>
                                 <SelectItem value="claude">Claude 3</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                         <div>
                           <label className="text-sm font-medium mb-2 block">Confiança Mínima</label>
                           <div className="flex items-center gap-2">
                             <input type="range" min="0" max="100" defaultValue="75" className="flex-1" />
                             <span className="text-sm text-muted-foreground">75%</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Mapping */}
                     <div>
                       <h4 className="font-semibold mb-3">Mapeamento de Campos</h4>
                       <div className="space-y-3">
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium">Título PDF</span>
                           <span className="text-sm text-muted-foreground">→</span>
                           <span className="text-sm font-medium">Título User Story</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium">Descrição PDF</span>
                           <span className="text-sm text-muted-foreground">→</span>
                           <span className="text-sm font-medium">Descrição User Story</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm font-medium">Pontos PDF</span>
                           <span className="text-sm text-muted-foreground">→</span>
                           <span className="text-sm font-medium">Story Points</span>
                         </div>
                       </div>
                     </div>

                     {/* Actions */}
                     <div className="flex gap-3 pt-4">
                       <Button className="gradient-primary text-white hover-lift">
                         <Upload className="h-4 w-4 mr-2" />
                         Salvar Configurações
                       </Button>
                       <Button variant="outline">
                         Testar Conexão
                       </Button>
                     </div>
                   </CardContent>
                 </Card>

                 {/* Usage Stats */}
                 <Card className="card-modern">
                   <CardHeader>
                     <CardTitle>Estatísticas de Uso</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="text-center p-4 bg-blue-50 rounded-lg">
                         <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                         <div className="text-sm text-blue-600">PDFs Processados</div>
                       </div>
                       <div className="text-center p-4 bg-green-50 rounded-lg">
                         <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                         <div className="text-sm text-green-600">User Stories Criadas</div>
                       </div>
                       <div className="text-center p-4 bg-purple-50 rounded-lg">
                         <div className="text-2xl font-bold text-purple-600 mb-1">0%</div>
                         <div className="text-sm text-purple-600">Taxa de Sucesso</div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Sprint */}
      <Dialog open={isEditSprintModalOpen} onOpenChange={setIsEditSprintModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Sprint</DialogTitle>
            <DialogDescription>
              Edite as informações do sprint selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSprint && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Sprint</Label>
                <Input
                  id="edit-name"
                  value={selectedSprint.name}
                  onChange={(e) => setSelectedSprint({...selectedSprint, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={selectedSprint.description}
                  onChange={(e) => setSelectedSprint({...selectedSprint, description: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-goal">Objetivo</Label>
                <Input
                  id="edit-goal"
                  value={selectedSprint.goal || ''}
                  onChange={(e) => setSelectedSprint({...selectedSprint, goal: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start">Data de Início</Label>
                  <Input
                    id="edit-start"
                    type="date"
                    value={selectedSprint.startDate ? new Date(selectedSprint.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedSprint({...selectedSprint, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end">Data de Fim</Label>
                  <Input
                    id="edit-end"
                    type="date"
                    value={selectedSprint.endDate ? new Date(selectedSprint.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedSprint({...selectedSprint, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditSprintModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  try {
                    updateSprint(selectedSprint.id, selectedSprint);
                    setIsEditSprintModalOpen(false);
                    alert('✅ Sprint atualizado com sucesso!');
                  } catch (error) {
                    console.error('Erro ao atualizar sprint:', error);
                    alert('❌ Erro ao atualizar sprint. Tente novamente.');
                  }
                }}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Sprint */}
      <Dialog open={isSprintDetailModalOpen} onOpenChange={setIsSprintDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Sprint</DialogTitle>
            <DialogDescription>
              Informações completas sobre o sprint selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSprint && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Nome</Label>
                      <p className="font-medium">{selectedSprint.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Descrição</Label>
                      <p className="text-sm">{selectedSprint.description || 'Sem descrição'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Objetivo</Label>
                      <p className="text-sm">{selectedSprint.goal || 'Não definido'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <Badge variant={selectedSprint.isActive ? 'default' : 'secondary'}>
                        {selectedSprint.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cronograma</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Data de Início</Label>
                      <p className="font-medium">
                        {formatDate(selectedSprint.startDate)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Data de Fim</Label>
                      <p className="font-medium">
                        {formatDate(selectedSprint.endDate)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Duração</Label>
                      <p className="font-medium">
                        {Math.ceil((new Date(selectedSprint.endDate).getTime() - new Date(selectedSprint.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Criado em</Label>
                      <p className="text-sm">
                        {selectedSprint.createdAt ? new Date(selectedSprint.createdAt).toLocaleDateString('pt-BR') : 'Não disponível'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSprintDetailModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  setIsSprintDetailModalOpen(false);
                  handleEditSprint(selectedSprint);
                }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Sprint
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
