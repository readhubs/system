import React, { useState } from 'react';
import { ImageType, PatientImage } from '../types';
import { UploadCloud, AlertCircle, FileImage, Check } from 'lucide-react';

interface ImageUploadModalProps {
  patientId: string;
  toothNumber: number;
  onUpload: (imageData: Omit<PatientImage, 'id'>) => void;
  onClose: () => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  patientId,
  toothNumber,
  onUpload,
  onClose
}) => {
  const [type, setType] = useState<ImageType>('Periapical');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedBy, setUploadedBy] = useState('Dr. Mohamed Al-Sayed');
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const sizeInMb = Number((selected.size / (1024 * 1024)).toFixed(2));
      setFileSizeMb(sizeInMb);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl && !file) return;

    // Use selected file object URL or high-quality sample image if preview
    const finalUrl = previewUrl || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80';

    onUpload({
      patientId,
      toothNumber,
      type,
      url: finalUrl,
      fileName: file?.name || `tooth_${toothNumber}_${type.toLowerCase()}.jpg`,
      date: new Date().toISOString().split('T')[0],
      uploadedBy,
      fileSizeMb: fileSizeMb || 1.5
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
              <p className="text-xs text-slate-500">Periapical, Panoramic, CBCT or Intraoral photo</p>
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
              <option value="CBCT Slice">CBCT 3D Slice</option>
              <option value="Intraoral Photo">Intraoral Photo</option>
              <option value="Other">Other / Document</option>
            </select>
          </div>

          {/* File Drag and Drop Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Image File *
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors relative cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-36 mx-auto rounded-xl shadow-md border border-slate-200 object-cover"
                  />
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 py-1.5 px-3 rounded-lg w-fit mx-auto">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{file?.name} ({fileSizeMb} MB)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileImage className="w-10 h-10 text-sky-600 mx-auto group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Click or drag X-Ray image here</p>
                    <p className="text-xs text-slate-400">Supports JPG, PNG, DICOM exports up to 25MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Large File Warning if > 5MB */}
          {fileSizeMb > 5 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Large File Warning ({fileSizeMb} MB):</strong> CBCT or high-res images will be optimized in browser memory for fast viewing.
              </div>
            </div>
          )}

          {/* Uploaded By */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Uploaded By
            </label>
            <input
              type="text"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none"
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
              className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-extrabold hover:bg-sky-700 shadow-md transition-colors"
            >
              Save Radiograph
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
