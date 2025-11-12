'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertData {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  duration?: number;
}

interface AlertModalProps {
  alert: AlertData | null;
  onClose: () => void;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    iconBg: 'bg-success/20'
  },
  error: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    iconBg: 'bg-destructive/20'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    iconBg: 'bg-warning/20'
  },
  info: {
    icon: Info,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    iconBg: 'bg-primary/20'
  }
};

export function AlertModal({ alert, onClose }: AlertModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      
      // Auto close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, alert.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  if (!alert) return null;

  const config = alertConfig[alert.type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <Card 
        className={cn(
          "relative w-full max-w-md glass-card border-2 transition-all duration-300 transform",
          config.borderColor,
          isVisible 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-95 opacity-0 translate-y-4"
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
              config.iconBg
            )}>
              <Icon className={cn("w-6 h-6", config.color)} />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {alert.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {alert.message}
              </p>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-muted/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="hover-lift"
            >
              OK
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook para usar o sistema de alertas
export function useAlert() {
  const [alert, setAlert] = useState<AlertData | null>(null);

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlert({
      id,
      type,
      title,
      message,
      duration
    });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return {
    alert,
    showAlert,
    hideAlert,
    AlertModal: () => <AlertModal alert={alert} onClose={hideAlert} />
  };
}
