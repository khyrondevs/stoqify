import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useInventoryQuery, useTransferStockMutation } from '@/hooks/useInventory';
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
import { AlertCircle, ArrowRightLeft } from 'lucide-react';

export function TransferStockDialog() {
  const { modalState, closeModal, addToast } = useApp();
  const isOpen = modalState.type === 'TRANSFER_STOCK';

  const { data: products } = useInventoryQuery();
  const { data: warehouses } = useWarehousesQuery();
  const transferMutation = useTransferStockMutation();

  const [sku, setSku] = useState('SEN-LIDAR-01');
  const [fromWarehouseId, setFromWarehouseId] = useState('WH-CHI');
  const [toWarehouseId, setToWarehouseId] = useState('WH-RNO');
  const [quantityStr, setQuantityStr] = useState('15');
  const [reason, setReason] = useState('Regional safety stock rebalancing');
  const [operator, setOperator] = useState('Elena Rostova (Logistics Lead)');

  useEffect(() => {
    if (modalState.type === 'TRANSFER_STOCK') {
      if (modalState.sku) setSku(modalState.sku);
      if (modalState.fromWarehouseId) setFromWarehouseId(modalState.fromWarehouseId);
      if (modalState.toWarehouseId) setToWarehouseId(modalState.toWarehouseId);
      setQuantityStr('15');
    }
  }, [modalState]);

  const selectedProduct = products?.find((p) => p.sku === sku);
  const sourceStock = selectedProduct?.warehouses[fromWarehouseId] || { onHand: 0, reserved: 0, available: 0 };
  const destStock = selectedProduct?.warehouses[toWarehouseId] || { onHand: 0, reserved: 0, available: 0 };

  const quantity = parseInt(quantityStr, 10) || 0;
  const isSameWarehouse = fromWarehouseId === toWarehouseId;
  const isOverTransfer = quantity > sourceStock.available;
  const isInvalid = quantity <= 0 || isSameWarehouse || isOverTransfer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    try {
      await transferMutation.mutateAsync({
        sku,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        reason,
        operator,
      });

      addToast({
        title: 'Stock Transferred',
        description: `Transferred ${quantity} units of ${sku} from ${fromWarehouseId} to ${toWarehouseId}.`,
        variant: 'success',
      });
      closeModal();
    } catch (err: any) {
      addToast({
        title: 'Transfer Failed',
        description: err.message || 'Failed to transfer stock',
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
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Inter-Facility Stock Transfer</DialogTitle>
              <DialogDescription>
                Transfer inventory between warehouses while conserving total network on-hand stock.
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

          {/* Warehouse Route Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Source Warehouse</label>
              <Select value={fromWarehouseId} onValueChange={setFromWarehouseId}>
                <SelectTrigger className="h-8">
                  <SelectValue />
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Destination Warehouse</label>
              <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                <SelectTrigger className="h-8">
                  <SelectValue />
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
          </div>

          {/* Live Preview Cards */}
          <div className="grid grid-cols-2 gap-3 rounded-md border border-warm-200 bg-warm-50/70 p-3 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Source: {fromWarehouseId}
              </div>
              <div className="font-mono text-slate-800">
                Available: <span className="font-bold">{sourceStock.available}</span> (On-Hand: {sourceStock.onHand})
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Projected Available: {Math.max(0, sourceStock.available - quantity)}
              </div>
            </div>

            <div className="space-y-1 border-l border-warm-200 pl-3">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Dest: {toWarehouseId}
              </div>
              <div className="font-mono text-slate-800">
                Current On-Hand: <span className="font-bold">{destStock.onHand}</span>
              </div>
              <div className="text-[11px] text-cobalt-600 font-mono">
                Projected On-Hand: {destStock.onHand + quantity}
              </div>
            </div>
          </div>

          {isSameWarehouse && (
            <div className="flex items-center gap-1.5 text-red-600 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Source and destination warehouse must be different.</span>
            </div>
          )}

          {isOverTransfer && (
            <div className="flex items-center gap-1.5 text-red-600 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Requested quantity ({quantity}) exceeds source available stock ({sourceStock.available}).</span>
            </div>
          )}

          {/* Quantity & Operator */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Transfer Units</label>
              <Input
                type="number"
                min="1"
                max={sourceStock.available}
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                className="h-8 font-mono text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Dispatcher</label>
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
            <label className="text-xs font-semibold text-slate-700">Transfer Memo / Authority</label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
              disabled={isInvalid || transferMutation.isPending}
            >
              {transferMutation.isPending ? 'Transferring...' : 'Execute Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
