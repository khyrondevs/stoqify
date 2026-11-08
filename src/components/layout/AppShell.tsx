import { useApp } from '@/context/AppContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DemoDataBanner } from '../common/DemoDataBanner';
import { CommandPalette } from '../common/CommandPalette';
import { ToastContainer } from '../common/ToastContainer';
import { DashboardView } from '../modules/dashboard/DashboardView';
import { InventoryCatalogView } from '../modules/inventory/InventoryCatalogView';
import { StockMovementLedgerView } from '../modules/movements/StockMovementLedgerView';
import { OrdersView } from '../modules/orders/OrdersView';
import { WarehouseView } from '../modules/warehouses/WarehouseView';
import { AdjustStockDialog } from '../modules/inventory/AdjustStockDialog';
import { TransferStockDialog } from '../modules/inventory/TransferStockDialog';
import { CreateOrderDialog } from '../modules/orders/CreateOrderDialog';
import { ReceivePODialog } from '../modules/orders/ReceivePODialog';
import { ResetConfirmDialog } from '../common/ResetConfirmDialog';

export function AppShell() {
  const { activeView } = useApp();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-warm-50 text-slate-900 select-none">
      {/* Subtle Demo Status Banner */}
      <DemoDataBanner />

      {/* Main App Layout: Sidebar + Working Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          {/* Active View Container */}
          <main className="flex-1 overflow-auto bg-warm-50/60">
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'inventory' && <InventoryCatalogView />}
            {activeView === 'movements' && <StockMovementLedgerView />}
            {activeView === 'orders' && <OrdersView />}
            {activeView === 'warehouses' && <WarehouseView />}
          </main>
        </div>
      </div>

      {/* Global Modals & Overlays */}
      <CommandPalette />
      <AdjustStockDialog />
      <TransferStockDialog />
      <CreateOrderDialog />
      <ReceivePODialog />
      <ResetConfirmDialog />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
