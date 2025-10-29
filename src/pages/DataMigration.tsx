import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { dataMigrationService, DataImport, SupportedFileType } from '../services/dataMigrationService';
import FileUploadZone from '../components/migration/FileUploadZone';
import MigrationOnboardingTour from '../components/migration/MigrationOnboardingTour';
import { Database, FileCheck, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

const ONBOARDING_KEY = 'migration_onboarding_completed';

export default function DataMigration() {
  const { user } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [imports, setImports] = useState<DataImport[]>([]);
  const [supportedTypes, setSupportedTypes] = useState<SupportedFileType[]>([]);
  const [isLoadingImports, setIsLoadingImports] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Carregar dados ao iniciar
  useEffect(() => {
    if (user) {
      loadImports();
      loadSupportedTypes();
      checkOnboarding();
    }
  }, [user]);

  const checkOnboarding = () => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const loadImports = async () => {
    try {
      setIsLoadingImports(true);
      const response = await dataMigrationService.getImports();
      setImports(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar importações:', error);
      setImports([]);
    } finally {
      setIsLoadingImports(false);
    }
  };

  const loadSupportedTypes = async () => {
    try {
      const response = await dataMigrationService.getSupportedTypes();
      setSupportedTypes(response.data.supported_types);
    } catch (error: any) {
      console.error('Erro ao carregar tipos suportados:', error);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setErrorMessage('');

      await dataMigrationService.uploadCSV(selectedFile);

      setUploadStatus('success');
      setTimeout(async () => {
        setSelectedFile(null);
        setUploadStatus('idle');
        await loadImports();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setUploadStatus('error');
      setErrorMessage(error.response?.data?.message || 'Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'processing':
        return 'Processando...';
      case 'failed':
        return 'Falhou';
      default:
        return 'Pendente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  return (
    <div className="p-8">
      <MigrationOnboardingTour run={showOnboarding} onFinish={handleOnboardingFinish} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Migração de Dados</h1>
        </div>
        <p className="text-gray-600">
          Importe dados do seu sistema anterior para o GerenciAi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Upload de Arquivo</h2>

            <div className="upload-zone mb-6">
              <FileUploadZone
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                uploadStatus={uploadStatus}
                errorMessage={errorMessage}
              />
            </div>

            {selectedFile && uploadStatus === 'idle' && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fazer Upload
              </button>
            )}
          </div>

          {/* Import History */}
          <div className="bg-white rounded-lg shadow-sm p-6 import-history">
            <h2 className="text-xl font-semibold mb-4">Histórico de Importações</h2>

            {isLoadingImports ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Carregando importações...</p>
              </div>
            ) : imports.length === 0 ? (
              <div className="text-center py-8">
                <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma importação encontrada</p>
                <p className="text-sm text-gray-400 mt-1">
                  Faça o upload de um arquivo CSV para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {imports.map((importData) => (
                  <div
                    key={importData.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(importData.status)}
                        <div>
                          <p className="font-medium text-gray-900">{importData.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(importData.file_size_bytes)} • Tipo: {importData.file_type}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          importData.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : importData.status === 'processing'
                            ? 'bg-blue-100 text-blue-700'
                            : importData.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {getStatusText(importData.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium">{importData.rows_total} linhas</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Importados</p>
                        <p className="font-medium text-green-600">{importData.rows_imported}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Falhas</p>
                        <p className="font-medium text-red-600">{importData.rows_failed}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(importData.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Supported Types */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 supported-types">
            <h3 className="text-lg font-semibold mb-4">Tipos Suportados</h3>

            {supportedTypes.length === 0 ? (
              <p className="text-gray-500 text-sm">Carregando...</p>
            ) : (
              <div className="space-y-4">
                {supportedTypes.map((type) => (
                  <div key={type.type} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-gray-900">{type.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Colunas esperadas:</p>
                      <div className="flex flex-wrap gap-1">
                        {type.sample_columns.map((col, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Dicas de Importação</p>
                <ul className="text-xs text-blue-800 mt-2 space-y-1">
                  <li>• Arquivos devem estar em formato CSV</li>
                  <li>• Tamanho máximo: 10MB</li>
                  <li>• Use codificação UTF-8</li>
                  <li>• Separe colunas por vírgula</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
