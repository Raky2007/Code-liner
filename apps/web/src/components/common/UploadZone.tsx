import React, { useState, useRef } from 'react';
import { Upload, FileArchive, X, Loader2, ArrowRight } from 'lucide-react';

interface UploadZoneProps {
  onUploadSubmit?: (file: File, projectName: string) => Promise<void>;
  isProcessing?: boolean;
  activeStep?: number;
  className?: string;
  defaultProjectName?: string;
}

const ANALYSIS_STEPS = [
  'Extracting project archive',
  'Detecting technologies & languages',
  'Mapping dependencies & call graphs',
  'Understanding architecture & data flow',
  'Generating code walkthrough & explanation',
];

export const UploadZone: React.FC<UploadZoneProps> = ({
  onUploadSubmit,
  isProcessing = false,
  activeStep = 0,
  className = '',
  defaultProjectName = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processSelectedFile = (selected: File) => {
    setErrorMessage('');
    if (!selected.name.toLowerCase().endsWith('.zip')) {
      setErrorMessage('Only ZIP archives (.zip) are supported.');
      return;
    }
    // 500 MB limit
    if (selected.size > 500 * 1024 * 1024) {
      setErrorMessage('Archive exceeds the 500MB upload limit.');
      return;
    }

    setFile(selected);
    if (!projectName) {
      // derive clean project name from file name
      const cleanName = selected.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
      setProjectName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !onUploadSubmit) return;
    try {
      await onUploadSubmit(file, projectName || file.name.replace(/\.zip$/i, ''));
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload and analysis failed.');
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Upload Box */}
      {!isProcessing ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative rounded-[16px] p-8 md:p-10 transition-all duration-200 cursor-pointer ${
            isDragOver
              ? 'bg-[#EFF6FF] border-2 border-[#3B82F6]'
              : file
              ? 'bg-white border-2 border-[#E2E8F0]'
              : 'bg-white border-2 border-dashed border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#EFF6FF]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
            id="zip-uploader"
          />

          {!file ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-[12px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-xs">
                <Upload size={30} strokeWidth={1.8} />
              </div>

              <div>
                <h3 className="text-[18px] font-semibold text-[#0F172A] tracking-[-0.01em]">
                  Drop your ZIP file here
                </h3>
                <p className="text-[14px] text-[#475569] mt-1">
                  or <span className="text-[#2563EB] font-medium hover:underline">click to browse</span> your project
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#F1F5F9] border border-[#E2E8F0] text-[12px] font-mono text-[#64748B]">
                <span>Supports ZIP files up to 500MB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6" onClick={e => e.stopPropagation()}>
              {/* Selected File Card */}
              <div className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px]">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-[8px] bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <FileArchive size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-mono font-medium text-[#0F172A] truncate">
                      {file.name}
                    </p>
                    <p className="text-[12px] font-mono text-[#64748B]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-[6px] transition-colors"
                  title="Remove archive"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Project Name Input */}
              <div>
                <label className="block text-[12px] uppercase font-mono tracking-wider font-semibold text-[#475569] mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. My Application Architecture"
                  className="w-full h-11 px-3.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="h-11 px-4 text-[14px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[8px] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="h-11 px-6 text-[14px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] rounded-[8px] flex items-center gap-2 shadow-xs transition-colors"
                >
                  <span>Analyze Your Code</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-[8px] text-[13px] text-[#DC2626]">
              {errorMessage}
            </div>
          )}
        </div>
      ) : (
        /* Multi-step AI Analysis Progress State (Design System Spec #23) */
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#0F172A]">
                  Analyzing codebase...
                </h4>
                <p className="text-[12px] font-mono text-[#64748B]">
                  Running AST parser & architectural synthesis
                </p>
              </div>
            </div>
            <div className="text-[12px] font-mono font-medium text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-[6px]">
              Step {Math.min(activeStep + 1, ANALYSIS_STEPS.length)} of {ANALYSIS_STEPS.length}
            </div>
          </div>

          <div className="space-y-3.5">
            {ANALYSIS_STEPS.map((stepText, idx) => {
              const isDone = idx < activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 text-[14px] transition-all duration-200 ${
                    isDone
                      ? 'text-[#16A34A] font-medium'
                      : isCurrent
                      ? 'text-[#2563EB] font-semibold'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  <div className="w-5 flex justify-center">
                    {isDone ? (
                      <span className="text-[#16A34A] text-sm">✓</span>
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full border border-[#CBD5E1]" />
                    )}
                  </div>
                  <span>{stepText}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[12px] text-[#64748B] text-center font-mono">
            Do not refresh the page while analysis is in progress...
          </div>
        </div>
      )}
    </div>
  );
};
