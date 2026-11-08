export interface WarehouseZone {
  code: string;
  name: string;
  binCapacity: number;
  binsOccupied: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  capacityUnits: number;
  utilizedUnits: number;
  utilizationPercentage: number;
  zones: WarehouseZone[];
  activeSkuCount: number;
  totalValuation: number;
}
