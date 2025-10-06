'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard-store';
import { Sidebar } from '@/components/sidebar';
import { BurndownChart } from '@/components/burndown-chart';
import { KanbanBoard } from '@/components/kanban-board';
import { Settings } from '@/components/settings';
import { ScrumManagement } from '@/components/scrum-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingDown,
  CheckCircle, 
  Users,
  ArrowRight,
  BarChart3,
  Target
} from 'lucide-react';
import { useUserKanbanBoardStore } from '@/hooks/useUserKanbanBoardStore';
import { useUserScrumStore } from '@/hooks/useUserStores';
import { useUserSettingsStore } from '@/hooks/useUserStores';
import { cn } from '@/lib/utils';

function HomePage() {
  const kanbanStore = useUserKanbanBoardStore();
  const { tasks: boardTasks } = kanbanStore || { tasks: [] };
  const scrumStore = useUserScrumStore();
  const { userStories } = scrumStore || { userStories: [] };
  const settingsStore = useUserSettingsStore();
  const { teamMembers } = settingsStore || { teamMembers: [] };
  
  // Calcular métricas baseadas nos dados do board
  const completedTasks = boardTasks.filter(task => task.isCompleted).length;
  const totalTasks = boardTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calcular story points das User Stories
  const totalUserStoryPoints = userStories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
  
  // Calcular story points das tasks do Kanban
  const totalTaskStoryPoints = boardTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
  
  // Total geral de story points (User Stories + Tasks)
  const totalStoryPoints = totalUserStoryPoints + totalTaskStoryPoints;

  const stats = [
    {
      title: 'Total de Tasks',
      value: `${boardTasks.length}`,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Membros da Equipe',
      value: `${teamMembers.length}`,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Story Points',
      value: `${totalStoryPoints}`,
      icon: Target,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Taxa de Conclusão',
      value: `${completionRate}%`,
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header simples */}
      <div className="p-6">
        <h1 className="text-4xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Visão geral do seu projeto Agile
        </p>
      </div>

      {/* Stats Grid com glassmorphism */}
      <div className="adaptive-layout">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="card-modern hover-lift group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "p-3 md:p-4 rounded-2xl transition-all duration-300 group-hover:scale-110", 
                    stat.bgColor
                  )}>
                    <Icon className={cn("w-6 h-6 md:w-7 md:h-7", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions com glassmorphism */}
      <div className="responsive-flex">
        <Card className="card-modern hover-lift group animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 mr-3 group-hover:scale-110 transition-transform duration-300">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
              Burndown Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Acompanhe o progresso do seu sprint com o gráfico de burndown interativo e insights em tempo real.
            </p>
            <Button 
              variant="outline" 
              className="w-full hover-glow focus-ring gradient-primary text-white border-primary hover:border-primary-hover hover:bg-primary-hover transition-all duration-300"
              onClick={() => useDashboardStore.getState().setCurrentPage('burndown')}
            >
              Ver Burndown
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </CardContent>
        </Card>

        <Card className="card-modern hover-lift group animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-r from-success/10 to-success/5 mr-3 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-success" />
              </div>
              Kanban Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Gerencie suas tarefas com o board Kanban interativo, drag-and-drop e colaboração em tempo real.
            </p>
            <Button 
              variant="outline" 
              className="w-full hover-glow focus-ring gradient-primary text-white border-primary hover:border-primary-hover hover:bg-primary-hover transition-all duration-300"
              onClick={() => useDashboardStore.getState().setCurrentPage('kanban')}
            >
              Abrir Board
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { currentPage, sidebarOpen, setCurrentPage } = useDashboardStore();

  // Listener para navegação via eventos customizados
  useEffect(() => {
    const handleNavigateToSettings = () => {
      setCurrentPage('settings');
    };

    window.addEventListener('navigate-to-settings', handleNavigateToSettings);
    
    return () => {
      window.removeEventListener('navigate-to-settings', handleNavigateToSettings);
    };
  }, [setCurrentPage]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'burndown':
        return <BurndownChart />;
      case 'kanban':
        return <KanbanBoard />;
      case 'sprint-management':
        return <ScrumManagement />;
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

