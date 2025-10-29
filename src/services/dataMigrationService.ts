import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DataImport {
  id: number;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rows_total: number;
  rows_imported: number;
  rows_failed: number;
  error_log?: any;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface SupportedFileType {
  type: string;
  name: string;
  description: string;
  sample_columns: string[];
}

class DataMigrationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_URL}/api/data-migration/upload`,
      formData,
      {
        ...this.getAuthHeaders(),
        headers: {
          ...this.getAuthHeaders().headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async getImports() {
    const response = await axios.get(
      `${API_URL}/api/data-migration/imports`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getImportDetails(importId: number) {
    const response = await axios.get(
      `${API_URL}/api/data-migration/imports/${importId}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getSupportedTypes() {
    const response = await axios.get(
      `${API_URL}/api/data-migration/supported-types`,
      this.getAuthHeaders()
    );
    return response.data;
  }
}

export const dataMigrationService = new DataMigrationService();
