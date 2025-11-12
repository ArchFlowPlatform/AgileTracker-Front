'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useUserKanbanBoardStore } from '@/hooks/useUserKanbanBoardStore';
import { KanbanColumn } from '@/components/kanban-column';
import { KanbanCard } from '@/components/kanban-card';
import { TaskDialog } from '@/components/task-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Settings, Users, Plus } from 'lucide-react';
import { useState } from 'react';
import { KanbanTask } from '@/types';

export default function KanbanBoardPage() {
  const kanbanStore = useUserKanbanBoardStore();
  
  if (!kanbanStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando board...</p>
        </div>
      </div>
    );
  }

  const {
    board,
    columns,
    tasks,
    members,
    loadBoard,
    getTasksByColumn,
    moveTask,
    openImportDialog,
    isTaskDialogOpen,
    closeTaskDialog,
  } = kanbanStore;

  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const newColumnName = over.id as string;
      
      // Verificar se é uma coluna válida
      const validColumns = columns.map(col => col.name);
      if (validColumns.includes(newColumnName)) {
        moveTask(taskId, newColumnName);
      }
    }
    
    setActiveTask(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        loadBoard(jsonData);
      } catch (error) {
        console.error('Erro ao carregar JSON:', error);
        alert('Erro ao carregar o arquivo JSON. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {board?.name || 'Kanban Board'}
            </h1>
            {board?.description && (
              <p className="text-gray-600">{board.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{members.length} membros</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={openImportDialog}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar JSON
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 p-6 min-h-[calc(100vh-80px)]">
            <SortableContext
              items={columns.map(col => col.name)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksByColumn(column.name)}
                />
              ))}
            </SortableContext>
            
            {/* Botão para adicionar nova coluna */}
            <div className="min-w-[300px]">
              <Card className="h-fit border-dashed border-2 border-gray-300">
                <CardContent className="p-6">
                  <Button
                    variant="ghost"
                    className="w-full h-20 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-6 w-6 mr-2" />
                    Adicionar coluna
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DragOverlay>
            {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
        id="json-upload"
      />
      
      {/* Task Dialog */}
      <TaskDialog 
        open={isTaskDialogOpen} 
        onOpenChange={(open) => !open && closeTaskDialog()} 
      />
    </div>
  );
}
