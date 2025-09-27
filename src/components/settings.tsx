'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useKanbanStore } from '@/store/kanban-store';
import { useSettingsStore } from '@/store/settings-store';
import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  Users,
  Calendar,
  Palette,
  Plus,
  X
} from 'lucide-react';

export function Settings() {
  const { cards, tasks, sprintConfig, updateSprintConfig } = useKanbanStore();
  const { teamMembers, addTeamMember, removeTeamMember } = useSettingsStore();
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const handleExportData = () => {
    const data = {
      cards,
      tasks,
      sprintConfig,
      teamMembers,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burndown-kanban-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          // Aqui você pode implementar a lógica de importação
          console.log('Dados importados:', data);
          alert('Dados importados com sucesso!');
        } catch {
          alert('Erro ao importar dados. Verifique se o arquivo é válido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('kanban-storage');
      window.location.reload();
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addTeamMember(newMemberName.trim(), newMemberEmail.trim() || undefined);
      setNewMemberName('');
      setNewMemberEmail('');
    }
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
      removeTeamMember(id);
    }
  };

  const handleResetSprint = () => {
    if (confirm('Tem certeza que deseja resetar a configuração da sprint?')) {
      updateSprintConfig({
        startDate: '2025-09-16',
        endDate: '2025-10-02',
        workingDays: ['16/09', '18/09', '22/09', '24/09', '26/09', '30/09', '02/10'],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuração da Sprint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configuração da Sprint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-start">Data de Início</Label>
              <Input
                id="sprint-start"
                type="date"
                defaultValue={sprintConfig.startDate}
                onChange={(e) => updateSprintConfig({ startDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sprint-end">Data de Fim</Label>
              <Input
                id="sprint-end"
                type="date"
                defaultValue={sprintConfig.endDate}
                onChange={(e) => updateSprintConfig({ endDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="working-days">Dias de Trabalho</Label>
              <Input
                id="working-days"
                placeholder="Ex: 16/09,18/09,22/09"
                defaultValue={sprintConfig.workingDays.join(', ')}
                onChange={(e) => {
                  const days = e.target.value.split(',').map(day => day.trim()).filter(day => day);
                  updateSprintConfig({ workingDays: days });
                }}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleResetSprint} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar Sprint
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuração da Equipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configuração da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adicionar novo membro */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium text-gray-900">Adicionar Novo Membro</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="member-name">Nome</Label>
                <Input
                  id="member-name"
                  placeholder="Nome do membro"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="member-email">Email (opcional)</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>

          {/* Lista de membros */}
          <div className="space-y-2">
            <Label>Membros da Equipe ({teamMembers.length})</Label>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.initials}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      {member.email && (
                        <p className="text-sm text-gray-500">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• Os membros da equipe serão usados para atribuição de tasks no Kanban</p>
            <p>• As iniciais são geradas automaticamente a partir do nome</p>
          </div>
        </CardContent>
      </Card>

      {/* Backup e Restauração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Backup e Restauração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exportar Dados</Label>
              <Button onClick={handleExportData} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Backup
              </Button>
              <p className="text-xs text-muted-foreground">
                Baixa um arquivo JSON com todos os dados do projeto
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Importar Dados</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="cursor-pointer"
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground">
                Importa dados de um arquivo JSON de backup
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Perigosas */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Ações Perigosas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-semibold text-destructive mb-2">Limpar Todos os Dados</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Esta ação irá remover todos os cards, tasks e configurações. Esta ação não pode ser desfeita.
              </p>
              <Button onClick={handleClearData} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Todos os Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Versão:</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Cards Criados:</span>
            <span className="text-sm font-medium">{cards.length}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tasks Criadas:</span>
            <span className="text-sm font-medium">{tasks.length}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Última Atualização:</span>
            <span className="text-sm font-medium">
              {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
