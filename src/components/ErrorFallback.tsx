import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorFallbackProps {
  title: string;
  message: string;
}

export function ErrorFallback({ title, message }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-md rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center text-red-100"
    >
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-300" />
      <p className="mb-2 font-bold">{title}</p>
      <p className="mb-4 text-sm text-red-100/80">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
      >
        <RotateCw className="h-4 w-4" />
        再読み込み
      </button>
    </div>
  );
}
