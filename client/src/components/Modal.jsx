import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className={`card-panel relative my-4 w-full ${sizes[size]} max-h-[calc(100dvh-2rem)] overflow-y-auto animate-scale-in shadow-card-hover`}
      >
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-700">
          <div>
            <div className="gold-divider mb-2" />
            <h2 className="font-display text-xl font-bold text-navy dark:text-gold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-navy dark:hover:bg-slate-700 dark:hover:text-gold"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
