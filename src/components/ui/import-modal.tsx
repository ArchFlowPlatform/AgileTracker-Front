'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  BarChart3, 
  AlertTriangle, 
  X,
  Download,
  Users,
  Tag,
  Columns
} from 'lucide-react';

export interface ImportResult {
  success: boolean;
  message: string;
  summary?: {
    columns: number;
    tasks: number;
    labels: number;
  };
  warning?: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ImportResult;
}

export function ImportModal({ isOpen, onClose, result }: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-lg glass-card border-2 border-success/30 animate-slide-up">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-success/20">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              Importação Concluída
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-success mb-1">Sucesso!</p>
              <p className="text-sm text-muted-foreground">
                {result.message}
              </p>
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Resumo da Importação</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-white border border-gray-200">
                  <Columns className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{result.summary.columns}</p>
                  <p className="text-sm text-gray-600">Colunas</p>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-white border border-gray-200">
                  <Download className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{result.summary.tasks}</p>
                  <p className="text-sm text-gray-600">Tasks</p>
                </div>
                
                <div className="text-center p-4 rounded-xl bg-white border border-gray-200">
                  <Tag className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{result.summary.labels}</p>
                  <p className="text-sm text-gray-600">Labels</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {result.warning && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-warning mb-1">Nota Importante</p>
                <p className="text-sm text-muted-foreground">
                  {result.warning}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="hover-lift"
            >
              Continuar
            </Button>
            <Button
              onClick={() => {
                // Fechar modal e navegar para configurações dentro do dashboard
                onClose();
                // Usar o sistema de navegação interno do dashboard
                setTimeout(() => {
                  const event = new CustomEvent('navigate-to-settings');
                  window.dispatchEvent(event);
                }, 100);
              }}
              className="gradient-primary text-white hover:bg-primary-hover hover-lift"
            >
              <Users className="w-4 h-4 mr-2" />
              Configurar Equipe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook para usar o modal de importação
export function useImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const showImportResult = (importResult: ImportResult) => {
    setResult(importResult);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setResult(null);
  };

  return {
    isOpen,
    result,
    showImportResult,
    hideModal,
    ImportModal: () => (
      <ImportModal 
        isOpen={isOpen} 
        onClose={hideModal} 
        result={result || { success: false, message: '' }} 
      />
    )
  };
}
