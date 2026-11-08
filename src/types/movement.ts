export type MovementType = 'RECEIPT' | 'TRANSFER' | 'ADJUSTMENT' | 'DISPATCH' | 'RETURN';

export interface StockMovement {
  id: string;
  referenceNumber: string;
  timestamp: string;
  sku: string;
  productName: string;
  type: MovementType;
  quantity: number; // positive for inbound/receipt, negative for outbound/dispatch
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  reason: string;
  operator: string;
  relatedOrderId?: string;
}

export interface MovementFilter {
  type?: MovementType;
  warehouseId?: string;
  sku?: string;
  startDate?: string;
  endDate?: string;
}
