import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Standard in Shadcn/ui

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  message = "AI is thinking...", 
  className 
}: LoadingOverlayProps) {
  return (

        <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 animate-pulse">
              {message}
            </p>
          </div>
        </div>
  );
}