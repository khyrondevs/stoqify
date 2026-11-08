import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  useOrdersQuery,
  useAllocateOrderMutation,
  useFulfillOrderMutation,
  useCancelOrderMutation,
} from '@/hooks/useOrders';
import { OrderType, OrderStatus } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Truck,
  Plus,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function OrdersView() {
  const { selectedWarehouseId, openModal, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<OrderType>('SALES_ORDER');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const { data: orders, isLoading } = useOrdersQuery({
    type: activeTab,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    warehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : undefined,
  });

  const allocateMutation = useAllocateOrderMutation();
  const fulfillMutation = useFulfillOrderMutation();
  const cancelMutation = useCancelOrderMutation();

  const handleAllocate = async (orderId: string, orderNumber: string) => {
    try {
      await allocateMutation.mutateAsync(orderId);
      addToast({
        title: 'Stock Allocated',
        description: `All line items for ${orderNumber} reserved from warehouse inventory.`,
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Allocation Failed',
        description: err.message || 'Insufficient available stock to allocate order',
        variant: 'destructive',
      });
    }
  };

  const handleFulfill = async (orderId: string, orderNumber: string) => {
    try {
      await fulfillMutation.mutateAsync(orderId);
      addToast({
        title: 'Order Dispatched',
        description: `${orderNumber} fulfilled: on-hand stock deducted and dispatched.`,
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Fulfillment Failed',
        description: err.message || 'Failed to fulfill order',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (orderId: string, orderNumber: string) => {
    try {
      await cancelMutation.mutateAsync({ orderId, reason: 'Operator requested cancellation' });
      addToast({
        title: 'Order Cancelled',
        description: `${orderNumber} cancelled. Any outstanding reservations have been released.`,
        variant: 'default',
      });
    } catch (err: any) {
      addToast({
        title: 'Cancellation Failed',
        description: err.message || 'Cannot cancel this order',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.75rem)] p-4 space-y-4 max-w-7xl mx-auto w-full overflow-hidden">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Orders & Allocations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer sales order reservations and inbound purchase order shipments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              openModal({
                type: 'CREATE_SALES_ORDER',
                defaultWarehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : 'WH-CHI',
              })
            }
            className="gap-1.5 text-xs bg-cobalt-600 hover:bg-cobalt-700 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Sales Order</span>
          </Button>
        </div>
      </div>

      {/* Tabs and Status Filter */}
      <div className="flex items-center justify-between border-b border-warm-200 pb-2">
        {/* Type Toggle */}
        <div className="flex items-center gap-1 bg-warm-100 p-0.5 rounded-md border border-warm-200">
          <button
            onClick={() => {
              setActiveTab('SALES_ORDER');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'SALES_ORDER'
                ? 'bg-white text-slate-900 shadow-3xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5 text-cobalt-600" />
            <span>Outbound Sales Orders</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PURCHASE_ORDER');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'PURCHASE_ORDER'
                ? 'bg-white text-slate-900 shadow-3xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="h-3.5 w-3.5 text-teal-600" />
            <span>Inbound Purchase Orders</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {(activeTab === 'SALES_ORDER'
            ? ['ALL', 'PENDING', 'ALLOCATED', 'FULFILLED', 'CANCELLED']
            : ['ALL', 'PENDING', 'RECEIVED']
          ).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-warm-100 text-slate-600 hover:bg-warm-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Grid */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading orders...</div>
        ) : orders?.length ? (
          orders.map((order) => {
            const isAllocated = order.status === 'ALLOCATED';
            const isPending = order.status === 'PENDING';
            const isFulfilled = order.status === 'FULFILLED';
            const isReceived = order.status === 'RECEIVED';
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="rounded-lg border border-warm-200/90 bg-white p-4 shadow-xs space-y-3 hover:border-warm-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-warm-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900">{order.orderNumber}</span>
                    <Badge
                      variant={
                        isAllocated
                          ? 'default'
                          : isFulfilled
                          ? 'success'
                          : isReceived
                          ? 'success'
                          : isCancelled
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-[10px] py-0 px-2"
                    >
                      {order.status}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Hub: <b className="font-mono text-slate-700">{order.warehouseId}</b>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] mr-1">
                        {order.type === 'SALES_ORDER' ? 'Client:' : 'Supplier:'}
                      </span>
                      <span className="font-semibold text-slate-800">{order.counterparty}</span>
                    </div>

                    <div className="font-mono font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Line items table preview */}
                <div className="rounded-md border border-warm-100 bg-warm-50/40 p-2.5">
                  <div className="grid grid-cols-12 text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-1 mb-1 border-b border-warm-200/60">
                    <div className="col-span-5">Line Item SKU</div>
                    <div className="col-span-2 text-right">Order Qty</div>
                    <div className="col-span-2 text-right">Allocated</div>
                    <div className="col-span-3 text-right">Total Price</div>
                  </div>

                  <div className="space-y-1">
                    {order.items.map((it) => (
                      <div key={it.id} className="grid grid-cols-12 text-xs items-center font-mono">
                        <div className="col-span-5 truncate text-slate-800 font-sans font-medium">
                          <span className="font-mono font-bold text-slate-900 mr-1.5">{it.sku}</span>
                          <span className="text-[11px] text-slate-500 font-normal truncate">{it.productName}</span>
                        </div>
                        <div className="col-span-2 text-right text-slate-700">{it.quantity}</div>
                        <div className="col-span-2 text-right">
                          <span
                            className={
                              it.allocatedQuantity > 0
                                ? 'text-cobalt-700 font-bold'
                                : 'text-slate-400 font-normal'
                            }
                          >
                            {it.allocatedQuantity}
                          </span>
                        </div>
                        <div className="col-span-3 text-right text-slate-800">
                          {formatCurrency(it.quantity * it.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer and Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>Created {new Date(order.createdAt).toLocaleDateString()}</span>
                    {order.notes && <span className="text-slate-500 italic ml-2">— {order.notes}</span>}
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {/* Actions for SALES ORDER */}
                    {order.type === 'SALES_ORDER' && (
                      <>
                        {isPending && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAllocate(order.id, order.orderNumber)}
                            disabled={allocateMutation.isPending}
                            className="gap-1.5 text-xs bg-cobalt-600 hover:bg-cobalt-700"
                          >
                            <Layers className="h-3 w-3" />
                            <span>Allocate & Reserve Stock</span>
                          </Button>
                        )}

                        {isAllocated && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(order.id, order.orderNumber)}
                              disabled={cancelMutation.isPending}
                              className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Cancel Order</span>
                            </Button>

                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleFulfill(order.id, order.orderNumber)}
                              disabled={fulfillMutation.isPending}
                              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Fulfill & Dispatch</span>
                            </Button>
                          </>
                        )}

                        {isFulfilled && (
                          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Dispatched & Deducted</span>
                          </span>
                        )}

                        {isCancelled && (
                          <span className="text-xs text-slate-400 italic">
                            Cancelled — Reservations Released
                          </span>
                        )}
                      </>
                    )}

                    {/* Actions for PURCHASE ORDER */}
                    {order.type === 'PURCHASE_ORDER' && (
                      <>
                        {order.status === 'PENDING' && (
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => openModal({ type: 'RECEIVE_PO', orderId: order.id })}
                            className="gap-1.5 text-xs"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Receive Shipment</span>
                          </Button>
                        )}

                        {order.status === 'RECEIVED' && (
                          <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Booked into Warehouse</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-warm-200 bg-white p-12 text-center text-xs text-slate-400">
            No orders found matching status "{statusFilter}".
          </div>
        )}
      </div>
    </div>
  );
}
