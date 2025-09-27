'use client';

import { Settings } from '@/components/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard-store';

export default function SettingsPage() {
  const { setCurrentPage } = useDashboardStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Configure seu projeto e sprint
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

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <Settings />
        </CardContent>
      </Card>
    </div>
  );
}
