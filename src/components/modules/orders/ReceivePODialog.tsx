import { useApp } from '@/context/AppContext';
import { useOrdersQuery, useReceivePurchaseOrderMutation } from '@/hooks/useOrders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PackageCheck, ArrowDownToLine } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function ReceivePODialog() {
  const { modalState, closeModal, addToast } = useApp();
  const isOpen = modalState.type === 'RECEIVE_PO';
  const orderId = modalState.type === 'RECEIVE_PO' ? modalState.orderId : '';

  const { data: orders } = useOrdersQuery();
  const receiveMutation = useReceivePurchaseOrderMutation();

  const order = orders?.find((o) => o.id === orderId);

  const handleReceive = async () => {
    if (!orderId) return;

    try {
      await receiveMutation.mutateAsync(orderId);
      addToast({
        title: 'Shipment Received',
        description: `Purchase Order ${order?.orderNumber} checked into warehouse ${order?.warehouseId}.`,
        variant: 'success',
      });
      closeModal();
    } catch (err: any) {
      addToast({
        title: 'Receiving Failed',
        description: err.message || 'Failed to process PO receipt',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen || !order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-50 text-teal-600">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Receive Inbound Shipment</DialogTitle>
              <DialogDescription>
                Check in vendor delivery for purchase order {order.orderNumber}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="rounded-md border border-warm-200 bg-warm-50/70 p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Supplier:</span>
              <span className="font-semibold text-slate-800">{order.counterparty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destination Facility:</span>
              <span className="font-mono font-medium text-slate-800">{order.warehouseId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Purchase Value:</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="font-semibold text-slate-700 text-xs">Inbound Line Items to Book:</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {order.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-2 rounded bg-white border border-warm-200/80 shadow-3xs"
                >
                  <div>
                    <span className="font-mono font-medium text-slate-900">{it.sku}</span>
                    <div className="text-[11px] text-slate-500 truncate max-w-[240px]">
                      {it.productName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-teal-700 text-sm">
                      +{it.quantity}
                    </span>
                    <span className="text-[10px] text-slate-400 block">units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="teal"
            size="sm"
            onClick={handleReceive}
            disabled={receiveMutation.isPending}
            className="gap-1.5"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span>{receiveMutation.isPending ? 'Booking Receipt...' : 'Confirm Inbound Receipt'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
