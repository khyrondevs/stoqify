import { DemoRepository } from './demo/DemoRepository';

export const demoRepository = new DemoRepository();

export const repositories = {
  inventory: demoRepository,
  movement: demoRepository,
  order: demoRepository,
  warehouse: demoRepository,
  analytics: demoRepository,
  resetDemoData: () => demoRepository.resetDemoData(),
};

export const QUERY_KEYS = {
  inventory: ['inventory'] as const,
  inventoryDetail: (sku: string) => ['inventory', sku] as const,
  movements: ['movements'] as const,
  orders: ['orders'] as const,
  warehouses: ['warehouses'] as const,
  dashboard: ['dashboard'] as const,
  velocity: ['velocity'] as const,
  categories: ['categories'] as const,
};
