'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export interface QrLabelItem {
  id: string;
  title: string;
  subtitle?: string;
  code: string; // ID or payload
  shortCode?: string | null;
  typeLabel: 'Maszyna' | 'Rejon';
}

interface QrCodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: QrLabelItem;
  items?: QrLabelItem[];
}

export function QrCodeLabelModal({
  isOpen,
  onClose,
  item,
  items,
}: QrCodeLabelModalProps) {
  const labelList: QrLabelItem[] = items && items.length > 0 ? items : item ? [item] : [];

  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || labelList.length === 0) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateAll = async () => {
      const urls: Record<string, string> = {};
      for (const target of labelList) {
        const payload = target.shortCode
          ? `${target.typeLabel}: ${target.shortCode} (${target.title})\nID: ${target.code}`
          : `${target.typeLabel}: ${target.title}\nID: ${target.code}`;

        try {
          const url = await QRCode.toDataURL(payload, {
            margin: 1,
            errorCorrectionLevel: 'M',
            width: 600,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          urls[target.id] = url;
        } catch (err) {
          console.error(`Błąd generowania QR dla ${target.title}:`, err);
        }
      }
      if (isMounted) {
        setQrDataUrls(urls);
        setIsGenerating(false);
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [isOpen, labelList.length]);

  if (!isOpen || labelList.length === 0) return null;

  const currentItem = labelList[selectedIndex] || labelList[0];

  // Helper do przycinania tekstu z wielokropkiem (...) jeśli przekracza podany rozmiar na Canvas
  const fitCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    let str = text;
    if (ctx.measureText(str).width <= maxWidth) return str;
    while (str.length > 0 && ctx.measureText(str + '...').width > maxWidth) {
      str = str.slice(0, -1);
    }
    return str + '...';
  };

  // Precyzyjny helper do generowania wysokiej jakości etykiety PNG 7.5x7.5 cm (750x750 px) bez nachodzenia tekstu
  const generateLabelCanvas = async (targetItem: QrLabelItem): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 750;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Czyste białe tło
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 750, 750);

    // Zaokrąglona ramka z marginesem (zostawia 70px czystego zapasu od krawędzi)
    const margin = 70;
    const boxSize = 750 - margin * 2; // 610 px
    const radius = 32;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(margin, margin, boxSize, boxSize, radius);
    ctx.stroke();

    const maxTextWidth = 530; // bezpieczna szerokość tekstu wewnątrz ramki

    // 1. GŁÓWNY WYŚWIETLAJĄCY PUNKT — SYNONIM LUB NAZWA
    const rawMainText = (targetItem.shortCode || targetItem.title).toUpperCase();
    
    // Dynamiczny dobór wielkości czcionki w zależności od długości tekstu
    let fontSize = 32;
    if (rawMainText.length > 12 && rawMainText.length <= 20) fontSize = 24;
    if (rawMainText.length > 20) fontSize = 20;

    ctx.fillStyle = '#0f172a';
    ctx.font = `900 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    
    const formattedMainText = fitCanvasText(ctx, rawMainText, maxTextWidth);
    ctx.fillText(formattedMainText, 375, 128);

    // Pełna nazwa (pomocnicza, pod spodem synonimu jeśli synonim istnieje)
    if (targetItem.shortCode) {
      ctx.font = '600 18px sans-serif';
      ctx.fillStyle = '#475569';
      const formattedTitle = fitCanvasText(ctx, targetItem.title, maxTextWidth);
      ctx.fillText(formattedTitle, 375, 154);
    }

    // 2. Kod QR (odpowiednio przesunięty i zmniejszony, aby zachować odstęp od tekstu)
    const url = qrDataUrls[targetItem.id];
    if (url) {
      const qrImage = new Image();
      qrImage.src = url;
      await new Promise((resolve) => (qrImage.onload = resolve));

      const qrSize = targetItem.shortCode ? 380 : 400;
      const qrX = (750 - qrSize) / 2;
      const qrY = targetItem.shortCode ? 168 : 148;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    }

    // 3. Stopka informacyjna na dole (zawsze w bezpiecznym odstępie przed dolną ramką)
    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = '#64748b';
    const footerText = `${targetItem.typeLabel.toUpperCase()}${targetItem.subtitle ? ` • ${targetItem.subtitle}` : ''}`;
    const formattedFooter = fitCanvasText(ctx, footerText, maxTextWidth);
    ctx.fillText(formattedFooter, 375, 635);

    return canvas.toDataURL('image/png');
  };

  // Pobieranie pojedynczej etykiety PNG
  const handleDownloadSinglePng = async (targetItem: QrLabelItem) => {
    const dataUrl = await generateLabelCanvas(targetItem);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `Etykieta_QR_${targetItem.shortCode || targetItem.title.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Pobieranie wszystkich etykiet PNG
  const handleDownloadAllPng = async () => {
    for (let i = 0; i < labelList.length; i++) {
      const targetItem = labelList[i];
      await handleDownloadSinglePng(targetItem);
      await new Promise((r) => setTimeout(r, 250));
    }
  };

  // Pobieranie pliku PDF A4 z etykietami w dokładnej siatce 3x4 (dla pojedynczej etykiety lub zbiorczo)
  const handleDownloadPdf = async (singleItem?: QrLabelItem) => {
    const listToExport = singleItem ? [singleItem] : labelList;
    if (listToExport.length === 0) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const labelsPerPage = 12;
    const colWidth = 60; // 6 cm
    const rowHeight = 62; // 6.2 cm
    const startX = 10;
    const startY = 10;
    const gapX = 4;
    const gapY = 5;

    for (let i = 0; i < listToExport.length; i++) {
      const indexOnPage = i % labelsPerPage;

      if (i > 0 && indexOnPage === 0) {
        pdf.addPage('a4', 'portrait');
      }

      const col = indexOnPage % 3;
      const row = Math.floor(indexOnPage / 3);

      const x = startX + col * (colWidth + gapX);
      const y = startY + row * (rowHeight + gapY);

      const dataUrl = await generateLabelCanvas(listToExport[i]);
      if (dataUrl) {
        pdf.addImage(dataUrl, 'PNG', x, y, colWidth, rowHeight);
      }
    }

    const fileName = singleItem
      ? `Etykieta_QR_${singleItem.shortCode || singleItem.title.replace(/\s+/g, '_')}_A4.pdf`
      : `Wszystkie_Etykiety_QR_A4.pdf`;

    pdf.save(fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. Modal Ekranowy w Portalu */}
      {createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            {/* Nagłówek modalu */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>📱</span> {labelList.length > 1 ? `Etykiety QR (${labelList.length} szt.)` : `Etykieta QR dla ${currentItem.typeLabel}`}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Format druku / PDF: <strong className="text-brand-600">Siatka 3x4 na A4 (12 etykiet / strona)</strong>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Nawigacja jeśli wybrano zbiorczo */}
            {labelList.length > 1 && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 px-4 rounded-xl text-xs">
                <button
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedIndex === 0}
                  className="px-3 py-1 bg-white dark:bg-slate-700 font-bold rounded-lg disabled:opacity-40 border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  ← Poprzednia
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Etykieta {selectedIndex + 1} z {labelList.length}: <strong className="text-brand-600">{currentItem.shortCode || currentItem.title}</strong>
                </span>
                <button
                  onClick={() => setSelectedIndex((prev) => Math.min(labelList.length - 1, prev + 1))}
                  disabled={selectedIndex === labelList.length - 1}
                  className="px-3 py-1 bg-white dark:bg-slate-700 font-bold rounded-lg disabled:opacity-40 border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  Następna →
                </button>
              </div>
            )}

            {/* Podgląd Etykiety 7.5 cm x 7.5 cm */}
            <div className="flex flex-col items-center justify-center py-3 bg-slate-100 dark:bg-slate-950 rounded-2xl p-4 overflow-hidden">
              <div
                className="bg-white text-slate-900 flex flex-col items-center justify-between shadow-xl relative overflow-hidden"
                style={{
                  width: '7.5cm',
                  height: '7.5cm',
                  padding: '0.4cm',
                  boxSizing: 'border-box',
                }}
              >
                <div className="w-full h-full border-2 border-slate-900 rounded-2xl flex flex-col items-center justify-between p-2 relative bg-white overflow-hidden">
                  <div className="text-center w-full pt-1 px-1">
                    <div className="text-lg font-black text-slate-900 tracking-wider uppercase truncate max-w-[6.2cm]">
                      {currentItem.shortCode || currentItem.title}
                    </div>
                    {currentItem.shortCode && (
                      <div className="text-xs font-bold text-slate-600 truncate max-w-[6.2cm] mt-0.5">
                        {currentItem.title}
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-center bg-white my-1"
                    style={{ width: '4.2cm', height: '4.2cm' }}
                  >
                    {qrDataUrls[currentItem.id] ? (
                      <img
                        src={qrDataUrls[currentItem.id]}
                        alt={`Kod QR`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="animate-pulse text-xs text-slate-400">Generowanie QR...</div>
                    )}
                  </div>

                  <div className="text-center w-full pb-1 px-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-[6.2cm]">
                      {currentItem.typeLabel} {currentItem.subtitle ? `• ${currentItem.subtitle}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Opcje Pobierania i Drukowania */}
            <div className="space-y-2 pt-1">
              {/* Opcje PNG */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadSinglePng(currentItem)}
                  disabled={isGenerating}
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>💾</span> Pobierz tę etykietę (PNG 7.5x7.5 cm)
                </button>
                {labelList.length > 1 && (
                  <button
                    onClick={handleDownloadAllPng}
                    disabled={isGenerating}
                    className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>📦</span> Pobierz wszystkie PNG
                  </button>
                )}
              </div>

              {/* Opcje PDF w Siatce 3x4 A4 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPdf(currentItem)}
                  disabled={isGenerating}
                  className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>📄</span> Pobierz tę etykietę w PDF A4 (Siatka 3x4)
                </button>
                {labelList.length > 1 && (
                  <button
                    onClick={() => handleDownloadPdf()}
                    disabled={isGenerating}
                    className="flex-1 py-2.5 px-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>📑</span> Pobierz WSZYSTKIE w PDF A4 (Siatka 3x4)
                  </button>
                )}
              </div>

              {/* Przycisk Drukowania */}
              <button
                onClick={handlePrint}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>🖨️</span> Drukuj {labelList.length > 1 ? `Wszystkie (${labelList.length} szt. — Siatka 3x4 A4)` : 'Etykietę (Siatka 3x4 A4)'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Dedykowana struktura druku w Portalu document.body */}
      {createPortal(
        <div className="print-root-container">
          {labelList.map((targetItem) => (
            <div key={`print-${targetItem.id}`} className="print-card-item">
              <div className="w-full h-full border-[1.5px] border-slate-900 rounded-xl flex flex-col items-center justify-between p-1 box-border bg-white overflow-hidden">
                <div className="text-center w-full pt-1 px-1">
                  <div className="text-[11px] font-black text-slate-900 tracking-wider uppercase leading-none truncate max-w-[5.2cm]">
                    {targetItem.shortCode || targetItem.title}
                  </div>
                  {targetItem.shortCode && (
                    <div className="text-[8px] font-bold text-slate-600 truncate max-w-[5.2cm] mt-0.5 leading-tight">
                      {targetItem.title}
                    </div>
                  )}
                </div>

                <div
                  className="flex items-center justify-center bg-white my-0.5"
                  style={{ width: '3.3cm', height: '3.3cm' }}
                >
                  {qrDataUrls[targetItem.id] && (
                    <img
                      src={qrDataUrls[targetItem.id]}
                      alt={`Kod QR`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="text-center w-full pb-1 px-1">
                  <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider leading-none truncate max-w-[5.2cm]">
                    {targetItem.typeLabel} {targetItem.subtitle ? `• ${targetItem.subtitle}` : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Reguły drukowania */}
      <style jsx global>{`
        .print-root-container {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 4mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
          }
          body > *:not(.print-root-container) {
            display: none !important;
          }
          .print-root-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            text-align: center !important;
          }
          .print-root-container * {
            visibility: visible !important;
          }
          .print-card-item {
            width: 5.9cm !important;
            height: 5.5cm !important;
            margin: 1.5mm 1mm !important;
            padding: 1mm !important;
            box-sizing: border-box !important;
            display: inline-block !important;
            vertical-align: top !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            break-inside: avoid-page !important;
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}
