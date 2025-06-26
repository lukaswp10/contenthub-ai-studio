import React, { useState, useCallback } from 'react';
import { Upload, Video, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface VideoUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUpload,
  isUploading = false,
  acceptedFormats = ['mp4', 'mov', 'avi', 'mkv'],
  maxSizeMB = 500
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Validar tipo de arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      return `Formato não suportado. Use: ${acceptedFormats.join(', ')}`;
    }

    // Validar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    }
  }, [onUpload, maxSizeMB, acceptedFormats]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <Card className="p-6">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={acceptedFormats.map(f => `.${f}`).join(',')}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            {isUploading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            ) : (
              <Video className="w-full h-full" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isUploading ? 'Fazendo upload...' : 'Faça upload do seu vídeo'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Arraste e solte ou clique para selecionar
            </p>
          </div>
          
          <div className="text-xs text-gray-400">
            <p>Formatos aceitos: {acceptedFormats.join(', ')}</p>
            <p>Tamanho máximo: {maxSizeMB}MB</p>
          </div>
          
          {!isUploading && (
            <Button variant="outline" className="mt-4">
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
    </Card>
  );
}; 