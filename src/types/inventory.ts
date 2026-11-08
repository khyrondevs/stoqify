export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK';

/**
 * Documented Inventory Valuation Basis:
 * Standard Cost Basis (FIFO / Standard Unit Cost: product.unitCost).
 * Used consistently across warehouse asset valuations, category breakdowns, and dashboard KPIs.
 */
export interface WarehouseStock {
  warehouseId: string;
  binLocation: string;
  onHand: number;
  reserved: number;
  available: number; // Invariant: onHand - reserved
  status?: StockStatus; // Facility-specific stock availability status
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitCost: number;
  retailPrice: number;
  unitOfMeasure: string;
  safetyStock: number;
  reorderQuantity: number;
  leadTimeDays: number;
  warehouses: Record<string, WarehouseStock>; // warehouseId -> WarehouseStock
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  status: StockStatus;
}
