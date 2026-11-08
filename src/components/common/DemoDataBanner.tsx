import { useApp } from '@/context/AppContext';
import { Database, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DemoDataBanner() {
  const { openModal } = useApp();

  return (
    <div className="flex h-7 w-full items-center justify-between border-b border-amber-200/90 bg-amber-50/80 px-3 text-[11px] text-amber-900 select-none">
      <div className="flex items-center gap-1.5">
        <Database className="h-3 w-3 text-amber-700" />
        <span className="font-semibold tracking-wide uppercase text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300/80">
          Demo Mode
        </span>
        <span className="text-amber-800">
          Standalone demonstration dataset with local state persistence. Not connected to production commerce APIs.
        </span>
      </div>

      <Button
        variant="ghost"
        size="xs"
        className="h-5 text-amber-900 hover:bg-amber-200/60 hover:text-amber-950 gap-1 text-[11px]"
        onClick={() => openModal({ type: 'RESET_CONFIRM' })}
      >
        <RotateCcw className="h-2.5 w-2.5" />
        <span>Reset Seed Data</span>
      </Button>
    </div>
  );
}
