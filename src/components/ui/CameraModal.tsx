'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (url: string) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setLoading(true);
    stopCamera();

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }
    } catch (err: any) {
      console.warn('Nie udało się uruchomić podglądu WebRTC kamery:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
      if (!blob) {
        showToast('Nie udało się wygenerować zdjęcia z aparatu', 'error');
        return;
      }

      setIsUploading(true);
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Błąd wgrywania zdjęcia');

        showToast('📷 Zdjęcie zrobione pomyślnie!', 'success');
        onCapture(data.url);
        stopCamera();
        onClose();
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleMobileNativeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('📷 Zdjęcie zrobione pomyślnie!', 'success');
      onCapture(data.url);
      stopCamera();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl text-white overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📷</span>
            <h3 className="font-extrabold text-base sm:text-lg">Aparat Fotograficzny</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Video Frame */}
        <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 space-y-3">
              <span className="text-4xl animate-bounce block">📷</span>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {loading ? 'Uruchamianie aparatu...' : 'Podgląd wideo niedostępny lub zablokowany.'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Użyj natywnego aparatu w telefonie
              </button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Camera Flip Button */}
          {stream && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Przełącz aparat (przód / tył)"
            >
              🔄 Zmień aparat
            </button>
          )}

          {/* Fallback Native Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleMobileNativeCapture}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            📁 Wybierz plik
          </button>

          {/* Take Snapshot Shutter Button */}
          {stream && (
            <button
              type="button"
              disabled={isUploading}
              onClick={takeSnapshot}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <span>⏳ Zapisywanie...</span>
              ) : (
                <>
                  <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                  <span>📷 Zrób zdjęcie</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
