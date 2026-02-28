import { api } from './api';

export interface ShopProduct {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  price_cents: number;
  stock: number;
  stock_unlimited: boolean;
  visibility: 'all' | 'modality' | 'specific';
  visibility_modality_id?: number;
  modality_name?: string;
  payment_type: 'platform' | 'direct';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: number;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  payment_type: 'platform' | 'direct';
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  fulfillment_status: 'pending' | 'ready' | 'delivered';
  product_name: string;
  product_image?: string;
  product_price: number;
  student_name: string;
  student_phone?: string;
  student_email?: string;
  created_at: string;
  paid_at?: string;
}

export interface ShopDashboard {
  revenueThisMonth: number;
  salesThisMonth: number;
  pendingOrders: number;
  readyForPickup: number;
  topProducts: { name: string; image_url?: string; total_sold: number; total_revenue: number }[];
  monthlySales: { month: string; revenue: number; orders: number }[];
}

export const shopService = {
  async getProducts(): Promise<{ status: string; data: ShopProduct[] }> {
    const response = await api.get('/api/shop/products');
    return response.data;
  },

  async createProduct(formData: FormData): Promise<{ status: string; data: ShopProduct }> {
    const response = await api.post('/api/shop/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateProduct(id: number, formData: FormData): Promise<{ status: string; data: ShopProduct }> {
    const response = await api.put(`/api/shop/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteProduct(id: number): Promise<{ status: string; message: string }> {
    const response = await api.delete(`/api/shop/products/${id}`);
    return response.data;
  },

  async getOrders(params?: { status?: string; fulfillment?: string; page?: number }): Promise<{ status: string; data: { orders: ShopOrder[]; total: number } }> {
    const response = await api.get('/api/shop/orders', { params });
    return response.data;
  },

  async confirmOrder(id: number): Promise<{ status: string; message: string }> {
    const response = await api.put(`/api/shop/orders/${id}/confirm`);
    return response.data;
  },

  async markOrderReady(id: number): Promise<{ status: string; message: string }> {
    const response = await api.put(`/api/shop/orders/${id}/ready`);
    return response.data;
  },

  async markOrderDelivered(id: number): Promise<{ status: string; message: string }> {
    const response = await api.put(`/api/shop/orders/${id}/delivered`);
    return response.data;
  },

  async cancelOrder(id: number): Promise<{ status: string; message: string }> {
    const response = await api.put(`/api/shop/orders/${id}/cancel`);
    return response.data;
  },

  async getDashboard(): Promise<{ status: string; data: ShopDashboard }> {
    const response = await api.get('/api/shop/dashboard');
    return response.data;
  },
};
