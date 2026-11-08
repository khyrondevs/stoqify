import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useInventoryQuery } from '@/hooks/useInventory';
import { useMovementsQuery } from '@/hooks/useMovements';
import { Product, StockStatus } from '@/types/inventory';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Sliders,
  ArrowRightLeft,
  Download,
  X,
  Building2,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = [
  'ALL',
  'Optics & Vision',
  'Embedded Compute',
  'Motion Control',
  'Robotics & Actuation',
  'Industrial Networking',
  'Power & Distribution',
  'Sensors & Instrumentation',
  'Cabling & Interconnect',
];

export function InventoryCatalogView() {
  const { selectedWarehouseId, openModal } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  const { data: products, isLoading } = useInventoryQuery({
    category: selectedCategory,
    warehouseId: selectedWarehouseId,
    search: searchQuery,
  });

  const { data: allMovements } = useMovementsQuery();

  // Filtered by status
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (statusFilter === 'ALL') return products;
    return products.filter((p) => p.status === statusFilter);
  }, [products, statusFilter]);

  // Selected item detail
  const activeProduct = useMemo(() => {
    return products?.find((p) => p.sku === selectedSku) || null;
  }, [products, selectedSku]);

  const activeSkuMovements = useMemo(() => {
    if (!selectedSku || !allMovements) return [];
    return allMovements.filter((m) => m.sku.toUpperCase() === selectedSku.toUpperCase()).slice(0, 8);
  }, [selectedSku, allMovements]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredProducts || filteredProducts.length === 0) return;
    const headers = ['SKU', 'Name', 'Category', 'Total OnHand', 'Total Reserved', 'Total Available', 'Unit Cost', 'Retail Price', 'Status'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.totalOnHand,
      p.totalReserved,
      p.totalAvailable,
      p.unitCost,
      p.retailPrice,
      p.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stoqify-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table Column Definitions
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-900 hover:text-cobalt-600 transition-colors">
            {row.original.sku}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Product Specification',
        cell: ({ row }) => (
          <div className="max-w-[240px]">
            <div className="font-medium text-slate-800 truncate" title={row.original.name}>
              {row.original.name}
            </div>
            <div className="text-[10px] text-slate-400">{row.original.category}</div>
          </div>
        ),
      },
      {
        id: 'location',
        header: 'Warehouse Bin',
        cell: ({ row }) => {
          const whId = selectedWarehouseId !== 'ALL' ? selectedWarehouseId : 'WH-CHI';
          const wh = row.original.warehouses[whId];
          return (
            <span className="font-mono text-[11px] text-slate-600 bg-warm-100/80 px-1.5 py-0.5 rounded border border-warm-200">
              {wh?.binLocation || 'A-01-01'}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalOnHand',
        header: () => <span className="text-right block">On-Hand</span>,
        cell: ({ row }) => {
          const qty =
            selectedWarehouseId !== 'ALL'
              ? row.original.warehouses[selectedWarehouseId]?.onHand ?? 0
              : row.original.totalOnHand;
          return <span className="font-mono font-semibold text-slate-900 block text-right">{qty}</span>;
        },
      },
      {
        accessorKey: 'totalReserved',
        header: () => <span className="text-right block">Reserved</span>,
        cell: ({ row }) => {
          const res =
            selectedWarehouseId !== 'ALL'
              ? row.original.warehouses[selectedWarehouseId]?.reserved ?? 0
              : row.original.totalReserved;
          return (
            <span className={`font-mono text-right block ${res > 0 ? 'text-amber-700 font-semibold' : 'text-slate-400'}`}>
              {res}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalAvailable',
        header: () => <span className="text-right block">Available</span>,
        cell: ({ row }) => {
          const avail =
            selectedWarehouseId !== 'ALL'
              ? row.original.warehouses[selectedWarehouseId]?.available ?? 0
              : row.original.totalAvailable;
          return (
            <span
              className={`font-mono font-bold text-right block ${
                avail <= 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {avail}
            </span>
          );
        },
      },
      {
        accessorKey: 'unitCost',
        header: () => <span className="text-right block">Unit Cost</span>,
        cell: ({ row }) => (
          <span className="font-mono text-slate-500 text-right block text-[11px]">
            {formatCurrency(row.original.unitCost)}
          </span>
        ),
      },
      {
        accessorKey: 'retailPrice',
        header: () => <span className="text-right block">Retail Price</span>,
        cell: ({ row }) => (
          <span className="font-mono font-medium text-slate-800 text-right block text-xs">
            {formatCurrency(row.original.retailPrice)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => (
          <span>
            Stock Status{' '}
            <span className="text-[10px] font-normal text-slate-400">
              {selectedWarehouseId !== 'ALL' ? `(${selectedWarehouseId})` : '(Global)'}
            </span>
          </span>
        ),
        cell: ({ row }) => {
          const isFacility = selectedWarehouseId !== 'ALL';
          const whStock = isFacility ? row.original.warehouses[selectedWarehouseId] : undefined;
          const status = (isFacility ? whStock?.status || 'OUT_OF_STOCK' : row.original.status) as StockStatus;

          return (
            <div className="flex flex-col gap-0.5">
              <Badge
                variant={
                  status === 'IN_STOCK'
                    ? 'inStock'
                    : status === 'LOW_STOCK'
                    ? 'lowStock'
                    : status === 'CRITICAL'
                    ? 'critical'
                    : 'outOfStock'
                }
              >
                {status.replace('_', ' ')}
              </Badge>
              {isFacility && (
                <span className="text-[9px] text-slate-400 pl-0.5">
                  Global: {row.original.status.replace('_', ' ')}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="text-right block">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSku(row.original.sku);
              }}
              className="h-6 text-[11px] px-2"
            >
              Details
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={(e) => {
                e.stopPropagation();
                openModal({
                  type: 'ADJUST_STOCK',
                  sku: row.original.sku,
                  warehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : 'WH-CHI',
                });
              }}
              className="h-6 w-6 text-slate-500 hover:text-slate-800"
              title="Adjust Stock"
            >
              <Sliders className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
    ],
    [selectedWarehouseId, openModal]
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="flex h-[calc(100vh-4.75rem)] overflow-hidden">
      {/* Main Table Grid View */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Inventory Catalog</h1>
            <p className="text-xs text-slate-500">
              {filteredProducts.length} items cataloged across {selectedWarehouseId === 'ALL' ? 'all network hubs' : selectedWarehouseId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Filter by SKU, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white border-warm-200"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center rounded-md border border-warm-200 bg-white p-0.5 text-xs">
              {['ALL', 'LOW_STOCK', 'CRITICAL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-warm-100 text-slate-900 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs border-warm-300"
              title="Export filtered records as CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Category Horizontal Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-warm-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-2.5 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-cobalt-600 text-white font-medium shadow-3xs'
                  : 'bg-warm-100/80 text-slate-600 hover:bg-warm-200/80'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* TanStack Table Container */}
        <div className="flex-1 overflow-auto rounded-lg border border-warm-200/90 bg-white shadow-xs">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="cursor-pointer select-none">
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp className="h-3 w-3 text-cobalt-600" />,
                          desc: <ChevronDown className="h-3 w-3 text-cobalt-600" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400">
                    Loading inventory records...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.original.sku === selectedSku ? 'selected' : undefined}
                    onClick={() => setSelectedSku(row.original.sku)}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400">
                    No catalog items found matching your filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 shrink-0">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredProducts.length
              )}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{filteredProducts.length}</span> SKUs
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="font-mono text-[11px] px-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-Over Drawer for Detailed SKU Breakdown */}
      {activeProduct && (
        <aside className="w-96 border-l border-warm-200 bg-white flex flex-col h-full shadow-lg z-20 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-warm-200 p-4 bg-warm-50/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900">{activeProduct.sku}</span>
                <Badge
                  variant={
                    activeProduct.status === 'IN_STOCK'
                      ? 'inStock'
                      : activeProduct.status === 'LOW_STOCK'
                      ? 'lowStock'
                      : 'critical'
                  }
                  className="text-[10px] py-0 px-1.5"
                >
                  {activeProduct.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[260px] mt-0.5">
                {activeProduct.name}
              </div>
            </div>

            <button
              onClick={() => setSelectedSku(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-warm-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Aggregate Overview Card */}
            <div className="rounded-lg border border-warm-200 bg-warm-50/70 p-3 space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Network Stock Totals
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-white p-2 border border-warm-200/80 shadow-3xs">
                  <div className="text-[10px] text-slate-400">Total On-Hand</div>
                  <div className="font-mono text-base font-bold text-slate-900">
                    {activeProduct.totalOnHand}
                  </div>
                </div>
                <div className="rounded bg-white p-2 border border-warm-200/80 shadow-3xs">
                  <div className="text-[10px] text-slate-400">Reserved</div>
                  <div className="font-mono text-base font-bold text-amber-700">
                    {activeProduct.totalReserved}
                  </div>
                </div>
                <div className="rounded bg-white p-2 border border-warm-200/80 shadow-3xs">
                  <div className="text-[10px] text-slate-400">Available</div>
                  <div className="font-mono text-base font-bold text-emerald-700">
                    {activeProduct.totalAvailable}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions in Drawer */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs border-warm-300"
                onClick={() =>
                  openModal({
                    type: 'ADJUST_STOCK',
                    sku: activeProduct.sku,
                    warehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : 'WH-CHI',
                  })
                }
              >
                <Sliders className="h-3 w-3" />
                <span>Adjust Count</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs border-warm-300"
                onClick={() =>
                  openModal({
                    type: 'TRANSFER_STOCK',
                    sku: activeProduct.sku,
                    fromWarehouseId: 'WH-CHI',
                    toWarehouseId: 'WH-RNO',
                  })
                }
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>Transfer Units</span>
              </Button>
            </div>

            {/* Warehouse Allocation Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Facility Breakdown</span>
                </span>
                <span className="text-[10px] text-slate-400">4 Warehouses</span>
              </div>

              <div className="space-y-1.5">
                {Object.values(activeProduct.warehouses).map((wh) => (
                  <div
                    key={wh.warehouseId}
                    className="p-2.5 rounded-md border border-warm-200 bg-white space-y-1 shadow-3xs"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{wh.warehouseId}</span>
                        {wh.status && (
                          <Badge
                            variant={
                              wh.status === 'IN_STOCK'
                                ? 'inStock'
                                : wh.status === 'LOW_STOCK'
                                ? 'lowStock'
                                : wh.status === 'CRITICAL'
                                ? 'critical'
                                : 'outOfStock'
                            }
                            className="text-[9px] py-0 px-1.5 h-4"
                          >
                            {wh.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 bg-warm-100 px-1.5 py-0.2 rounded">
                        Bin: {wh.binLocation}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-600">
                      <span>On-Hand: <b>{wh.onHand}</b></span>
                      <span>Reserved: <b className="text-amber-700">{wh.reserved}</b></span>
                      <span>Available: <b className="text-emerald-700">{wh.available}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials & Reorder Rules */}
            <div className="space-y-2 border-t border-warm-200 pt-3">
              <div className="text-[11px] font-semibold text-slate-700">Procurement & Pricing</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                <div className="p-2 rounded bg-warm-50 border border-warm-200/60">
                  <div className="text-slate-400 text-[10px]">Unit Cost:</div>
                  <div className="font-mono font-semibold text-slate-800">
                    {formatCurrency(activeProduct.unitCost)}
                  </div>
                </div>
                <div className="p-2 rounded bg-warm-50 border border-warm-200/60">
                  <div className="text-slate-400 text-[10px]">Retail Price:</div>
                  <div className="font-mono font-semibold text-slate-800">
                    {formatCurrency(activeProduct.retailPrice)}
                  </div>
                </div>
                <div className="p-2 rounded bg-warm-50 border border-warm-200/60">
                  <div className="text-slate-400 text-[10px]">Safety Reorder Min:</div>
                  <div className="font-mono font-semibold text-slate-800">
                    {activeProduct.safetyStock} units
                  </div>
                </div>
                <div className="p-2 rounded bg-warm-50 border border-warm-200/60">
                  <div className="text-slate-400 text-[10px]">Lead Time:</div>
                  <div className="font-mono font-semibold text-slate-800">
                    {activeProduct.leadTimeDays} days
                  </div>
                </div>
              </div>
            </div>

            {/* SKU Transaction Audit History */}
            <div className="space-y-2 border-t border-warm-200 pt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  <span>Audit Ledger for {activeProduct.sku}</span>
                </span>
              </div>

              {activeSkuMovements.length > 0 ? (
                <div className="space-y-1.5">
                  {activeSkuMovements.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded border border-warm-200 bg-warm-50/50 text-[11px] space-y-0.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-semibold text-slate-800">{m.referenceNumber}</span>
                        <span
                          className={`font-mono font-bold ${
                            m.quantity > 0 ? 'text-teal-700' : 'text-slate-800'
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </div>
                      <div className="text-slate-500 truncate">{m.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.timestamp).toLocaleDateString()} by {m.operator}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-[11px] py-2 text-center">
                  No movement transactions recorded for this SKU yet.
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
