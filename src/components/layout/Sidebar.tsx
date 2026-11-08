import { useApp, ActiveView } from '@/context/AppContext';
import { useDashboardMetricsQuery } from '@/hooks/useAnalytics';
import { useOrdersQuery } from '@/hooks/useOrders';
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Warehouse as WarehouseIcon,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'inventory' | 'orders';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory Catalog', icon: Boxes, badgeKey: 'inventory' },
  { id: 'movements', label: 'Movement Ledger', icon: ArrowLeftRight },
  { id: 'orders', label: 'Orders & Allocation', icon: ShoppingCart, badgeKey: 'orders' },
  { id: 'warehouses', label: 'Warehouses', icon: WarehouseIcon },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { data: metrics } = useDashboardMetricsQuery();
  const { data: orders } = useOrdersQuery();

  const pendingOrdersCount = orders?.filter((o) => o.status === 'PENDING').length || 0;
  const lowStockCount = metrics?.lowStockAlertsCount || 0;

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-warm-200 bg-white transition-all duration-200 select-none z-20 shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-12 items-center justify-between border-b border-warm-200 px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cobalt-600 text-white shadow-xs">
            <Package className="h-4 w-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold tracking-tight text-slate-900 leading-none">STOQIFY</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">DESKTOP IMS v2.0</span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className="text-slate-400 hover:text-slate-700 h-6 w-6 ml-auto"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 p-2">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {!sidebarCollapsed ? 'Operations' : '•••'}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          let badgeContent: number | null = null;
          if (item.badgeKey === 'inventory' && lowStockCount > 0) {
            badgeContent = lowStockCount;
          } else if (item.badgeKey === 'orders' && pendingOrdersCount > 0) {
            badgeContent = pendingOrdersCount;
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors text-left',
                isActive
                  ? 'bg-cobalt-50 text-cobalt-700 font-semibold'
                  : 'text-slate-600 hover:bg-warm-100 hover:text-slate-900'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-cobalt-600" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-cobalt-600' : 'text-slate-400 group-hover:text-slate-700'
                )}
              />
              {!sidebarCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {!sidebarCollapsed && badgeContent !== null && badgeContent > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums leading-tight',
                    item.badgeKey === 'inventory'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-cobalt-100 text-cobalt-800'
                  )}
                >
                  {badgeContent}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="border-t border-warm-200 p-2">
        {!sidebarCollapsed ? (
          <div className="rounded-md bg-warm-50 p-2 border border-warm-200/60">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Local IPC Ready
              </span>
              <SlidersHorizontal className="h-3 w-3 text-slate-400" />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Tauri v2 Native</span>
              <span>4 Hubs</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="Engine Online">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
