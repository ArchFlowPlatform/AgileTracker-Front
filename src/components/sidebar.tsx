'use client';

import { useDashboardStore } from '@/store/dashboard-store';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  TrendingDown, 
  Kanban, 
  BarChart3, 
  Settings
} from 'lucide-react';
import { AgileTrackerLogo } from '@/components/agile-tracker-logo';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    id: 'home' as const,
    label: 'Dashboard',
    icon: Home,
    description: 'Visão geral do projeto'
  },
  {
    id: 'burndown' as const,
    label: 'Burndown',
    icon: TrendingDown,
    description: 'Gráfico de burndown'
  },
  {
    id: 'kanban' as const,
    label: 'Kanban',
    icon: Kanban,
    description: 'Board de tarefas'
  },
  {
    id: 'analytics' as const,
    label: 'Analytics',
    icon: BarChart3,
    description: 'Métricas e estatísticas'
  },
  {
    id: 'settings' as const,
    label: 'Configurações',
    icon: Settings,
    description: 'Configurações do projeto'
  }
];

export function Sidebar() {
  const { currentPage, sidebarOpen, setCurrentPage, toggleSidebar } = useDashboardStore();

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50",
      sidebarOpen ? "w-64" : "w-24"
    )}>
      {/* Header */}
      <div className="flex items-center justify-center p-4">
        <AgileTrackerLogo 
          size={sidebarOpen ? "md" : "sm"} 
          showText={sidebarOpen}
          onClick={toggleSidebar}
        />
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <div key={item.id} className="flex flex-col items-center">
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3",
                  sidebarOpen ? "text-left" : "justify-center flex-col h-auto py-2"
                )}
                onClick={() => setCurrentPage(item.id)}
              >
                <Icon className={cn("w-5 h-5", sidebarOpen ? "mr-3" : "")} />
                {sidebarOpen && (
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.label}</span>
                    <span className={cn(
                      "text-xs",
                      isActive ? "text-white" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </span>
                  </div>
                )}
              </Button>
              {!sidebarOpen && (
                <span className="text-xs text-muted-foreground mt-1 text-center leading-tight px-1">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
