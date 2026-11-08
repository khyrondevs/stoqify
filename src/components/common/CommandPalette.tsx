import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useInventoryQuery } from '@/hooks/useInventory';
import { useWarehousesQuery } from '@/hooks/useWarehouses';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Box,
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Warehouse as WarehouseIcon,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveView,
    openModal,
    setSelectedWarehouseId,
  } = useApp();

  const [query, setQuery] = useState('');
  const { data: products } = useInventoryQuery();
  const { data: warehouses } = useWarehousesQuery();

  const filteredProducts = useMemo(() => {
    if (!query.trim() || !products) return [];
    const q = query.toLowerCase().trim();
    return products
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, products]);

  const filteredWarehouses = useMemo(() => {
    if (!query.trim() || !warehouses) return [];
    const q = query.toLowerCase().trim();
    return warehouses
      .filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.code.toLowerCase().includes(q) ||
          w.location.toLowerCase().includes(q)
      )
      .slice(0, 3);
  }, [query, warehouses]);

  const handleSelectNav = (view: any) => {
    setActiveView(view);
    setIsCommandPaletteOpen(false);
    setQuery('');
  };

  const handleSelectWarehouse = (whId: string) => {
    setSelectedWarehouseId(whId);
    setActiveView('inventory');
    setIsCommandPaletteOpen(false);
    setQuery('');
  };

  const handleAdjustProduct = (sku: string) => {
    setIsCommandPaletteOpen(false);
    setQuery('');
    openModal({
      type: 'ADJUST_STOCK',
      sku,
      warehouseId: 'WH-CHI',
    });
  };

  return (
    <Dialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-xl border-warm-200 shadow-2xl bg-white">
        <DialogTitle className="sr-only">Quick Command & Global Search</DialogTitle>

        {/* Search input header */}
        <div className="flex items-center border-b border-warm-200 px-3 py-2.5 bg-warm-50/50">
          <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Type a SKU, product name, view, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Products match */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Catalog SKUs
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAdjustProduct(p.sku)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-warm-100/70 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-cobalt-600 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900">{p.sku}</span>
                          <span className="text-slate-500 truncate max-w-[220px]">{p.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{p.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div className="text-right">
                        <div className="font-mono font-semibold text-slate-900 text-xs">
                          {p.totalOnHand} on hand
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {p.totalAvailable} avail
                        </div>
                      </div>
                      <Badge
                        variant={
                          p.status === 'IN_STOCK'
                            ? 'inStock'
                            : p.status === 'LOW_STOCK'
                            ? 'lowStock'
                            : 'critical'
                        }
                        className="text-[10px] py-0 px-1.5"
                      >
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warehouses match */}
          {filteredWarehouses.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Warehouses
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredWarehouses.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => handleSelectWarehouse(w.id)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-warm-100/70 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <WarehouseIcon className="h-4 w-4 text-slate-600" />
                      <div>
                        <span className="font-semibold text-slate-900">{w.name}</span>
                        <span className="text-slate-400 ml-1.5 text-[11px]">({w.location})</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-cobalt-600 font-medium">Filter view →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Shortcuts */}
          <div>
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button
                onClick={() => handleSelectNav('dashboard')}
                className="flex items-center gap-2 p-2 rounded hover:bg-warm-100 text-left text-xs text-slate-700"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-slate-400" />
                <span>Executive Dashboard</span>
              </button>
              <button
                onClick={() => handleSelectNav('inventory')}
                className="flex items-center gap-2 p-2 rounded hover:bg-warm-100 text-left text-xs text-slate-700"
              >
                <Boxes className="h-3.5 w-3.5 text-slate-400" />
                <span>Inventory Catalog</span>
              </button>
              <button
                onClick={() => handleSelectNav('movements')}
                className="flex items-center gap-2 p-2 rounded hover:bg-warm-100 text-left text-xs text-slate-700"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                <span>Stock Ledger</span>
              </button>
              <button
                onClick={() => handleSelectNav('orders')}
                className="flex items-center gap-2 p-2 rounded hover:bg-warm-100 text-left text-xs text-slate-700"
              >
                <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                <span>Orders & Allocations</span>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-warm-100 pt-2">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="space-y-0.5 mt-1">
              <button
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  openModal({ type: 'ADJUST_STOCK', sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI' });
                }}
                className="flex w-full items-center justify-between p-2 rounded hover:bg-warm-100 text-left text-xs text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-slate-400" />
                  <span>Adjust Physical Stock Count</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Action</span>
              </button>
              <button
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  openModal({ type: 'RESET_CONFIRM' });
                }}
                className="flex w-full items-center justify-between p-2 rounded hover:bg-red-50 text-left text-xs text-red-600"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-red-500" />
                  <span>Reset Demo Fixtures</span>
                </span>
                <span className="text-[10px] text-red-400 font-mono">Utility</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-warm-200 bg-warm-50 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-400">
          <span>Use <b>Esc</b> to close</span>
          <span>STOQIFY Enterprise</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
