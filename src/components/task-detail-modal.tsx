'use client';

import { useState, useEffect } from 'react';
import { X, ThumbsUp, Trash2, MoreVertical, Plus, Paperclip, Send, CheckCircle } from 'lucide-react';
import { KanbanTask, Comment, Subtask } from '@/types';
import { useUserKanbanBoardStore } from '@/hooks/useUserStores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: KanbanTask | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const kanbanStore = useUserKanbanBoardStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen]);

  if (!kanbanStore) {
    return null;
  }
  
  const { updateTask } = kanbanStore;

  if (!task || !isOpen) return null;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: 'Current User',
      authorAvatar: '/placeholder-avatar.jpg',
      createdAt: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      comments: [...task.comments, comment]
    };

    updateTask(task.id, updatedTask);
    setNewComment('');
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    const subtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      subtasks: [...task.subtasks, subtask]
    };

    updateTask(task.id, updatedTask);
    setNewSubtask('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const updatedTask = {
      ...task,
      subtasks: updatedSubtasks
    };

    updateTask(task.id, updatedTask);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} horas`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} dias`;
    }
  };

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop simples */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      
      {/* Modal clean */}
      <div className="relative bg-white rounded-2xl border border-gray-200 w-full max-w-4xl h-[90vh] flex flex-col shadow-xl">
        {/* Header simples */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center space-x-4">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Concluído
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 rounded-full p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs simples */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-none h-12">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white bg-white text-gray-600 font-medium rounded-none h-full flex items-center justify-center"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="subtasks" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white bg-white text-gray-600 font-medium rounded-none h-full flex items-center justify-center"
            >
              Subtarefas
            </TabsTrigger>
            <TabsTrigger 
              value="comments" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white bg-white text-gray-600 font-medium rounded-none h-full flex items-center justify-center"
            >
              Comentários ({task.comments.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 px-6 py-4 overflow-y-auto min-h-0">
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              
              {/* Task Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Responsável</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {task.assignedMembers.length > 0 ? (
                        task.assignedMembers.slice(0, 3).map((member, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-700">{member.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Nenhum responsável</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Labels</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.labels.length > 0 ? (
                        task.labels.map((label, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                            {label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Nenhum label</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Vencimento</label>
                    <p className="text-sm mt-1 font-medium text-gray-700">
                      {task.dueDate ? formatDate(task.dueDate) : 'Sem data de vencimento'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Story Points</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {task.storyPoints} pts
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <Textarea 
                      value={task.description || ''} 
                      className="mt-1 h-32 resize-none border-gray-200 bg-gray-50/50"
                      placeholder="Adicionar descrição..."
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Anexos</label>
                    <Button variant="outline" size="sm" className="mt-1 border-blue-200 text-blue-600 hover:bg-blue-50">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Enviar arquivos
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="flex-1 px-6 py-4 overflow-y-auto min-h-0">
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{completedSubtasks} of {totalSubtasks}</span>
                  <span className="text-gray-500">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Subtasks List */}
              <div className="space-y-3">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className={cn(
                      "text-sm flex-1",
                      subtask.completed ? "line-through text-gray-500" : "text-gray-900"
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask */}
              <div className="flex items-center space-x-3">
                <Input
                  placeholder="Add subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
                <Button onClick={handleAddSubtask} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="flex-1 px-6 py-4 overflow-y-auto min-h-0">
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              
              {/* Comments List */}
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                      <AvatarFallback className="text-xs">
                        {comment.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border-t pt-4">
                <div className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="You" />
                    <AvatarFallback className="text-xs">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Type a message..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button onClick={handleAddComment} size="sm">
                        <Send className="w-4 h-4 mr-2" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
