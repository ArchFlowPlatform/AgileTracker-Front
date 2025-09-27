'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from './kanban-board';
import { BurndownChart } from './burndown-chart';
import { Analytics } from './analytics';
import { SettingsPanel } from './settings';
import { Kanban, TrendingDown, Settings, BarChart3, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function MainNavigation() {
  return (
    <Tabs defaultValue="kanban" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-100 border-gray-200 rounded-xl p-1">
        <TabsTrigger 
          value="kanban" 
          className="flex items-center gap-2 data-[state=active]:bg-[#2C5B8E] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#2C5B8E]/25 rounded-lg transition-all duration-200 hover:bg-gray-200"
        >
          <Kanban className="h-4 w-4" />
          Kanban Board
        </TabsTrigger>
        <TabsTrigger 
          value="burndown" 
          className="flex items-center gap-2 data-[state=active]:bg-[#2C5B8E] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#2C5B8E]/25 rounded-lg transition-all duration-200 hover:bg-gray-200"
        >
          <TrendingDown className="h-4 w-4" />
          Burndown Chart
        </TabsTrigger>
        <TabsTrigger 
          value="analytics" 
          className="flex items-center gap-2 data-[state=active]:bg-[#2C5B8E] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#2C5B8E]/25 rounded-lg transition-all duration-200 hover:bg-gray-200"
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger 
          value="settings" 
          className="flex items-center gap-2 data-[state=active]:bg-[#2C5B8E] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#2C5B8E]/25 rounded-lg transition-all duration-200 hover:bg-gray-200"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="kanban" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Kanban Board</h2>
          <Link 
            href="/board" 
            className="flex items-center gap-2 px-4 py-2 bg-[#2C5B8E] text-white rounded-lg hover:bg-[#1e3f5f] transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir Board Completo
          </Link>
        </div>
        <KanbanBoard />
      </TabsContent>

      <TabsContent value="burndown" className="space-y-6">
        <BurndownChart />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <Analytics />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <SettingsPanel />
      </TabsContent>
    </Tabs>
  );
}
