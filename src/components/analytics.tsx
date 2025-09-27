'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKanbanStore } from '@/store/kanban-store';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export function Analytics() {
  const { cards, tasks, sprintConfig } = useKanbanStore();

  // Calcular métricas
  const totalCards = cards.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalPoints = tasks.reduce((sum, task) => sum + task.storyPoints, 0);
  const completedPoints = tasks.filter(task => task.completed).reduce((sum, task) => sum + task.storyPoints, 0);
  
  const cardsByStatus = {
    todo: cards.filter(card => card.status === 'todo').length,
    inprogress: cards.filter(card => card.status === 'inprogress').length,
    done: cards.filter(card => card.status === 'done').length,
  };

  const tasksByPriority = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length,
  };

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pointsCompletionRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Cards</p>
                <p className="text-2xl font-bold text-[#2C5B8E]">{totalCards}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-[#2C5B8E]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Tasks</p>
                <p className="text-2xl font-bold text-[#34A853]">{totalTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-[#34A853]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Story Points</p>
                <p className="text-2xl font-bold text-[#4A4A4A]">{totalPoints}</p>
              </div>
              <Target className="h-8 w-8 text-[#4A4A4A]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-[#2C5B8E]">{completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#2C5B8E]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Cards */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <BarChart3 className="h-5 w-5 text-[#2C5B8E]" />
            Status dos Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
              <div className="text-2xl font-bold text-[#2C5B8E]">{cardsByStatus.todo}</div>
              <div className="text-sm text-gray-500">📋 To Do</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
              <div className="text-2xl font-bold text-[#4A4A4A]">{cardsByStatus.inprogress}</div>
              <div className="text-sm text-gray-500">🔄 In Progress</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
              <div className="text-2xl font-bold text-[#34A853]">{cardsByStatus.done}</div>
              <div className="text-sm text-gray-500">✅ Done</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioridades das Tasks */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <AlertCircle className="h-5 w-5 text-[#2C5B8E]" />
            Prioridades das Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
              <div className="text-2xl font-bold text-red-500">{tasksByPriority.high}</div>
              <div className="text-sm text-gray-500">🔴 Alta Prioridade</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
              <div className="text-2xl font-bold text-[#4A4A4A]">{tasksByPriority.medium}</div>
              <div className="text-sm text-gray-500">🟡 Média Prioridade</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
              <div className="text-2xl font-bold text-[#34A853]">{tasksByPriority.low}</div>
              <div className="text-sm text-gray-500">🟢 Baixa Prioridade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso Detalhado */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="h-5 w-5 text-[#34A853]" />
            Progresso Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tasks Completadas</span>
              <span>{completedTasks}/{totalTasks} ({completionRate}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-[#2C5B8E] h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Story Points Completados</span>
              <span>{completedPoints}/{totalPoints} ({pointsCompletionRate}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-[#34A853] h-3 rounded-full transition-all duration-500"
                style={{ width: `${pointsCompletionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Sprint */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="h-5 w-5 text-[#2C5B8E]" />
            Informações da Sprint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">📅 Data de Início:</span>
            <Badge variant="outline" className="border-[#2C5B8E] text-[#2C5B8E] bg-[#2C5B8E]/10">
              {new Date(sprintConfig.startDate).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">📅 Data de Fim:</span>
            <Badge variant="outline" className="border-[#2C5B8E] text-[#2C5B8E] bg-[#2C5B8E]/10">
              {new Date(sprintConfig.endDate).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">📊 Dias de Trabalho:</span>
            <Badge variant="outline" className="border-[#34A853] text-[#34A853] bg-[#34A853]/10">{sprintConfig.workingDays.length}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">👥 Membros da Equipe:</span>
            <Badge variant="outline" className="border-[#4A4A4A] text-[#4A4A4A] bg-[#4A4A4A]/10">6</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
