import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ActiveView = 'dashboard' | 'inventory' | 'movements' | 'orders' | 'warehouses';

export type ModalState =
  | { type: null }
  | { type: 'ADJUST_STOCK'; sku: string; warehouseId: string }
  | { type: 'TRANSFER_STOCK'; sku?: string; fromWarehouseId?: string; toWarehouseId?: string }
  | { type: 'CREATE_SALES_ORDER'; defaultWarehouseId?: string }
  | { type: 'RECEIVE_PO'; orderId: string }
  | { type: 'RESET_CONFIRM' };

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
}

interface AppContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedWarehouseId: string | 'ALL';
  setSelectedWarehouseId: (id: string | 'ALL') => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  modalState: ModalState;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | 'ALL'>('ALL');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const openModal = useCallback((modal: ModalState) => {
    setModalState(modal);
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ type: null });
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Keyboard shortcut listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedWarehouseId,
        setSelectedWarehouseId,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        modalState,
        openModal,
        closeModal,
        sidebarCollapsed,
        setSidebarCollapsed,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
