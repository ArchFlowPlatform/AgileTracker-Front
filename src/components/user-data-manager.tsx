'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserDataManager } from '@/utils/user-persistence';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Upload, Trash2, Database, Shield } from 'lucide-react';

/**
 * Componente para gerenciar dados do usuário
 * Permite backup, restauração e limpeza de dados
 */
export function UserDataManager() {
  const { user, isAuthenticated } = useAuth();
  const dataManager = useUserDataManager();
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [backupData, setBackupData] = useState<string>('');

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleBackup = () => {
    const backup = dataManager.backupUserData(user.id);
    const backupString = JSON.stringify(backup, null, 2);
    setBackupData(backupString);
    setIsBackupDialogOpen(true);
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agiletracker-backup-user-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    try {
      const parsedData = JSON.parse(backupData);
      const success = dataManager.restoreUserData(user.id, parsedData);
      if (success) {
        alert('✅ Dados restaurados com sucesso! Recarregue a página para ver as mudanças.');
        setIsRestoreDialogOpen(false);
        setBackupData('');
      } else {
        alert('❌ Erro ao restaurar dados. Verifique o formato do arquivo.');
      }
    } catch {
      alert('❌ Arquivo de backup inválido. Verifique o formato.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackupData(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os seus dados permanentemente!\n\nTem certeza que deseja continuar?')) {
      const success = dataManager.clearUserData(user.id);
      if (success) {
        alert('✅ Dados removidos com sucesso! Recarregue a página.');
      } else {
        alert('❌ Erro ao remover dados.');
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gerenciamento de Dados do Usuário
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gerencie seus dados pessoais: backup, restauração e limpeza
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações do usuário */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Usuário: {user.name} ({user.email})
          </span>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Backup */}
          <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleBackup} variant="outline" className="h-auto p-4 flex flex-col gap-2">
                <Download className="h-5 w-5" />
                <span className="text-sm">Fazer Backup</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Backup dos Dados</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Seus dados foram preparados para download. Clique em "Download" para salvar o arquivo.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadBackup} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Backup
                  </Button>
                  <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)}>
                    Fechar
                  </Button>
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Ver dados do backup (JSON)
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {backupData}
                  </pre>
                </details>
              </div>
            </DialogContent>
          </Dialog>

          {/* Restaurar */}
          <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                <Upload className="h-5 w-5" />
                <span className="text-sm">Restaurar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Restaurar Dados</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um arquivo de backup para restaurar seus dados.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRestore} 
                    disabled={!backupData}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Restaurar Dados
                  </Button>
                  <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Limpar */}
          <Button 
            onClick={handleClearData} 
            variant="destructive" 
            className="h-auto p-4 flex flex-col gap-2"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm">Limpar Dados</span>
          </Button>
        </div>

        {/* Aviso importante */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Importante:</strong> Seus dados são salvos automaticamente no navegador. 
            Use o backup para não perder suas configurações ao trocar de dispositivo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
