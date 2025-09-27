'use client';

import { useState, useEffect } from 'react';
import { X, ThumbsUp, Trash2, MoreVertical, Plus, Paperclip, Send } from 'lucide-react';
import { KanbanTask, Comment, Subtask } from '@/types';
import { useKanbanBoardStore } from '@/store/kanban-board-store';
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
  const { updateTask } = useKanbanBoardStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Done
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="w-4 h-4 text-green-500" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4 text-gray-500" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger value="comments">Comments ({task.comments.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              
              {/* Task Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reporter</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="Reporter" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">John Doe</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Assignee</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {task.assignedMembers.slice(0, 5).map((member, index) => (
                        <Avatar key={index} className="w-8 h-8">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignedMembers.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full">
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Labels</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.labels.map((label, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due date</label>
                    <p className="text-sm mt-1">{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <div className="flex space-x-2 mt-1">
                      <Button 
                        variant={task.priority === 'low' ? 'default' : 'outline'} 
                        size="sm"
                        className="text-xs"
                      >
                        Low
                      </Button>
                      <Button 
                        variant={task.priority === 'medium' ? 'default' : 'outline'} 
                        size="sm"
                        className="text-xs"
                      >
                        Medium
                      </Button>
                      <Button 
                        variant={task.priority === 'high' ? 'default' : 'outline'} 
                        size="sm"
                        className="text-xs"
                      >
                        High
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <Textarea 
                      value={task.description || ''} 
                      className="mt-1 min-h-[100px]"
                      placeholder="Add a description..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Attachments</label>
                    <Button variant="outline" size="sm" className="mt-1">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Upload files
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="flex-1 p-6 overflow-y-auto">
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
          <TabsContent value="comments" className="flex-1 p-6 overflow-y-auto">
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
