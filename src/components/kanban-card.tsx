'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MessageCircle, Paperclip, Calendar, Clock, MoreVertical, Trash2, Edit } from 'lucide-react';
import { KanbanTask } from '@/types';
import { useKanbanBoardStore } from '@/store/kanban-board-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanCardProps {
  task: KanbanTask;
  isOverlay?: boolean;
}

export function KanbanCard({ task, isOverlay }: KanbanCardProps) {
  const { openTaskDialog, deleteTask } = useKanbanBoardStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };


  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM', { locale: ptBR });
    } catch {
      return null;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implementar edição
    console.log('Edit task:', task.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja deletar a tarefa "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative",
        isOverlay && "rotate-3 shadow-xl",
        isHovered && "shadow-md",
        isDragging && "opacity-50"
      )}
      onClick={() => openTaskDialog(task)}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      {/* Actions Menu */}
      {showActions && !isOverlay && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/80 hover:bg-white shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Cover Image */}
      {task.coverImage && (
        <div className="relative h-32 w-full rounded-t-lg overflow-hidden">
          <Image
            src={task.coverImage}
            alt={task.title}
            width={256}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.labels.slice(0, 3).map((label, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700"
              >
                {label}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                +{task.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
          {task.title}
        </h3>

        {/* Task Code */}
        {task.taskCode && (
          <div className="text-xs text-gray-500 font-mono mb-2">
            {task.taskCode}
          </div>
        )}

        {/* Story Points */}
        {task.storyPoints > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Badge variant="outline" className="text-xs">
              {task.storyPoints} SP
            </Badge>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            {/* Comments */}
            {task.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>{task.comments.length}</span>
              </div>
            )}

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="w-3 h-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className={cn(
              "flex items-center space-x-1",
              isOverdue ? "text-red-500" : "text-gray-500"
            )}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            {task.assignedMembers.slice(0, 3).map((member, index) => (
              <Avatar key={index} className="w-6 h-6 border-2 border-white">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-xs">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignedMembers.length > 3 && (
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-xs text-gray-600">
                  +{task.assignedMembers.length - 3}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Subtasks Progress */}
        {task.subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Subtasks</span>
              <span>
                {task.subtasks.filter(st => st.completed).length} of {task.subtasks.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gray-500 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Last Activity */}
        {task.lastActivity && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>Atualizado {formatDate(task.lastActivity)}</span>
          </div>
        )}
      </div>
    </div>
  );
}