'use client';

import { useEffect } from 'react';

interface DocumentModalProps {
  isOpen: boolean;
  documentUrl: string | null;
  onClose: () => void;
}

export function DocumentModal({ isOpen, documentUrl, onClose }: DocumentModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !documentUrl) return null;

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(documentUrl);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 z-50 shadow-md cursor-pointer"
          title="Zamknij podgląd"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {isImage ? (
          <img 
            src={documentUrl} 
            alt="Podgląd dokumentu" 
            className="max-w-full max-h-full object-contain p-8"
          />
        ) : (
          <iframe 
            src={documentUrl} 
            className="w-full h-full border-0 bg-white dark:bg-slate-900"
            title="Podgląd dokumentu"
          />
        )}
      </div>
    </div>
  );
}
