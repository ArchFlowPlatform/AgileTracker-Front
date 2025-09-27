'use client';

import { useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from '@/components/kanban-column';
import { KanbanCard } from '@/components/kanban-card';
import { TaskDetailModal } from '@/components/task-detail-modal';
import { useKanbanBoardStore } from '@/store/kanban-board-store';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KanbanBoard() {
  const {
    columns,
    tasks,
    selectedTask,
    loadBoard,
    moveTask,
    selectTask,
    getTasksByColumn,
    addColumn,
  } = useKanbanBoardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    // Limpar dados persistidos e carregar dados limpos
    const clearAndLoad = () => {
      // Limpar localStorage do kanban
      localStorage.removeItem('kanban-board-storage');
      
      const sampleData = {
        board: {
          id: 'sample-board',
          name: 'Sample Board',
          description: 'A sample kanban board',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
        columns: [
          { id: 'todo', name: 'TO DO', color: '#6b7280', taskLimit: undefined, isCollapsed: false },
          { id: 'doing', name: 'DOING', color: '#6b7280', taskLimit: undefined, isCollapsed: false },
          { id: 'done', name: 'DONE', color: '#6b7280', taskLimit: undefined, isCollapsed: false },
        ],
        tasks: [],
        members: [], 
        labels: [], 
      };
      
      loadBoard(sampleData);
    };

    // Sempre limpar e carregar dados limpos
    clearAndLoad();
  }, [loadBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
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
    const newColumn = {
      name: 'Nova Coluna',
      color: '#6b7280',
      taskLimit: undefined,
      isCollapsed: false,
    };
    
    addColumn(newColumn);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Board Title */}
          <div className="px-6 py-4 bg-white">
            <h1 className="text-2xl font-bold text-gray-900">Kanban</h1>
          </div>
          
          {/* Board Content */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex h-full p-6 space-x-6 min-w-max bg-white">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    tasks={getTasksByColumn(column.name)}
                  />
                ))}
                
                {/* Add Column Button */}
                <div className="flex-shrink-0 w-64">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    onClick={handleAddColumn}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add column
                  </Button>
                </div>
              </div>
              
              <DragOverlay>
                {selectedTask ? (
                  <KanbanCard task={selectedTask} isOverlay />
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