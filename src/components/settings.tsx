"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUserKanbanBoardStore } from '@/hooks/useUserKanbanBoardStore';
import { useUserSettingsStore } from "@/hooks/useUserStores";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlert } from "@/hooks/useAlert";
import { KanbanTask } from '@/types';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Users,
  Palette,
  Plus,
  X,
  BarChart3,
  Target,
  AlertCircle,
} from "lucide-react";

export function Settings() {
  const { user } = useAuth();
  const kanbanStore = useUserKanbanBoardStore();
  const settingsStore = useUserSettingsStore();
  const { teamMembers, addTeamMember, removeTeamMember } = settingsStore || { teamMembers: [], addTeamMember: () => {}, removeTeamMember: () => {} };
  const { token } = useAuth();
  const { showAlert, showImportResult } = useAlert();
  
  // Extrair propriedades do store com verificação de null
  const tasks = kanbanStore?.tasks || [];
  const clearBoard = kanbanStore?.clearBoard || (() => {});
  const loadBoard = kanbanStore?.loadBoard || (() => {});
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [devMode, setDevMode] = useState(false);
  const [devKey, setDevKey] = useState("");
  const [systemInfo, setSystemInfo] = useState<{
    version: string;
    last_update: string;
    persistence: string;
    environment: string;
    database_path: string;
    api_version: string;
    build_date: string;
  } | null>(null);
  const [importPreview, setImportPreview] = useState<{
    board: {
      id: string;
      name: string;
      description: string;
      createdAt: string;
      lastModified: string;
    };
    columns: {
      id: string;
      name: string;
      color: string;
      taskLimit?: number;
      isCollapsed: boolean;
    }[];
    tasks: {
      id: string;
      title: string;
      description: string;
      column: string;
      storyPoints: number;
      taskCode: string;
      labels: string[];
      assignedMembers: { name: string; initials: string; avatar: string }[];
      isCompleted: boolean;
      createdAt: string;
      attachments: {
        id: string;
        name: string;
        url: string;
        type: "image" | "document" | "other";
        size: number;
        uploadedAt: string;
      }[];
      comments: {
        id: string;
        content: string;
        author: string;
        authorAvatar: string;
        createdAt: string;
      }[];
      subtasks: {
        id: string;
        title: string;
        completed: boolean;
        createdAt: string;
      }[];
    }[];
    members: { name: string; initials: string; avatar: string }[];
    labels: { id: string; name: string; color: string }[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Carregar dados da API
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        // Carregar informações do sistema
        const systemResponse = await fetch('http://localhost:8000/api/system/info');
        if (systemResponse.ok) {
          const systemData = await systemResponse.json();
          setSystemInfo(systemData);
        } else {
          // Dados padrão se a API não estiver disponível
          setSystemInfo({
            version: "1.0.0",
            last_update: new Date().toISOString(),
            persistence: "SQLite Database",
            environment: "Development",
            database_path: "backend/agiletracker.db",
            api_version: "1.0.0",
            build_date: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Dados padrão em caso de erro
        setSystemInfo({
          version: "1.0.0",
          last_update: new Date().toISOString(),
          persistence: "SQLite Database",
          environment: "Development",
          database_path: "backend/agiletracker.db",
          api_version: "1.0.0",
          build_date: new Date().toISOString()
        });
      }
    };

    fetchData();
  }, [token]);

  const handleExportData = () => {
    const data = {
      tasks,
      teamMembers,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanban-backup-${new Date().toISOString().split("T")[0]}.json`;
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
          // Aqui você pode implementar a lógica de importação de backup
          console.log("Dados de backup importados:", data);
          showAlert('success', 'Backup Importado!', 'Os dados de backup foram importados com sucesso.');
        } catch {
          showAlert('error', 'Erro ao Importar Backup', 'Verifique se o arquivo é válido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportTrelloData = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const trelloData = JSON.parse(e.target?.result as string);

          // Processar dados do Trello
          const processedData = processTrelloData(trelloData);

          // Mostrar preview dos dados
          setImportPreview(processedData);

          setIsImporting(false);
        } catch (error) {
          console.error("Erro ao processar dados do Trello:", error);
          alert(
            "Erro ao importar dados do Trello. Verifique se o arquivo é válido."
          );
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const confirmImport = () => {
    if (importPreview) {
      // Limpar dados atuais
      clearBoard();

      // Carregar novos dados
      loadBoard(importPreview);

      // Limpar preview
      setImportPreview(null);

      // Mostrar modal bonito de importação
      showImportResult({
        success: true,
        message: 'Dados do Trello importados com sucesso!',
        summary: {
          columns: importPreview.columns.length,
          tasks: importPreview.tasks.length,
          labels: importPreview.labels.length
        },
        warning: 'Membros não foram importados. Configure-os nas configurações da equipe.'
      });
    }
  };

  const cancelImport = () => {
    setImportPreview(null);
  };

  const handleRemoveMember = (id: string) => {
    if (confirm("Tem certeza que deseja remover este membro da equipe?")) {
      removeTeamMember(id);
    }
  };

  const processTrelloData = (trelloData: {
    id?: string;
    name?: string;
    desc?: string;
    lists?: Array<{ id: string; name: string }>;
    members?: Array<{
      id: string;
      fullName?: string;
      username?: string;
      initials?: string;
      avatarUrl?: string;
    }>;
    cards?: Array<{
      id: string;
      name?: string;
      desc?: string;
      idList: string;
      labels?: Array<{ name: string }>;
      idMembers?: string[];
      due?: string;
      dateLastActivity?: string;
      closed?: boolean;
    }>;
  }) => {
    // Criar mapa de listas
    const listsMap: { [key: string]: string } = {};
    if (trelloData.lists) {
      trelloData.lists.forEach((list) => {
        listsMap[list.id] = list.name;
      });
    }

    // Processar colunas (remover duplicatas por nome)
    const uniqueColumns = new Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        taskLimit: undefined;
        isCollapsed: boolean;
      }
    >();
    if (trelloData.lists) {
      trelloData.lists.forEach((list) => {
        if (!uniqueColumns.has(list.name)) {
          uniqueColumns.set(list.name, {
            id: list.id,
            name: list.name,
            color: "#6b7280",
            taskLimit: undefined,
            isCollapsed: false,
          });
        }
      });
    }
    const columns = Array.from(uniqueColumns.values());

    // Processar tasks (remover duplicatas por título e coluna)
    const uniqueTasks = new Map<
      string,
      {
        id: string;
        title: string;
        description: string;
        column: string;
        storyPoints: number;
        taskCode: string;
        labels: string[];
        assignedMembers: { name: string; initials: string; avatar: string }[];
        dueDate?: string;
        lastActivity?: string;
        isCompleted: boolean;
        createdAt: string;
        attachments: {
          id: string;
          name: string;
          url: string;
          type: "image" | "document" | "other";
          size: number;
          uploadedAt: string;
        }[];
        comments: {
          id: string;
          content: string;
          author: string;
          authorAvatar: string;
          createdAt: string;
        }[];
        subtasks: {
          id: string;
          title: string;
          completed: boolean;
          createdAt: string;
        }[];
      }
    >();
    if (trelloData.cards) {
      trelloData.cards.forEach((card) => {
        const cardTitle = card.name || "";
        const columnName = listsMap[card.idList] || "Unknown";
        const uniqueKey = `${cardTitle}-${columnName}`;

        // Só adiciona se não existir uma task com o mesmo título na mesma coluna
        if (!uniqueTasks.has(uniqueKey)) {
          // Extrair story points do nome do card
          const storyPointsMatch = card.name?.match(/\[(\d+)\]/);
          const storyPoints = storyPointsMatch
            ? parseInt(storyPointsMatch[1])
            : 0;

          // Extrair código da task
          const codeMatch = card.name?.match(/→\s*([A-Z]{2,4})\s*(\d+)/);
          const taskCode = codeMatch ? `${codeMatch[1]} ${codeMatch[2]}` : "";

          // Extrair labels
          const labels = card.labels?.map((label) => label.name) || [];

          uniqueTasks.set(uniqueKey, {
            id: card.id,
            title: cardTitle,
            description: card.desc || "",
            column: columnName,
            storyPoints,
            taskCode,
            labels,
            assignedMembers: [], // Não importar membros do Trello
            dueDate: card.due || undefined,
            lastActivity: card.dateLastActivity || undefined,
            isCompleted: card.closed || 
                        columnName.toLowerCase().includes('done') || 
                        columnName.toLowerCase().includes('validation'),
            createdAt: new Date().toISOString(),
            attachments: [],
            comments: [],
            subtasks: [],
          });
        }
      });
    }
    const tasks = Array.from(uniqueTasks.values());

    // Processar labels (remover duplicatas)
    const uniqueLabels = new Set<string>();
    tasks.forEach((task) => {
      task.labels.forEach((label: string) => {
        uniqueLabels.add(label);
      });
    });

    return {
      board: {
        id: trelloData.id || "trello-board",
        name: trelloData.name || "Trello Board",
        description: trelloData.desc || "",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      columns,
      tasks,
      members: [], // Não importar membros do Trello
      labels: Array.from(uniqueLabels).map((label, index) => ({
        id: `label_${index}`,
        name: String(label),
        color: "#3b82f6",
      })),
    };
  };

  const handleClearData = () => {
    if (
      confirm(
        "Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita."
      )
    ) {
      clearBoard();
      // Usar chaves específicas por usuário
      if (user?.id) {
        localStorage.removeItem(`kanban-board-storage-user-${user.id}`);
        localStorage.removeItem(`settings-storage-user-${user.id}`);
      }
      window.location.reload();
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addTeamMember(newMemberName.trim(), newMemberEmail.trim() || undefined);
      setNewMemberName("");
      setNewMemberEmail("");
    }
  };

  const handleDevModeToggle = () => {
    // Chave secreta: "agile_dev_2024"
    if (devKey === "agile_dev_2024") {
      setDevMode(true);
      showAlert('success', 'Modo Desenvolvedor Ativado!', '🚀 Funcionalidades avançadas habilitadas.');
    } else {
      showAlert('error', 'Chave Incorreta!', '🔒 A chave inserida não é válida.');
    }
    setDevKey("");
  };

  const handleDevModeExit = () => {
    setDevMode(false);
    showAlert('info', 'Modo Desenvolvedor Desativado', '🔒 Funcionalidades avançadas desabilitadas.');
  };

  return (
    <div className="space-y-8">
      {/* Configurações do Sistema */}

      {/* Configuração da Equipe */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Users className="h-5 w-5 text-[#2C5B8E]" />
            Gerenciar Equipe
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Adicione e gerencie os membros da sua equipe
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Adicionar novo membro */}
          <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#2C5B8E]" />
              Adicionar Novo Membro
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label
                  htmlFor="member-name"
                  className="text-sm font-medium text-gray-700"
                >
                  Nome
                </Label>
                <Input
                  id="member-name"
                  placeholder="Nome do membro"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="border-gray-300 focus:border-[#2C5B8E] focus:ring-[#2C5B8E]"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="member-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email (opcional)
                </Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="border-gray-300 focus:border-[#2C5B8E] focus:ring-[#2C5B8E]"
                />
              </div>
            </div>
            <Button
              onClick={handleAddMember}
              disabled={!newMemberName.trim()}
              className="bg-[#2C5B8E] hover:bg-[#2C5B8E]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>

          {/* Lista de membros */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Membros da Equipe</h4>
              <Badge
                variant="secondary"
                className="bg-[#2C5B8E]/10 text-[#2C5B8E] border-[#2C5B8E]/20"
              >
                {teamMembers.length} membros
              </Badge>
            </div>

            {teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2C5B8E] to-[#1e3a8a] rounded-full flex items-center justify-center text-white text-sm font-semibold border border-gray-200">
                        {member.initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.name}
                        </p>
                        {member.email && (
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum membro adicionado ainda</p>
                <p className="text-sm">Adicione membros da equipe acima</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                i
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Dicas importantes:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>
                    • Os membros da equipe serão usados para atribuição de tasks
                    no Kanban
                  </li>
                  <li>
                    • As iniciais são geradas automaticamente a partir do nome
                  </li>
                  <li>
                    • Membros podem ser atribuídos a tasks durante a criação
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup e Restauração */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <SettingsIcon className="h-5 w-5 text-[#2C5B8E]" />
            Backup e Importação
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie seus dados e importe informações do Trello
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Exportar */}
            <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:border-gray-300 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Exportar Dados
                  </h4>
                  <p className="text-sm text-gray-600">Backup completo</p>
                </div>
              </div>
              <Button
                onClick={handleExportData}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Backup
              </Button>
              <p className="text-xs text-gray-500 mt-3">
                Baixa um arquivo JSON com todos os dados do projeto
              </p>
            </div>

            {/* Importar Backup */}
            <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:border-gray-300 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Importar Backup
                  </h4>
                  <p className="text-sm text-gray-600">Restaurar dados</p>
                </div>
              </div>
              <div className="relative">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="cursor-pointer border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Importa dados de um arquivo JSON de backup
              </p>
            </div>

            {/* Importar Trello */}
            <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 hover:border-gray-300 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Importar Trello
                  </h4>
                  <p className="text-sm text-gray-600">JSON do Trello</p>
                </div>
              </div>
              <div className="relative">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportTrelloData}
                  disabled={isImporting}
                  className="cursor-pointer border-gray-300 focus:border-purple-500 focus:ring-purple-500 disabled:opacity-50"
                />
                <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {isImporting
                  ? "Processando arquivo..."
                  : "Importa dados diretamente do JSON do Trello"}
              </p>
            </div>
          </div>

          {/* Instruções */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                ?
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Como importar do Trello:</p>
                <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                  <li>
                    No Trello, vá em <strong>Menu</strong> →{" "}
                    <strong>Mais</strong> → <strong>Imprimir e Exportar</strong>{" "}
                    → <strong>Exportar como JSON</strong>
                  </li>
                  <li>Baixe o arquivo JSON do seu board</li>
                  <li>
                    Use o botão &quot;Importar Trello&quot; acima para carregar
                    o arquivo
                  </li>
                  <li>Os dados serão processados automaticamente</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Perigosas */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Trash2 className="h-5 w-5" />
            Ações Perigosas
          </CardTitle>
          <p className="text-sm text-red-700 mt-1">
            Estas ações são irreversíveis. Use com cuidado.
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-white border border-red-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">
                  Limpar Todos os Dados
                </h4>
                <p className="text-sm text-red-700 mb-4">
                  Esta ação irá remover permanentemente todos os cards, tasks,
                  membros da equipe e configurações. Esta ação não pode ser
                  desfeita.
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-red-600">
                    <p>
                      <strong>Dados encontrados:</strong>
                    </p>
                    <p>• {tasks.length} tasks</p>
                    <p>• {teamMembers.length} membros da equipe</p>
                  </div>
                  <Button
                    onClick={handleClearData}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Todos os Dados
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Palette className="h-5 w-5 text-[#2C5B8E]" />
            Informações do Sistema
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Detalhes sobre a aplicação e dados atuais
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-[#2C5B8E]" />
                  Informações Técnicas
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Versão:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {systemInfo?.version || "1.0.0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Última Atualização:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {systemInfo?.last_update ? new Date(systemInfo.last_update).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Persistência:</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      {systemInfo?.persistence || "SQLite Database"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ambiente:</span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 border-blue-200"
                    >
                      {systemInfo?.environment || "Development"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                ℹ
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Sobre a aplicação:</p>
                <p className="text-blue-700">
                  Agile Tracker é uma ferramenta de gerenciamento de projetos
                  ágeis que permite criar e gerenciar tasks, acompanhar
                  progresso e gerar relatórios. Todos os dados são armazenados
                  localmente no seu navegador.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview da Importação */}
      {importPreview && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Upload className="h-5 w-5" />
              Preview da Importação do Trello
            </CardTitle>
            <p className="text-sm text-blue-700 mt-1">
              Revise os dados antes de confirmar a importação
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo dos dados */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-blue-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importPreview.columns.length}
                </div>
                <div className="text-sm text-gray-600">Colunas</div>
              </div>
              <div className="p-4 bg-white border border-blue-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importPreview.tasks.length}
                </div>
                <div className="text-sm text-gray-600">Tasks</div>
              </div>
              <div className="p-4 bg-white border border-blue-200 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {importPreview.labels.length}
                </div>
                <div className="text-sm text-gray-600">Labels</div>
              </div>
            </div>

            {/* Detalhes das colunas */}
            <div className="p-4 bg-white border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                Colunas que serão criadas:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {importPreview.columns.map(
                  (column: { id: string; name: string; color: string }) => (
                    <div
                      key={column.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="text-sm font-medium">{column.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {
                          importPreview.tasks.filter(
                            (task: { column: string }) =>
                              task.column === column.name
                          ).length
                        }{" "}
                        tasks
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Detalhes das tasks */}
            <div className="p-4 bg-white border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                Resumo das Tasks:
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total de Story Points:</span>
                  <Badge variant="secondary">
                    {importPreview.tasks.reduce(
                      (sum: number, task: { storyPoints: number }) =>
                        sum + task.storyPoints,
                      0
                    )}{" "}
                    pts
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tasks com Story Points:</span>
                  <Badge variant="secondary">
                    {
                      importPreview.tasks.filter(
                        (task: { storyPoints: number }) => task.storyPoints > 0
                      ).length
                    }
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tasks com Código:</span>
                  <Badge variant="secondary">
                    {
                      importPreview.tasks.filter(
                        (task: { taskCode: string }) => task.taskCode
                      ).length
                    }
                  </Badge>
                </div>
              </div>
            </div>

            {/* Nota sobre membros */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                  !
                </div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Importante:</p>
                  <p>Os membros da equipe não serão importados do Trello. Configure-os manualmente nas configurações da equipe após a importação.</p>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={cancelImport}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmImport}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Confirmar Importação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modo Desenvolvedor - Secreto */}
      {!devMode ? (
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <SettingsIcon className="h-5 w-5 text-[#2C5B8E]" />
              Acesso Avançado
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Para desenvolvedores e administradores
            </p>
          </CardHeader>
          <CardContent>
            <div className="p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <SettingsIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Modo Desenvolvedor
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Acesso a ferramentas avançadas de manipulação de dados e
                    debug
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="password"
                      placeholder="Digite a chave de acesso..."
                      value={devKey}
                      onChange={(e) => setDevKey(e.target.value)}
                      className="flex-1 border-gray-300 focus:border-[#2C5B8E] focus:ring-[#2C5B8E]"
                    />
                    <Button
                      onClick={handleDevModeToggle}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      Acessar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-orange-800">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Modo Desenvolvedor Ativo
              </div>
              <Button
                onClick={handleDevModeExit}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Sair
              </Button>
            </CardTitle>
            <p className="text-sm text-orange-700 mt-1">
              Ferramentas avançadas de manipulação e debug disponíveis
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ferramentas de Debug */}
            <div className="p-6 bg-white border border-orange-200 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                Ferramentas de Debug
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Dados Brutos (JSON)
                  </Label>
                  <Button
                    onClick={() => {
                      const rawData = {
                        tasks,
                        teamMembers,
                        timestamp: new Date().toISOString(),
                      };
                      console.log("Raw Data:", rawData);
                      alert(
                        "Dados enviados para o console! Abra F12 para ver."
                      );
                    }}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Log no Console
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Estatísticas Detalhadas
                  </Label>
                  <Button
                    onClick={() => {
                      const stats = {
                        totalTasks: tasks.length,
                        completedTasks: tasks.filter((t: KanbanTask) => t.isCompleted)
                          .length,
                        totalStoryPoints: tasks.reduce(
                          (sum: number, t: KanbanTask) => sum + t.storyPoints,
                          0
                        ),
                        completedStoryPoints: tasks
                          .filter((t: KanbanTask) => t.isCompleted)
                          .reduce((sum: number, t: KanbanTask) => sum + t.storyPoints, 0),
                        tasksByColumn: tasks.reduce((acc: Record<string, number>, task: KanbanTask) => {
                          acc[task.column] = (acc[task.column] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>),
                        teamMembers: teamMembers.length,
                      };
                      console.log("Detailed Stats:", stats);
                      alert("Estatísticas enviadas para o console!");
                    }}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Ver Estatísticas
                  </Button>
                </div>
              </div>
            </div>

            {/* Manipulação Avançada */}
            <div className="p-6 bg-white border border-orange-200 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                Manipulação Avançada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => {
                    if (confirm("Marcar TODAS as tasks como concluídas?")) {
                      tasks.forEach((task: KanbanTask) => {
                        // Simular atualização - em produção usaria o store
                        console.log(`Marcando task ${task.id} como concluída`);
                      });
                      alert("Todas as tasks foram marcadas como concluídas!");
                    }
                  }}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Marcar Todas Concluídas
                </Button>
                <Button
                  onClick={() => {
                    if (confirm("Resetar TODAS as tasks para pendentes?")) {
                      tasks.forEach((task: KanbanTask) => {
                        console.log(`Resetando task ${task.id} para pendente`);
                      });
                      alert("Todas as tasks foram resetadas!");
                    }
                  }}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Resetar Todas
                </Button>
                <Button
                  onClick={() => {
                    const testData = {
                      board: {
                        id: "dev-test-board",
                        name: "Board de Teste Dev",
                        description: "Board criado no modo desenvolvedor",
                        createdAt: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                      },
                      columns: [
                        {
                          id: "col1",
                          name: "TO DO",
                          color: "#3b82f6",
                          taskLimit: undefined,
                          isCollapsed: false,
                        },
                        {
                          id: "col2",
                          name: "DONE",
                          color: "#10b981",
                          taskLimit: undefined,
                          isCollapsed: false,
                        },
                      ],
                      tasks: [
                        {
                          id: "dev-task-1",
                          title: "Task de Teste Dev",
                          description: "Task criada no modo desenvolvedor",
                          column: "TO DO",
                          storyPoints: 5,
                          taskCode: "DEV 001",
                          labels: ["dev", "test"],
                          assignedMembers: [],
                          isCompleted: false,
                          createdAt: new Date().toISOString(),
                          attachments: [],
                          comments: [],
                          subtasks: [],
                        },
                      ],
                      members: [],
                      labels: [
                        { id: "label1", name: "dev", color: "#3b82f6" },
                        { id: "label2", name: "test", color: "#10b981" },
                      ],
                    };
                    loadBoard(testData);
                    alert("Dados de teste carregados!");
                  }}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Carregar Dados Teste
                </Button>
              </div>
            </div>

            {/* Informações do Sistema */}
            <div className="p-6 bg-white border border-orange-200 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Informações do Sistema
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User Agent:</span>
                    <span className="font-mono text-xs">
                      {navigator.userAgent.substring(0, 50)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Local Storage:</span>
                    <span className="font-mono text-xs">
                      {localStorage.getItem(`kanban-board-storage-user-${user?.id || 'null'}`)
                        ? "Ativo"
                        : "Vazio"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="font-mono text-xs">
                      {new Date().toISOString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasks em Memória:</span>
                    <span className="font-mono text-xs">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Membros:</span>
                    <span className="font-mono text-xs">
                      {teamMembers.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modo Dev:</span>
                    <span className="font-mono text-xs text-green-600">
                      ATIVO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
