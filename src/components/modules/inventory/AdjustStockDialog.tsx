import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useInventoryQuery, useAdjustStockMutation } from '@/hooks/useInventory';
import { useWarehousesQuery } from '@/hooks/useWarehouses';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Sliders } from 'lucide-react';

export function AdjustStockDialog() {
  const { modalState, closeModal, addToast } = useApp();
  const isOpen = modalState.type === 'ADJUST_STOCK';

  const { data: products } = useInventoryQuery();
  const { data: warehouses } = useWarehousesQuery();
  const adjustMutation = useAdjustStockMutation();

  const [sku, setSku] = useState('');
  const [warehouseId, setWarehouseId] = useState('WH-CHI');
  const [deltaStr, setDeltaStr] = useState('0');
  const [reason, setReason] = useState('Physical audit cycle count');
  const [operator, setOperator] = useState('Marcus Vance (Inventory Lead)');

  useEffect(() => {
    if (modalState.type === 'ADJUST_STOCK') {
      if (modalState.sku) setSku(modalState.sku);
      if (modalState.warehouseId) setWarehouseId(modalState.warehouseId);
      setDeltaStr('10');
      setReason('Cycle count adjustment');
    }
  }, [modalState]);

  const selectedProduct = products?.find((p) => p.sku === sku);
  const currentWhStock = selectedProduct?.warehouses[warehouseId] || {
    onHand: 0,
    reserved: 0,
    available: 0,
  };

  const delta = parseInt(deltaStr, 10) || 0;
  const projectedOnHand = currentWhStock.onHand + delta;
  const projectedAvailable = projectedOnHand - currentWhStock.reserved;
  const isInvalidNegative = delta < 0 && projectedOnHand < currentWhStock.reserved;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || delta === 0 || isInvalidNegative) return;

    try {
      await adjustMutation.mutateAsync({
        sku,
        warehouseId,
        delta,
        reason,
        operator,
      });

      addToast({
        title: 'Stock Adjusted',
        description: `${sku} at ${warehouseId} adjusted by ${delta > 0 ? `+${delta}` : delta} units.`,
        variant: 'success',
      });
      closeModal();
    } catch (err: any) {
      addToast({
        title: 'Adjustment Failed',
        description: err.message || 'Failed to adjust stock',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-cobalt-50 text-cobalt-600">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Adjust Physical Stock Count</DialogTitle>
              <DialogDescription>
                Record manual inventory adjustments, shrinkage, surplus, or damaged scrap.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
          {/* SKU Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Product SKU</label>
            <Select value={sku} onValueChange={setSku}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((p) => (
                  <SelectItem key={p.id} value={p.sku}>
                    <span className="font-mono font-medium">{p.sku}</span> — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Target Facility</label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name} ({wh.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current vs Projected Live Preview Card */}
          <div className="rounded-md border border-warm-200 bg-warm-50/70 p-3 text-xs space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Current Balances vs Projected
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-white p-1.5 border border-warm-200/60 shadow-3xs">
                <div className="text-[10px] text-slate-400">On-Hand</div>
                <div className="font-mono font-semibold text-slate-800 text-sm">
                  {currentWhStock.onHand}
                </div>
                <div className="text-[10px] text-cobalt-600 font-mono">
                  → {projectedOnHand}
                </div>
              </div>

              <div className="rounded bg-white p-1.5 border border-warm-200/60 shadow-3xs">
                <div className="text-[10px] text-slate-400">Reserved</div>
                <div className="font-mono font-semibold text-amber-700 text-sm">
                  {currentWhStock.reserved}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  (immutable)
                </div>
              </div>

              <div className="rounded bg-white p-1.5 border border-warm-200/60 shadow-3xs">
                <div className="text-[10px] text-slate-400">Available</div>
                <div className="font-mono font-semibold text-slate-800 text-sm">
                  {currentWhStock.available}
                </div>
                <div
                  className={`text-[10px] font-mono font-semibold ${
                    projectedAvailable < 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  → {projectedAvailable}
                </div>
              </div>
            </div>

            {isInvalidNegative && (
              <div className="flex items-center gap-1.5 text-red-600 text-[11px] pt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Negative balance prohibited: On-hand cannot drop below {currentWhStock.reserved} active reserved units.
                </span>
              </div>
            )}
          </div>

          {/* Delta input */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Delta Quantity (+ / -)</label>
              <Input
                type="number"
                value={deltaStr}
                onChange={(e) => setDeltaStr(e.target.value)}
                placeholder="+25 or -10"
                className="h-8 font-mono text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Operator Sign-Off</label>
              <Input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Reason / Reference Note</label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Broken casing found during packaging inspection"
              className="h-8 text-xs"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!sku || delta === 0 || isInvalidNegative || adjustMutation.isPending}
            >
              {adjustMutation.isPending ? 'Committing...' : 'Commit Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
