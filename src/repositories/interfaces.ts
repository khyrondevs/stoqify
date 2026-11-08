import { Product } from '../types/inventory';
import { StockMovement, MovementFilter } from '../types/movement';
import { Order, OrderType, OrderStatus } from '../types/order';
import { Warehouse } from '../types/warehouse';
import { DashboardMetrics, VelocityTrendPoint, CategoryBreakdown } from '../types/analytics';

export interface StockAdjustmentInput {
  sku: string;
  warehouseId: string;
  delta: number;
  reason: string;
  operator?: string;
}

export interface StockTransferInput {
  sku: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason: string;
  operator?: string;
}

export interface IInventoryRepository {
  getItems(filter?: { category?: string; warehouseId?: string; search?: string }): Promise<Product[]>;
  getItemBySku(sku: string): Promise<Product | null>;
  adjustStock(input: StockAdjustmentInput): Promise<Product>;
  transferStock(input: StockTransferInput): Promise<Product>;
}

export interface IMovementRepository {
  getMovements(filter?: MovementFilter): Promise<StockMovement[]>;
  recordMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<StockMovement>;
}

export interface IOrderRepository {
  getOrders(filter?: { type?: OrderType; status?: OrderStatus; warehouseId?: string }): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createSalesOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order>;
  allocateSalesOrder(orderId: string): Promise<Order>;
  fulfillSalesOrder(orderId: string): Promise<Order>;
  cancelSalesOrder(orderId: string, reason?: string): Promise<Order>;
  receivePurchaseOrder(orderId: string): Promise<Order>;
}

export interface IWarehouseRepository {
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouseById(id: string): Promise<Warehouse | null>;
}

export interface IAnalyticsRepository {
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getVelocityTrends(): Promise<VelocityTrendPoint[]>;
  getCategoryBreakdown(): Promise<CategoryBreakdown[]>;
}
