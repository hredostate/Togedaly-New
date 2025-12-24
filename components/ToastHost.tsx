
// FIX: Import PropsWithChildren to create a more robust component type
import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from "react";
import type { ToastMessage } from "../types";

interface ToastContextType {
  add: (toast: Omit<ToastMessage, 'id'>) => void;
  remove: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType>({
  add: () => {},
  remove: () => {},
});

export function useToasts() {
  return useContext(ToastContext);
}

const Toast: React.FC<{ message: ToastMessage; onRemove: (id: string) => void }> = ({ message, onRemove }) => {
    return (
        <div className="rounded-xl border border-brand-100 bg-white shadow-lg p-3 animate-fade-in-right">
            <div className="flex items-start gap-3">
                <div className="text-2xl pt-1">{message.emoji ?? "🥳"}</div>
                <div className="flex-1">
                    <div className="font-semibold text-gray-800">{message.title}</div>
                    <div className="text-sm text-gray-600">{message.desc}</div>
                </div>
                <button 
                    className="text-gray-400 hover:text-gray-700 transition-colors" 
                    onClick={() => message.id && onRemove(message.id)}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

// FIX: Refactor component to use React.FC and PropsWithChildren for robust children typing.
export const ToastHost: React.FC<PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const add = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setItems((currentItems) => [...currentItems, { id, ...toast }]);
    
    // HAPTIC FEEDBACK: Trigger a short vibration on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50); // 50ms "tick" feeling
    }

    // CELEBRATION TRIGGER: Fire confetti for specific emojis
    if (['🎉', '🚀', '💸'].includes(toast.emoji)) {
        window.dispatchEvent(new CustomEvent('trigger-confetti'));
    }

    setTimeout(() => remove(id), toast.timeout ?? 5000);
  }, [remove]);

  const value = { add, remove };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-50 top-4 right-4 space-y-2 w-full max-w-sm">
        {items.map((t) => (
          <Toast key={t.id} message={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
