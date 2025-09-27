'use client';

import { BurndownChart } from '@/components/burndown-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard-store';

export default function BurndownPage() {
  const { setCurrentPage } = useDashboardStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Burndown Chart</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe o progresso do seu sprint
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setCurrentPage('home')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Burndown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso do Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <BurndownChart />
        </CardContent>
      </Card>
    </div>
  );
}
