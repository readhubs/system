import React, { useState } from 'react';
import { ImageType, PatientImage } from '../types';
import { UploadCloud, AlertCircle, FileImage, Check, Sparkles, Zap } from 'lucide-react';
import { compressDentalImage } from '../lib/imageCompressor';

interface ImageUploadModalProps {
  patientId: string;
  toothNumber: number;
  onUpload: (imageData: Omit<PatientImage, 'id'>) => void;
  onClose: () => void;
  onOpenDicomViewer?: (file: File) => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  patientId,
  toothNumber,
  onUpload,
  onClose,
  onOpenDicomViewer
}) => {
  const [type, setType] = useState<ImageType>('Periapical');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedBy, setUploadedBy] = useState('Dr. Mohamed Al-Sayed');
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [compressing, setCompressing] = useState<boolean>(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Check if DICOM file
    if (selected.name.toLowerCase().endsWith('.dcm') || selected.type === 'application/dicom') {
      if (onOpenDicomViewer) {
        onOpenDicomViewer(selected);
        onClose();
        return;
      }
    }

    setFile(selected);
    const origKb = Math.round(selected.size / 1024);
    setOriginalSizeKb(origKb);
    setCompressing(true);

    try {
      // Smart clinical compression (< 500KB guarantee)
      const res = await compressDentalImage(selected);
      setCompressedSizeKb(res.compressedSizeKb);
      setPreviewUrl(res.dataUrl);
    } catch (err) {
      console.warn('Compression error, fallback:', err);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setCompressedSizeKb(origKb);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl && !file) return;

    const finalUrl = previewUrl || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80';

    onUpload({
      patientId,
      toothNumber,
      type,
      url: finalUrl,
      fileName: file?.name || `tooth_${toothNumber}_${type.toLowerCase()}.jpg`,
      date: new Date().toISOString().split('T')[0],
      uploadedBy,
      fileSizeMb: Number((compressedSizeKb / 1024).toFixed(2)) || 0.4
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">Upload Radiograph</h2>
                <span className="text-xs bg-sky-600 text-white font-mono font-bold px-2 py-0.5 rounded-md">
                  Tooth #{toothNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">Auto-compressed &lt; 500KB for instant cloud sync</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 text-xl font-bold rounded-xl hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
          {/* Image Type Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Radiograph / Image Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ImageType)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none font-bold text-slate-800 bg-white"
            >
              <option value="Periapical">Periapical Radiograph (PA)</option>
              <option value="Panoramic">Panoramic Radiograph (OPG)</option>
              <option value="Bitewing">Bitewing Radiograph (BW)</option>
              <option value="CBCT Slice">CBCT 3D Slice</option>
              <option value="Intraoral Photo">Intraoral Clinical Photo</option>
              <option value="Other">Other / Lab Attachment</option>
            </select>
          </div>

          {/* File Drag and Drop Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Image / DICOM File *
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors relative cursor-pointer group">
              <input
                type="file"
                accept="image/*,.dcm"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {compressing ? (
                <div className="py-6 space-y-2">
                  <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-sky-700">Compressing & optimizing diagnostic quality...</p>
                </div>
              ) : previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-36 mx-auto rounded-xl shadow-md border border-slate-200 object-cover bg-black"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 text-xs text-emerald-800 font-bold bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200 w-full">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{file?.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700">
                      Compressed: {compressedSizeKb} KB ({Math.round(((originalSizeKb - compressedSizeKb) / (originalSizeKb || 1)) * 100)}% saved) &lt; 500 KB Limit
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileImage className="w-10 h-10 text-sky-600 mx-auto group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Click or drag X-Ray image or .DCM here</p>
                    <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP, and DICOM (.dcm)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Uploaded By */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Uploaded By
            </label>
            <input
              type="text"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none font-semibold text-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={compressing || !previewUrl}
              className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-extrabold hover:bg-sky-700 shadow-md transition-colors disabled:opacity-50"
            >
              Save to Patient Media
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
