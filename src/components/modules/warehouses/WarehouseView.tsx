import { useApp } from '@/context/AppContext';
import { useWarehousesQuery } from '@/hooks/useWarehouses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Warehouse as WarehouseIcon,
  Boxes,
  ArrowRightLeft,
  MapPin,
  Layers,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function WarehouseView() {
  const { setSelectedWarehouseId, setActiveView, openModal } = useApp();
  const { data: warehouses, isLoading } = useWarehousesQuery();

  const handleFilterInventory = (whId: string) => {
    setSelectedWarehouseId(whId);
    setActiveView('inventory');
  };

  const handleTransfer = (fromWhId: string) => {
    const toWhId = fromWhId === 'WH-CHI' ? 'WH-RNO' : 'WH-CHI';
    openModal({
      type: 'TRANSFER_STOCK',
      fromWarehouseId: fromWhId,
      toWarehouseId: toWhId,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.75rem)] p-4 space-y-4 max-w-7xl mx-auto w-full overflow-y-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-warm-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Warehouse Logistics Hubs</h1>
            <span className="rounded bg-warm-100 border border-warm-200 px-2 py-0.5 font-mono text-[11px] text-slate-600">
              4 Active Facilities
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time bin occupancy, facility asset valuations, and inter-hub transfer management.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() =>
            openModal({
              type: 'TRANSFER_STOCK',
              fromWarehouseId: 'WH-CHI',
              toWarehouseId: 'WH-RNO',
            })
          }
          className="gap-1.5 text-xs bg-cobalt-600 hover:bg-cobalt-700 shadow-xs"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>New Stock Transfer</span>
        </Button>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-400">Loading facility telemetry...</div>
        ) : (
          warehouses?.map((wh) => {
            const isHighUtil = wh.utilizationPercentage > 70;

            return (
              <Card
                key={wh.id}
                className="border-warm-200/90 shadow-2xs hover:border-warm-300 transition-colors overflow-hidden"
              >
                {/* Header */}
                <CardHeader className="p-4 pb-3 border-b border-warm-100 bg-warm-50/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-100/80">
                        <WarehouseIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-bold text-slate-900">{wh.name}</CardTitle>
                          <span className="font-mono text-[11px] font-semibold text-slate-500 bg-warm-100 px-1.5 py-0.2 rounded border border-warm-200">
                            {wh.id}
                          </span>
                        </div>
                        <CardDescription className="flex items-center gap-1 text-slate-500 mt-0.5 text-xs">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{wh.location}</span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Stored Asset Valuation <span className="font-normal lowercase text-[9px] text-slate-400">(cost basis)</span>
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(wh.totalValuation)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Capacity Utilization Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">Volumetric Utilization</span>
                      <span className="font-mono font-bold text-slate-900">
                        {wh.utilizationPercentage}%{' '}
                        <span className="text-slate-400 font-normal">
                          ({formatNumber(wh.utilizedUnits)} / {formatNumber(wh.capacityUnits)} units)
                        </span>
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-warm-100 overflow-hidden border border-warm-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHighUtil ? 'bg-amber-500' : 'bg-cobalt-600'
                        }`}
                        style={{ width: `${wh.utilizationPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-md border border-warm-100 bg-warm-50/60 space-y-0.5">
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Active Catalog SKUs</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {wh.activeSkuCount} SKUs
                      </div>
                    </div>

                    <div className="p-2.5 rounded-md border border-warm-100 bg-warm-50/60 space-y-0.5">
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Active Storage Zones</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {wh.zones.length} Zones
                      </div>
                    </div>
                  </div>

                  {/* Zones Breakdown */}
                  <div className="space-y-1.5 border-t border-warm-100 pt-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="h-3 w-3 text-slate-400" />
                      <span>Dedicated Facility Zones</span>
                    </div>

                    <div className="space-y-1">
                      {wh.zones.map((zone) => {
                        const zoneUtil = Math.round((zone.binsOccupied / zone.binCapacity) * 100);
                        return (
                          <div
                            key={zone.code}
                            className="flex items-center justify-between p-1.5 rounded bg-warm-50/50 text-[11px]"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-700 bg-white px-1 py-0.2 rounded border border-warm-200">
                                {zone.code}
                              </span>
                              <span className="text-slate-600">{zone.name}</span>
                            </div>
                            <div className="font-mono text-slate-500">
                              <b>{zone.binsOccupied}</b> / {zone.binCapacity} bins ({zoneUtil}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-warm-100 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterInventory(wh.id)}
                      className="gap-1.5 text-xs border-warm-300"
                    >
                      <Boxes className="h-3.5 w-3.5 text-slate-600" />
                      <span>Inspect Inventory ({wh.id})</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransfer(wh.id)}
                      className="gap-1.5 text-xs text-cobalt-700 border-cobalt-200 hover:bg-cobalt-50"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>Transfer From Hub</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
