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

  const isPdf = documentUrl.toLowerCase().endsWith('.pdf');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {isPdf ? (
          <iframe 
            src={documentUrl} 
            className="w-full h-full border-0"
            title="Podgląd dokumentu"
          />
        ) : (
          <img 
            src={documentUrl} 
            alt="Podgląd dokumentu" 
            className="max-w-full max-h-full object-contain p-8"
          />
        )}
      </div>
    </div>
  );
}
