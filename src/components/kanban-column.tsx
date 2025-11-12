'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { type KanbanColumn, type KanbanTask } from '@/types';
import { useUserKanbanBoardStore } from '@/hooks/useUserStores';
import { KanbanCard } from './kanban-card';
import { TaskEditModal } from './task-edit-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical, Trash2, Edit2, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
  column: KanbanColumn;
  tasks: KanbanTask[];
  isOver?: boolean;
}

export function KanbanColumn({ column, tasks, isOver }: KanbanColumnProps) {
  const kanbanStore = useUserKanbanBoardStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(column.name);
  
  const { setNodeRef } = useDroppable({
    id: column.id,
  });
  
  if (!kanbanStore) {
    return null;
  }
  
  const { deleteColumn, updateColumn, clearColumn } = kanbanStore;

  const handleAddTask = () => {
    setIsTaskModalOpen(true);
  };

  const handleDeleteColumn = () => {
    if (confirm(`Tem certeza que deseja deletar a coluna "${column.name}"?`)) {
      deleteColumn(column.id);
    }
  };

  const handleClearColumn = () => {
    if (confirm(`Tem certeza que deseja limpar todas as tarefas da coluna "${column.name}"?`)) {
      clearColumn(column.id);
    }
  };

  const handleEditName = () => {
    setIsEditing(true);
    setNewName(column.name);
  };

  const handleSaveName = () => {
    if (newName.trim() && newName !== column.name) {
      updateColumn(column.id, { name: newName.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setNewName(column.name);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="flex-shrink-0 w-64">
      <div
        ref={setNodeRef}
        className={cn(
          "bg-white/80 backdrop-blur-sm rounded-xl p-4 min-h-[200px] border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300",
          isOver && "bg-blue-50/80 border-blue-300/50 shadow-lg"
        )}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 flex-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            {isEditing ? (
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyPress}
                className="h-6 text-sm font-semibold border-none p-0 focus-visible:ring-0"
                autoFocus
              />
            ) : (
              <h3 
                className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                onClick={handleEditName}
                title="Clique para editar o nome"
              >
                {column.name}
              </h3>
            )}
            <span className="text-sm font-medium text-white px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: column.color }}>
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddTask}
              className="h-8 w-8 p-0 hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditName}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Renomear Coluna
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearColumn} className="text-orange-600">
                  <Eraser className="w-4 h-4 mr-2" />
                  Limpar Tarefas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteColumn} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Coluna
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tasks Container with Scroll */}
        <div className="relative">
          {/* Scrollable Tasks Area */}
          <div 
            className="space-y-3 max-h-[calc(4*120px)] overflow-y-auto pr-2 kanban-scroll"
          >
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>

      {/* Task Edit Modal */}
      <TaskEditModal
        columnId={column.id}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}