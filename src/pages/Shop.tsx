import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faPen, faTrash, faBoxOpen, faReceipt, faCheck,
  faCheckDouble, faTimes, faBox, faCamera, faInfoCircle,
  faStore, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { shopService } from '../services/shopService';
import { modalityService } from '../services/modalityService';
import type { ShopProduct, ShopOrder, ShopDashboard } from '../services/shopService';
import { useThemeStore } from '../store/themeStore';
import '../styles/Shop.css';
import '../styles/ModernModal.css';

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const ORDER_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'paid', label: 'Pagos' },
  { key: 'ready', label: 'Separados' },
  { key: 'delivered', label: 'Entregues' },
  { key: 'cancelled', label: 'Cancelados' },
];

export default function Shop() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [dashboard, setDashboard] = useState<ShopDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [prodRes, orderRes, dashRes] = await Promise.all([
        shopService.getProducts(),
        shopService.getOrders(),
        shopService.getDashboard(),
      ]);
      setProducts(prodRes.data || []);
      setOrders(orderRes.data?.orders || []);
      setDashboard(dashRes.data || null);
    } catch (err) {
      console.error('Shop fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProduct = async (product: ShopProduct) => {
    const action = product.is_active ? 'Desativar' : 'Reativar';
    if (!confirm(`${action} "${product.name}"?`)) return;
    try {
      if (product.is_active) {
        await shopService.deleteProduct(product.id);
      } else {
        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('price_cents', String(product.price_cents));
        formData.append('is_active', 'true');
        await shopService.updateProduct(product.id, formData);
      }
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || `Erro ao ${action.toLowerCase()} produto`);
    }
  };

  const handleOrderAction = async (orderId: number, action: 'confirm' | 'ready' | 'delivered' | 'cancel') => {
    const msgs: Record<string, string> = {
      confirm: 'Confirmar pagamento?', ready: 'Marcar como separado?',
      delivered: 'Marcar como entregue?', cancel: 'Cancelar pedido?',
    };
    if (!confirm(msgs[action])) return;
    setActionLoading(orderId);
    try {
      if (action === 'confirm') await shopService.confirmOrder(orderId);
      else if (action === 'ready') await shopService.markOrderReady(orderId);
      else if (action === 'delivered') await shopService.markOrderDelivered(orderId);
      else if (action === 'cancel') await shopService.cancelOrder(orderId);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWhatsApp = (order: ShopOrder) => {
    if (!order.student_phone) return;
    const phone = order.student_phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${order.student_name}! 🛍️ Seu pedido de ${order.product_name} (${order.quantity}x) foi confirmado e está separado para retirada! Pode vir buscar quando quiser.`
    );
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'pending') return o.payment_status === 'pending';
    if (orderFilter === 'paid') return o.payment_status === 'paid' && o.fulfillment_status === 'pending';
    if (orderFilter === 'ready') return o.fulfillment_status === 'ready';
    if (orderFilter === 'delivered') return o.fulfillment_status === 'delivered';
    if (orderFilter === 'cancelled') return o.payment_status === 'cancelled';
    return true;
  });

  const getStatusBadge = (order: ShopOrder) => {
    if (order.payment_status === 'cancelled') return { label: 'Cancelado', cls: 'shop-badge-cancelled' };
    if (order.payment_status === 'pending') return { label: 'Pgto Pendente', cls: 'shop-badge-pending' };
    if (order.fulfillment_status === 'delivered') return { label: 'Entregue', cls: 'shop-badge-delivered' };
    if (order.fulfillment_status === 'ready') return { label: 'Separado', cls: 'shop-badge-ready' };
    if (order.payment_status === 'paid') return { label: 'Pago', cls: 'shop-badge-paid' };
    return { label: order.payment_status, cls: '' };
  };

  if (isLoading) {
    return <div className="shop-page"><div className="shop-loading"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</div></div>;
  }

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1><FontAwesomeIcon icon={faStore} style={{ marginRight: 10, color: '#FF9900' }} /> Lojinha</h1>
        {tab === 'products' && (
          <button className="shop-btn-primary" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
            <FontAwesomeIcon icon={faPlus} /> Novo Produto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="shop-tabs">
        <button className={`shop-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
          <FontAwesomeIcon icon={faBoxOpen} /> Produtos ({products.length})
        </button>
        <button className={`shop-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          <FontAwesomeIcon icon={faReceipt} /> Pedidos ({orders.length})
        </button>
      </div>

      {tab === 'products' ? (
        <>
          {products.length === 0 ? (
            <div className="shop-empty">
              <div className="shop-empty-icon"><FontAwesomeIcon icon={faStore} /></div>
              <div className="shop-empty-text">Nenhum produto cadastrado</div>
              <p>Clique em "Novo Produto" para começar a vender.</p>
            </div>
          ) : (
            <div className="shop-products-grid">
              {products.map(p => (
                <div key={p.id} className="shop-product-card" onClick={() => { setEditingProduct(p); setShowProductModal(true); }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="shop-product-image" />
                  ) : (
                    <div className="shop-product-image-placeholder"><FontAwesomeIcon icon={faBoxOpen} /></div>
                  )}
                  <div className="shop-product-info">
                    <div className="shop-product-name">{p.name}</div>
                    <div className="shop-product-price">{formatCurrency(p.price_cents)}</div>
                    <div className="shop-product-meta">
                      <span>{p.stock_unlimited ? 'Ilimitado' : `Estoque: ${p.stock}`}</span>
                      <span className={`shop-badge ${p.payment_type === 'platform' ? 'shop-badge-platform' : 'shop-badge-direct'}`}>
                        {p.payment_type === 'platform' ? 'PIX' : 'Direto'}
                      </span>
                    </div>
                  </div>
                  <div className="shop-product-actions">
                    <button className="shop-btn-icon" onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setShowProductModal(true); }}><FontAwesomeIcon icon={faPen} /></button>
                    <button
                      className={`shop-btn-icon ${p.is_active ? 'danger' : ''}`}
                      title={p.is_active ? 'Desativar' : 'Reativar'}
                      onClick={(e) => { e.stopPropagation(); handleToggleProduct(p); }}
                    >
                      <FontAwesomeIcon icon={p.is_active ? faTrash : faCheck} />
                    </button>
                    {!p.is_active && <span className="shop-badge shop-badge-inactive">Inativo</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Dashboard */}
          {dashboard && (
            <div className="shop-dashboard">
              <div className="shop-dash-card">
                <div className="shop-dash-value" style={{ color: '#16a34a' }}>{formatCurrency(dashboard.revenueThisMonth)}</div>
                <div className="shop-dash-label">Faturamento (mês)</div>
              </div>
              <div className="shop-dash-card">
                <div className="shop-dash-value" style={{ color: '#FF9900' }}>{dashboard.salesThisMonth}</div>
                <div className="shop-dash-label">Vendas (mês)</div>
              </div>
              <div className="shop-dash-card">
                <div className="shop-dash-value" style={{ color: '#d97706' }}>{dashboard.pendingOrders}</div>
                <div className="shop-dash-label">Pendentes</div>
              </div>
              <div className="shop-dash-card">
                <div className="shop-dash-value" style={{ color: '#7c3aed' }}>{dashboard.readyForPickup}</div>
                <div className="shop-dash-label">Para Separar</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="shop-filters">
            {ORDER_FILTERS.map(f => (
              <button
                key={f.key}
                className={`shop-filter-chip ${orderFilter === f.key ? 'active' : ''}`}
                onClick={() => setOrderFilter(f.key)}
              >{f.label}</button>
            ))}
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="shop-empty">
              <div className="shop-empty-icon"><FontAwesomeIcon icon={faReceipt} /></div>
              <div className="shop-empty-text">Nenhum pedido encontrado</div>
            </div>
          ) : (
            <div className="shop-table-wrapper">
              <table className="shop-orders-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const status = getStatusBadge(order);
                    const date = new Date(order.created_at);
                    const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="shop-order-student">
                            <div className="shop-order-avatar">{order.student_name?.charAt(0).toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{order.student_name}</div>
                              {order.student_phone && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.student_phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td>{order.product_name}</td>
                        <td>{order.quantity}x</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(order.total_cents)}</td>
                        <td><span className={`shop-badge ${status.cls}`}>{status.label}</span></td>
                        <td>{dateStr}</td>
                        <td>
                          <div className="shop-order-actions">
                            {actionLoading === order.id ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                              <>
                                {order.student_phone && (order.payment_status === 'paid' || order.fulfillment_status === 'ready') && (
                                  <button className="shop-btn-whatsapp" title="WhatsApp" onClick={() => handleWhatsApp(order)}>
                                    <FontAwesomeIcon icon={faWhatsapp} />
                                  </button>
                                )}
                                {order.payment_status === 'pending' && order.payment_type === 'direct' && (
                                  <>
                                    <button className="shop-btn shop-btn-confirm" onClick={() => handleOrderAction(order.id, 'confirm')}>
                                      <FontAwesomeIcon icon={faCheck} /> Confirmar
                                    </button>
                                    <button className="shop-btn shop-btn-cancel" onClick={() => handleOrderAction(order.id, 'cancel')}>
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </>
                                )}
                                {order.payment_status === 'paid' && order.fulfillment_status === 'pending' && (
                                  <button className="shop-btn shop-btn-ready" onClick={() => handleOrderAction(order.id, 'ready')}>
                                    <FontAwesomeIcon icon={faBox} /> Separar
                                  </button>
                                )}
                                {order.fulfillment_status === 'ready' && (
                                  <button className="shop-btn shop-btn-delivered" onClick={() => handleOrderAction(order.id, 'delivered')}>
                                    <FontAwesomeIcon icon={faCheckDouble} /> Entregue
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSuccess={() => { setShowProductModal(false); setEditingProduct(null); fetchAll(); }}
        />
      )}
    </div>
  );
}

// ─── Product Modal ───
function ProductModal({ product, onClose, onSuccess }: { product: ShopProduct | null; onClose: () => void; onSuccess: () => void }) {
  const isEditing = !!product;
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [priceText, setPriceText] = useState(product ? (product.price_cents / 100).toFixed(2).replace('.', ',') : '');
  const [stockText, setStockText] = useState(product ? String(product.stock) : '');
  const [stockUnlimited, setStockUnlimited] = useState(product?.stock_unlimited || false);
  const [visibility, setVisibility] = useState<'all' | 'modality' | 'specific'>(product?.visibility || 'all');
  const [visibilityModalityId, setVisibilityModalityId] = useState<number | null>(product?.visibility_modality_id || null);
  const [paymentType, setPaymentType] = useState<'platform' | 'direct'>(product?.payment_type || 'direct');
  const [isActive, setIsActive] = useState(product?.is_active !== false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
  const [modalities, setModalities] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    modalityService.getModalities().then(res => {
      if (res.data) setModalities(res.data);
    }).catch(() => {});
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const parsePriceToCents = (text: string): number => {
    const cleaned = text.replace(/[^\d,\.]/g, '').replace(',', '.');
    return Math.round(parseFloat(cleaned) * 100) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    const priceCents = parsePriceToCents(priceText);
    if (priceCents <= 0) { setError('Preço inválido'); return; }

    setIsSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price_cents', String(priceCents));
      formData.append('stock', stockUnlimited ? '0' : stockText || '0');
      formData.append('stock_unlimited', String(stockUnlimited));
      formData.append('visibility', visibility);
      if (visibility === 'modality' && visibilityModalityId) {
        formData.append('visibility_modality_id', String(visibilityModalityId));
      }
      formData.append('payment_type', paymentType);
      formData.append('is_active', String(isActive));
      if (imageFile) formData.append('image', imageFile);

      if (isEditing) {
        await shopService.updateProduct(product!.id, formData);
      } else {
        await shopService.createProduct(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar produto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-modal mm-modal-md" onClick={e => e.stopPropagation()}>
        <div className="mm-header">
          <h2>{isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button className="mm-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="mm-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mm-content">
            {/* Image */}
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            <div className="shop-modal-image-picker" onClick={() => fileRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" />
              ) : (
                <div className="shop-modal-image-placeholder">
                  <FontAwesomeIcon icon={faCamera} /><br />
                  Clique para adicionar foto
                </div>
              )}
            </div>

            {/* Name */}
            <div className="mm-field">
              <label>Nome do Produto</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Camiseta Arena" />
            </div>

            {/* Description */}
            <div className="mm-field">
              <label>Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={3} />
            </div>

            {/* Price + Stock */}
            <div className="mm-field-row">
              <div className="mm-field">
                <label>Preço (R$)</label>
                <input type="text" value={priceText} onChange={e => setPriceText(e.target.value)} placeholder="49,90" />
              </div>
              <div className="mm-field">
                <label>Estoque</label>
                <input type="number" value={stockText} onChange={e => setStockText(e.target.value)} placeholder="10" disabled={stockUnlimited} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={stockUnlimited} onChange={e => setStockUnlimited(e.target.checked)} />
                  Ilimitado
                </label>
              </div>
            </div>

            {/* Visibility */}
            <div className="mm-field">
              <label>Visibilidade</label>
              <div className="shop-chip-row">
                {(['all', 'modality', 'specific'] as const).map(v => (
                  <button type="button" key={v} className={`shop-chip ${visibility === v ? 'active' : ''}`} onClick={() => setVisibility(v)}>
                    {v === 'all' ? 'Todos' : v === 'modality' ? 'Modalidade' : 'Específico'}
                  </button>
                ))}
              </div>
              {visibility === 'modality' && (
                <div className="shop-chip-row" style={{ marginTop: 8 }}>
                  {modalities.map(m => (
                    <button type="button" key={m.id} className={`shop-chip ${visibilityModalityId === m.id ? 'active' : ''}`} onClick={() => setVisibilityModalityId(m.id)}>
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Type */}
            <div className="mm-field">
              <label>Tipo de Pagamento</label>
              <div className="shop-chip-row">
                <button type="button" className={`shop-chip ${paymentType === 'platform' ? 'active' : ''}`} onClick={() => setPaymentType('platform')}>
                  Plataforma (PIX)
                </button>
                <button type="button" className={`shop-chip ${paymentType === 'direct' ? 'active' : ''}`} onClick={() => setPaymentType('direct')}>
                  Venda Direta
                </button>
              </div>
              {paymentType === 'platform' && (
                <div className="shop-fee-notice">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  Taxa: 0,99% ASAAS + 2,00% plataforma sobre o valor da venda.
                </div>
              )}
            </div>

            {/* Active Toggle */}
            {isEditing && (
              <div className="mm-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#FF9900' }}
                  />
                  <span style={{ fontWeight: 600 }}>Produto Ativo</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #6b7280)', fontWeight: 400 }}>
                    — {isActive ? 'Visível para os alunos' : 'Oculto para os alunos'}
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="mm-footer">
            <button type="button" className="mm-btn mm-btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="mm-btn mm-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
