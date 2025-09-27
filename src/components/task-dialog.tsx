'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useKanbanBoardStore } from '@/store/kanban-board-store';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDialog({ open, onOpenChange }: TaskDialogProps) {
  const {
    selectedTask,
    members,
    labels,
    updateTask,
    addTask,
    closeTaskDialog,
  } = useKanbanBoardStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    storyPoints: 0,
    taskCode: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedMembers: [] as string[],
    selectedLabels: [] as string[],
  });

  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description || '',
        storyPoints: selectedTask.storyPoints,
        taskCode: selectedTask.taskCode,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '',
        assignedMembers: selectedTask.assignedMembers.map(m => m.name),
        selectedLabels: selectedTask.labels,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        storyPoints: 0,
        taskCode: '',
        priority: 'medium',
        dueDate: '',
        assignedMembers: [],
        selectedLabels: [],
      });
    }
  }, [selectedTask]);

  const handleSave = () => {
    const assignedMembersData = members.filter(m => 
      formData.assignedMembers.includes(m.name)
    );

    const taskData = {
      title: formData.title,
      description: formData.description,
      storyPoints: formData.storyPoints,
      taskCode: formData.taskCode,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      assignedMembers: assignedMembersData,
      labels: formData.selectedLabels,
    };

    if (selectedTask) {
      updateTask(selectedTask.id, taskData);
    } else {
      addTask({
        ...taskData,
        column: 'TO DO', // Default column
        isCompleted: false,
      });
    }

    closeTaskDialog();
  };

  const handleMemberToggle = (memberName: string) => {
    setFormData(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberName)
        ? prev.assignedMembers.filter(name => name !== memberName)
        : [...prev.assignedMembers, memberName]
    }));
  };

  const handleLabelToggle = (labelName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.includes(labelName)
        ? prev.selectedLabels.filter(name => name !== labelName)
        : [...prev.selectedLabels, labelName]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedTask ? 'Editar Task' : 'Nova Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da task..."
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite a descrição da task..."
              rows={4}
            />
          </div>

          {/* Task Code e Story Points */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskCode">Código da Task</Label>
              <Input
                id="taskCode"
                value={formData.taskCode}
                onChange={(e) => setFormData(prev => ({ ...prev, taskCode: e.target.value }))}
                placeholder="Ex: ED 002"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                value={formData.storyPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, storyPoints: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Prioridade e Data de Vencimento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Membros Atribuídos */}
          <div className="space-y-2">
            <Label>Membros Atribuídos</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div
                  key={member.name}
                  onClick={() => handleMemberToggle(member.name)}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.assignedMembers.includes(member.name)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <Badge
                  key={label.id}
                  variant={formData.selectedLabels.includes(label.name) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleLabelToggle(label.name)}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeTaskDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {selectedTask ? 'Salvar' : 'Criar Task'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}