'use client';

import { Settings } from '@/components/settings';
import { UserDataManager } from '@/components/user-data-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const { setCurrentPage } = useDashboardStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Configure seu projeto, sprints e sistema
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

      {/* Tabs */}
      <Tabs defaultValue="project" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="project">Projeto</TabsTrigger>
          <TabsTrigger value="data">Dados do Usuário</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-6">
          <Settings />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <UserDataManager />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Versão:</strong> 1.0.0</p>
                <p><strong>Ambiente:</strong> Desenvolvimento</p>
                <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
