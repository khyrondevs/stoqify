import { Product, StockStatus } from '../../types/inventory';
import { Warehouse } from '../../types/warehouse';
import { Order } from '../../types/order';
import { StockMovement } from '../../types/movement';

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-CHI',
    code: 'CHI-01',
    name: 'Central Distribution Center',
    location: 'Chicago, IL',
    capacityUnits: 50000,
    utilizedUnits: 34200,
    utilizationPercentage: 68.4,
    activeSkuCount: 20,
    totalValuation: 2450800,
    zones: [
      { code: 'Z-A', name: 'Optics & Precision', binCapacity: 500, binsOccupied: 380 },
      { code: 'Z-B', name: 'Heavy Actuators', binCapacity: 800, binsOccupied: 610 },
      { code: 'Z-C', name: 'Compute & Controllers', binCapacity: 1200, binsOccupied: 790 },
      { code: 'Z-D', name: 'Bulk Cabling & Power', binCapacity: 2000, binsOccupied: 1400 },
    ],
  },
  {
    id: 'WH-RNO',
    code: 'RNO-02',
    name: 'West Coast Logistics Hub',
    location: 'Reno, NV',
    capacityUnits: 35000,
    utilizedUnits: 19800,
    utilizationPercentage: 56.5,
    activeSkuCount: 19,
    totalValuation: 1320400,
    zones: [
      { code: 'Z-A', name: 'Fast-Moving Automation', binCapacity: 600, binsOccupied: 420 },
      { code: 'Z-B', name: 'Sensor Assembly Staging', binCapacity: 900, binsOccupied: 480 },
      { code: 'Z-C', name: 'Reserve Racks', binCapacity: 1500, binsOccupied: 750 },
    ],
  },
  {
    id: 'WH-NWK',
    code: 'NWK-03',
    name: 'East Coast Freight Terminal',
    location: 'Newark, NJ',
    capacityUnits: 30000,
    utilizedUnits: 22400,
    utilizationPercentage: 74.6,
    activeSkuCount: 18,
    totalValuation: 1610200,
    zones: [
      { code: 'Z-A', name: 'Import Staging', binCapacity: 800, binsOccupied: 650 },
      { code: 'Z-B', name: 'High-Density Bins', binCapacity: 1400, binsOccupied: 1020 },
    ],
  },
  {
    id: 'WH-RTM',
    code: 'RTM-04',
    name: 'European Gateway',
    location: 'Rotterdam, Netherlands',
    capacityUnits: 40000,
    utilizedUnits: 18900,
    utilizationPercentage: 47.2,
    activeSkuCount: 16,
    totalValuation: 1180600,
    zones: [
      { code: 'Z-A', name: 'CE Compliance Quarantine', binCapacity: 400, binsOccupied: 150 },
      { code: 'Z-B', name: 'Automated Pallet Racks', binCapacity: 1600, binsOccupied: 790 },
    ],
  },
];

export function computeFacilityStockStatus(
  available: number,
  onHand: number,
  safetyStock: number
): StockStatus {
  if (onHand === 0 || available <= 0) {
    return 'OUT_OF_STOCK';
  }
  if (available <= Math.floor(safetyStock * 0.25)) {
    return 'CRITICAL';
  }
  if (available <= Math.floor(safetyStock * 0.5)) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
}

export function computeProductAggregates(
  warehouses: Product['warehouses'],
  safetyStock: number
): { totalOnHand: number; totalReserved: number; totalAvailable: number; status: StockStatus } {
  let totalOnHand = 0;
  let totalReserved = 0;

  for (const wh of Object.values(warehouses)) {
    totalOnHand += wh.onHand;
    totalReserved += wh.reserved;
    wh.available = wh.onHand - wh.reserved;
    wh.status = computeFacilityStockStatus(wh.available, wh.onHand, safetyStock);
  }

  const totalAvailable = totalOnHand - totalReserved;

  let status: StockStatus = 'IN_STOCK';
  if (totalOnHand === 0 || totalAvailable <= 0) {
    status = 'OUT_OF_STOCK';
  } else if (totalAvailable <= Math.floor(safetyStock * 0.4)) {
    status = 'CRITICAL';
  } else if (totalAvailable <= safetyStock) {
    status = 'LOW_STOCK';
  }

  return { totalOnHand, totalReserved, totalAvailable, status };
}

export function createInitialProducts(): Product[] {
  const rawProducts = [
    {
      id: 'prod-01',
      sku: 'SEN-LIDAR-01',
      name: 'Solid-State LiDAR Range Sensor 30m',
      category: 'Optics & Vision',
      unitCost: 210.0,
      retailPrice: 349.0,
      unitOfMeasure: 'EA',
      safetyStock: 80,
      reorderQuantity: 150,
      leadTimeDays: 14,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'A-01-04', onHand: 100, reserved: 0, available: 100 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-02-11', onHand: 30, reserved: 0, available: 30 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-04-02', onHand: 20, reserved: 0, available: 20 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'C-01-08', onHand: 15, reserved: 0, available: 15 },
      },
    },
    {
      id: 'prod-02',
      sku: 'MCU-CORTEX-M7',
      name: 'Dual-Core Industrial System-on-Module',
      category: 'Embedded Compute',
      unitCost: 34.5,
      retailPrice: 68.0,
      unitOfMeasure: 'EA',
      safetyStock: 200,
      reorderQuantity: 500,
      leadTimeDays: 21,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'C-02-01', onHand: 240, reserved: 20, available: 220 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'A-01-09', onHand: 110, reserved: 0, available: 110 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-03-05', onHand: 95, reserved: 0, available: 95 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'A-02-04', onHand: 80, reserved: 0, available: 80 },
      },
    },
    {
      id: 'prod-03',
      sku: 'DRV-STEP-80V',
      name: 'Microstepping Driver 80V 8.2A EtherCAT',
      category: 'Motion Control',
      unitCost: 85.0,
      retailPrice: 149.0,
      unitOfMeasure: 'EA',
      safetyStock: 60,
      reorderQuantity: 120,
      leadTimeDays: 10,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'B-01-08', onHand: 45, reserved: 10, available: 35 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-03-02', onHand: 18, reserved: 0, available: 18 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-02-14', onHand: 12, reserved: 0, available: 12 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-01-05', onHand: 10, reserved: 0, available: 10 },
      },
    },
    {
      id: 'prod-04',
      sku: 'ACT-SERVO-15NM',
      name: 'Integrated Frameless Servo Actuator 15Nm',
      category: 'Robotics & Actuation',
      unitCost: 420.0,
      retailPrice: 699.0,
      unitOfMeasure: 'EA',
      safetyStock: 30,
      reorderQuantity: 60,
      leadTimeDays: 28,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'B-04-12', onHand: 18, reserved: 5, available: 13 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'C-01-03', onHand: 8, reserved: 0, available: 8 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-01-09', onHand: 6, reserved: 0, available: 6 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-02-01', onHand: 4, reserved: 0, available: 4 },
      },
    },
    {
      id: 'prod-05',
      sku: 'BUS-ETHCAT-04',
      name: '4-Port Ruggedized EtherCAT Junction Box',
      category: 'Industrial Networking',
      unitCost: 115.0,
      retailPrice: 189.0,
      unitOfMeasure: 'EA',
      safetyStock: 40,
      reorderQuantity: 80,
      leadTimeDays: 7,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'C-01-15', onHand: 55, reserved: 0, available: 55 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'A-02-08', onHand: 24, reserved: 0, available: 24 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-01-12', onHand: 16, reserved: 0, available: 16 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'A-03-07', onHand: 14, reserved: 0, available: 14 },
      },
    },
    {
      id: 'prod-06',
      sku: 'SEN-IMU-6DOF',
      name: 'Tactical Grade 6-DoF Industrial IMU',
      category: 'Optics & Vision',
      unitCost: 145.0,
      retailPrice: 235.0,
      unitOfMeasure: 'EA',
      safetyStock: 50,
      reorderQuantity: 100,
      leadTimeDays: 14,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'A-02-06', onHand: 62, reserved: 0, available: 62 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-01-04', onHand: 28, reserved: 0, available: 28 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-03-11', onHand: 22, reserved: 0, available: 22 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'C-02-02', onHand: 16, reserved: 0, available: 16 },
      },
    },
    {
      id: 'prod-07',
      sku: 'PWR-PSU-48V10A',
      name: 'DIN-Rail Power Supply 48V 10A 480W PFC',
      category: 'Power & Distribution',
      unitCost: 78.0,
      retailPrice: 132.0,
      unitOfMeasure: 'EA',
      safetyStock: 75,
      reorderQuantity: 150,
      leadTimeDays: 12,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'D-01-03', onHand: 95, reserved: 15, available: 80 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-02-07', onHand: 42, reserved: 0, available: 42 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-02-12', onHand: 35, reserved: 0, available: 35 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-03-04', onHand: 25, reserved: 0, available: 25 },
      },
    },
    {
      id: 'prod-08',
      sku: 'CBL-M12-CAN8P',
      name: 'M12 A-Coded 8-Pin Shielded CAN Bus Cable 5m',
      category: 'Cabling & Interconnect',
      unitCost: 18.5,
      retailPrice: 34.0,
      unitOfMeasure: 'EA',
      safetyStock: 300,
      reorderQuantity: 600,
      leadTimeDays: 7,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'D-03-22', onHand: 480, reserved: 50, available: 430 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'C-02-10', onHand: 210, reserved: 0, available: 210 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-04-18', onHand: 190, reserved: 0, available: 190 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-02-15', onHand: 140, reserved: 0, available: 140 },
      },
    },
    {
      id: 'prod-09',
      sku: 'SEN-PRES-060B',
      name: 'Piezoresistive Pressure Transmitter 0-60 Bar',
      category: 'Sensors & Instrumentation',
      unitCost: 64.0,
      retailPrice: 112.0,
      unitOfMeasure: 'EA',
      safetyStock: 90,
      reorderQuantity: 180,
      leadTimeDays: 16,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'A-03-09', onHand: 38, reserved: 0, available: 38 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'A-03-05', onHand: 14, reserved: 0, available: 14 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-02-07', onHand: 10, reserved: 0, available: 10 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'C-01-02', onHand: 8, reserved: 0, available: 8 },
      },
    },
    {
      id: 'prod-10',
      sku: 'IO-MOD-16DI',
      name: '16-Channel 24VDC Optoisolated Digital Input',
      category: 'Embedded Compute',
      unitCost: 52.0,
      retailPrice: 89.0,
      unitOfMeasure: 'EA',
      safetyStock: 110,
      reorderQuantity: 220,
      leadTimeDays: 14,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'C-03-04', onHand: 140, reserved: 0, available: 140 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'A-01-14', onHand: 65, reserved: 0, available: 65 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-04-09', onHand: 50, reserved: 0, available: 50 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'A-02-11', onHand: 42, reserved: 0, available: 42 },
      },
    },
    {
      id: 'prod-11',
      sku: 'ENC-OPT-1024P',
      name: 'Differential Optical Encoder 1024 PPR 5V',
      category: 'Motion Control',
      unitCost: 92.0,
      retailPrice: 158.0,
      unitOfMeasure: 'EA',
      safetyStock: 65,
      reorderQuantity: 130,
      leadTimeDays: 12,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'B-02-14', onHand: 78, reserved: 0, available: 78 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-01-09', onHand: 34, reserved: 0, available: 34 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-02-04', onHand: 28, reserved: 0, available: 28 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-03-08', onHand: 20, reserved: 0, available: 20 },
      },
    },
    {
      id: 'prod-12',
      sku: 'SEN-TEMP-RTD4',
      name: 'Class A Pt100 4-Wire RTD Probe -50 to 400C',
      category: 'Sensors & Instrumentation',
      unitCost: 28.0,
      retailPrice: 49.0,
      unitOfMeasure: 'EA',
      safetyStock: 150,
      reorderQuantity: 300,
      leadTimeDays: 9,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'A-04-18', onHand: 190, reserved: 0, available: 190 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'A-02-12', onHand: 85, reserved: 0, available: 85 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-01-16', onHand: 72, reserved: 0, available: 72 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'C-02-06', onHand: 60, reserved: 0, available: 60 },
      },
    },
    {
      id: 'prod-13',
      sku: 'SW-ETH-MGD08',
      name: '8-Port M12 Managed Industrial Ethernet Switch',
      category: 'Industrial Networking',
      unitCost: 280.0,
      retailPrice: 460.0,
      unitOfMeasure: 'EA',
      safetyStock: 30,
      reorderQuantity: 60,
      leadTimeDays: 18,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'C-04-02', onHand: 12, reserved: 0, available: 12 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'A-03-14', onHand: 6, reserved: 0, available: 6 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-03-02', onHand: 5, reserved: 0, available: 5 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'A-01-05', onHand: 3, reserved: 0, available: 3 },
      },
    },
    {
      id: 'prod-14',
      sku: 'RLY-SSR-40A',
      name: 'Zero-Cross AC Solid State Relay 40A 480VAC',
      category: 'Power & Distribution',
      unitCost: 22.5,
      retailPrice: 39.5,
      unitOfMeasure: 'EA',
      safetyStock: 180,
      reorderQuantity: 360,
      leadTimeDays: 8,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'D-02-11', onHand: 240, reserved: 0, available: 240 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-03-09', onHand: 110, reserved: 0, available: 110 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-01-14', onHand: 95, reserved: 0, available: 95 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-02-09', onHand: 75, reserved: 0, available: 75 },
      },
    },
    {
      id: 'prod-15',
      sku: 'ACT-LIN-500N',
      name: 'Precision High-Speed Linear Actuator 500N',
      category: 'Robotics & Actuation',
      unitCost: 310.0,
      retailPrice: 520.0,
      unitOfMeasure: 'EA',
      safetyStock: 25,
      reorderQuantity: 50,
      leadTimeDays: 24,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'B-03-18', onHand: 22, reserved: 0, available: 22 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'C-02-04', onHand: 9, reserved: 0, available: 9 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-03-01', onHand: 8, reserved: 0, available: 8 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-01-12', onHand: 5, reserved: 0, available: 5 },
      },
    },
    {
      id: 'prod-16',
      sku: 'CBL-FBR-LC10M',
      name: 'Heavy-Duty Armored OM3 Fiber Patch Cable 10m',
      category: 'Cabling & Interconnect',
      unitCost: 32.0,
      retailPrice: 58.0,
      unitOfMeasure: 'EA',
      safetyStock: 120,
      reorderQuantity: 240,
      leadTimeDays: 6,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'D-04-05', onHand: 160, reserved: 0, available: 160 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'C-01-12', onHand: 70, reserved: 0, available: 70 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-04-08', onHand: 55, reserved: 0, available: 55 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-03-01', onHand: 40, reserved: 0, available: 40 },
      },
    },
    {
      id: 'prod-17',
      sku: 'SEN-FLOW-MAG2',
      name: 'Electromagnetic Flanged Flow Sensor 2-inch',
      category: 'Sensors & Instrumentation',
      unitCost: 540.0,
      retailPrice: 890.0,
      unitOfMeasure: 'EA',
      safetyStock: 20,
      reorderQuantity: 40,
      leadTimeDays: 30,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'A-01-19', onHand: 8, reserved: 0, available: 8 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-02-04', onHand: 3, reserved: 0, available: 3 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-04-14', onHand: 2, reserved: 0, available: 2 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'C-01-11', onHand: 1, reserved: 0, available: 1 },
      },
    },
    {
      id: 'prod-18',
      sku: 'MCU-PLC-RTOS',
      name: 'Modular Linux Real-Time Automation Controller',
      category: 'Embedded Compute',
      unitCost: 380.0,
      retailPrice: 640.0,
      unitOfMeasure: 'EA',
      safetyStock: 35,
      reorderQuantity: 70,
      leadTimeDays: 18,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'C-01-08', onHand: 40, reserved: 0, available: 40 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'A-02-02', onHand: 18, reserved: 0, available: 18 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-01-08', onHand: 14, reserved: 0, available: 14 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'A-03-02', onHand: 11, reserved: 0, available: 11 },
      },
    },
    {
      id: 'prod-19',
      sku: 'PWR-DC-CONV24',
      name: 'Wide-Input Isolated DC-DC Converter 24V 15A',
      category: 'Power & Distribution',
      unitCost: 42.0,
      retailPrice: 74.0,
      unitOfMeasure: 'EA',
      safetyStock: 140,
      reorderQuantity: 280,
      leadTimeDays: 11,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'D-02-18', onHand: 180, reserved: 0, available: 180 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-01-15', onHand: 80, reserved: 0, available: 80 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'B-02-19', onHand: 68, reserved: 0, available: 68 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-03-12', onHand: 50, reserved: 0, available: 50 },
      },
    },
    {
      id: 'prod-20',
      sku: 'VALV-PROP-PNEU',
      name: 'Proportional Pneumatic Pressure Regulator 0-10V',
      category: 'Motion Control',
      unitCost: 165.0,
      retailPrice: 275.0,
      unitOfMeasure: 'EA',
      safetyStock: 45,
      reorderQuantity: 90,
      leadTimeDays: 14,
      warehouses: {
        'WH-CHI': { warehouseId: 'WH-CHI', binLocation: 'B-03-07', onHand: 52, reserved: 0, available: 52 },
        'WH-RNO': { warehouseId: 'WH-RNO', binLocation: 'B-02-09', onHand: 24, reserved: 0, available: 24 },
        'WH-NWK': { warehouseId: 'WH-NWK', binLocation: 'A-03-08', onHand: 18, reserved: 0, available: 18 },
        'WH-RTM': { warehouseId: 'WH-RTM', binLocation: 'B-02-06', onHand: 14, reserved: 0, available: 14 },
      },
    },
  ];

  return rawProducts.map((p) => {
    const aggregates = computeProductAggregates(p.warehouses, p.safetyStock);
    return {
      ...p,
      ...aggregates,
    };
  });
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-so-001',
    orderNumber: 'SO-2026-1042',
    type: 'SALES_ORDER',
    status: 'ALLOCATED',
    warehouseId: 'WH-CHI',
    counterparty: 'Apex Robotics Labs',
    createdAt: '2026-11-06T09:15:00Z',
    totalAmount: 3490.0,
    notes: 'Priority dispatch for autonomous rover prototype',
    items: [
      {
        id: 'item-01-1',
        sku: 'MCU-CORTEX-M7',
        productName: 'Dual-Core Industrial System-on-Module',
        quantity: 20,
        allocatedQuantity: 20,
        fulfilledQuantity: 0,
        unitPrice: 68.0,
      },
      {
        id: 'item-01-2',
        sku: 'DRV-STEP-80V',
        productName: 'Microstepping Driver 80V 8.2A EtherCAT',
        quantity: 10,
        allocatedQuantity: 10,
        fulfilledQuantity: 0,
        unitPrice: 149.0,
      },
    ],
  },
  {
    id: 'ord-so-002',
    orderNumber: 'SO-2026-1043',
    type: 'SALES_ORDER',
    status: 'PENDING',
    warehouseId: 'WH-CHI',
    counterparty: 'Kinetic Motion Systems',
    createdAt: '2026-11-07T14:30:00Z',
    totalAmount: 5195.0,
    items: [
      {
        id: 'item-02-1',
        sku: 'ACT-SERVO-15NM',
        productName: 'Integrated Frameless Servo Actuator 15Nm',
        quantity: 5,
        allocatedQuantity: 0,
        fulfilledQuantity: 0,
        unitPrice: 699.0,
      },
      {
        id: 'item-02-2',
        sku: 'PWR-PSU-48V10A',
        productName: 'DIN-Rail Power Supply 48V 10A 480W PFC',
        quantity: 15,
        allocatedQuantity: 0,
        fulfilledQuantity: 0,
        unitPrice: 132.0,
      },
    ],
  },
  {
    id: 'ord-po-001',
    orderNumber: 'PO-2026-0881',
    type: 'PURCHASE_ORDER',
    status: 'PENDING',
    warehouseId: 'WH-CHI',
    counterparty: 'OmniPhotonics Sensor Foundry',
    createdAt: '2026-11-01T10:00:00Z',
    expectedDate: '2026-11-15T00:00:00Z',
    totalAmount: 31500.0,
    notes: 'Quarterly replenish of 30m LiDAR sensor modules',
    items: [
      {
        id: 'item-po-1',
        sku: 'SEN-LIDAR-01',
        productName: 'Solid-State LiDAR Range Sensor 30m',
        quantity: 150,
        allocatedQuantity: 0,
        fulfilledQuantity: 0,
        unitPrice: 210.0,
      },
    ],
  },
  {
    id: 'ord-po-002',
    orderNumber: 'PO-2026-0882',
    type: 'PURCHASE_ORDER',
    status: 'PENDING',
    warehouseId: 'WH-NWK',
    counterparty: 'Precision Flow Instrumentation GmbH',
    createdAt: '2026-11-04T11:20:00Z',
    expectedDate: '2026-11-18T00:00:00Z',
    totalAmount: 21600.0,
    items: [
      {
        id: 'item-po-2',
        sku: 'SEN-FLOW-MAG2',
        productName: 'Electromagnetic Flanged Flow Sensor 2-inch',
        quantity: 40,
        allocatedQuantity: 0,
        fulfilledQuantity: 0,
        unitPrice: 540.0,
      },
    ],
  },
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-001',
    referenceNumber: 'REC-2026-0914',
    timestamp: '2026-11-05T08:30:00Z',
    sku: 'SEN-LIDAR-01',
    productName: 'Solid-State LiDAR Range Sensor 30m',
    type: 'RECEIPT',
    quantity: 50,
    destinationWarehouseId: 'WH-CHI',
    reason: 'Purchase Order Fulfillment PO-2026-0792',
    operator: 'Marcus Vance (Dock Lead)',
    relatedOrderId: 'PO-2026-0792',
  },
  {
    id: 'mov-002',
    referenceNumber: 'TRF-2026-0312',
    timestamp: '2026-11-05T14:10:00Z',
    sku: 'SEN-LIDAR-01',
    productName: 'Solid-State LiDAR Range Sensor 30m',
    type: 'TRANSFER',
    quantity: -15,
    sourceWarehouseId: 'WH-CHI',
    destinationWarehouseId: 'WH-RTM',
    reason: 'Rebalancing European safety threshold',
    operator: 'Elena Rostova (Inventory Controller)',
  },
  {
    id: 'mov-003',
    referenceNumber: 'ADJ-2026-0189',
    timestamp: '2026-11-06T11:45:00Z',
    sku: 'DRV-STEP-80V',
    productName: 'Microstepping Driver 80V 8.2A EtherCAT',
    type: 'ADJUSTMENT',
    quantity: 5,
    destinationWarehouseId: 'WH-CHI',
    reason: 'Cycle count physical audit surplus found in Bin B-01-08',
    operator: 'Marcus Vance (Dock Lead)',
  },
  {
    id: 'mov-004',
    referenceNumber: 'DSP-2026-1102',
    timestamp: '2026-11-07T16:20:00Z',
    sku: 'CBL-M12-CAN8P',
    productName: 'M12 A-Coded 8-Pin Shielded CAN Bus Cable 5m',
    type: 'DISPATCH',
    quantity: -50,
    sourceWarehouseId: 'WH-CHI',
    reason: 'Customer fulfillment dispatch SO-2026-1019',
    operator: 'System (Automated Dispatch)',
    relatedOrderId: 'SO-2026-1019',
  },
];
