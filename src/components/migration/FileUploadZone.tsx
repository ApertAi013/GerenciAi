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
        relative border-2 border-dashed rounded-xl p-12
        transition-all duration-300 ease-in-out
        ${isDragging
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-[1.02]'
          : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-gray-400 hover:shadow-md'
        }
        ${uploadStatus === 'success' ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100' : ''}
        ${uploadStatus === 'error' ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100' : ''}
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
          <div className="animate-fade-in">
            <div className="relative">
              <Loader className="w-20 h-20 text-blue-500 animate-spin mb-4" />
              <div className="absolute inset-0 w-20 h-20 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            </div>
            <p className="text-xl font-semibold text-gray-800">Enviando arquivo...</p>
            <p className="text-sm text-gray-600 mt-2">Por favor aguarde</p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="animate-fade-in">
            <div className="relative">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
              <div className="absolute inset-0 w-20 h-20 bg-green-400 rounded-full blur-xl opacity-30"></div>
            </div>
            <p className="text-xl font-semibold text-green-700">Arquivo enviado com sucesso!</p>
            <p className="text-sm text-gray-600 mt-2">
              {selectedFile && `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`}
            </p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="animate-fade-in">
            <div className="relative">
              <XCircle className="w-20 h-20 text-red-500 mb-4 animate-shake" />
              <div className="absolute inset-0 w-20 h-20 bg-red-400 rounded-full blur-xl opacity-30"></div>
            </div>
            <p className="text-xl font-semibold text-red-700">Erro ao enviar arquivo</p>
            {errorMessage && (
              <p className="text-sm text-red-600 mt-2 bg-red-100 px-4 py-2 rounded-lg">
                {errorMessage}
              </p>
            )}
          </div>
        )}

        {uploadStatus === 'idle' && (
          <>
            {selectedFile ? (
              <div className="animate-fade-in">
                <div className="relative mb-4 p-4 bg-white rounded-xl shadow-sm">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto" />
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  Clique para escolher outro arquivo
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="relative mb-6">
                  <Upload className="w-20 h-20 text-blue-500 mx-auto" />
                  {isDragging && (
                    <div className="absolute inset-0 w-20 h-20 bg-blue-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  )}
                </div>
                <p className="text-xl font-semibold text-gray-800">
                  Arraste e solte seu arquivo CSV aqui
                </p>
                <p className="text-base text-gray-600 mt-2">ou clique para selecionar um arquivo</p>
                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                    </svg>
                    Máximo 10MB
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                    </svg>
                    Formato CSV
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </label>
    </div>
  );
}
