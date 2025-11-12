'use client';

import { useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn as KanbanColumnComponent } from '@/components/kanban-column';
import { KanbanCard } from '@/components/kanban-card';
import { TaskDetailModal } from '@/components/task-detail-modal';
import { useUserKanbanBoardStore } from '@/hooks/useUserKanbanBoardStore';
import { KanbanTask, KanbanColumn } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function KanbanBoard() {
  const kanbanStore = useUserKanbanBoardStore();
  
  // Mover todos os hooks para o topo (antes de qualquer return condicional)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // useEffect também deve estar no topo
  useEffect(() => {
    // Só executar se o store estiver disponível
    if (!kanbanStore) return;
    
    const { columns, loadBoard } = kanbanStore;
    // Inicializar com dados vazios se não houver dados persistidos
    if (columns.length === 0) {
      const emptyData = {
        board: {
          id: 'empty-board',
          name: 'Meu Board',
          description: 'Crie suas colunas e tasks',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
        columns: [
          { id: 'todo', name: 'TO DO', color: '#ef4444', taskLimit: undefined, isCollapsed: false },
          { id: 'doing', name: 'DOING', color: '#f59e0b', taskLimit: undefined, isCollapsed: false },
          { id: 'done', name: 'DONE', color: '#10b981', taskLimit: undefined, isCollapsed: false },
        ],
        tasks: [],
        members: [], 
        labels: [], 
      };
      
      loadBoard(emptyData);
    }
  }, [kanbanStore]);

  // Verificar se o store está disponível (depois de todos os hooks)
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
    columns,
    tasks,
    selectedTask,
    moveTask,
    selectTask,
    getTasksByColumn,
    addColumn,
  } = kanbanStore;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t: KanbanTask) => t.id === active.id);
    if (task) {
      selectTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id as string;
    const columnId = over.id as string;
    
    moveTask(taskId, columnId);
    selectTask(null);
  };

  const handleAddColumn = () => {
    // Gerar nome único para a nova coluna
    let columnName = 'Nova Coluna';
    let counter = 1;
    
    // Verificar se já existe uma coluna com esse nome
    while (columns.some((col: KanbanColumn) => col.name === columnName)) {
      columnName = `Nova Coluna ${counter}`;
      counter++;
    }
    
    const newColumn = {
      name: columnName,
      color: '#8b5cf6',
      taskLimit: undefined,
      isCollapsed: false,
    };
    
    addColumn(newColumn);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Board Title com glassmorphism */}
          <div className="px-8 py-6 glass-card border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Kanban Board
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie suas tarefas com drag-and-drop intuitivo
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 glass-card rounded-xl border-sidebar-border">
                  <span className="text-sm font-medium text-muted-foreground">
                    {tasks.length} tarefas
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Board Content */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gradient-to-br from-indigo-50/50 via-white to-cyan-50/50">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex h-full p-8 space-x-8 min-w-max">
                {columns.map((column: KanbanColumn, index: number) => (
                  <div 
                    key={column.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <KanbanColumnComponent
                      column={column}
                      tasks={getTasksByColumn(column.name)}
                    />
                  </div>
                ))}
                
                {/* Add Column Button com glassmorphism */}
                <div className="flex-shrink-0 w-72 animate-slide-up" style={{ animationDelay: `${columns.length * 150}ms` }}>
                  <Button
                    variant="outline"
                    className="w-full h-16 border-dashed border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 glass-card transition-all duration-300 hover-lift group"
                    onClick={handleAddColumn}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-primary group-hover:text-primary-hover">
                        Adicionar Coluna
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
              
              <DragOverlay>
                {selectedTask ? (
                  <div className="transform rotate-3 scale-105">
                    <KanbanCard task={selectedTask} isOverlay />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => selectTask(null)}
        />
      )}
    </div>
  );
}