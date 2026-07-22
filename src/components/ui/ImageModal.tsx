'use client';

import { useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageModal({ isOpen, imageUrl, onClose }: ImageModalProps) {
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

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 md:-right-12 text-white hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img 
          src={imageUrl} 
          alt="Podgląd pełnoekranowy" 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
