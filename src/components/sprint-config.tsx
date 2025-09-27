'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useKanbanStore } from '@/store/kanban-store';
import { Calendar, RefreshCw } from 'lucide-react';

export function SprintConfig() {
  const { sprintConfig, updateSprintConfig } = useKanbanStore();

  const handleUpdate = () => {
    const startDate = (document.getElementById('sprint-start') as HTMLInputElement)?.value;
    const endDate = (document.getElementById('sprint-end') as HTMLInputElement)?.value;
    const workingDays = (document.getElementById('working-days') as HTMLInputElement)?.value
      .split(',')
      .map(day => day.trim())
      .filter(day => day);

    if (startDate && endDate && workingDays.length > 0) {
      updateSprintConfig({
        startDate,
        endDate,
        workingDays,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Configuração da Sprint
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sprint-start">Data de Início</Label>
            <Input
              id="sprint-start"
              type="date"
              defaultValue={sprintConfig.startDate}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sprint-end">Data de Fim</Label>
            <Input
              id="sprint-end"
              type="date"
              defaultValue={sprintConfig.endDate}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="working-days">Dias de Trabalho</Label>
            <Input
              id="working-days"
              placeholder="Ex: 16/09,18/09,22/09"
              defaultValue={sprintConfig.workingDays.join(', ')}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <Button onClick={handleUpdate} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar Sprint
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
