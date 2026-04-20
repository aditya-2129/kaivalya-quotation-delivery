"use client";

import React, { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { THEME } from '@/constants/ui';

const PdfPreviewModal = ({ 
  isOpen, 
  onClose, 
  pdfDoc, 
  url,
  title = "Document Preview",
  filename = "document.pdf"
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (url) {
        setPdfUrl(url);
        setLoading(false);
      } else if (pdfDoc) {
        setLoading(true);
        try {
          const blob = pdfDoc.output('blob');
          const previewUrl = URL.createObjectURL(blob);
          setPdfUrl(previewUrl);
        } catch (err) {
          console.error("Failed to generate PDF URL:", err);
        } finally {
          setLoading(false);
        }
      }
    }

    return () => {
      if (pdfUrl && !url) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, pdfDoc, url]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (pdfDoc) {
      pdfDoc.save(filename);
    } else if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full h-full flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 m-0 rounded-0' : 'max-w-5xl max-h-[90vh] rounded-none md:rounded-[32px] border border-zinc-200'}`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-tight text-zinc-950 leading-none">{title}</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{filename}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-10 w-10 hidden md:flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
              title={isFullscreen ? "Minimize" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 h-10 flex items-center gap-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-all font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-brand-primary/20"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <div className="w-px h-6 bg-zinc-200 mx-1" />
            <button 
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-zinc-100 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Generating Preview...</p>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-none"
              title="PDF Preview"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Failed to load preview</p>
            </div>
          )}
        </div>

        {/* Mobile Footer Toggle */}
        <div className="md:hidden p-4 border-t border-zinc-100 bg-white flex justify-center">
            <button 
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-zinc-950 text-white font-bold text-[11px] uppercase tracking-widest"
            >
              Close Preview
            </button>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
