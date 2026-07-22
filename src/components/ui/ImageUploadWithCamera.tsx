'use client';

import { useState, useRef } from 'react';
import { CameraModal } from '@/components/ui/CameraModal';
import { useToast } from '@/context/ToastContext';

interface ImageUploadWithCameraProps {
  value?: string | string[] | null;
  onChange: (urls: string | null) => void;
  label?: string;
  maxPhotos?: number;
  className?: string;
}

function parseUrls(val?: string | string[] | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    if (val.startsWith('[')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {}
    }
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function ImageUploadWithCamera({
  value,
  onChange,
  label = 'Zdjęcia / Załączniki',
  maxPhotos = 4,
  className = '',
}: ImageUploadWithCameraProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const currentPhotos = parseUrls(value);

  const handleFileUpload = async (files: FileList | File[]) => {
    const remainingSlots = maxPhotos - currentPhotos.length;
    if (remainingSlots <= 0) {
      showToast(`Maksymalna liczba zdjęć to ${maxPhotos}`, 'error');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Błąd wgrywania pliku');
        uploadedUrls.push(data.url);
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }

    setIsUploading(false);

    if (uploadedUrls.length > 0) {
      const updated = [...currentPhotos, ...uploadedUrls];
      onChange(updated.join(','));
      showToast(`Dodano ${uploadedUrls.length} zdjęcie/zdjęcia!`, 'success');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleCameraCapture = (url: string) => {
    if (currentPhotos.length >= maxPhotos) {
      showToast(`Maksymalna liczba zdjęć to ${maxPhotos}`, 'error');
      return;
    }
    const updated = [...currentPhotos, url];
    onChange(updated.join(','));
  };

  const removePhoto = (indexToRemove: number) => {
    const updated = currentPhotos.filter((_, idx) => idx !== indexToRemove);
    onChange(updated.length > 0 ? updated.join(',') : null);
    showToast('Zdjęcie zostało usunięte', 'info');
  };

  const openCamera = () => {
    if (currentPhotos.length >= maxPhotos) {
      showToast(`Osiągnięto maksymalny limit ${maxPhotos} zdjęć`, 'error');
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      setIsCameraModalOpen(true);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <span className="text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
            {currentPhotos.length} z {maxPhotos} zdjęć
          </span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Thumbnails Grid (Up to 4 Photos) */}
      {currentPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl animate-in fade-in">
          {currentPhotos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-xs bg-slate-900"
            >
              <img
                src={url}
                alt={`Zdjęcie ${idx + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Photo Index Badge */}
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 text-white font-extrabold text-[10px] rounded-full backdrop-blur-xs">
                #{idx + 1}
              </span>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xs font-black shadow-md transition-all cursor-pointer"
                title="Usuń to zdjęcie"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons Container */}
      {currentPhotos.length < maxPhotos ? (
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Camera Button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={openCamera}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="text-base">📷</span>
            <span>
              {isUploading
                ? 'Wgrywanie...'
                : currentPhotos.length > 0
                ? `+ Zrób kolejne zdjęcie (${currentPhotos.length}/${maxPhotos})`
                : 'Zrób zdjęcie aparatem'}
            </span>
          </button>

          {/* Gallery / File Picker Button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="text-base">📁</span>
            <span>Wybierz z galerii ({maxPhotos - currentPhotos.length} wolne)</span>
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <span>✅</span>
          <span>Załączono maksymalną liczbę {maxPhotos} zdjęć.</span>
        </div>
      )}

      {/* Live WebRTC Camera Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
