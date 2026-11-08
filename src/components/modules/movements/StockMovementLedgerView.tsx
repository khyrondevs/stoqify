import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useMovementsQuery } from '@/hooks/useMovements';
import { MovementType } from '@/types/movement';
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
  Download,
  ArrowRight,
  Filter,
} from 'lucide-react';

const MOVEMENT_TYPES: Array<MovementType | 'ALL'> = [
  'ALL',
  'RECEIPT',
  'TRANSFER',
  'ADJUSTMENT',
  'DISPATCH',
];

export function StockMovementLedgerView() {
  const { selectedWarehouseId } = useApp();
  const [selectedType, setSelectedType] = useState<MovementType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: movements, isLoading } = useMovementsQuery({
    type: selectedType === 'ALL' ? undefined : selectedType,
    warehouseId: selectedWarehouseId,
  });

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    if (!searchQuery.trim()) return movements;
    const q = searchQuery.toLowerCase().trim();
    return movements.filter(
      (m) =>
        m.referenceNumber.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.operator.toLowerCase().includes(q)
    );
  }, [movements, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredMovements || filteredMovements.length === 0) return;
    const headers = ['Reference Number', 'Timestamp', 'Type', 'SKU', 'Product Name', 'Quantity', 'Source', 'Destination', 'Reason', 'Operator'];
    const rows = filteredMovements.map((m) => [
      m.referenceNumber,
      m.timestamp,
      m.type,
      m.sku,
      `"${m.productName.replace(/"/g, '""')}"`,
      m.quantity,
      m.sourceWarehouseId || '',
      m.destinationWarehouseId || '',
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${m.operator.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stoqify-movement-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.75rem)] p-4 space-y-3 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Stock Movement Ledger</h1>
            <span className="rounded bg-warm-100 border border-warm-200 px-2 py-0.5 font-mono text-[11px] text-slate-600">
              Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transaction history of stock receipts, cross-dock transfers, cycle counts, and customer dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search reference, SKU, operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-white border-warm-200"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs border-warm-300"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Audit Log</span>
          </Button>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-1.5 border-b border-warm-200 pb-2">
        <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
        {MOVEMENT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedType === type
                ? 'bg-slate-900 text-white font-medium shadow-3xs'
                : 'bg-warm-100 text-slate-600 hover:bg-warm-200'
            }`}
          >
            {type === 'ALL' ? 'All Transactions' : type}
          </button>
        ))}
        {selectedWarehouseId !== 'ALL' && (
          <span className="ml-auto text-[11px] font-mono text-slate-500 bg-warm-100 border border-warm-200 px-2 py-0.5 rounded">
            Filtered by: {selectedWarehouseId}
          </span>
        )}
      </div>

      {/* Ledger Table Container */}
      <div className="flex-1 overflow-auto rounded-lg border border-warm-200/90 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Reference</TableHead>
              <TableHead className="w-36">Timestamp</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-32">SKU</TableHead>
              <TableHead>Specification</TableHead>
              <TableHead className="w-24 text-right">Delta Qty</TableHead>
              <TableHead className="w-40">Facility Route</TableHead>
              <TableHead>Reason / Memo</TableHead>
              <TableHead className="w-40">Operator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                  Loading movement transactions...
                </TableCell>
              </TableRow>
            ) : filteredMovements.length ? (
              filteredMovements.map((m) => {
                const isPositive = m.quantity > 0;
                return (
                  <TableRow key={m.id} className="hover:bg-warm-50/50">
                    <TableCell className="font-mono font-semibold text-slate-800 text-[11px]">
                      {m.referenceNumber}
                    </TableCell>

                    <TableCell className="font-mono text-[11px] text-slate-500">
                      {new Date(m.timestamp).toLocaleDateString()}{' '}
                      <span className="text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          m.type === 'RECEIPT'
                            ? 'success'
                            : m.type === 'TRANSFER'
                            ? 'default'
                            : m.type === 'DISPATCH'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px] py-0 px-1.5"
                      >
                        {m.type}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono font-semibold text-slate-900 text-xs">
                      {m.sku}
                    </TableCell>

                    <TableCell className="max-w-[200px] truncate text-slate-700" title={m.productName}>
                      {m.productName}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-xs">
                      <span
                        className={
                          isPositive
                            ? 'text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60'
                            : 'text-slate-800 bg-warm-100 px-1.5 py-0.5 rounded border border-warm-200/80'
                        }
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </TableCell>

                    <TableCell className="font-mono text-[11px] text-slate-600">
                      {m.sourceWarehouseId && m.destinationWarehouseId ? (
                        <span className="flex items-center gap-1">
                          <span>{m.sourceWarehouseId}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span>{m.destinationWarehouseId}</span>
                        </span>
                      ) : m.destinationWarehouseId ? (
                        <span>→ {m.destinationWarehouseId}</span>
                      ) : m.sourceWarehouseId ? (
                        <span>{m.sourceWarehouseId} → Out</span>
                      ) : (
                        <span>—</span>
                      )}
                    </TableCell>

                    <TableCell className="max-w-[220px] truncate text-slate-600 text-xs" title={m.reason}>
                      {m.reason}
                    </TableCell>

                    <TableCell className="text-[11px] text-slate-500 truncate" title={m.operator}>
                      {m.operator}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                  No stock movement records found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Total Audit Entries: <b className="text-slate-800 font-mono">{filteredMovements.length}</b>
        </span>
        <span className="font-mono text-[11px] text-slate-400">Deterministic Transaction Audit Ledger</span>
      </div>
    </div>
  );
}
