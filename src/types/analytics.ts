export interface DashboardMetrics {
  totalStockValuation: number;
  totalActiveSkus: number;
  lowStockAlertsCount: number;
  criticalStockCount: number;
  pendingDispatchUnits: number;
  inboundUnitsOnTheWay: number;
  activeWarehouseCount: number;
}

export interface VelocityTrendPoint {
  date: string;
  inboundUnits: number;
  outboundUnits: number;
  turnoverRatio: number;
}

export interface CategoryBreakdown {
  category: string;
  skuCount: number;
  valuation: number;
  unitsOnHand: number;
}
