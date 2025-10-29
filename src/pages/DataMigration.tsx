import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { dataMigrationService, type DataImport, type SupportedFileType } from '../services/dataMigrationService';
import FileUploadZone from '../components/migration/FileUploadZone';
import MigrationOnboardingTour from '../components/migration/MigrationOnboardingTour';
import { Database, FileCheck, AlertCircle, CheckCircle2, Clock, XCircle, Upload, Loader } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 p-8">
      <MigrationOnboardingTour run={showOnboarding} onFinish={handleOnboardingFinish} />

      {/* Header */}
      <div className="mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Migração de Dados</h1>
            <p className="text-gray-600 mt-1">
              Importe dados do seu sistema anterior para o GerenciAi
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Upload de Arquivo</h2>
            </div>

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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Fazer Upload
                </span>
              </button>
            )}
          </div>

          {/* Import History */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 import-history">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Histórico de Importações</h2>
            </div>

            {isLoadingImports ? (
              <div className="text-center py-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <Clock className="w-16 h-16 text-blue-500 animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                </div>
                <p className="text-gray-600 font-medium">Carregando importações...</p>
              </div>
            ) : imports.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <FileCheck className="w-20 h-20 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700">Nenhuma importação encontrada</p>
                <p className="text-sm text-gray-500 mt-2">
                  Faça o upload de um arquivo CSV para começar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {imports.map((importData) => (
                  <div
                    key={importData.id}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {getStatusIcon(importData.status)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{importData.file_name}</p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {formatFileSize(importData.file_size_bytes)} • Tipo: {importData.file_type}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
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

                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 text-xs mb-1">Total</p>
                        <p className="font-bold text-gray-900 text-lg">{importData.rows_total}</p>
                        <p className="text-xs text-gray-500">linhas</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-green-700 text-xs mb-1">Importados</p>
                        <p className="font-bold text-green-700 text-lg">{importData.rows_imported}</p>
                        <p className="text-xs text-green-600">sucesso</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-red-700 text-xs mb-1">Falhas</p>
                        <p className="font-bold text-red-700 text-lg">{importData.rows_failed}</p>
                        <p className="text-xs text-red-600">erros</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(importData.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Supported Types */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 supported-types">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Tipos Suportados</h3>
            </div>

            {supportedTypes.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {supportedTypes.map((type) => (
                  <div
                    key={type.type}
                    className="border-l-4 border-blue-500 pl-4 pr-3 py-3 bg-gradient-to-r from-blue-50 to-transparent rounded-r-lg hover:from-blue-100 transition-colors"
                  >
                    <p className="font-bold text-gray-900 text-sm">{type.name}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{type.description}</p>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Colunas esperadas:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {type.sample_columns.map((col, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded-md font-medium shadow-sm"
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
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex gap-3">
              <div className="p-2 bg-white/20 rounded-lg h-fit">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold mb-3">Dicas de Importação</p>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-200 mt-0.5">•</span>
                    <span>Arquivos devem estar em formato CSV</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-200 mt-0.5">•</span>
                    <span>Tamanho máximo: 10MB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-200 mt-0.5">•</span>
                    <span>Use codificação UTF-8</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-200 mt-0.5">•</span>
                    <span>Separe colunas por vírgula</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
