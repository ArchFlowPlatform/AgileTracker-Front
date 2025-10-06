'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/hooks/useAlert';
import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Play } from 'lucide-react';

interface Sprint {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  working_days: string[];
  is_active: boolean;
  board_id: number;
}

interface Board {
  id: number;
  name: string;
  description?: string;
}

export function SprintManager() {
  const { token } = useAuth();
  const { showAlert } = useAlert();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    workingDays: '',
  });

  // Carregar boards e sprints
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        // Carregar boards
        const boardsResponse = await fetch('http://localhost:8000/api/boards', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (boardsResponse.ok) {
          const boardsData = await boardsResponse.json();
          setBoards(boardsData);
          if (boardsData.length > 0) {
            setSelectedBoardId(boardsData[0].id);
            await fetchSprints(boardsData[0].id);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const fetchSprints = async (boardId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/sprints/board/${boardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const sprintsData = await response.json();
        setSprints(sprintsData);
      }
    } catch (error) {
      console.error('Erro ao carregar sprints:', error);
    }
  };

  const handleCreateSprint = async () => {
    if (!token || !formData.name || !formData.startDate || !formData.endDate || !selectedBoardId) return;
    
    setIsCreating(true);
    
    try {
      const workingDaysArray = formData.workingDays
        .split(',')
        .map(day => day.trim())
        .filter(day => day);
      
      const response = await fetch('http://localhost:8000/api/sprints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          start_date: formData.startDate,
          end_date: formData.endDate,
          working_days: workingDaysArray,
          is_active: false,
          board_id: selectedBoardId
        }),
      });
      
      if (response.ok) {
        const newSprint = await response.json();
        setSprints(prev => [...prev, newSprint]);
        
        // Limpar formulário
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          workingDays: '',
        });
        
        showAlert('success', 'Sprint Criado!', 'O sprint foi criado com sucesso.');
      } else {
        const error = await response.json();
        showAlert('error', 'Erro ao Criar Sprint', error.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      showAlert('error', 'Erro ao Criar Sprint', 'Ocorreu um erro inesperado ao criar o sprint.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivateSprint = async (sprintId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/sprints/${sprintId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        await fetchSprints(selectedBoardId!);
        showAlert('success', 'Sprint Ativado!', 'O sprint foi ativado com sucesso.');
      } else {
        const error = await response.json();
        showAlert('error', 'Erro ao Ativar Sprint', error.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao ativar sprint:', error);
      showAlert('error', 'Erro ao Ativar Sprint', 'Ocorreu um erro inesperado ao ativar o sprint.');
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!token) return;
    
    // Usar o modal customizado para confirmação
    const confirmed = window.confirm('Tem certeza que deseja deletar este sprint?');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/sprints/${sprintId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setSprints(prev => prev.filter(sprint => sprint.id !== sprintId));
        showAlert('success', 'Sprint Deletado!', 'O sprint foi deletado com sucesso.');
      } else {
        const error = await response.json();
        showAlert('error', 'Erro ao Deletar Sprint', error.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao deletar sprint:', error);
      showAlert('error', 'Erro ao Deletar Sprint', 'Ocorreu um erro inesperado ao deletar o sprint.');
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-4 text-muted-foreground font-medium">Carregando sprints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Selection com glassmorphism */}
      {boards.length > 0 && (
        <Card className="card-modern hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 mr-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              Selecionar Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {boards.map((board) => (
                <Button
                  key={board.id}
                  variant={selectedBoardId === board.id ? "default" : "outline"}
                  className={`transition-all duration-300 hover-lift focus-ring ${
                    selectedBoardId === board.id 
                      ? "gradient-primary text-white border-primary" 
                      : "glass-card border-sidebar-border hover:border-primary/30"
                  }`}
                  onClick={() => {
                    setSelectedBoardId(board.id);
                    fetchSprints(board.id);
                  }}
                >
                  {board.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Sprint Form com glassmorphism */}
      <Card className="card-modern hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-success/10 to-success/5 mr-3">
              <Plus className="h-6 w-6 text-success" />
            </div>
            Criar Novo Sprint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Nome do Sprint</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Sprint 1"
                className="glass-card border-sidebar-border focus-ring hover:border-primary/30 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">Descrição (opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do sprint"
                className="glass-card border-sidebar-border focus-ring hover:border-primary/30 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium text-foreground">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="glass-card border-sidebar-border focus-ring hover:border-primary/30 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium text-foreground">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="glass-card border-sidebar-border focus-ring hover:border-primary/30 transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workingDays" className="text-sm font-medium text-foreground">Dias de Trabalho (separados por vírgula)</Label>
            <Input
              id="workingDays"
              value={formData.workingDays}
              onChange={(e) => setFormData(prev => ({ ...prev, workingDays: e.target.value }))}
              placeholder="Ex: Segunda, Terça, Quarta, Quinta, Sexta"
              className="glass-card border-sidebar-border focus-ring hover:border-primary/30 transition-all duration-300"
            />
          </div>

          <Button 
            onClick={handleCreateSprint} 
            disabled={isCreating || !formData.name || !formData.startDate || !formData.endDate}
            className="w-full gradient-primary text-white hover:bg-primary-hover focus-ring transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Criando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Criar Sprint
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sprints List com glassmorphism */}
      {selectedBoardId && (
        <Card className="card-modern hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 mr-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              Sprints do Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sprints.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto glass-card rounded-2xl flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum sprint criado ainda</h3>
                <p className="text-sm">Crie seu primeiro sprint usando o formulário acima</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sprints.map((sprint) => (
                  <div 
                    key={sprint.id}
                    className={`p-6 rounded-2xl transition-all duration-300 hover-lift ${
                      sprint.is_active 
                        ? 'glass-card border-success/30 bg-gradient-to-r from-success/5 to-transparent' 
                        : 'glass-card border-sidebar-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-foreground">{sprint.name}</h3>
                          {sprint.is_active && (
                            <Badge className="gradient-primary text-white">
                              <Play className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        
                        {sprint.description && (
                          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{sprint.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span>{new Date(sprint.start_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span>{new Date(sprint.end_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success"></div>
                            <span>{calculateDuration(sprint.start_date, sprint.end_date)} dias</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-warning"></div>
                            <span>{sprint.working_days.length} dias úteis</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {!sprint.is_active && (
                          <Button
                            size="sm"
                            onClick={() => handleActivateSprint(sprint.id)}
                            className="gradient-primary text-white hover:bg-primary-hover focus-ring hover-lift"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Ativar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSprint(sprint.id)}
                          className="hover-lift focus-ring"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}