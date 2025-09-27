'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKanbanStore } from '@/store/kanban-store';
import { useState, useEffect } from 'react';
import { Card as CardType } from '@/types';

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CardType;
}

const cardColors = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#06b6d4', label: 'Ciano' },
];

export function CardDialog({ open, onOpenChange, card }: CardDialogProps) {
  const { addCard, updateCard } = useKanbanStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#3b82f6',
    assignee: '',
  });

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        description: card.description || '',
        color: card.color,
        assignee: card.assignee || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        color: '#3b82f6',
        assignee: '',
      });
    }
  }, [card, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Por favor, insira um título para o card.');
      return;
    }

    if (card) {
      updateCard(card.id, formData);
    } else {
      addCard({
        ...formData,
        status: 'todo',
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {card ? 'Editar Card' : 'Novo Card'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Card</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Feature Login"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do card/epic"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Cor do Card</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignee">Responsável</Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                placeholder="Ex: João"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {card ? 'Atualizar' : 'Criar'} Card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
