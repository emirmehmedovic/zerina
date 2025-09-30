"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImage } from '@/lib/uploadImage';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (path: string) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const result = await uploadImage(file);
        onUpload(result.path);
      }
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  return (
    <div {...getRootProps()} className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30'}`}>
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadCloud className={`w-8 h-8 mb-4 ${isDragActive ? 'text-blue-400' : 'text-zinc-500'}`} />
        {isDragActive ? (
          <p className="font-semibold text-blue-400">Drop the files here ...</p>
        ) : (
          <p className="text-sm text-zinc-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
        )}
        <p className="text-xs text-zinc-600">SVG, PNG, JPG or GIF</p>
      </div>
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <p className="text-white">Uploading...</p>
        </div>
      )}
    </div>
  );
}
