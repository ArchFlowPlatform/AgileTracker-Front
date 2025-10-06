'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { KanbanTask } from '@/types';
import { useUserKanbanBoardStore } from '@/hooks/useUserStores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TaskEditModalProps {
  task?: KanbanTask | null;
  columnId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskEditModal({ task, columnId, isOpen, onClose }: TaskEditModalProps) {
  const kanbanStore = useUserKanbanBoardStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    storyPoints: 0,
    taskCode: '',
    dueDate: '',
    assignedMembers: [] as string[],
    selectedLabels: [] as string[],
  });
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        storyPoints: task.storyPoints,
        taskCode: task.taskCode,
        dueDate: task.dueDate || '',
        assignedMembers: task.assignedMembers.map(m => m.name),
        selectedLabels: task.labels,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        storyPoints: 0,
        taskCode: '',
        dueDate: '',
        assignedMembers: [],
        selectedLabels: [],
      });
    }
  }, [task, isOpen]);

  if (!kanbanStore) {
    return null;
  }
  
  const { addTask, updateTask, labels, createLabel, getTeamMembers } = kanbanStore;
  
  // Get members from settings
  const members = getTeamMembers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title,
      description: formData.description,
      column: columnId,
      storyPoints: formData.storyPoints,
      taskCode: formData.taskCode,
      dueDate: formData.dueDate,
      assignedMembers: formData.assignedMembers.map(name => 
        members.find(m => m.name === name) || { name, initials: name.split(' ').map(n => n[0]).join(''), avatar: '' }
      ),
      labels: formData.selectedLabels,
      lastActivity: new Date().toISOString(),
      isCompleted: false,
      createdAt: task?.createdAt || new Date().toISOString(),
      attachments: task?.attachments || [],
      comments: task?.comments || [],
      subtasks: task?.subtasks || [],
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }

    onClose();
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

  const handleCreateLabel = () => {
    if (newLabelName.trim()) {
      createLabel(newLabelName.trim(), newLabelColor);
      setFormData(prev => ({
        ...prev,
        selectedLabels: [...prev.selectedLabels, newLabelName.trim()]
      }));
      setNewLabelName('');
    }
  };

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop com desfoque */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-md" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da tarefa..."
              className="mt-1"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva a tarefa..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Story Points */}
            <div>
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                value={formData.storyPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, storyPoints: parseInt(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>

            {/* Task Code */}
            <div>
              <Label htmlFor="taskCode">Código da Tarefa</Label>
              <Input
                id="taskCode"
                value={formData.taskCode}
                onChange={(e) => setFormData(prev => ({ ...prev, taskCode: e.target.value }))}
                placeholder="ex: ED 001"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">

            {/* Data de Vencimento */}
            <div>
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Membros Atribuídos */}
          <div>
            <Label>Membros Atribuídos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {members.map((member) => (
                <div
                  key={member.name}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors",
                    formData.assignedMembers.includes(member.name)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  )}
                  onClick={() => handleMemberToggle(member.name)}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={member.avatar} alt={member.name} />
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
          <div>
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {labels.map((label) => (
                <Badge
                  key={label.id}
                  variant={formData.selectedLabels.includes(label.name) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    formData.selectedLabels.includes(label.name) && "bg-blue-500"
                  )}
                  style={{
                    backgroundColor: formData.selectedLabels.includes(label.name) ? label.color : undefined,
                    borderColor: label.color,
                    color: formData.selectedLabels.includes(label.name) ? 'white' : label.color
                  }}
                  onClick={() => handleLabelToggle(label.name)}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
            
            {/* Criar novo label */}
            <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  placeholder="Nome do label..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                >
                  Criar
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Cor:</span>
                <div className="flex space-x-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        newLabelColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewLabelColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {task ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
