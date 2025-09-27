'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useKanbanStore } from '@/store/kanban-store';
import { TaskDialog } from './task-dialog';
import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, CheckCircle, Circle } from 'lucide-react';
import { Task } from '@/types';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { deleteTask, toggleTaskCompletion } = useKanbanStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const priorityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta task?')) {
      deleteTask(task.id);
    }
  };

  return (
    <>
      <div className={`p-2 rounded-md border-l-2 border-l-blue-500 bg-muted/50 ${
        task.completed ? 'opacity-60' : ''
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 mt-0.5"
              onClick={() => toggleTaskCompletion(task.id)}
            >
              {task.completed ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <Circle className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
            
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${
                task.completed ? 'line-through text-muted-foreground' : ''
              }`}>
                {task.title}
              </p>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {task.storyPoints} SP
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${priorityColors[task.priority]}`}
                >
                  {priorityLabels[task.priority]}
                </Badge>
                
                {task.assignee && (
                  <span className="text-xs text-muted-foreground">
                    👤 {task.assignee}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <TaskDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
