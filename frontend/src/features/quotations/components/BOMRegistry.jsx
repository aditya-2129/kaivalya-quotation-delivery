'use client';

import React, { useState } from 'react';
import AssetPreviewModal from '@/components/modals/AssetPreviewModal';
import { FeaturePanel } from '@/components/ui/FeaturePanel';
import { useAssets } from '@/hooks/useAssets';
import { assetService } from '@/services/assets';
import { Trash2 , Plus, ImageIcon, FileText } from 'lucide-react';

/**
 * BOMRegistry Feature Component
 * Manages the list of parts/components in a quotation.
 */
const BOMRegistry = ({
  formData,
  setFormData,
  activePhase,
  setActivePhase,
  panelIndex = 2,
  onError,
}) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [uploadingItems, setUploadingItems] = useState(new Set());
  const { uploadFile, uploadFiles, deleteFile, getPreviewUrl } = useAssets();

  const setItemUploading = (itemId, val) =>
    setUploadingItems((prev) => {
      const next = new Set(prev);
      val ? next.add(itemId) : next.delete(itemId);
      return next;
    });

  const getPartImageSrc = (item) => {
    if (!item.part_image?.$id) return null;
    if (item.part_image.localPreview) return item.part_image.localPreview;
    const errState = imageErrors[item.id];
    if (errState === 'view') return assetService.getFileView(item.part_image.$id)?.toString() || null;
    if (errState === 'failed') return null;
    return getPreviewUrl(item.part_image.$id) || null;
  };

  const handlePartImageError = (itemId) => {
    setImageErrors((prev) => {
      if (prev[itemId] === 'failed') return prev;
      return { ...prev, [itemId]: prev[itemId] === 'view' ? 'failed' : 'view' };
    });
  };

  const addPart = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          part_name: `Part ${String(prev.items.length + 1).padStart(2, '0')}`,
          qty: 1,
          processes: [],
          bought_out_items: [],
          design_files: [],
          part_image: null,
          material: null,
          material_weight: 0,
        },
      ],
    }));
  };

  const removePart = async (index, e) => {
    e.stopPropagation();
    if (formData.items.length <= 1) return;

    const targetItem = formData.items[index];
    if (targetItem?.design_files?.length > 0) {
      await Promise.all(
        targetItem.design_files.map(async (file) => {
          if (file.$id) await deleteFile(file.$id);
        })
      );
    }

    if (targetItem?.part_image?.$id) {
      await deleteFile(targetItem.part_image.$id);
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, updates) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  };

  const isExpanded = activePhase === 'bom';

  return (
    <FeaturePanel
      index={panelIndex}
      title="Parts"
      countLabel={`${formData.items.length} Components Configured`}
      isExpanded={isExpanded}
      onToggle={() => setActivePhase(isExpanded ? '' : 'bom')}
      actionButton={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addPart();
          }}
          className="h-8 w-40 rounded-xl bg-brand-primary text-zinc-950 text-[10.5px] font-black uppercase tracking-tight shadow-xl shadow-brand-primary/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 border border-brand-primary/20"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          ADD PART +
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-100 italic">
              <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-16 text-center">
                No.
              </th>
              <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-24 text-center">
                Part Image
              </th>
              <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                Component Name <span className="text-red-500 font-extrabold">*</span>
              </th>
              <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">
                Quantity <span className="text-red-500 font-extrabold">*</span>
              </th>
              <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                Blueprints / Drawings
              </th>
              <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                Date
              </th>
              <th className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center w-24">
                Ops
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {formData.items.map((item, idx) => (
              <tr
                key={item.id}
                className="group transition-all duration-300 bg-white hover:bg-zinc-50"
              >
                <td className="px-3 py-2 text-center">
                  <span className="text-[10px] font-black font-mono text-zinc-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id={`part-image-${item.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setItemUploading(item.id, true);
                        try {
                          const uploadedFile = await uploadFile(file);
                          updateItem(idx, {
                            part_image: {
                              ...uploadedFile,
                              localPreview: URL.createObjectURL(file),
                            },
                          });
                        } catch (err) {
                          onError?.('Failed to upload part snapshot. ' + err.message);
                        } finally {
                          setItemUploading(item.id, false);
                          if (e.target) e.target.value = '';
                        }
                      }}
                    />
                    {item.part_image ? (
                      <div className="relative group/img flex-shrink-0">
                        <div
                          className="h-14 w-14 rounded-xl border-2 border-zinc-200 bg-zinc-50 overflow-hidden shadow-sm-inset cursor-pointer"
                          onClick={() => setPreviewFile(item.part_image)}
                        >
                          <img
                            src={getPartImageSrc(item)}
                            onError={imageErrors[item.id] !== 'failed' ? () => handlePartImageError(item.id) : undefined}
                            alt="Part"
                            className="h-full w-full object-cover transition-transform group-hover/img:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (item.part_image?.$id) await deleteFile(item.part_image.$id);
                            updateItem(idx, { part_image: null });
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 shadow-lg opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all z-20 scale-75 group-hover/img:scale-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor={`part-image-${item.id}`}
                        className="relative h-14 w-14 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 flex flex-col items-center justify-center gap-0.5 text-zinc-300 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer group/upload overflow-hidden flex-shrink-0"
                      >
                        {uploadingItems.has(item.id) && (
                          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center">
                            <div className="h-3 w-3 border-[1.5px] border-brand-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-0 group-hover/upload:opacity-100 transition-opacity">
                          Snap
                        </span>
                      </label>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="relative group/input max-w-sm">
                    <input
                      className="bg-transparent border-b border-dashed border-zinc-200 hover:border-brand-primary focus:border-brand-primary focus:border-solid outline-none font-black text-[13px] py-0.5 w-full text-zinc-900 transition-all cursor-text"
                      placeholder="Enter Name (e.g. Shaft, Plate)..."
                      value={item.part_name}
                      onChange={(e) => updateItem(idx, { part_name: e.target.value })}
                    />
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    min="1"
                    className="w-18 h-8 bg-zinc-50 border border-zinc-200 rounded-lg px-2 text-center text-[12px] font-black outline-none focus:ring-1 focus:ring-brand-primary transition-all font-mono shadow-sm"
                    value={item.qty ?? 1}
                    onChange={(e) => updateItem(idx, { qty: parseInt(e.target.value) || 1 })}
                  />
                </td>
                <td className="px-4 py-3 max-w-[320px]">
                  <input
                    type="file"
                    id={`drawing-${item.id}`}
                    className="hidden"
                    multiple
                    accept=".pdf,.stp,.step,.dwg,.dxf"
                    disabled={uploadingItems.has(item.id)}
                    onChange={async (e) => {
                      const selectedFiles = Array.from(e.target.files || []);
                      if (selectedFiles.length === 0) return;
                      setItemUploading(item.id, true);
                      try {
                        const uploadedFiles = await uploadFiles(selectedFiles);
                        updateItem(idx, {
                          design_files: [...(item.design_files || []), ...uploadedFiles],
                        });
                      } catch (err) {
                        onError?.('Failed to upload assets. ' + err.message);
                      } finally {
                        setItemUploading(item.id, false);
                        if (e.target) e.target.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    {item.design_files?.map((file, fIdx) => {
                      const isCAD = ['.stp', '.step', '.dwg', '.dxf'].some((ext) =>
                        file.name?.toLowerCase().endsWith(ext)
                      );
                      const baseName = file.name?.replace(/\.[^/.]+$/, '') ?? '';
                      const ext = file.name?.split('.').pop()?.toUpperCase() ?? '';
                      return (
                        <div key={fIdx} className="relative group/file">
                          <div
                            onClick={() => setPreviewFile(file)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer active:scale-95 ${
                              isCAD
                                ? 'bg-cyan-50 border-cyan-200 hover:border-cyan-400'
                                : 'bg-red-50 border-red-200 hover:border-red-400'
                            }`}
                          >
                            {isCAD ? (
                              <svg className="h-3 w-3 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            ) : (
                              <FileText className="h-3 w-3 text-red-500 flex-shrink-0" />
                            )}
                            <span className={`text-[9px] font-bold uppercase tracking-tight truncate flex-1 min-w-0 ${isCAD ? 'text-cyan-800' : 'text-red-800'}`}>
                              {baseName}
                            </span>
                            <span className={`text-[8px] font-black uppercase opacity-50 flex-shrink-0 ${isCAD ? 'text-cyan-700' : 'text-red-700'}`}>
                              .{ext}
                            </span>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (file.$id) await deleteFile(file.$id);
                              updateItem(idx, {
                                design_files: item.design_files.filter((_, i) => i !== fIdx),
                              });
                            }}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 shadow-md opacity-0 group-hover/file:opacity-100 flex items-center justify-center transition-all z-10"
                          >
                            <Trash2 className="h-2 w-2" />
                          </button>
                        </div>
                      );
                    })}
                    {uploadingItems.has(item.id) ? (
                      <div className="h-6 px-2 flex items-center gap-1.5 rounded-md bg-zinc-50 border border-dashed border-zinc-200 text-[9px] font-black text-zinc-400 uppercase tracking-widest animate-pulse w-fit">
                        <div className="h-2.5 w-2.5 border-[1.5px] border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        Uploading…
                      </div>
                    ) : (
                      <label
                        htmlFor={`drawing-${item.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-zinc-200 text-zinc-400 bg-transparent hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer w-fit"
                        title="Attach files"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-tight">
                          {item.design_files?.length > 0 ? 'Add More' : 'Attach Files'}
                        </span>
                      </label>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="text-[11px] font-bold text-zinc-600 whitespace-nowrap">
                    {new Date(item.id).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {formData.items.length > 1 ? (
                    <button
                      onClick={(e) => removePart(idx, e)}
                      className="p-2 rounded-lg transition-all text-zinc-300 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-tight opacity-30">
                      LOCKED
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AssetPreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </FeaturePanel>
  );
};

export default BOMRegistry;
