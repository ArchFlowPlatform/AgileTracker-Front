'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { 
  Plus, 
  FileText, 
  Target, 
  Calendar,
  Upload,
  Edit2,
  Trash2,
  Search,
  Tag,
  Wand2,
  X
} from 'lucide-react';
import { createUserScrumStore } from '@/store/scrum-store';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { useUserKanbanBoardStore } from '@/hooks/useUserKanbanBoardStore';
import { UserStory } from '@/types/scrum';
import { TextPasteModal } from '@/components/ui/text-paste-modal';
import { ParsedUserStory } from '@/services/userStoryParser';

export function UserStoriesManagement() {
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
  const kanbanStore = useUserKanbanBoardStore();
  const { tasks, updateTask } = kanbanStore || { tasks: [], updateTask: () => {} };
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTextPasteModalOpen, setIsTextPasteModalOpen] = useState(false);
  const [isTaskAssociationModalOpen, setIsTaskAssociationModalOpen] = useState(false);
  const [editingUserStory, setEditingUserStory] = useState<UserStory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEpic, setFilterEpic] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  const [newUserStory, setNewUserStory] = useState({
    title: '',
    description: '',
    storyPoints: 0,
    acceptanceCriteria: [''],
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    epic: '',
    tags: [] as string[],
  });

  const [newEpic, setNewEpic] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });
  
  // Verificar se o store está disponível
  if (!scrumStore || !storeState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando User Stories...</p>
        </div>
      </div>
    );
  }
  
  // Usar estado do store que atualiza em tempo real
  const userStories = storeState.userStories;
  const epics = storeState.epics;
  const addUserStory = storeState.addUserStory;
  const updateUserStory = storeState.updateUserStory;
  const deleteUserStory = storeState.deleteUserStory;
  const addEpic = storeState.addEpic;

  const handleCreateUserStory = () => {
    // Validações
    if (!newUserStory.title.trim()) {
      alert('❌ Por favor, preencha o título da User Story');
      return;
    }

    if (newUserStory.storyPoints <= 0) {
      alert('❌ Por favor, defina os Story Points (1, 2, 3, 5, 8, 13, 21)');
      return;
    }

    try {
      addUserStory({
        title: newUserStory.title,
        description: newUserStory.description,
        storyPoints: newUserStory.storyPoints,
        acceptanceCriteria: newUserStory.acceptanceCriteria.filter(c => c.trim()),
        priority: newUserStory.priority,
        epic: newUserStory.epic,
        tags: newUserStory.tags,
        status: 'Backlog',
      });

      // Reset form
      setNewUserStory({
        title: '',
        description: '',
        storyPoints: 0,
        acceptanceCriteria: [''],
        priority: 'Medium',
        epic: '',
        tags: [],
      });
      setIsCreateModalOpen(false);
      
      alert('✅ User Story criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar User Story:', error);
      alert('❌ Erro ao criar User Story. Tente novamente.');
    }
  };

  const handleEditUserStory = (userStory: UserStory) => {
    setEditingUserStory(userStory);
    setIsEditModalOpen(true);
  };

  const handleUpdateUserStory = () => {
    if (!editingUserStory) return;

    // Validações
    if (!editingUserStory.title.trim()) {
      alert('❌ Por favor, preencha o título da User Story');
      return;
    }

    if (editingUserStory.storyPoints <= 0) {
      alert('❌ Por favor, defina os Story Points (1, 2, 3, 5, 8, 13, 21)');
      return;
    }

    try {
      updateUserStory(editingUserStory.id, {
        title: editingUserStory.title,
        description: editingUserStory.description,
        storyPoints: editingUserStory.storyPoints,
        acceptanceCriteria: editingUserStory.acceptanceCriteria.filter(c => c.trim()),
        priority: editingUserStory.priority,
        epic: editingUserStory.epic,
        tags: editingUserStory.tags,
      });

      setIsEditModalOpen(false);
      setEditingUserStory(null);
      
      alert('✅ User Story atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar User Story:', error);
      alert('❌ Erro ao atualizar User Story. Tente novamente.');
    }
  };

  const handleDeleteUserStory = (id: string) => {
    const userStory = userStories.find(story => story.id === id);
    if (!userStory) return;

    const confirmDelete = window.confirm(
      `❓ Tem certeza que deseja excluir a User Story "${userStory.title}"?\n\nEsta ação não pode ser desfeita.`
    );

    if (confirmDelete) {
      try {
        deleteUserStory(id);
        alert('✅ User Story excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir User Story:', error);
        alert('❌ Erro ao excluir User Story. Tente novamente.');
      }
    }
  };

  const updateAcceptanceCriteriaEdit = (index: number, value: string) => {
    if (!editingUserStory) return;
    
    const newCriteria = [...editingUserStory.acceptanceCriteria];
    newCriteria[index] = value;
    setEditingUserStory(prev => prev ? { ...prev, acceptanceCriteria: newCriteria } : null);
  };

  const removeAcceptanceCriteriaEdit = (index: number) => {
    if (!editingUserStory) {
      console.log('❌ editingUserStory is null');
      return;
    }
    
    console.log('🗑️ Removendo critério no índice:', index);
    console.log('📋 Critérios antes:', editingUserStory.acceptanceCriteria);
    
    const newCriteria = editingUserStory.acceptanceCriteria.filter((_, i) => i !== index);
    
    // Se não há mais critérios, adiciona um vazio
    if (newCriteria.length === 0) {
      newCriteria.push('');
    }
    
    console.log('📋 Critérios depois:', newCriteria);
    
    setEditingUserStory(prev => {
      if (!prev) return null;
      const updated = { ...prev, acceptanceCriteria: newCriteria };
      console.log('✅ Estado atualizado:', updated);
      return updated;
    });
  };

  const addAcceptanceCriteriaEdit = () => {
    if (!editingUserStory) {
      console.log('❌ editingUserStory is null');
      return;
    }
    
    console.log('➕ Adicionando novo critério');
    console.log('📋 Critérios antes:', editingUserStory.acceptanceCriteria);
    
    setEditingUserStory(prev => {
      if (!prev) return null;
      const updated = { ...prev, acceptanceCriteria: [...prev.acceptanceCriteria, ''] };
      console.log('✅ Estado atualizado:', updated);
      return updated;
    });
  };

  const handleParseUserStory = (parsedStory: ParsedUserStory) => {
    try {
      addUserStory({
        title: parsedStory.title,
        description: parsedStory.description,
        storyPoints: parsedStory.storyPoints,
        acceptanceCriteria: parsedStory.acceptanceCriteria,
        priority: parsedStory.priority,
        epic: '', // Pode ser definido depois
        tags: parsedStory.tags,
        status: 'Backlog', // Status padrão
      });
      
      alert('✅ User Story criada com sucesso a partir do texto!');
    } catch (error) {
      console.error('Erro ao criar User Story:', error);
      alert('❌ Erro ao criar User Story. Tente novamente.');
    }
  };

  const handleCreateEpic = () => {
    if (!newEpic.name.trim()) {
      alert('❌ Por favor, preencha o nome do Epic');
      return;
    }

    try {
      addEpic({
        name: newEpic.name,
        description: newEpic.description,
        color: newEpic.color,
        userStories: [],
      });

      // Reset form
      setNewEpic({
        name: '',
        description: '',
        color: '#3b82f6',
      });
      setIsEpicModalOpen(false);
      
      alert('✅ Epic criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar Epic:', error);
      alert('❌ Erro ao criar Epic. Tente novamente.');
    }
  };

  // Função para associar task a User Story
  const handleAssociateTask = (taskId: string, userStoryId: string) => {
    try {
      updateTask(taskId, { userStoryId });
      console.log(`✅ Task ${taskId} associada à User Story ${userStoryId}`);
    } catch (error) {
      console.error('❌ Erro ao associar task:', error);
    }
  };

  // Função para desassociar task de User Story
  const handleDisassociateTask = (taskId: string) => {
    try {
      updateTask(taskId, { userStoryId: undefined });
      console.log(`✅ Task ${taskId} desassociada`);
    } catch (error) {
      console.error('❌ Erro ao desassociar task:', error);
    }
  };

  const addAcceptanceCriteria = () => {
    setNewUserStory(prev => ({
      ...prev,
      acceptanceCriteria: [...prev.acceptanceCriteria, '']
    }));
  };

  const updateAcceptanceCriteria = (index: number, value: string) => {
    setNewUserStory(prev => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.map((criteria, i) => 
        i === index ? value : criteria
      )
    }));
  };

  const removeAcceptanceCriteria = (index: number) => {
    setNewUserStory(prev => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index)
    }));
  };

  // Filter user stories
  const filteredUserStories = userStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEpic = filterEpic === 'all' || story.epic === filterEpic;
    const matchesPriority = filterPriority === 'all' || story.priority === filterPriority;
    
    return matchesSearch && matchesEpic && matchesPriority;
  });

  const totalStoryPoints = userStories.reduce((sum, story) => sum + story.storyPoints, 0);
  const completedStoryPoints = userStories
    .filter(story => story.status === 'Done')
    .reduce((sum, story) => sum + story.storyPoints, 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-modern hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">{userStories.length}</p>
              </div>
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Story Points</p>
                <p className="text-2xl font-bold text-warning">{totalStoryPoints}</p>
              </div>
              <Target className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-success">{completedStoryPoints}</p>
              </div>
              <Calendar className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Epics</p>
                <p className="text-2xl font-bold text-primary">{epics.length}</p>
              </div>
              <Tag className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova User Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova User Story</DialogTitle>
                  <DialogDescription>
                    Crie uma nova User Story para o seu backlog de produto.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newUserStory.title}
                      onChange={(e) => setNewUserStory(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Login do Usuário"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newUserStory.description}
                      onChange={(e) => setNewUserStory(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Como usuário, quero fazer login no sistema, para acessar minhas funcionalidades..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storyPoints">Story Points</Label>
                      <Select 
                        value={newUserStory.storyPoints.toString()} 
                        onValueChange={(value) => setNewUserStory(prev => ({ ...prev, storyPoints: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                          <SelectItem value="13">13</SelectItem>
                          <SelectItem value="21">21</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select 
                        value={newUserStory.priority} 
                        onValueChange={(value) => setNewUserStory(prev => ({ ...prev, priority: value as 'High' | 'Medium' | 'Low' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">Alta</SelectItem>
                          <SelectItem value="Medium">Média</SelectItem>
                          <SelectItem value="Low">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="epic">Epic</Label>
                    <Select 
                      value={newUserStory.epic} 
                      onValueChange={(value) => setNewUserStory(prev => ({ ...prev, epic: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um Epic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem Epic</SelectItem>
                        {epics.map((epic) => (
                          <SelectItem key={epic.id} value={epic.id}>
                            {epic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Critérios de Aceitação</Label>
                    <div className="space-y-2">
                      {newUserStory.acceptanceCriteria.map((criteria, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={criteria}
                            onChange={(e) => updateAcceptanceCriteria(index, e.target.value)}
                            placeholder={`Critério ${index + 1}`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAcceptanceCriteria(index)}
                            disabled={newUserStory.acceptanceCriteria.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addAcceptanceCriteria}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Critério
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateUserStory}>
                      Criar User Story
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isTextPasteModalOpen} onOpenChange={setIsTextPasteModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Parser de Texto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Parser de User Story</DialogTitle>
                  <DialogDescription>
                    Cole o texto da User Story e deixe a IA extrair as informações automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <TextPasteModal 
                  onParse={handleParseUserStory}
                  onClose={() => setIsTextPasteModalOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isTaskAssociationModalOpen} onOpenChange={setIsTaskAssociationModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  Associar Tasks
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[99vw] w-[99vw] max-h-[95vh] overflow-y-auto">
                <DialogHeader className="pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-3xl font-bold">Associar Tasks às User Stories</DialogTitle>
                      <DialogDescription className="text-lg mt-3">
                        Associe tasks do Kanban às User Stories para o burndown chart funcionar corretamente.
                      </DialogDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {
                        if (kanbanStore) {
                          const { autoAssociateTasksByLabels } = kanbanStore;
                          autoAssociateTasksByLabels(userStories);
                        }
                      }}
                      className="ml-8 px-6 py-3"
                    >
                      <Wand2 className="h-5 w-5 mr-3" />
                      Auto-Associar
                    </Button>
                  </div>
                </DialogHeader>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
                    {/* Tasks não associadas */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Tasks Disponíveis</h3>
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto border rounded-lg p-5 bg-gray-50/50">
                        {tasks.filter(task => !task.userStoryId).map(task => (
                          <div key={task.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="space-y-3">
                              {/* Título da task */}
                              <div>
                                <p className="font-semibold text-gray-900 text-base leading-tight">{task.title}</p>
                              </div>
                              
                              {/* Informações da task */}
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                  {task.storyPoints} pts
                                </span>
                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                  {task.column}
                                </span>
                              </div>
                              
                              {/* Labels */}
                              {task.labels.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {task.labels.map((label, index) => {
                                    const isUSLabel = /^US\s*\d+$/i.test(label);
                                    return (
                                      <span 
                                        key={index}
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                          isUSLabel 
                                            ? 'bg-green-100 text-green-800 border border-green-200' 
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Select para associação */}
                              <div className="pt-2 border-t border-gray-100">
                                <Select onValueChange={(userStoryId) => handleAssociateTask(task.id, userStoryId)}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecionar User Story..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {userStories.map(story => (
                                      <SelectItem key={story.id} value={story.id}>
                                        {story.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                        {tasks.filter(task => !task.userStoryId).length === 0 && (
                          <p className="text-gray-500 text-center py-8 text-lg">Todas as tasks já estão associadas</p>
                        )}
                      </div>
                    </div>

                    {/* Tasks associadas */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Tasks Associadas</h3>
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto border rounded-lg p-5 bg-gray-50/50">
                        {tasks.filter(task => task.userStoryId).map(task => {
                          const userStory = userStories.find(story => story.id === task.userStoryId);
                          return (
                            <div key={task.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                              <div className="space-y-3">
                                {/* Título da task */}
                                <div>
                                  <p className="font-semibold text-gray-900 text-base leading-tight">{task.title}</p>
                                </div>
                                
                                {/* Informações da task */}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                    {task.storyPoints} pts
                                  </span>
                                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                    {task.column}
                                  </span>
                                </div>
                                
                                {/* Labels */}
                                {task.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {task.labels.map((label, index) => {
                                      const isUSLabel = /^US\s*\d+$/i.test(label);
                                      return (
                                        <span 
                                          key={index}
                                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            isUSLabel 
                                              ? 'bg-green-100 text-green-800 border border-green-200' 
                                              : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {/* Informação da associação */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-sm text-green-700 font-medium mb-1">Associada à:</p>
                                  <p className="text-sm text-green-800 font-semibold">{userStory?.title}</p>
                                </div>
                                
                                {/* Botão de desassociação */}
                                <div className="pt-2 border-t border-gray-100">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDisassociateTask(task.id)}
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Desassociar Task
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {tasks.filter(task => task.userStoryId).length === 0 && (
                          <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                              <Tag className="h-12 w-12 mx-auto" />
                            </div>
                            <p className="text-gray-500 text-lg mb-2">Nenhuma task associada</p>
                            <p className="text-sm text-gray-400">Associe tasks na coluna da esquerda</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isEpicModalOpen} onOpenChange={setIsEpicModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  Novo Epic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Epic</DialogTitle>
                  <DialogDescription>
                    Crie um novo Epic para agrupar User Stories relacionadas.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="epicName">Nome *</Label>
                    <Input
                      id="epicName"
                      value={newEpic.name}
                      onChange={(e) => setNewEpic(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Sistema de Autenticação"
                    />
                  </div>

                  <div>
                    <Label htmlFor="epicDescription">Descrição</Label>
                    <Textarea
                      id="epicDescription"
                      value={newEpic.description}
                      onChange={(e) => setNewEpic(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do epic..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="epicColor">Cor</Label>
                    <div className="flex gap-2">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newEpic.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewEpic(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEpicModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateEpic}>
                      Criar Epic
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de Edição */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar User Story</DialogTitle>
                  <DialogDescription>
                    Edite os detalhes da User Story selecionada.
                  </DialogDescription>
                </DialogHeader>
                
                {editingUserStory && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editTitle">Título *</Label>
                      <Input
                        id="editTitle"
                        value={editingUserStory.title}
                        onChange={(e) => setEditingUserStory(prev => prev ? { ...prev, title: e.target.value } : null)}
                        placeholder="Ex: Login do Usuário"
                      />
                    </div>

                    <div>
                      <Label htmlFor="editDescription">Descrição</Label>
                      <Textarea
                        id="editDescription"
                        value={editingUserStory.description}
                        onChange={(e) => setEditingUserStory(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Como usuário, quero fazer login no sistema, para acessar minhas funcionalidades..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="editStoryPoints">Story Points</Label>
                        <Select 
                          value={editingUserStory.storyPoints.toString()} 
                          onValueChange={(value) => setEditingUserStory(prev => prev ? { ...prev, storyPoints: parseInt(value) } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                            <SelectItem value="13">13</SelectItem>
                            <SelectItem value="21">21</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="editPriority">Prioridade</Label>
                        <Select 
                          value={editingUserStory.priority} 
                          onValueChange={(value) => setEditingUserStory(prev => prev ? { ...prev, priority: value as 'High' | 'Medium' | 'Low' } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">Alta</SelectItem>
                            <SelectItem value="Medium">Média</SelectItem>
                            <SelectItem value="Low">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="editEpic">Epic</Label>
                      <Select 
                        value={editingUserStory.epic} 
                        onValueChange={(value) => setEditingUserStory(prev => prev ? { ...prev, epic: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um Epic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem Epic</SelectItem>
                          {epics.map((epic) => (
                            <SelectItem key={epic.id} value={epic.id}>
                              {epic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Critérios de Aceitação</Label>
                      <div className="space-y-2">
                        {editingUserStory.acceptanceCriteria.map((criteria, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={criteria}
                              onChange={(e) => updateAcceptanceCriteriaEdit(index, e.target.value)}
                              placeholder={`Critério ${index + 1}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeAcceptanceCriteriaEdit(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addAcceptanceCriteriaEdit}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Critério
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleUpdateUserStory}>
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar User Stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filterEpic} onValueChange={setFilterEpic}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Epics</SelectItem>
              {epics.map((epic) => (
                <SelectItem key={epic.id} value={epic.id}>
                  {epic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="High">Alta</SelectItem>
              <SelectItem value="Medium">Média</SelectItem>
              <SelectItem value="Low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Stories List */}
      <div className="space-y-4">
        {filteredUserStories.length === 0 ? (
          <Card className="card-modern">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {userStories.length === 0 ? 'Nenhuma User Story' : 'Nenhuma User Story encontrada'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {userStories.length === 0 
                  ? 'Crie sua primeira User Story para começar'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
              {userStories.length === 0 && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova User Story
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredUserStories.map((story) => (
            <Card key={story.id} className="card-modern hover-lift">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{story.title}</h3>
                      <Badge 
                        variant={story.priority === 'High' ? 'destructive' : story.priority === 'Medium' ? 'default' : 'secondary'}
                      >
                        {story.priority}
                      </Badge>
                      <Badge variant="outline">{story.storyPoints} pts</Badge>
                      {story.epic && (
                        <Badge 
                          variant="outline" 
                          style={{ 
                            backgroundColor: epics.find(e => e.id === story.epic)?.color + '20',
                            borderColor: epics.find(e => e.id === story.epic)?.color,
                            color: epics.find(e => e.id === story.epic)?.color
                          }}
                        >
                          {epics.find(e => e.id === story.epic)?.name}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{story.description}</p>
                    
                    {story.acceptanceCriteria.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-2">Critérios de Aceitação:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {story.acceptanceCriteria.map((criteria, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {story.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {story.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUserStory(story)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteUserStory(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
