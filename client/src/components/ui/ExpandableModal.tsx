import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  accent?: string;          // məs: 'text-accent-cyan'
  children: ReactNode;
}

const ExpandableModal = ({ open, onClose, title, subtitle, accent = 'text-accent-cyan', children }: Props) => {
  // ESC ilə bağlanma
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8
                 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[95vw] h-[90vh] rounded-2xl
                   bg-bg-primary border border-border shadow-2xl
                   flex flex-col overflow-hidden animate-slide-up"
      >
        {/* Başlıq */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-card/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1 h-4 rounded-full bg-current ${accent}`} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-100 truncate">
                {title || 'Detallı görünüş'}
              </div>
              {subtitle && (
                <div className="text-[10px] text-gray-500 truncate">{subtitle}</div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                       text-gray-400 hover:text-gray-100 hover:bg-bg-hover
                       transition-colors"
            title="Bağla (ESC)"
          >
            <span className="hidden md:inline">ESC</span>
            <X size={14} />
          </button>
        </div>

        {/* Məzmun */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExpandableModal;