'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AlertModal, AlertData, AlertType } from '@/components/ui/alert-modal';
import { ImportModal, ImportResult } from '@/components/ui/import-modal';

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message: string, duration?: number) => void;
  hideAlert: () => void;
  showImportResult: (result: ImportResult) => void;
  hideImportModal: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [importModal, setImportModal] = useState<{
    isOpen: boolean;
    result: ImportResult | null;
  }>({ isOpen: false, result: null });

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

  const showImportResult = (result: ImportResult) => {
    setImportModal({ isOpen: true, result });
  };

  const hideImportModal = () => {
    setImportModal({ isOpen: false, result: null });
  };

  return (
    <AlertContext.Provider value={{ 
      showAlert, 
      hideAlert, 
      showImportResult, 
      hideImportModal 
    }}>
      {children}
      <AlertModal alert={alert} onClose={hideAlert} />
      {importModal.isOpen && importModal.result && (
        <ImportModal 
          isOpen={importModal.isOpen} 
          onClose={hideImportModal} 
          result={importModal.result} 
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
