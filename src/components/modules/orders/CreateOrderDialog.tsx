import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useInventoryQuery } from '@/hooks/useInventory';
import { useWarehousesQuery } from '@/hooks/useWarehouses';
import { useCreateSalesOrderMutation } from '@/hooks/useOrders';
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
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function CreateOrderDialog() {
  const { modalState, closeModal, addToast } = useApp();
  const isOpen = modalState.type === 'CREATE_SALES_ORDER';

  const { data: products } = useInventoryQuery();
  const { data: warehouses } = useWarehousesQuery();
  const createOrderMutation = useCreateSalesOrderMutation();

  const [counterparty, setCounterparty] = useState('Vanguard Dynamics Inc.');
  const [warehouseId, setWarehouseId] = useState('WH-CHI');
  const [notes, setNotes] = useState('Standard 48h fulfillment route');
  const [items, setItems] = useState<Array<{ sku: string; quantity: number }>>([
    { sku: 'MCU-CORTEX-M7', quantity: 10 },
  ]);

  const handleAddItem = () => {
    const firstSku = products?.[0]?.sku || 'SEN-LIDAR-01';
    setItems((prev) => [...prev, { sku: firstSku, quantity: 5 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, sku: string, quantity: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { sku, quantity: Math.max(1, quantity) };
      return copy;
    });
  };

  const lineItemsCalculated = items.map((it, idx) => {
    const prod = products?.find((p) => p.sku === it.sku);
    const unitPrice = prod?.retailPrice || 0;
    const productName = prod?.name || it.sku;
    const whStock = prod?.warehouses[warehouseId];
    const available = whStock?.available ?? 0;
    return {
      id: `item-${idx}`,
      sku: it.sku,
      productName,
      quantity: it.quantity,
      allocatedQuantity: 0,
      fulfilledQuantity: 0,
      unitPrice,
      available,
    };
  });

  const totalAmount = lineItemsCalculated.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterparty.trim() || lineItemsCalculated.length === 0) return;

    try {
      const order = await createOrderMutation.mutateAsync({
        orderNumber: '',
        type: 'SALES_ORDER',
        warehouseId,
        counterparty,
        notes,
        totalAmount,
        items: lineItemsCalculated.map(({ available: _, ...rest }) => rest),
      });

      addToast({
        title: 'Sales Order Created',
        description: `Order ${order.orderNumber} placed in PENDING state.`,
        variant: 'success',
      });
      closeModal();
    } catch (err: any) {
      addToast({
        title: 'Order Creation Failed',
        description: err.message || 'Failed to create sales order',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-cobalt-50 text-cobalt-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Create Outbound Sales Order</DialogTitle>
              <DialogDescription>
                Place a customer sales order in PENDING status ready for inventory allocation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
          {/* Counterparty & Warehouse */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Client / Customer</label>
              <Input
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="Enterprise customer name"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fulfillment Hub</label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
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

          {/* Line items list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Order Line Items</label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleAddItem}
                className="gap-1 text-slate-600"
              >
                <Plus className="h-3 w-3" />
                <span>Add Item</span>
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-warm-200 rounded-md p-2 bg-warm-50/40">
              {lineItemsCalculated.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded bg-white p-2 border border-warm-200/70 shadow-3xs text-xs"
                >
                  <div className="flex-1">
                    <Select
                      value={it.sku}
                      onValueChange={(val) => handleUpdateItem(idx, val, it.quantity)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.sku}>
                            <span className="font-mono">{p.sku}</span> ({p.warehouses[warehouseId]?.available || 0} avail)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleUpdateItem(idx, it.sku, parseInt(e.target.value) || 1)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>

                  <div className="w-24 text-right font-mono text-slate-700 text-xs">
                    {formatCurrency(it.quantity * it.unitPrice)}
                  </div>

                  {lineItemsCalculated.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700 h-7 w-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes and Total */}
          <div className="flex items-center justify-between border-t border-warm-200 pt-3">
            <div className="flex-1 mr-4">
              <Input
                type="text"
                placeholder="Shipping instructions or internal memo"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 mr-2">Total Amount:</span>
              <span className="font-mono text-base font-bold text-slate-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={createOrderMutation.isPending || lineItemsCalculated.length === 0}
            >
              {createOrderMutation.isPending ? 'Placing Order...' : 'Submit Sales Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
