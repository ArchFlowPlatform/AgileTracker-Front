'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Calendar, Plus, Save } from 'lucide-react';

interface Sprint {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  working_days: string[];
  is_active: boolean;
  board_id: number;
  created_at: string;
  updated_at?: string;
}

export function SprintConfig() {
  const { token } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    workingDays: ''
  });

  // Carregar sprints do board (assumindo board_id = 1 por enquanto)
  useEffect(() => {
    const fetchSprints = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:8000/api/sprints/board/1', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const sprintsData = await response.json();
          setSprints(sprintsData);
          
          // Encontrar sprint ativo
          const active = sprintsData.find((sprint: Sprint) => sprint.is_active);
          if (active) {
            setActiveSprint(active);
            setFormData({
              name: active.name,
              description: active.description || '',
              startDate: active.start_date.split('T')[0],
              endDate: active.end_date.split('T')[0],
              workingDays: active.working_days.join(', ')
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar sprints:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSprints();
  }, [token]);

  const handleCreateSprint = async () => {
    if (!token || !formData.name || !formData.startDate || !formData.endDate) return;
    
    setIsCreating(true);
    
    try {
      const workingDaysArray = formData.workingDays
        .split(',')
        .map(day => day.trim())
        .filter(day => day);
      
      const response = await fetch('http://localhost:8000/api/sprints/', {
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
          is_active: true,
          board_id: null // Será determinado pelo backend automaticamente
        }),
      });
      
      if (response.ok) {
        const newSprint = await response.json();
        setSprints(prev => [...prev, newSprint]);
        setActiveSprint(newSprint);
        
        // Executar o sprint imediatamente após criar
        await executeSprint(newSprint.id);
        
        alert('Sprint criado e executado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao criar sprint: ${error.detail}`);
      }
    } catch (error) {
      console.error('Erro ao criar sprint:', error);
      alert('Erro ao criar sprint');
    } finally {
      setIsCreating(false);
    }
  };

  const executeSprint = async (sprintId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/sprints/${sprintId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        console.log('Sprint executado com sucesso!');
      } else {
        console.error('Erro ao executar sprint');
      }
    } catch (error) {
      console.error('Erro ao executar sprint:', error);
    }
  };

  const handleUpdateSprint = async () => {
    if (!token || !activeSprint || !formData.name || !formData.startDate || !formData.endDate) return;
    
    setIsUpdating(true);
    
    try {
      const workingDaysArray = formData.workingDays
        .split(',')
        .map(day => day.trim())
        .filter(day => day);
      
      const response = await fetch(`http://localhost:8000/api/sprints/${activeSprint.id}`, {
        method: 'PUT',
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
        }),
      });
      
      if (response.ok) {
        const updatedSprint = await response.json();
        setSprints(prev => prev.map(s => s.id === updatedSprint.id ? updatedSprint : s));
        setActiveSprint(updatedSprint);
        alert('Sprint atualizado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao atualizar sprint: ${error.detail}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
      alert('Erro ao atualizar sprint');
    } finally {
      setIsUpdating(false);
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
        // Recarregar sprints para atualizar o estado ativo
        const sprintsResponse = await fetch('http://localhost:8000/api/sprints/board/1', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (sprintsResponse.ok) {
          const sprintsData = await sprintsResponse.json();
          setSprints(sprintsData);
          
          const active = sprintsData.find((sprint: Sprint) => sprint.is_active);
          if (active) {
            setActiveSprint(active);
            setFormData({
              name: active.name,
              description: active.description || '',
              startDate: active.start_date.split('T')[0],
              endDate: active.end_date.split('T')[0],
              workingDays: active.working_days.join(', ')
            });
          }
        }
        alert('Sprint ativado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao ativar sprint: ${error.detail}`);
      }
    } catch (error) {
      console.error('Erro ao ativar sprint:', error);
      alert('Erro ao ativar sprint');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando sprints...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sprint Ativo */}
      {activeSprint && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Calendar className="h-5 w-5" />
              Sprint Ativo: {activeSprint.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-name">Nome do Sprint</Label>
                <Input
                  id="sprint-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Sprint 1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sprint-start">Data de Início</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sprint-end">Data de Fim</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="working-days">Dias de Trabalho</Label>
              <Input
                id="working-days"
                placeholder="Ex: 16/09, 18/09, 22/09"
                value={formData.workingDays}
                onChange={(e) => setFormData(prev => ({ ...prev, workingDays: e.target.value }))}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="sprint-description">Descrição (opcional)</Label>
              <Input
                id="sprint-description"
                placeholder="Descrição do sprint"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={handleUpdateSprint} 
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criar Novo Sprint */}
      {!activeSprint && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Plus className="h-5 w-5" />
              Criar Novo Sprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-sprint-name">Nome do Sprint</Label>
                <Input
                  id="new-sprint-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Sprint 1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-sprint-start">Data de Início</Label>
                <Input
                  id="new-sprint-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-sprint-end">Data de Fim</Label>
                <Input
                  id="new-sprint-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="new-working-days">Dias de Trabalho</Label>
              <Input
                id="new-working-days"
                placeholder="Ex: 16/09, 18/09, 22/09"
                value={formData.workingDays}
                onChange={(e) => setFormData(prev => ({ ...prev, workingDays: e.target.value }))}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="new-sprint-description">Descrição (opcional)</Label>
              <Input
                id="new-sprint-description"
                placeholder="Descrição do sprint"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={handleCreateSprint} 
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isCreating ? 'Criando...' : 'Criar Sprint'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Sprints */}
      {sprints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Todos os Sprints ({sprints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sprints.map((sprint) => (
                <div 
                  key={sprint.id} 
                  className={`p-4 border rounded-lg ${
                    sprint.is_active 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {sprint.name}
                        {sprint.is_active && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ATIVO
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(sprint.start_date).toLocaleDateString('pt-BR')} - {new Date(sprint.end_date).toLocaleDateString('pt-BR')}
                      </p>
                      {sprint.description && (
                        <p className="text-sm text-gray-500 mt-1">{sprint.description}</p>
                      )}
                    </div>
                    {!sprint.is_active && (
                      <Button
                        size="sm"
                        onClick={() => handleActivateSprint(sprint.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
