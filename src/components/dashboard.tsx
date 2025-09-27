'use client';

import { useDashboardStore } from '@/store/dashboard-store';
import { Sidebar } from '@/components/sidebar';
import { BurndownChart } from '@/components/burndown-chart';
import { KanbanBoard } from '@/components/kanban-board';
import { Analytics } from '@/components/analytics';
import { Settings } from '@/components/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  CheckCircle, 
  Clock, 
  Users,
  ArrowRight
} from 'lucide-react';
import { useKanbanStore } from '@/store/kanban-store';
import { cn } from '@/lib/utils';

function HomePage() {
  const { cards, tasks } = useKanbanStore();
  
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const completedCards = cards.filter(card => card.status === 'done').length;
  const totalCards = cards.length;
  const cardCompletionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  const stats = [
    {
      title: 'Tarefas Completadas',
      value: `${completedTasks}/${totalTasks}`,
      percentage: completionRate,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Cards Completados',
      value: `${completedCards}/${totalCards}`,
      percentage: cardCompletionRate,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Sprint Atual',
      value: 'Sprint 1',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Duração',
      value: '14 dias',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral do seu projeto Agile
          </p>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    {stat.percentage !== undefined && (
                      <Badge variant="secondary" className="mt-2">
                        {stat.percentage}% completo
                      </Badge>
                    )}
                  </div>
                  <div className={cn("p-3 rounded-full", stat.bgColor)}>
                    <Icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="w-5 h-5 mr-2" />
              Burndown Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Acompanhe o progresso do seu sprint com o gráfico de burndown.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => useDashboardStore.getState().setCurrentPage('burndown')}
            >
              Ver Burndown
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Kanban Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie suas tarefas com o board Kanban interativo.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => useDashboardStore.getState().setCurrentPage('kanban')}
            >
              Abrir Board
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { currentPage, sidebarOpen } = useDashboardStore();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'burndown':
        return <BurndownChart />;
      case 'kanban':
        return <KanbanBoard />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-24"
      )}>
        <main className={cn(
          "p-6",
          currentPage === 'kanban' ? "p-0" : ""
        )}>
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}
