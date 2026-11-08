import { useApp } from '@/context/AppContext';
import { useWarehousesQuery } from '@/hooks/useWarehouses';
import {
  Search,
  Building2,
  Plus,
  ArrowRightLeft,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

export function Topbar() {
  const {
    selectedWarehouseId,
    setSelectedWarehouseId,
    setIsCommandPaletteOpen,
    openModal,
  } = useApp();
  const { data: warehouses } = useWarehousesQuery();

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-warm-200 bg-white px-4 select-none shrink-0 z-10">
      {/* Left: Global Warehouse Selector & Location Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-500" />
          <div className="w-56">
            <Select
              value={selectedWarehouseId}
              onValueChange={(val) => setSelectedWarehouseId(val)}
            >
              <SelectTrigger className="h-8 bg-warm-50/70 border-warm-200 text-xs font-medium">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <span className="font-semibold text-cobalt-700">All Warehouses (Global View)</span>
                </SelectItem>
                {warehouses?.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    <span className="font-medium">{wh.name}</span>{' '}
                    <span className="text-slate-400 font-mono text-[11px]">({wh.id})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Middle: Command Palette Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex h-8 w-full items-center justify-between rounded-md border border-warm-200 bg-warm-50/80 px-3 text-xs text-slate-400 hover:border-warm-300 hover:bg-warm-100/60 transition-colors shadow-2xs"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">Search catalog, SKUs, bin locations, orders...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-warm-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 shadow-3xs">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action Buttons & Demo Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium border-warm-300"
          onClick={() =>
            openModal({
              type: 'ADJUST_STOCK',
              sku: 'SEN-LIDAR-01',
              warehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : 'WH-CHI',
            })
          }
        >
          <Sliders className="h-3.5 w-3.5 text-slate-600" />
          <span>Adjust Stock</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium border-warm-300"
          onClick={() =>
            openModal({
              type: 'TRANSFER_STOCK',
              fromWarehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : 'WH-CHI',
              toWarehouseId: 'WH-RNO',
            })
          }
        >
          <ArrowRightLeft className="h-3.5 w-3.5 text-slate-600" />
          <span>Transfer</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          className="gap-1.5 text-xs font-medium bg-cobalt-600 hover:bg-cobalt-700 shadow-xs"
          onClick={() =>
            openModal({
              type: 'CREATE_SALES_ORDER',
              defaultWarehouseId: selectedWarehouseId !== 'ALL' ? selectedWarehouseId : 'WH-CHI',
            })
          }
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Order</span>
        </Button>

        {/* Overflow Menu for Reset / Secondary Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="iconSm" className="text-slate-500 hover:text-slate-800 ml-1">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-md border border-warm-200 bg-white p-1 text-slate-800 shadow-md text-xs z-50"
          >
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Demonstration State
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
              onClick={() => openModal({ type: 'RESET_CONFIRM' })}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo State</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 h-px bg-warm-100" />
            <div className="px-2 py-1 text-[10px] text-slate-400">
              LocalStorage snapshot engine
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
