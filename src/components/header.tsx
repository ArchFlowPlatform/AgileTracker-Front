import { AgileTrackerLogo } from './agile-tracker-logo';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="glass-card border-b border-sidebar-border bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            {/* Logo do Agile Tracker com microinteração */}
            <div className="relative group">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-200 group-hover:border-primary/30 transition-all duration-300 hover-scale">
                <AgileTrackerLogo size="md" />
              </div>
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <p className="text-xs text-muted-foreground font-medium tracking-wide mt-2 animate-fade-in">
              Proof of Concept
            </p>
          </div>

          {/* User Menu com glassmorphism */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover-lift focus-ring glass-card border-sidebar-border hover:border-primary/30"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="glass-card border-sidebar-border animate-slide-up"
              >
                <DropdownMenuItem 
                  onClick={logout} 
                  className="text-destructive hover:bg-destructive/10 focus-ring"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
