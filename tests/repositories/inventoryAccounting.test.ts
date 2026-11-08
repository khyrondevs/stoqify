import { describe, it, expect, beforeEach } from 'vitest';
import { DemoRepository } from '../../src/repositories/demo/DemoRepository';
import {
  InsufficientStockError,
  InvalidOrderStateError,
  NotFoundError,
  ValidationError,
  PersistenceError,
} from '../../src/types/errors';

describe('Inventory Accounting & Transaction Engine (12 Scenarios)', () => {
  let repo: DemoRepository;

  beforeEach(() => {
    // Reset state cleanly before test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    repo = new DemoRepository();
    repo.resetDemoData();
  });

  // Scenario 1: Initial Seed Balance
  it('Scenario 1: correctly initializes seed stock balances and calculates available stock', async () => {
    const item = await repo.getItemBySku('SEN-LIDAR-01');
    expect(item).not.toBeNull();
    const chiStock = item!.warehouses['WH-CHI'];
    expect(chiStock).toBeDefined();
    expect(chiStock.onHand).toBe(100);
    expect(chiStock.reserved).toBe(0);
    expect(chiStock.available).toBe(100);
    expect(chiStock.available).toBe(chiStock.onHand - chiStock.reserved);
  });

  // Scenario 2: Positive Stock Adjustment
  it('Scenario 2: increases on-hand and available on positive stock adjustment and creates ledger record', async () => {
    const updated = await repo.adjustStock({
      sku: 'SEN-LIDAR-01',
      warehouseId: 'WH-CHI',
      delta: 25,
      reason: 'Physical delivery surplus count',
      operator: 'Marcus Vance',
    });

    const chiStock = updated.warehouses['WH-CHI'];
    expect(chiStock.onHand).toBe(125);
    expect(chiStock.reserved).toBe(0);
    expect(chiStock.available).toBe(125);

    const movements = await repo.getMovements({ sku: 'SEN-LIDAR-01' });
    expect(movements.length).toBeGreaterThan(0);
    expect(movements[0].type).toBe('ADJUSTMENT');
    expect(movements[0].quantity).toBe(25);
    expect(movements[0].destinationWarehouseId).toBe('WH-CHI');
  });

  // Scenario 3: Sales Order Full Allocation
  it('Scenario 3: reserves stock on order allocation without reducing on-hand', async () => {
    // Start by adjusting +25 so onHand is 125, available is 125
    await repo.adjustStock({
      sku: 'SEN-LIDAR-01',
      warehouseId: 'WH-CHI',
      delta: 25,
      reason: 'Setup',
    });

    const order = await repo.createSalesOrder({
      orderNumber: 'SO-TEST-001',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'Cyberdyne Systems',
      totalAmount: 13960,
      items: [
        {
          id: 'item-1',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 40,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });

    const allocatedOrder = await repo.allocateSalesOrder(order.id);
    expect(allocatedOrder.status).toBe('ALLOCATED');
    expect(allocatedOrder.items[0].allocatedQuantity).toBe(40);

    const item = await repo.getItemBySku('SEN-LIDAR-01');
    const chiStock = item!.warehouses['WH-CHI'];
    expect(chiStock.onHand).toBe(125);
    expect(chiStock.reserved).toBe(40);
    expect(chiStock.available).toBe(85);
  });

  // Scenario 4: Over-Reservation Rejection
  it('Scenario 4: rejects over-reservation when requested quantity exceeds available stock', async () => {
    // Setup: 125 onHand, 40 reserved, 85 available
    await repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: 25, reason: 'Setup' });
    const order1 = await repo.createSalesOrder({
      orderNumber: 'SO-TEST-001',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'Client A',
      totalAmount: 13960,
      items: [
        {
          id: 'item-1',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 40,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });
    await repo.allocateSalesOrder(order1.id);

    // Attempt to allocate 90 units when only 85 available
    const order2 = await repo.createSalesOrder({
      orderNumber: 'SO-TEST-002',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'Client B',
      totalAmount: 31410,
      items: [
        {
          id: 'item-2',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 90,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });

    await expect(repo.allocateSalesOrder(order2.id)).rejects.toThrow(InsufficientStockError);

    // Verify balances remain unmodified
    const item = await repo.getItemBySku('SEN-LIDAR-01');
    const chiStock = item!.warehouses['WH-CHI'];
    expect(chiStock.onHand).toBe(125);
    expect(chiStock.reserved).toBe(40);
    expect(chiStock.available).toBe(85);
  });

  // Scenario 5: Downside Adjustment Rejection
  it('Scenario 5: rejects downward stock adjustment that would push on-hand below reserved', async () => {
    // Setup: 125 onHand, 40 reserved, 85 available
    await repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: 25, reason: 'Setup' });
    const order = await repo.createSalesOrder({
      orderNumber: 'SO-TEST-001',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'Client A',
      totalAmount: 13960,
      items: [
        {
          id: 'item-1',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 40,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });
    await repo.allocateSalesOrder(order.id);

    // Adjusting -100 would leave onHand=25 < reserved=40 (available=-15)
    await expect(
      repo.adjustStock({
        sku: 'SEN-LIDAR-01',
        warehouseId: 'WH-CHI',
        delta: -100,
        reason: 'Scrap test',
      })
    ).rejects.toThrow(InsufficientStockError);

    // Balances unchanged
    const item = await repo.getItemBySku('SEN-LIDAR-01');
    const chiStock = item!.warehouses['WH-CHI'];
    expect(chiStock.onHand).toBe(125);
    expect(chiStock.reserved).toBe(40);
    expect(chiStock.available).toBe(85);
  });

  // Scenario 6: Order Fulfillment Dispatch
  it('Scenario 6: decrements on-hand and clears reserved upon order fulfillment and records dispatch', async () => {
    await repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: 25, reason: 'Setup' });
    const order = await repo.createSalesOrder({
      orderNumber: 'SO-TEST-001',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'Client A',
      totalAmount: 13960,
      items: [
        {
          id: 'item-1',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 40,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });
    await repo.allocateSalesOrder(order.id);

    const fulfilled = await repo.fulfillSalesOrder(order.id);
    expect(fulfilled.status).toBe('FULFILLED');
    expect(fulfilled.items[0].fulfilledQuantity).toBe(40);
    expect(fulfilled.items[0].allocatedQuantity).toBe(0);

    const item = await repo.getItemBySku('SEN-LIDAR-01');
    const chiStock = item!.warehouses['WH-CHI'];
    expect(chiStock.onHand).toBe(85);
    expect(chiStock.reserved).toBe(0);
    expect(chiStock.available).toBe(85);

    const movements = await repo.getMovements({ sku: 'SEN-LIDAR-01' });
    expect(movements[0].type).toBe('DISPATCH');
    expect(movements[0].quantity).toBe(-40);
  });

  // Scenario 7: Order Cancellation Stock Recovery
  it('Scenario 7: releases reserved stock back to available upon cancelling an allocated order', async () => {
    // Current onHand is 100, reserved 0, available 100
    // Adjust to 85 onHand for scenario setup
    await repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: -15, reason: 'Align to 85' });

    const order = await repo.createSalesOrder({
      orderNumber: 'SO-TEST-CANCEL',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'Client B',
      totalAmount: 10470,
      items: [
        {
          id: 'item-c1',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 30,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });

    await repo.allocateSalesOrder(order.id);
    let item = await repo.getItemBySku('SEN-LIDAR-01');
    expect(item!.warehouses['WH-CHI'].onHand).toBe(85);
    expect(item!.warehouses['WH-CHI'].reserved).toBe(30);
    expect(item!.warehouses['WH-CHI'].available).toBe(55);

    // Cancel order
    const cancelled = await repo.cancelSalesOrder(order.id, 'Customer changed requirements');
    expect(cancelled.status).toBe('CANCELLED');

    item = await repo.getItemBySku('SEN-LIDAR-01');
    expect(item!.warehouses['WH-CHI'].onHand).toBe(85);
    expect(item!.warehouses['WH-CHI'].reserved).toBe(0);
    expect(item!.warehouses['WH-CHI'].available).toBe(85);
  });

  // Scenario 8: Prohibit Cancelling Fulfilled Order
  it('Scenario 8: throws InvalidOrderStateError when attempting to cancel an already fulfilled order', async () => {
    const order = await repo.createSalesOrder({
      orderNumber: 'SO-TEST-FULFILLED',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'Client C',
      totalAmount: 3490,
      items: [
        {
          id: 'item-f1',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 10,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });
    await repo.allocateSalesOrder(order.id);
    await repo.fulfillSalesOrder(order.id);

    await expect(repo.cancelSalesOrder(order.id)).rejects.toThrow(InvalidOrderStateError);
  });

  // Scenario 9: Inter-Warehouse Transfer Conservation
  it('Scenario 9: conserves total network on-hand stock during inter-warehouse transfer', async () => {
    // Set WH-CHI onHand: 85, WH-RNO onHand: 30
    await repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: -15, reason: 'Align to 85' });

    const itemBefore = await repo.getItemBySku('SEN-LIDAR-01');
    const totalBefore = itemBefore!.totalOnHand;
    expect(itemBefore!.warehouses['WH-CHI'].onHand).toBe(85);
    expect(itemBefore!.warehouses['WH-RNO'].onHand).toBe(30);

    const updated = await repo.transferStock({
      sku: 'SEN-LIDAR-01',
      fromWarehouseId: 'WH-CHI',
      toWarehouseId: 'WH-RNO',
      quantity: 20,
      reason: 'West coast buffer replenishment',
      operator: 'Elena Rostova',
    });

    expect(updated.warehouses['WH-CHI'].onHand).toBe(65);
    expect(updated.warehouses['WH-CHI'].available).toBe(65);
    expect(updated.warehouses['WH-RNO'].onHand).toBe(50);
    expect(updated.warehouses['WH-RNO'].available).toBe(50);
    expect(updated.totalOnHand).toBe(totalBefore);

    const movements = await repo.getMovements({ sku: 'SEN-LIDAR-01' });
    expect(movements[0].type).toBe('TRANSFER');
    expect(movements[0].sourceWarehouseId).toBe('WH-CHI');
    expect(movements[0].destinationWarehouseId).toBe('WH-RNO');
  });

  // Scenario 10: Transfer Exceeding Available Rejection
  it('Scenario 10: rejects transfer when requested quantity exceeds source warehouse available stock', async () => {
    // WH-CHI available is 65 after previous step (or set to 65)
    await repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: -35, reason: 'Set to 65' });

    await expect(
      repo.transferStock({
        sku: 'SEN-LIDAR-01',
        fromWarehouseId: 'WH-CHI',
        toWarehouseId: 'WH-RNO',
        quantity: 70, // Exceeds 65 available
        reason: 'Over-transfer test',
      })
    ).rejects.toThrow(InsufficientStockError);

    // Verify source on-hand unmodified
    const item = await repo.getItemBySku('SEN-LIDAR-01');
    expect(item!.warehouses['WH-CHI'].onHand).toBe(65);
  });

  // Scenario 11: Purchase Order Receiving
  it('Scenario 11: increases on-hand stock and creates receipt record upon receiving a purchase order', async () => {
    const itemBefore = await repo.getItemBySku('SEN-FLOW-MAG2');
    const nwkBefore = itemBefore!.warehouses['WH-NWK'].onHand;

    // ord-po-002 is for SEN-FLOW-MAG2, quantity 40, to WH-NWK
    const receivedOrder = await repo.receivePurchaseOrder('ord-po-002');
    expect(receivedOrder.status).toBe('RECEIVED');

    const itemAfter = await repo.getItemBySku('SEN-FLOW-MAG2');
    expect(itemAfter!.warehouses['WH-NWK'].onHand).toBe(nwkBefore + 40);
    expect(itemAfter!.warehouses['WH-NWK'].available).toBe(itemAfter!.warehouses['WH-NWK'].onHand);

    const movements = await repo.getMovements({ sku: 'SEN-FLOW-MAG2' });
    expect(movements[0].type).toBe('RECEIPT');
    expect(movements[0].quantity).toBe(40);
    expect(movements[0].destinationWarehouseId).toBe('WH-NWK');
  });

  // Scenario 12: Demo Data Reset and Repeated-Operation Safety
  it('Scenario 12: cleanly resets demonstration state and ensures repeated-operation safety', async () => {
    // Perform multiple dirtying mutations
    await repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: 50, reason: 'Dirty' });
    await repo.adjustStock({ sku: 'MCU-CORTEX-M7', warehouseId: 'WH-RNO', delta: -30, reason: 'Dirty' });

    // Reset
    repo.resetDemoData();

    // Verify pristine seed values
    const lidar = await repo.getItemBySku('SEN-LIDAR-01');
    expect(lidar!.warehouses['WH-CHI'].onHand).toBe(100);
    expect(lidar!.warehouses['WH-CHI'].reserved).toBe(0);
    expect(lidar!.warehouses['WH-CHI'].available).toBe(100);

    const mcu = await repo.getItemBySku('MCU-CORTEX-M7');
    expect(mcu!.warehouses['WH-RNO'].onHand).toBe(110);
    expect(mcu!.warehouses['WH-RNO'].reserved).toBe(0);

    // Repeated reset idempotency
    repo.resetDemoData();
    const lidarAgain = await repo.getItemBySku('SEN-LIDAR-01');
    expect(lidarAgain!.warehouses['WH-CHI'].onHand).toBe(100);
  });
});

describe('Pre-Commit Audit Remediations & Robustness Regressions', () => {
  let repo: DemoRepository;

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    repo = new DemoRepository();
    repo.resetDemoData();
  });

  // Test 1: Duplicate-SKU Order Lines Over-Reservation Prevention & Atomicity
  it('prevents duplicate-SKU order lines from over-reserving and guarantees atomic rollback', async () => {
    // SEN-LIDAR-01 in WH-CHI has onHand: 100, reserved: 0, available: 100
    // Create an order with two line items for SEN-LIDAR-01: line 1 = 60, line 2 = 50 (total = 110 > 100)
    const order = await repo.createSalesOrder({
      orderNumber: 'SO-DUP-SKU',
      type: 'SALES_ORDER',
      warehouseId: 'WH-CHI',
      counterparty: 'MultiLine Testing Corp',
      totalAmount: 38390,
      items: [
        {
          id: 'line-1',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 60,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
        {
          id: 'line-2',
          sku: 'SEN-LIDAR-01',
          productName: 'Solid-State LiDAR Range Sensor 30m',
          quantity: 50,
          allocatedQuantity: 0,
          fulfilledQuantity: 0,
          unitPrice: 349,
        },
      ],
    });

    // Allocation must fail because total requested (110) > available (100)
    await expect(repo.allocateSalesOrder(order.id)).rejects.toThrow(InsufficientStockError);

    // Verify atomic guarantee: neither line item was allocated, available remains 100
    const item = await repo.getItemBySku('SEN-LIDAR-01');
    const chiStock = item!.warehouses['WH-CHI'];
    expect(chiStock.reserved).toBe(0);
    expect(chiStock.available).toBe(100);
    expect(chiStock.onHand).toBe(100);

    const reloadedOrder = await repo.getOrderById(order.id);
    expect(reloadedOrder!.status).toBe('PENDING');
    expect(reloadedOrder!.items[0].allocatedQuantity).toBe(0);
    expect(reloadedOrder!.items[1].allocatedQuantity).toBe(0);
  });

  // Test 2: Repository Boundary Input Validations
  it('validates safe integers, finite non-zero deltas, and valid quantities at repository boundaries', async () => {
    // Zero delta adjustment
    await expect(
      repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: 0, reason: 'Zero' })
    ).rejects.toThrow(ValidationError);

    // Non-integer float delta
    await expect(
      repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: 2.5, reason: 'Float' })
    ).rejects.toThrow(ValidationError);

    // NaN / Infinity delta
    await expect(
      repo.adjustStock({ sku: 'SEN-LIDAR-01', warehouseId: 'WH-CHI', delta: NaN, reason: 'NaN' })
    ).rejects.toThrow(ValidationError);

    // Transfer negative quantity
    await expect(
      repo.transferStock({
        sku: 'SEN-LIDAR-01',
        fromWarehouseId: 'WH-CHI',
        toWarehouseId: 'WH-RNO',
        quantity: -10,
        reason: 'Negative',
      })
    ).rejects.toThrow(ValidationError);

    // Transfer zero quantity
    await expect(
      repo.transferStock({
        sku: 'SEN-LIDAR-01',
        fromWarehouseId: 'WH-CHI',
        toWarehouseId: 'WH-RNO',
        quantity: 0,
        reason: 'Zero',
      })
    ).rejects.toThrow(ValidationError);

    // Transfer identical source and destination
    await expect(
      repo.transferStock({
        sku: 'SEN-LIDAR-01',
        fromWarehouseId: 'WH-CHI',
        toWarehouseId: 'WH-CHI',
        quantity: 10,
        reason: 'Same',
      })
    ).rejects.toThrow(ValidationError);

    // Create sales order with empty line items
    await expect(
      repo.createSalesOrder({
        orderNumber: 'SO-EMPTY',
        type: 'SALES_ORDER',
        warehouseId: 'WH-CHI',
        counterparty: 'Empty Corp',
        totalAmount: 0,
        items: [],
      })
    ).rejects.toThrow(ValidationError);

    // Create sales order with non-positive line item quantity
    await expect(
      repo.createSalesOrder({
        orderNumber: 'SO-INVALID-QTY',
        type: 'SALES_ORDER',
        warehouseId: 'WH-CHI',
        counterparty: 'Invalid Corp',
        totalAmount: 100,
        items: [
          {
            id: 'item-inv',
            sku: 'SEN-LIDAR-01',
            productName: 'LiDAR',
            quantity: 0,
            allocatedQuantity: 0,
            fulfilledQuantity: 0,
            unitPrice: 100,
          },
        ],
      })
    ).rejects.toThrow(ValidationError);
  });

  // Test 3: Unknown Warehouse Rejection
  it('rejects operations specifying non-existent warehouses with NotFoundError', async () => {
    // Adjust in non-existent warehouse
    await expect(
      repo.adjustStock({
        sku: 'SEN-LIDAR-01',
        warehouseId: 'WH-NONEXISTENT',
        delta: 10,
        reason: 'Bad WH',
      })
    ).rejects.toThrow(NotFoundError);

    // Transfer from non-existent warehouse
    await expect(
      repo.transferStock({
        sku: 'SEN-LIDAR-01',
        fromWarehouseId: 'WH-NONEXISTENT',
        toWarehouseId: 'WH-CHI',
        quantity: 10,
        reason: 'Bad source',
      })
    ).rejects.toThrow(NotFoundError);

    // Transfer to non-existent warehouse
    await expect(
      repo.transferStock({
        sku: 'SEN-LIDAR-01',
        fromWarehouseId: 'WH-CHI',
        toWarehouseId: 'WH-NONEXISTENT',
        quantity: 10,
        reason: 'Bad dest',
      })
    ).rejects.toThrow(NotFoundError);

    // Create order in non-existent warehouse
    await expect(
      repo.createSalesOrder({
        orderNumber: 'SO-BAD-WH',
        type: 'SALES_ORDER',
        warehouseId: 'WH-NONEXISTENT',
        counterparty: 'Corp',
        totalAmount: 349,
        items: [
          {
            id: 'item-1',
            sku: 'SEN-LIDAR-01',
            productName: 'LiDAR',
            quantity: 1,
            allocatedQuantity: 0,
            fulfilledQuantity: 0,
            unitPrice: 349,
          },
        ],
      })
    ).rejects.toThrow(NotFoundError);
  });

  // Test 4: Strict Order Lifecycle Guards & Repeated Receiving Protection
  it('enforces type-specific lifecycle guards and prohibits repeated purchase-order receiving', async () => {
    // Receive purchase order first time
    const received = await repo.receivePurchaseOrder('ord-po-001');
    expect(received.status).toBe('RECEIVED');

    // Attempt to receive already-received PO again -> throws InvalidOrderStateError
    await expect(repo.receivePurchaseOrder('ord-po-001')).rejects.toThrow(InvalidOrderStateError);

    // Attempt to receive a SALES_ORDER via receivePurchaseOrder -> throws InvalidOrderStateError
    await expect(repo.receivePurchaseOrder('ord-so-001')).rejects.toThrow(InvalidOrderStateError);

    // Attempt to allocate an unallocated PURCHASE_ORDER via allocateSalesOrder -> throws InvalidOrderStateError
    await expect(repo.allocateSalesOrder('ord-po-002')).rejects.toThrow(InvalidOrderStateError);

    // Attempt to fulfill a PENDING sales order directly without allocation -> throws InvalidOrderStateError
    await expect(repo.fulfillSalesOrder('ord-so-002')).rejects.toThrow(InvalidOrderStateError);

    // Attempt to allocate an already ALLOCATED sales order (ord-so-001 is seeded as ALLOCATED) -> throws InvalidOrderStateError
    await expect(repo.allocateSalesOrder('ord-so-001')).rejects.toThrow(InvalidOrderStateError);

    // Cancel the allocated order
    await repo.cancelSalesOrder('ord-so-001');

    // Attempt to cancel an already CANCELLED order -> throws InvalidOrderStateError
    await expect(repo.cancelSalesOrder('ord-so-001')).rejects.toThrow(InvalidOrderStateError);
  });

  // Test 5: Valuation Consistency (Dashboard === Sum of Warehouses === Sum of Categories)
  it('guarantees dashboard stock valuation equals the sum of warehouse valuations and category valuations on Cost Basis', async () => {
    const metrics = await repo.getDashboardMetrics();
    const warehouses = await repo.getWarehouses();
    const categories = await repo.getCategoryBreakdown();

    const sumWarehouseValuation = Math.round(
      warehouses.reduce((acc, w) => acc + w.totalValuation, 0) * 100
    ) / 100;
    const sumCategoryValuation = Math.round(
      categories.reduce((acc, c) => acc + c.valuation, 0) * 100
    ) / 100;

    // Baseline parity
    expect(metrics.totalStockValuation).toBe(sumWarehouseValuation);
    expect(metrics.totalStockValuation).toBe(sumCategoryValuation);

    // Mutate: positive adjustment (+50 units of SEN-LIDAR-01, unitCost $210)
    await repo.adjustStock({
      sku: 'SEN-LIDAR-01',
      warehouseId: 'WH-CHI',
      delta: 50,
      reason: 'Audit surplus',
    });

    const metricsAfter = await repo.getDashboardMetrics();
    const warehousesAfter = await repo.getWarehouses();
    const categoriesAfter = await repo.getCategoryBreakdown();

    const sumWarehouseAfter = Math.round(
      warehousesAfter.reduce((acc, w) => acc + w.totalValuation, 0) * 100
    ) / 100;
    const sumCategoryAfter = Math.round(
      categoriesAfter.reduce((acc, c) => acc + c.valuation, 0) * 100
    ) / 100;

    expect(metricsAfter.totalStockValuation).toBe(sumWarehouseAfter);
    expect(metricsAfter.totalStockValuation).toBe(sumCategoryAfter);
    expect(metricsAfter.totalStockValuation).toBe(metrics.totalStockValuation + 50 * 210);
  });

  // Test 6: Dependent Warehouse Metrics Dynamic Refresh
  it('dynamically refreshes warehouse capacity utilization, active SKU count, and total valuation after mutations', async () => {
    const whBefore = (await repo.getWarehouseById('WH-CHI'))!;
    const initialUtilized = whBefore.utilizedUnits;
    const initialValuation = whBefore.totalValuation;

    // Adjust +20 units of SEN-LIDAR-01 (unitCost: 210)
    await repo.adjustStock({
      sku: 'SEN-LIDAR-01',
      warehouseId: 'WH-CHI',
      delta: 20,
      reason: 'Capacity test',
    });

    const whAfter = (await repo.getWarehouseById('WH-CHI'))!;
    expect(whAfter.utilizedUnits).toBe(initialUtilized + 20);
    expect(whAfter.totalValuation).toBe(initialValuation + 20 * 210);
    expect(whAfter.utilizationPercentage).toBe(
      parseFloat(((whAfter.utilizedUnits / whAfter.capacityUnits) * 100).toFixed(1))
    );
  });

  // Test 7: Persistence Error Handling & Rollback
  it('surfaces storage persistence failures and rolls back in-memory state', async () => {
    const originalSetItem = window.localStorage.setItem;
    // Simulate localStorage QuotaExceededError or security failure
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError: LocalStorage limit reached');
    };

    try {
      await expect(
        repo.adjustStock({
          sku: 'SEN-LIDAR-01',
          warehouseId: 'WH-CHI',
          delta: 25,
          reason: 'Test quota failure',
        })
      ).rejects.toThrow(PersistenceError);

      // Verify in-memory state was rolled back and NOT permanently modified
      const lidar = await repo.getItemBySku('SEN-LIDAR-01');
      expect(lidar!.warehouses['WH-CHI'].onHand).toBe(100);
    } finally {
      window.localStorage.setItem = originalSetItem;
    }
  });
});
