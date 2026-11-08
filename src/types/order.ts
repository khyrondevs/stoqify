export type OrderType = 'PURCHASE_ORDER' | 'SALES_ORDER';
export type OrderStatus = 'PENDING' | 'ALLOCATED' | 'FULFILLED' | 'RECEIVED' | 'CANCELLED';

export interface OrderLineItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  allocatedQuantity: number;
  fulfilledQuantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  warehouseId: string;
  counterparty: string; // Customer name for SO, Supplier name for PO
  createdAt: string;
  expectedDate?: string;
  items: OrderLineItem[];
  totalAmount: number;
  notes?: string;
}
