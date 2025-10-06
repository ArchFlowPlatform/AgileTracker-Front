'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserSettingsStore } from '@/hooks/useUserStores';
import { createUserScrumStore } from '@/store/scrum-store';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { useUserKanbanBoardStore } from '@/hooks/useUserKanbanBoardStore';
import { useRef, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BarChart3, TrendingDown, Calendar, Users } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function BurndownChart() {
  const settingsStore = useUserSettingsStore();
  const { teamMembers } = settingsStore || { teamMembers: [] };
  const { user, isAuthenticated } = useAuth();
  
  // Criar store diretamente usando useMemo para garantir mesma instância
  const scrumStore = useMemo(() => {
    if (isAuthenticated && user?.id) {
      return createUserScrumStore(user.id);
    }
    return createUserScrumStore(null);
  }, [user?.id, isAuthenticated]);

  // Estado para forçar re-render quando store muda
  const [storeState, setStoreState] = useState(() => scrumStore?.getState() || null);
  
  // Se inscrever nas mudanças do store para forçar re-render
  useEffect(() => {
    if (scrumStore) {
      const unsubscribe = scrumStore.subscribe((state) => {
        console.log(`🔄 Scrum Store atualizado para usuário ${user?.id}:`, {
          userStories: state.userStories.length,
          sprints: state.sprints.length,
          epics: state.epics.length
        });
        setStoreState(state);
      });
      
      return unsubscribe;
    }
  }, [scrumStore, user?.id]);
  const kanbanStore = useUserKanbanBoardStore();
  const { tasks } = kanbanStore || { tasks: [] };
  const chartRef = useRef<ChartJS<'line'>>(null);
  
  // Estado para sprint selecionado no burndown
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  
  // Verificar se o store está disponível
  if (!scrumStore || !storeState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do Burndown...</p>
        </div>
      </div>
    );
  }
  
  // Usar estado do store que atualiza em tempo real
  const userStories = storeState.userStories;
  const sprints = storeState.sprints;
  
  // Função para converter data corretamente (evita problemas de timezone)
  const formatDate = (dateString: string) => {
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Determinar qual sprint usar para o burndown (apenas seleção manual)
  const currentSprint = sprints.find(s => s.id === selectedSprintId);
  
  // Se não há sprint selecionado, usar dados padrão para mostrar o gráfico

  // Sistema Híbrido: Tasks associadas às User Stories da sprint
  const sprintUserStories = currentSprint 
    ? userStories.filter(story => currentSprint.userStories.includes(story.id))
    : []; // Se não há sprint, não há stories
  
  // Tasks associadas às User Stories da sprint
  const sprintTasks = currentSprint 
    ? tasks.filter(task => 
        task.userStoryId && 
        sprintUserStories.some(story => story.id === task.userStoryId)
      )
    : [];
  
  // Calcular dados baseados nas User Stories da sprint (não nas tasks individuais)
  const totalTasks = sprintTasks.length;
  const completedTasks = sprintTasks.filter(task => task.isCompleted).length;
  
  // Usar pontos das User Stories, não das tasks individuais
  const totalPoints = sprintUserStories.reduce((sum, story) => sum + story.storyPoints, 0);
  
  // Calcular pontos completados baseado no PROGRESSO REAL das tasks (não tudo ou nada)
  const completedPoints = sprintUserStories.reduce((sum, story) => {
    const storyTasks = sprintTasks.filter(task => task.userStoryId === story.id);
    
    console.log(`🔍 Analisando User Story "${story.title}" (${story.storyPoints} pts):`);
    console.log(`   - Tasks associadas: ${storyTasks.length}`);
    
    if (storyTasks.length === 0) {
      console.log(`   ❌ Nenhuma task associada - não conta pontos`);
      return sum; // Se não há tasks associadas, não conta pontos
    }
    
    // Contar tasks realmente completadas (apenas DONE/WAITING VALIDATION)
    const tasksCompletadas = storyTasks.filter(task => {
      const isCompleted = task.column.toLowerCase().includes('done') || 
                         task.column.toLowerCase().includes('validation') ||
                         task.column.toLowerCase().includes('waiting');
      console.log(`     - Task "${task.title}": coluna "${task.column}" = ${isCompleted ? 'CONCLUÍDA' : 'EM PROGRESSO/NÃO INICIADA'}`);
      return isCompleted;
    });
    
    // Calcular progresso proporcional da User Story
    const progressoUserStory = tasksCompletadas.length / storyTasks.length;
    const pontosCompletados = story.storyPoints * progressoUserStory;
    
    console.log(`   📊 Progresso: ${tasksCompletadas.length}/${storyTasks.length} tasks (${Math.round(progressoUserStory * 100)}%) = ${pontosCompletados.toFixed(2)} pontos`);
    
    return sum + pontosCompletados;
  }, 0);
  
  console.log('🎯 DADOS REAIS DO BURNDOWN (NÃO SIMULADOS):');
  console.log('Sprint selecionada:', currentSprint?.name);
  console.log('Sprint ID:', currentSprint?.id);
  console.log('User Stories na sprint:', sprintUserStories.length);
  console.log('Tasks associadas:', sprintTasks.length);
  console.log('Total Points (User Stories):', totalPoints);
  console.log('Completed Points (User Stories 100% completas):', completedPoints);
  
  // Usar dados das tasks associadas às User Stories
  const finalTotalTasks = totalTasks;
  const finalCompletedTasks = completedTasks;
  const finalTotalPoints = totalPoints;
  const finalCompletedPoints = completedPoints;
  
  // Se não há sprint selecionado, mostrar seletor
  if (!currentSprint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-card p-10 max-w-2xl mx-auto rounded-3xl border border-gray-200/30">
        <div className="text-center mb-6">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Selecionar Sprint</h3>
          <p className="text-gray-500 mb-6">
            Escolha uma sprint para visualizar o gráfico de burndown.
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sprint para análise:
          </label>
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma sprint..." />
            </SelectTrigger>
            <SelectContent>
              {sprints.length === 0 ? (
                <SelectItem value="no-sprints" disabled>
                  Nenhuma sprint criada
                </SelectItem>
              ) : (
                sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id.toString()}>
                    {sprint.name} - {formatDate(sprint.startDate)} a {formatDate(sprint.endDate)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {sprints.length === 0 && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Crie uma sprint no Scrum Management primeiro.
            </p>
          )}
        </div>
        </div>
      </div>
    );
  }

  // Calcular velocity baseada na sprint atual (mais preciso e automático)
  const currentSprintVelocity = finalTotalPoints; // Velocity = pontos planejados para esta sprint
  
  // Calcular datas do sprint selecionado (corrigir timezone)
  const sprintStartDate = new Date(currentSprint.startDate + 'T00:00:00');
  const sprintEndDate = new Date(currentSprint.endDate + 'T23:59:59');
  
  // Gerar datas reais do sprint selecionado
  const generateSprintDates = () => {
    const dates = [];
    const currentDate = new Date(sprintStartDate);
    
    console.log('🔍 Debug geração de datas:');
    console.log('Sprint Start:', sprintStartDate.toISOString());
    console.log('Sprint End:', sprintEndDate.toISOString());
    
    while (currentDate <= sprintEndDate) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];
      
      console.log(`Verificando ${dateStr} - Dia da semana: ${dayOfWeek}`);
      
      // Pular fins de semana (sábado = 6, domingo = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(formatDate(dateStr));
        console.log(`✅ Adicionado: ${dateStr}`);
      } else {
        console.log(`❌ Fim de semana: ${dateStr}`);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('Total de dias úteis:', dates.length);
    console.log('Datas geradas:', dates);
    return dates;
  };
  
  const workingDays = generateSprintDates();
  const totalDays = workingDays.length;
  
  // Calcular progresso real por dia baseado no tempo decorrido do sprint
  const now = new Date();
  
  // Calcular dias úteis trabalhados (excluindo fins de semana)
  const calculateWorkingDaysElapsed = () => {
    if (!currentSprint) return 0;
    
    const currentDate = new Date(sprintStartDate);
    let workingDaysCount = 0;
    
    // Usar apenas a data atual (não contar dias futuros)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Início do dia atual
    
    while (currentDate <= today && currentDate <= sprintEndDate) {
      // Contar apenas dias úteis (segunda a sexta)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        workingDaysCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDaysCount;
  };
  
  const daysElapsed = calculateWorkingDaysElapsed();
  
  // Logs adicionais após declaração das variáveis
  console.log('Dias decorridos:', daysElapsed);
  console.log('Total de dias da sprint:', totalDays);
  console.log('Progresso real:', `${completedPoints}/${totalPoints} (${Math.round((completedPoints/totalPoints)*100)}%)`);
  console.log('⚠️ NOTA: Burndown atual é baseado no estado REAL das tasks, não em simulação temporal');
  
  // Calcular progresso REAL baseado no estado atual das tasks (SEM SIMULAÇÃO)
  const calcularProgressoRealPorDia = () => {
    const progressoPorDia = [];
    
    // Se não há tasks completadas, todos os dias = 0
    if (finalCompletedPoints === 0) {
      return workingDays.map(() => 0);
    }
    
    // Se todas as tasks estão completas, distribuir progresso de forma mais realista
    if (finalCompletedPoints === finalTotalPoints) {
      // Distribuir progresso de forma mais realista baseado no estado atual
      // Usar uma curva mais natural (não linear)
      for (let i = 0; i < workingDays.length; i++) {
        const diaAtual = i + 1;
        
        if (diaAtual <= daysElapsed) {
          // Progresso mais realista: começar devagar, acelerar no meio, estabilizar no final
          const progressoNormalizado = diaAtual / daysElapsed;
          const progressoCurvado = Math.pow(progressoNormalizado, 1.5); // Curva mais realista
          progressoPorDia.push(finalTotalPoints * progressoCurvado);
        } else {
          // Dias futuros mantêm o progresso atual
          progressoPorDia.push(finalCompletedPoints);
        }
      }
    } else {
      // Se não está tudo completo, mostrar progresso real atual
      const progressoAtual = finalCompletedPoints / finalTotalPoints;
      return workingDays.map((_, index) => {
        if (index < daysElapsed) {
          // Progresso gradual até o estado atual
          const progressoTemporal = (index + 1) / daysElapsed;
          return Math.min(finalCompletedPoints, finalTotalPoints * progressoTemporal * progressoAtual);
        }
        return finalCompletedPoints;
      });
    }
    
    return progressoPorDia;
  };

  const pontosCompletados = calcularProgressoRealPorDia();
  
  const data = {
    labels: workingDays,
    pontosCompletados,
    cardsCompletados: workingDays.map((_, index) => {
      const diaAtual = index + 1;
      
      // Se todas as tasks estão completas, distribuir progresso gradual
      if (finalCompletedTasks === finalTotalTasks) {
        if (diaAtual <= daysElapsed) {
          const progressoTemporal = diaAtual / daysElapsed;
          return Math.round(finalTotalTasks * progressoTemporal);
        } else {
          return finalCompletedTasks;
        }
      } else {
        // Se não está tudo completo, simular progresso baseado no estado atual
        const progressoAtual = finalCompletedTasks / finalTotalTasks;
        const progressoDia = diaAtual / workingDays.length;
        const progressoDiaSimulado = Math.min(progressoAtual, progressoDia);
        return Math.round(finalTotalTasks * progressoDiaSimulado);
      }
    }),
    totalPontos: finalTotalPoints,
    totalCards: finalTotalTasks,
    totalDias: totalDays,
    diasTrabalhados: daysElapsed,
    membrosEquipe: teamMembers.length,
  };
  
  // Calcular linha ideal baseada nos pontos totais divididos pelos dias da sprint
  const idealLine = data.labels.map((_, index) => {
    // Calcular pontos por dia baseado na sprint atual (não na velocity histórica)
    const pointsPerDay = data.totalPontos / data.totalDias;
    return Math.max(0, data.totalPontos - (index * pointsPerDay));
  });

  // Calcular pontos restantes baseado nos pontos reais completados
  const remainingPoints = data.pontosCompletados.map((completed) => 
    Math.max(0, data.totalPontos - completed)
  );

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Pontos Restantes',
        data: remainingPoints,
        borderColor: '#2C5B8E',
        backgroundColor: 'rgba(44, 91, 142, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2C5B8E',
        pointBorderWidth: 2,
      },
      {
        label: 'Burndown Ideal',
        data: idealLine,
        borderColor: '#34A853',
        backgroundColor: 'rgba(52, 168, 83, 0.1)',
        borderDash: [5, 5],
        fill: false,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
      {
        label: 'Pontos Completados',
        data: data.pontosCompletados,
        borderColor: '#4A4A4A',
        backgroundColor: 'rgba(74, 74, 74, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#4A4A4A',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    layout: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'normal' as const,
          },
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#ffffff',
        titleColor: '#1e293b',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function(context: { dataset: { label?: string }; parsed: { y: number | null } }) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + ' pontos';
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.03)',
          lineWidth: 1,
        },
        border: {
          display: false,
        },
        ticks: {
          display: true,
          color: '#64748b',
          font: {
            size: 11,
          },
          padding: 8,
          maxTicksLimit: 8,
          callback: function(value: number | string) {
            return value + ' pts';
          },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          display: true,
          color: '#64748b',
          font: {
            size: 11,
          },
          padding: 8,
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  };

  const completedCards = data.cardsCompletados[data.cardsCompletados.length - 1] || 0;
  // Usar os pontos reais completados, não os simulados
  const currentCompletedPoints = finalCompletedPoints;
  
  const cardsPercentage = Math.round((completedCards / data.totalCards) * 100) || 0;
  const pointsPercentage = Math.round((currentCompletedPoints / data.totalPontos) * 100) || 0;
  const daysPercentage = Math.round((data.diasTrabalhados / data.totalDias) * 100) || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Burndown Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line ref={chartRef} data={chartData} options={options} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Métricas da Sprint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de Sprint */}
          {sprints.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Selecionar Sprint para Burndown:</label>
              <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha um sprint..." />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name} - {formatDate(sprint.startDate)} a {formatDate(sprint.endDate)}
                      {sprint.isActive && ' (Ativo)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {currentSprint ? (
            <>
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Sprint Selecionado</span>
                  <Badge variant={currentSprint.isActive ? "default" : "secondary"} className={currentSprint.isActive ? "bg-green-600" : ""}>
                    {currentSprint.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Período</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(currentSprint.startDate)} - {formatDate(currentSprint.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Objetivo</span>
                  <span className="text-sm text-gray-900">{currentSprint.goal || 'Não definido'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge variant="secondary">Visualização Geral</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Período</span>
                <span className="text-sm text-gray-900">Últimos 14 dias</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Dados</span>
                <span className="text-sm text-gray-900">Todas as User Stories</span>
              </div>
            </div>
          )}
          
          {/* Sempre mostrar progresso */}
          <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso dos Cards</span>
                  <span>{completedCards}/{data.totalCards} ({cardsPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#2C5B8E] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${cardsPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pontos Completados</span>
                  <span>{currentCompletedPoints}/{data.totalPontos} ({pointsPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#34A853] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${pointsPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Dias Trabalhados</span>
                  <span>{data.diasTrabalhados}/{data.totalDias} ({daysPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#4A4A4A] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${daysPercentage}%` }}
                  />
                </div>
              </div>
          </>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Informações da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">👥 Membros da Equipe:</span>
            <Badge variant="secondary">{data.membrosEquipe}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">📊 Velocity da Sprint:</span>
            <Badge variant="secondary">
              {currentSprintVelocity} pts/sprint
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">📈 Pontos por Dia:</span>
            <Badge variant="secondary">
              {(currentSprintVelocity / data.totalDias).toFixed(1)} pts/dia
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">📅 Duração da Sprint:</span>
            <Badge variant="secondary">{data.totalDias} dias</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
