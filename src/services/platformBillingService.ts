import { api } from './api';

export const platformBillingService = {
  // ========== Gestor endpoints ==========

  async getPlans() {
    const response = await api.get('/api/platform-billing/plans');
    return response.data;
  },

  async getAddons() {
    const response = await api.get('/api/platform-billing/addons');
    return response.data;
  },

  async getMySubscription() {
    const response = await api.get('/api/platform-billing/my-subscription');
    return response.data;
  },

  async getMyInvoices() {
    const response = await api.get('/api/platform-billing/my-invoices');
    return response.data;
  },

  async createUpgradeRequest(data: {
    requested_plan_id: number;
    requested_addons?: number[];
    reason?: string;
  }) {
    const response = await api.post('/api/platform-billing/upgrade-request', data);
    return response.data;
  },

  async promisePayment() {
    const response = await api.post('/api/platform-billing/promise-payment');
    return response.data;
  },

  async checkLimits() {
    const response = await api.get('/api/platform-billing/check-limits');
    return response.data;
  },

  // ========== Admin endpoints ==========

  async adminGetGestores(params?: { search?: string; billing_status?: string }) {
    const response = await api.get('/api/platform-billing/admin/gestores', { params });
    return response.data;
  },

  async adminGetGestorDetail(id: number) {
    const response = await api.get(`/api/platform-billing/admin/gestores/${id}`);
    return response.data;
  },

  async adminAssignPlan(gestorId: number, planId: number) {
    const response = await api.put(`/api/platform-billing/admin/gestores/${gestorId}/plan`, {
      plan_id: planId,
    });
    return response.data;
  },

  async adminToggleAddon(gestorId: number, addonId: number, enable: boolean) {
    const response = await api.put(`/api/platform-billing/admin/gestores/${gestorId}/addons`, {
      addon_id: addonId,
      enable,
    });
    return response.data;
  },

  async adminGetInvoices(params?: { status?: string; month?: string; user_id?: number }) {
    const response = await api.get('/api/platform-billing/admin/invoices', { params });
    return response.data;
  },

  async adminConfirmPayment(invoiceId: number) {
    const response = await api.post(`/api/platform-billing/admin/invoices/${invoiceId}/confirm`);
    return response.data;
  },

  async adminGenerateInvoices(referenceMonth: string) {
    const response = await api.post('/api/platform-billing/admin/invoices/generate', {
      reference_month: referenceMonth,
    });
    return response.data;
  },

  async adminGetUpgradeRequests(params?: { status?: string }) {
    const response = await api.get('/api/platform-billing/admin/upgrade-requests', { params });
    return response.data;
  },

  async adminApproveUpgrade(requestId: number, adminNotes?: string) {
    const response = await api.put(
      `/api/platform-billing/admin/upgrade-requests/${requestId}/approve`,
      { admin_notes: adminNotes }
    );
    return response.data;
  },

  async adminDenyUpgrade(requestId: number, adminNotes?: string) {
    const response = await api.put(
      `/api/platform-billing/admin/upgrade-requests/${requestId}/deny`,
      { admin_notes: adminNotes }
    );
    return response.data;
  },

  async adminGetDashboard() {
    const response = await api.get('/api/platform-billing/admin/dashboard');
    return response.data;
  },
};
