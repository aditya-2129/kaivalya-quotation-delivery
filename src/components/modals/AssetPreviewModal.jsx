import React from 'react';
import { assetService } from '@/services/assets';
import { Layers, FileDown, CheckCircle2, AlertCircle, Maximize2, Minimize2, X, Image as ImageIcon, FileText } from 'lucide-react';

const AssetPreviewModal = ({ isOpen, onClose, file }) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  if (!isOpen || !file) return null;

  const getFileUrl = (file) => {
    if (file instanceof File) return URL.createObjectURL(file);
    if (file.localPreview) return file.localPreview;
    if (file.$id) return assetService.getFileView(file.$id);
    return file.url || ''; 
  };

  const fileUrl = getFileUrl(file);
  const downloadUrl = file.$id ? assetService.getFileDownload(file.$id) : fileUrl;
  const fileName = file.name || file.filename || 'Unknown File';
  const fileSize = file.size || file.sizeOriginal || 0;
  const fileType = file.type || file.mimeType || '';

  const isImage = fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|svg)$/i);
  const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isCAD = fileName.match(/\.(stp|step|igs|iges|stl|obj|dwg|dxf)$/i);

  const renderContent = () => {
    if (isImage) {
      return (
        <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
          <img 
            src={fileUrl} 
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none animate-in fade-in zoom-in-95 duration-500"
            onError={(e) => {
              if (e.target.src.includes('blob:') && file.$id) {
                e.target.src = assetService.getFileView(file.$id)?.toString();
              }
            }}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <iframe 
          src={`${fileUrl}#view=FitH`}
          className="w-full h-full border-0 bg-white"
          title={fileName}
        />
      );
    }

    if (isCAD) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-brand-primary/10 rounded-[32px] blur-2xl group-hover:bg-brand-primary/20 transition-all duration-500" />
            <div className="relative h-24 w-24 bg-zinc-800 rounded-[32px] flex items-center justify-center text-zinc-500 border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-primary/30" />
              <Layers className="h-10 w-10 text-brand-primary" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-zinc-900 flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">ENGINEERING ASSET</h3>
          <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed">
            This technical asset (<span className="text-white font-bold">{fileName.split('.').pop().toUpperCase()}</span>) is encrypted for manufacturing precision and requires local CAD software for review.
          </p>
          
          <a 
            href={downloadUrl} 
            download={fileName}
            className="group relative h-14 px-12 rounded-2xl bg-brand-primary text-zinc-950 text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl hover:shadow-brand-primary/20 hover:scale-[1.02] active:scale-95"
          >
            <FileDown className="h-5 w-5" />
            SECURE DOWNLOAD
          </a>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg">
        <div className="h-20 w-20 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-6">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-black text-white mb-2">BINARY FRAGMENT</h3>
        <p className="text-zinc-500 text-sm mb-8">This file format does not support in-browser preview.</p>
        <a 
          href={downloadUrl} 
          download={fileName}
          className="px-8 py-4 bg-zinc-800 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-zinc-700 transition-all"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className={`relative bg-zinc-900 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 ring-1 ring-white/10 transition-all ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden'}`}>
        {/* Header */}
        <header className="px-6 py-4 border-b border-white/5 bg-zinc-950/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center text-brand-primary border border-white/5 shrink-0">
              {isImage ? <ImageIcon className="h-5 w-5" /> : isPdf ? <FileText className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-white text-[13px] font-black uppercase tracking-widest truncate">{fileName}</h3>
              <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-tight">
                {(fileSize / 1024 / 1024).toFixed(2)} MB • {isCAD ? 'CAD Model' : 'Document'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all border border-white/5"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button 
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-red-500 transition-all border border-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* content */}
        <div className="flex-1 bg-[#09090b] flex items-center justify-center relative overflow-hidden">
          {renderContent()}
        </div>
        
        {/* Footer */}
        {!isFullscreen && (
          <footer className="px-6 py-2 bg-zinc-950/50 border-t border-white/5 flex justify-center shrink-0">
            <span className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.3em]">Precision Engineering Assets Registry • SG.CLOUD.V1</span>
          </footer>
        )}
      </div>
    </div>
  );
};

export default AssetPreviewModal;
