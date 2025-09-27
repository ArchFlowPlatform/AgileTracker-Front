'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKanbanStore } from '@/store/kanban-store';
import { useRef } from 'react';
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
import { TrendingDown, Calendar, Users } from 'lucide-react';

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
  const { getBurndownData } = useKanbanStore();
  const chartRef = useRef<ChartJS<'line'>>(null);
  
  const data = getBurndownData();
  
  // Calcular linha ideal
  const idealLine = data.labels.map((_, index) => {
    const totalDays = data.labels.length;
    const pointsPerDay = data.totalPontos / (totalDays - 1);
    return Math.max(0, data.totalPontos - (index * pointsPerDay));
  });

  // Calcular pontos restantes
  const remainingPoints = data.pontosCompletados.map((completed) => 
    data.totalPontos - completed
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
  const completedPoints = data.pontosCompletados[data.pontosCompletados.length - 1] || 0;
  
  const cardsPercentage = Math.round((completedCards / data.totalCards) * 100) || 0;
  const pointsPercentage = Math.round((completedPoints / data.totalPontos) * 100) || 0;
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
              <span>{completedPoints}/{data.totalPontos} ({pointsPercentage}%)</span>
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
            <span className="text-sm text-muted-foreground">📊 Pontos por Membro/Dia:</span>
            <Badge variant="secondary">
              {((data.totalPontos / data.totalDias) / data.membrosEquipe).toFixed(2)} pts
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
