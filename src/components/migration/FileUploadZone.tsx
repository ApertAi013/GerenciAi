import { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export default function FileUploadZone({
  onFileSelect,
  isUploading,
  uploadStatus = 'idle',
  errorMessage,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const csvFiles = files.filter((file) => file.name.endsWith('.csv'));

      if (csvFiles.length > 0) {
        const file = csvFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-12
        transition-all duration-200 ease-in-out
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        ${uploadStatus === 'success' ? 'border-green-500 bg-green-50' : ''}
        ${uploadStatus === 'error' ? 'border-red-500 bg-red-50' : ''}
      `}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
        id="csv-upload"
        disabled={isUploading}
      />

      <label
        htmlFor="csv-upload"
        className="flex flex-col items-center justify-center cursor-pointer"
      >
        {uploadStatus === 'uploading' && (
          <>
            <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-700">Enviando arquivo...</p>
          </>
        )}

        {uploadStatus === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-700">Arquivo enviado com sucesso!</p>
            <p className="text-sm text-gray-600 mt-2">
              {selectedFile && `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`}
            </p>
          </>
        )}

        {uploadStatus === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-lg font-medium text-red-700">Erro ao enviar arquivo</p>
            {errorMessage && <p className="text-sm text-red-600 mt-2">{errorMessage}</p>}
          </>
        )}

        {uploadStatus === 'idle' && (
          <>
            {selectedFile ? (
              <>
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-sm text-blue-600 mt-4">Clique para escolher outro arquivo</p>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  Arraste e solte seu arquivo CSV aqui
                </p>
                <p className="text-sm text-gray-500 mt-2">ou clique para selecionar um arquivo</p>
                <p className="text-xs text-gray-400 mt-4">Máximo 10MB • Formato: CSV</p>
              </>
            )}
          </>
        )}
      </label>
    </div>
  );
}
