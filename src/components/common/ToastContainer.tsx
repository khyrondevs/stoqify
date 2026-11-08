import { useApp } from '@/context/AppContext';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClasses = 'border-warm-200 bg-white text-slate-900';

        if (toast.variant === 'success') {
          Icon = CheckCircle2;
          colorClasses = 'border-teal-300 bg-white text-slate-900 shadow-md';
        } else if (toast.variant === 'destructive') {
          Icon = AlertCircle;
          colorClasses = 'border-red-300 bg-white text-slate-900 shadow-md';
        } else if (toast.variant === 'warning') {
          Icon = AlertTriangle;
          colorClasses = 'border-amber-300 bg-white text-slate-900 shadow-md';
        }

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-lg border p-3 shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200 text-xs',
              colorClasses
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 mt-0.5',
                toast.variant === 'success' && 'text-teal-600',
                toast.variant === 'destructive' && 'text-red-600',
                toast.variant === 'warning' && 'text-amber-600',
                (!toast.variant || toast.variant === 'default') && 'text-cobalt-600'
              )}
            />
            <div className="flex-1 space-y-0.5">
              <div className="font-semibold text-slate-900">{toast.title}</div>
              {toast.description && <div className="text-slate-600 text-[11px]">{toast.description}</div>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 rounded p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
