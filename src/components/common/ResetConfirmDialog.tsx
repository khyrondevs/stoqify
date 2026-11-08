import { useApp } from '@/context/AppContext';
import { repositories, QUERY_KEYS } from '@/repositories';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function ResetConfirmDialog() {
  const { modalState, closeModal, addToast } = useApp();
  const queryClient = useQueryClient();
  const isOpen = modalState.type === 'RESET_CONFIRM';

  const handleReset = () => {
    repositories.resetDemoData();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.warehouses });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.velocity });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });

    addToast({
      title: 'Demo State Restored',
      description: 'Pristine seed catalog, warehouse allocations, and audit ledger have been reloaded.',
      variant: 'default',
    });
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-50 text-amber-600">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Reset Demonstration Fixtures</DialogTitle>
              <DialogDescription>
                Reload initial catalog, warehouse allocations, and test orders.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs text-slate-600 leading-relaxed">
          This will wipe any experimental stock adjustments, transfers, and test orders stored in your local session, returning STOQIFY to its deterministic client presentation state.
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeModal}>
            Keep Current State
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo State</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
