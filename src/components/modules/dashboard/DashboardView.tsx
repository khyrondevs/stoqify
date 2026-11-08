import { useApp } from '@/context/AppContext';
import { useDashboardMetricsQuery, useVelocityTrendsQuery, useCategoryBreakdownQuery } from '@/hooks/useAnalytics';
import { useInventoryQuery } from '@/hooks/useInventory';
import { useMovementsQuery } from '@/hooks/useMovements';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Truck,
  ArrowRight,
  Sliders,
  ArrowLeftRight,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export function DashboardView() {
  const { setActiveView, openModal } = useApp();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetricsQuery();
  const { data: velocityTrends } = useVelocityTrendsQuery();
  const { data: categories } = useCategoryBreakdownQuery();
  const { data: products } = useInventoryQuery();
  const { data: movements } = useMovementsQuery();

  // Find attention items (LOW_STOCK or CRITICAL)
  const attentionItems = products
    ?.filter((p) => p.status === 'LOW_STOCK' || p.status === 'CRITICAL' || p.status === 'OUT_OF_STOCK')
    .slice(0, 5);

  const recentMovements = movements?.slice(0, 5);

  return (
    <div className="space-y-4 p-5 max-w-7xl mx-auto">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-warm-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Executive Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Network asset valuation, facility stock distribution, and order allocation telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('inventory')}
            className="text-xs gap-1 border-warm-300"
          >
            <span>Catalog Grid</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => openModal({ type: 'CREATE_SALES_ORDER' })}
            className="text-xs gap-1 bg-cobalt-600 hover:bg-cobalt-700 shadow-xs"
          >
            <span>New Order</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: Total Valuation */}
        <Card className="border-warm-200/90 shadow-2xs hover:border-warm-300 transition-colors">
          <CardHeader className="p-3.5 pb-2">
            <CardDescription className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Total Valuation</span>
              <TrendingUp className="h-3.5 w-3.5 text-cobalt-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-slate-900 mt-1">
              {metricsLoading ? '...' : formatCurrency(metrics?.totalStockValuation || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold flex items-center font-mono">
              <ArrowUpRight className="h-3 w-3" /> 4.2%
            </span>
            <span>vs previous period</span>
          </CardContent>
        </Card>

        {/* KPI 2: Active SKUs */}
        <Card className="border-warm-200/90 shadow-2xs hover:border-warm-300 transition-colors">
          <CardHeader className="p-3.5 pb-2">
            <CardDescription className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Active SKUs</span>
              <Package className="h-3.5 w-3.5 text-slate-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-slate-900 mt-1">
              {metricsLoading ? '...' : formatNumber(metrics?.totalActiveSkus || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Across 4 hub facilities</span>
            <span className="font-mono text-[10px] text-slate-400">100% Active</span>
          </CardContent>
        </Card>

        {/* KPI 3: Low Stock Alerts */}
        <Card
          className="border-warm-200/90 shadow-2xs hover:border-amber-300 transition-colors cursor-pointer"
          onClick={() => setActiveView('inventory')}
        >
          <CardHeader className="p-3.5 pb-2">
            <CardDescription className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Reorder Triggers</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-amber-900 mt-1">
              {metricsLoading ? '...' : formatNumber(metrics?.lowStockAlertsCount || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[11px] text-amber-800 flex items-center justify-between">
            <span>Below safety margin</span>
            <span className="text-[10px] text-amber-700 font-medium underline">View List →</span>
          </CardContent>
        </Card>

        {/* KPI 4: Pending Dispatch */}
        <Card className="border-warm-200/90 shadow-2xs hover:border-warm-300 transition-colors">
          <CardHeader className="p-3.5 pb-2">
            <CardDescription className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Reserved Units</span>
              <Clock className="h-3.5 w-3.5 text-cobalt-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-slate-900 mt-1">
              {metricsLoading ? '...' : formatNumber(metrics?.pendingDispatchUnits || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Awaiting fulfillment</span>
            <span className="font-mono text-[10px] text-cobalt-700">Allocated</span>
          </CardContent>
        </Card>

        {/* KPI 5: Inbound on Way */}
        <Card className="border-warm-200/90 shadow-2xs hover:border-warm-300 transition-colors">
          <CardHeader className="p-3.5 pb-2">
            <CardDescription className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center justify-between">
              <span>Inbound POs</span>
              <Truck className="h-3.5 w-3.5 text-teal-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-teal-900 mt-1">
              {metricsLoading ? '...' : formatNumber(metrics?.inboundUnitsOnTheWay || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 text-[11px] text-teal-800 flex items-center justify-between">
            <span>Units scheduled delivery</span>
            <span
              className="text-[10px] text-teal-700 font-medium underline cursor-pointer"
              onClick={() => setActiveView('orders')}
            >
              View POs →
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section: Velocity Trends and Category Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Velocity Trend Area Chart */}
        <Card className="lg:col-span-2 border-warm-200/90 shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-warm-100 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Inventory Velocity & Turnover</CardTitle>
                <span className="rounded bg-warm-100 border border-warm-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                  Demo Baseline Model
                </span>
              </div>
              <CardDescription>
                14-day trailing benchmark model for inbound shipments vs outbound customer dispatches.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-teal-700">
                <span className="h-2 w-2 rounded-full bg-teal-500" /> Inbound Units
              </span>
              <span className="flex items-center gap-1.5 text-cobalt-700">
                <span className="h-2 w-2 rounded-full bg-cobalt-600" /> Outbound Dispatches
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-3">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eae8df" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7a7465' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7a7465' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#eae8df',
                      fontSize: '11px',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inboundUnits"
                    name="Inbound Received"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#inboundGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outboundUnits"
                    name="Outbound Dispatched"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#outboundGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Valuation Bar Chart */}
        <Card className="border-warm-200/90 shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-warm-100">
            <CardTitle>Valuation by Category</CardTitle>
            <CardDescription>Stored inventory asset value breakdown</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories?.slice(0, 5) || []}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eae8df" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: '#7a7465' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 10, fill: '#433f37' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <RechartsTooltip
                    formatter={(val: any) => formatCurrency(Number(val) || 0)}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#eae8df',
                      fontSize: '11px',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="valuation" name="Valuation ($)" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Reorder Watchlist & Recent Movement Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Critical Reorder Watchlist */}
        <Card className="border-warm-200/90 shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-warm-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Critical Stock Watchlist</span>
              </CardTitle>
              <CardDescription>
                SKUs approaching or below safety reorder thresholds.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setActiveView('inventory')}
              className="text-xs"
            >
              View Catalog
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-warm-100 text-xs">
              {attentionItems?.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between hover:bg-warm-50/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900">{item.sku}</span>
                      <Badge
                        variant={item.status === 'CRITICAL' ? 'critical' : 'lowStock'}
                        className="text-[10px] py-0 px-1.5"
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.name}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {item.totalOnHand} <span className="text-slate-400 font-normal">/ {item.safetyStock} min</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.totalAvailable} available
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        openModal({
                          type: 'ADJUST_STOCK',
                          sku: item.sku,
                          warehouseId: 'WH-CHI',
                        })
                      }
                      className="h-7 text-xs gap-1"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>Adjust</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Ledger Snapshot */}
        <Card className="border-warm-200/90 shadow-2xs">
          <CardHeader className="p-4 pb-2 border-b border-warm-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-slate-600" />
                <span>Recent Audit Transactions</span>
              </CardTitle>
              <CardDescription>
                Chronological ledger of stock receipts, transfers, and dispatches.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setActiveView('movements')}
              className="text-xs"
            >
              Full Ledger
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-warm-100 text-xs">
              {recentMovements?.map((m) => {
                const isPositive = m.quantity > 0;
                return (
                  <div key={m.id} className="p-3 flex items-center justify-between hover:bg-warm-50/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold text-slate-800">
                          {m.referenceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        <span className="font-mono font-medium text-slate-700">{m.sku}</span> — {m.reason}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          m.type === 'RECEIPT'
                            ? 'success'
                            : m.type === 'TRANSFER'
                            ? 'default'
                            : m.type === 'ADJUSTMENT'
                            ? 'secondary'
                            : 'warning'
                        }
                        className="text-[10px] py-0 px-1.5"
                      >
                        {m.type}
                      </Badge>
                      <span
                        className={`font-mono font-bold text-xs ${
                          isPositive ? 'text-teal-700' : 'text-slate-800'
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
