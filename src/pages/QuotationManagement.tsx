/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Search, Eye, Download, Trash2, 
  CheckCircle2, Clock, XCircle, Send, Calculator, 
  Building2, Home, Wrench, AlertCircle, ShieldCheck, 
  Edit3, Bell, MessageSquare, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';

interface FinishingLevel {
  id: string; name: string; name_en: string | null; price_per_sqm: number; description: string | null; sort_order: number;
}
interface QuotationCategory { id: string; name: string; sort_order: number; }
interface QuotationItem { id: string; category_id: string; item_code: string | null; description: string; unit: string; default_unit_price: number; sort_order: number; }

interface Quotation {
  id: string; quotation_number: string; client_name: string; client_phone: string | null; client_email: string | null;
  project_type: string; property_type: string | null; property_area: number | null; pricing_system: string;
  finishing_level_id: string | null; material_cost: number | null; labor_percentage: number | null;
  subtotal: number; discount_percentage: number | null; discount_amount: number | null;
  tax_percentage: number | null; tax_amount: number | null; total: number; status: string;
  notes: string | null; valid_until: string | null; created_at: string;
  approved_by: string | null; approved_at: string | null; rejection_reason: string | null;
  approval_notes: string | null; modified_by: string | null; modified_at: string | null;
}

interface LineItem {
  id?: string; item_id?: string | null; description: string; unit: string;
  quantity: number; unit_price: number; total: number; sort_order: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'مسودة', color: 'bg-muted text-muted-foreground', icon: <FileText className="w-3 h-3" /> },
  sent: { label: 'مُرسل', color: 'bg-blue-100 text-blue-700', icon: <Send className="w-3 h-3" /> },
  pending_approval: { label: 'بانتظار الموافقة', color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3 h-3" /> },
  reviewing: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700', icon: <Eye className="w-3 h-3" /> },
  approved: { label: 'تمت الموافقة', color: 'bg-emerald-100 text-emerald-700', icon: <ShieldCheck className="w-3 h-3" /> },
  accepted: { label: 'مقبول', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
};

const pricingLabels: Record<string, string> = {
  area_based: 'حسب المساحة', itemized: 'تفصيلي بالبنود', labor_only: 'تنفيذ فقط',
};

const QuotationManagement: React.FC = () => {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [finishingLevels, setFinishingLevels] = useState<FinishingLevel[]>([]);
  const [categories, setCategories] = useState<QuotationCategory[]>([]);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Approval modal state
  const [approvalModal, setApprovalModal] = useState<{ quotation: Quotation; action: 'approve' | 'reject' | 'edit' } | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    client_name: '', client_phone: '', client_email: '',
    project_type: 'residential', property_type: '', property_area: '',
    pricing_system: 'area_based', finishing_level_id: '',
    material_cost: '', labor_percentage: '20',
    discount_percentage: '0', tax_percentage: '14',
    notes: '', valid_days: '30',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [qRes, flRes, catRes, itemRes] = await Promise.all([
      supabase.from('quotations').select('*').order('created_at', { ascending: false }),
      supabase.from('finishing_levels').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('quotation_categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('quotation_items').select('*').eq('is_active', true).order('sort_order'),
    ]);
    setQuotations((qRes.data as any[]) || []);
    setFinishingLevels((flRes.data as any[]) || []);
    setCategories((catRes.data as any[]) || []);
    setItems((itemRes.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    const ps = formData.pricing_system;
    if (ps === 'area_based') {
      const area = parseFloat(formData.property_area) || 0;
      const level = finishingLevels.find(l => l.id === formData.finishing_level_id);
      subtotal = area * (level?.price_per_sqm || 0);
    } else if (ps === 'labor_only') {
      const mc = parseFloat(formData.material_cost) || 0;
      const lp = parseFloat(formData.labor_percentage) || 20;
      subtotal = mc * (lp / 100);
    } else {
      subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
    }
    const discPct = parseFloat(formData.discount_percentage) || 0;
    const discAmt = subtotal * (discPct / 100);
    const afterDisc = subtotal - discAmt;
    const taxPct = parseFloat(formData.tax_percentage) || 0;
    const taxAmt = afterDisc * (taxPct / 100);
    const total = afterDisc + taxAmt;
    return { subtotal, discAmt, taxAmt, total };
  }, [formData, lineItems, finishingLevels]);

  const addLineItem = (itemId?: string) => {
    const qi = itemId ? items.find(i => i.id === itemId) : null;
    setLineItems(prev => [...prev, {
      item_id: qi?.id || null, description: qi?.description || '', unit: qi?.unit || 'م2',
      quantity: 1, unit_price: qi?.default_unit_price || 0, total: qi?.default_unit_price || 0,
      sort_order: prev.length,
    }]);
  };

  const updateLineItem = (idx: number, field: string, value: any) => {
    setLineItems(prev => prev.map((li, i) => {
      if (i !== idx) return li;
      const updated = { ...li, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (parseFloat(updated.quantity as any) || 0) * (parseFloat(updated.unit_price as any) || 0);
      }
      return updated;
    }));
  };

  const removeLineItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setFormData({
      client_name: '', client_phone: '', client_email: '',
      project_type: 'residential', property_type: '', property_area: '',
      pricing_system: 'area_based', finishing_level_id: '',
      material_cost: '', labor_percentage: '20',
      discount_percentage: '0', tax_percentage: '14',
      notes: '', valid_days: '30',
    });
    setLineItems([]);
    setEditingQuotation(null);
  };

  const handleSave = async () => {
    if (!formData.client_name.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم العميل', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const totals = calculateTotals();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (parseInt(formData.valid_days) || 30));

      const saveData: any = {
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone || null,
        client_email: formData.client_email || null,
        project_type: formData.project_type,
        property_type: formData.property_type || null,
        property_area: formData.property_area ? parseFloat(formData.property_area) : null,
        pricing_system: formData.pricing_system,
        finishing_level_id: formData.pricing_system === 'area_based' ? formData.finishing_level_id || null : null,
        material_cost: formData.pricing_system === 'labor_only' ? parseFloat(formData.material_cost) || null : null,
        labor_percentage: formData.pricing_system === 'labor_only' ? parseFloat(formData.labor_percentage) : null,
        subtotal: totals.subtotal,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        discount_amount: totals.discAmt,
        tax_percentage: parseFloat(formData.tax_percentage) || 0,
        tax_amount: totals.taxAmt,
        total: totals.total,
        notes: formData.notes || null,
        valid_until: validUntil.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      };

      if (editingQuotation) {
        // Update existing
        const { error } = await supabase.from('quotations').update({
          ...saveData,
          modified_at: new Date().toISOString(),
        }).eq('id', editingQuotation.id);
        if (error) throw error;

        // Update line items
        if (formData.pricing_system === 'itemized') {
          await supabase.from('quotation_line_items').delete().eq('quotation_id', editingQuotation.id);
          if (lineItems.length > 0) {
            const liData = lineItems.map((li, i) => ({
              quotation_id: editingQuotation.id, item_id: li.item_id || null,
              description: li.description, unit: li.unit, quantity: li.quantity,
              unit_price: li.unit_price, total: li.total, sort_order: i,
            }));
            await supabase.from('quotation_line_items').insert(liData);
          }
        }
        toast({ title: 'تم التحديث', description: `تم تحديث عرض السعر ${editingQuotation.quotation_number}` });
      } else {
        // Create new
        const { data: numData } = await supabase.rpc('generate_quotation_number');
        const quotation_number = numData || `AZB-${Date.now()}`;
        
        const { data: q, error: qErr } = await supabase.from('quotations')
          .insert({ ...saveData, quotation_number, status: 'draft' }).select().single();
        if (qErr) throw qErr;

        if (formData.pricing_system === 'itemized' && lineItems.length > 0) {
          const liData = lineItems.map((li, i) => ({
            quotation_id: q.id, item_id: li.item_id || null,
            description: li.description, unit: li.unit, quantity: li.quantity,
            unit_price: li.unit_price, total: li.total, sort_order: i,
          }));
          await supabase.from('quotation_line_items').insert(liData);
        }

        // Send notification for new quotation
        sendNotification(q.id, 'new');
        toast({ title: 'تم الحفظ', description: `عرض السعر ${quotation_number} تم إنشاؤه بنجاح` });
      }

      setShowForm(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendNotification = async (quotationId: string, action: string, extra?: any) => {
    try {
      await supabase.functions.invoke('quotation-notifications', {
        body: { quotation_id: quotationId, action, ...extra },
      });
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const handleEditQuotation = async (q: Quotation) => {
    // Load line items if itemized
    setFormData({
      client_name: q.client_name,
      client_phone: q.client_phone || '',
      client_email: q.client_email || '',
      project_type: q.project_type,
      property_type: q.property_type || '',
      property_area: q.property_area?.toString() || '',
      pricing_system: q.pricing_system,
      finishing_level_id: q.finishing_level_id || '',
      material_cost: q.material_cost?.toString() || '',
      labor_percentage: q.labor_percentage?.toString() || '20',
      discount_percentage: q.discount_percentage?.toString() || '0',
      tax_percentage: q.tax_percentage?.toString() || '14',
      notes: q.notes || '',
      valid_days: '30',
    });

    if (q.pricing_system === 'itemized') {
      const { data } = await supabase.from('quotation_line_items')
        .select('*').eq('quotation_id', q.id).order('sort_order');
      setLineItems((data as any[]) || []);
    } else {
      setLineItems([]);
    }

    setEditingQuotation(q);
    setShowForm(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('quotations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    sendNotification(id, 'status_change', { new_status: status });
    fetchData();
    toast({ title: 'تم التحديث', description: `تم تحديث حالة العرض إلى ${statusConfig[status]?.label}` });
  };

  const handleApproval = async () => {
    if (!approvalModal) return;
    setProcessingApproval(true);
    try {
      const { quotation, action } = approvalModal;
      
      if (action === 'approve') {
        await supabase.from('quotations').update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approval_notes: approvalNotes || null,
          updated_at: new Date().toISOString(),
        }).eq('id', quotation.id);
        sendNotification(quotation.id, 'approved', { approval_notes: approvalNotes });
        toast({ title: '✅ تمت الموافقة', description: `تمت الموافقة على عرض السعر ${quotation.quotation_number}` });
      } else if (action === 'reject') {
        if (!rejectionReason.trim()) {
          toast({ title: 'خطأ', description: 'يرجى إدخال سبب الرفض', variant: 'destructive' });
          setProcessingApproval(false);
          return;
        }
        await supabase.from('quotations').update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        }).eq('id', quotation.id);
        sendNotification(quotation.id, 'rejected', { rejection_reason: rejectionReason });
        toast({ title: '❌ تم الرفض', description: `تم رفض عرض السعر ${quotation.quotation_number}` });
      } else if (action === 'edit') {
        handleEditQuotation(quotation);
      }

      setApprovalModal(null);
      setApprovalNotes('');
      setRejectionReason('');
      fetchData();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setProcessingApproval(false);
    }
  };

  const deleteQuotation = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف عرض السعر؟')) return;
    await supabase.from('quotation_line_items').delete().eq('quotation_id', id);
    await supabase.from('quotation_notifications').delete().eq('quotation_id', id);
    await supabase.from('quotations').delete().eq('id', id);
    fetchData();
    toast({ title: 'تم الحذف' });
  };

  const generatePDF = async (quotationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-quotation-pdf', {
        body: { quotationId },
      });
      if (error) throw error;
      const win = window.open('', '_blank');
      if (win) { win.document.write(data.html); win.document.close(); setTimeout(() => win.print(), 500); }
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
  };

  const filteredQuotations = quotations.filter(q => {
    const matchSearch = !search || q.client_name.includes(search) || q.quotation_number.includes(search) || (q.client_phone && q.client_phone.includes(search));
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = calculateTotals();
  const fmt = (n: number) => new Intl.NumberFormat('ar-EG').format(Math.round(n));

  // Count pending approvals
  const pendingCount = quotations.filter(q => q.status === 'pending_approval').length;

  return (
    <>
      <Helmet><title>إدارة عروض الأسعار | شركة العزب</title></Helmet>
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                  <Calculator className="w-8 h-8 text-construction-accent" />
                  إدارة عروض الأسعار
                  {pendingCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2.5 py-1 rounded-full animate-pulse">
                      {pendingCount} بانتظار الموافقة
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground mt-1">إنشاء وإدارة والموافقة على عروض الأسعار</p>
              </div>
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-construction-accent hover:bg-construction-accent/90 text-construction-primary">
                <Plus className="w-4 h-4 ml-2" /> إنشاء عرض سعر جديد
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
              {Object.entries(statusConfig).map(([key, cfg]) => {
                const count = quotations.filter(q => q.status === key).length;
                return (
                  <div key={key} className={`bg-card rounded-xl p-3 border border-border text-center cursor-pointer hover:shadow-md transition-shadow ${key === 'pending_approval' && count > 0 ? 'ring-2 ring-orange-400' : ''}`} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${cfg.color} ${statusFilter === key ? 'ring-2 ring-construction-accent' : ''}`}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <div className="text-xl font-bold mt-1">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث بالاسم، الرقم، الهاتف..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
              </div>
            </div>

            {/* Quotations List */}
            {loading ? (
              <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary mx-auto" /></div>
            ) : filteredQuotations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد عروض أسعار</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuotations.map((q) => {
                  const sc = statusConfig[q.status] || statusConfig.draft;
                  const isPending = q.status === 'pending_approval';
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-card rounded-xl border p-4 hover:shadow-md transition-shadow ${isPending ? 'border-orange-300 bg-orange-50/30' : 'border-border'}`}
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-construction-accent">{q.quotation_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${sc.color}`}>
                              {sc.icon} {sc.label}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {pricingLabels[q.pricing_system]}
                            </span>
                            {q.rejection_reason && (
                              <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                سبب الرفض: {q.rejection_reason}
                              </span>
                            )}
                            {q.approval_notes && q.status === 'approved' && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                📝 {q.approval_notes}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                            <span>👤 {q.client_name}</span>
                            {q.client_phone && <span>📞 {q.client_phone}</span>}
                            {q.property_area && <span>📐 {q.property_area} م²</span>}
                            <span>📅 {new Date(q.created_at).toLocaleDateString('ar-EG')}</span>
                            {q.approved_at && <span>✅ موافقة: {new Date(q.approved_at).toLocaleDateString('ar-EG')}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-left ml-4">
                            <div className="text-xs text-muted-foreground">الإجمالي</div>
                            <div className="text-lg font-bold text-construction-primary">{fmt(q.total)} ج.م</div>
                          </div>

                          {/* Approval Actions */}
                          {isPending && (
                            <>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setApprovalModal({ quotation: q, action: 'approve' }); setApprovalNotes(''); }}>
                                <ThumbsUp className="w-3.5 h-3.5 ml-1" /> موافقة
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setApprovalModal({ quotation: q, action: 'reject' }); setRejectionReason(''); }}>
                                <ThumbsDown className="w-3.5 h-3.5 ml-1" /> رفض
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditQuotation(q)}>
                                <Edit3 className="w-3.5 h-3.5 ml-1" /> تعديل
                              </Button>
                            </>
                          )}

                          {!isPending && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEditQuotation(q)} title="تعديل">
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => generatePDF(q.id)} title="طباعة PDF">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <select
                                value={q.status}
                                onChange={e => updateStatus(q.id, e.target.value)}
                                className="text-xs border rounded-md px-2 py-1.5 bg-background"
                              >
                                {Object.entries(statusConfig).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                              <Button variant="ghost" size="sm" onClick={() => deleteQuotation(q.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Approval Modal */}
            <AnimatePresence>
              {approvalModal && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={e => { if (e.target === e.currentTarget) setApprovalModal(null); }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" dir="rtl"
                  >
                    <div className={`p-5 text-white ${approvalModal.action === 'approve' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        {approvalModal.action === 'approve' ? (
                          <><ThumbsUp className="w-6 h-6" /> الموافقة على عرض السعر</>
                        ) : (
                          <><ThumbsDown className="w-6 h-6" /> رفض عرض السعر</>
                        )}
                      </h2>
                      <p className="text-sm opacity-80 mt-1">{approvalModal.quotation.quotation_number} - {approvalModal.quotation.client_name}</p>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="bg-muted rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">العميل:</span> <strong>{approvalModal.quotation.client_name}</strong></div>
                          <div><span className="text-muted-foreground">الإجمالي:</span> <strong className="text-construction-primary">{fmt(approvalModal.quotation.total)} ج.م</strong></div>
                          <div><span className="text-muted-foreground">النظام:</span> {pricingLabels[approvalModal.quotation.pricing_system]}</div>
                          {approvalModal.quotation.property_area && <div><span className="text-muted-foreground">المساحة:</span> {approvalModal.quotation.property_area} م²</div>}
                        </div>
                      </div>

                      {approvalModal.action === 'approve' ? (
                        <div>
                          <label className="text-sm font-bold mb-1 block">ملاحظات الموافقة (اختياري)</label>
                          <textarea
                            className="w-full border rounded-md p-3 text-sm bg-background resize-none"
                            rows={3}
                            value={approvalNotes}
                            onChange={e => setApprovalNotes(e.target.value)}
                            placeholder="أضف ملاحظات على الموافقة..."
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm font-bold mb-1 block text-red-600">سبب الرفض *</label>
                          <textarea
                            className="w-full border border-red-200 rounded-md p-3 text-sm bg-background resize-none"
                            rows={3}
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="يرجى توضيح سبب رفض العرض..."
                          />
                        </div>
                      )}

                      <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex items-start gap-2">
                        <Bell className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>سيتم إرسال إشعار واتساب تلقائي للعميل والإدارة وفريق المبيعات</span>
                      </div>
                    </div>

                    <div className="p-4 border-t flex justify-between">
                      <Button variant="outline" onClick={() => setApprovalModal(null)}>إلغاء</Button>
                      <Button
                        onClick={handleApproval}
                        disabled={processingApproval}
                        className={approvalModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                        variant={approvalModal.action === 'reject' ? 'destructive' : 'default'}
                      >
                        {processingApproval ? 'جاري المعالجة...' : approvalModal.action === 'approve' ? '✅ تأكيد الموافقة' : '❌ تأكيد الرفض'}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Create/Edit Form Modal */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4"
                  onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="bg-background rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl" dir="rtl"
                  >
                    <div className="bg-gradient-to-l from-construction-primary to-construction-dark p-5 text-white">
                      <h2 className="text-xl font-bold">{editingQuotation ? `تعديل عرض السعر ${editingQuotation.quotation_number}` : 'إنشاء عرض سعر جديد'}</h2>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                      {/* Client Info */}
                      <div>
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-construction-accent" /> بيانات العميل
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input placeholder="اسم العميل *" value={formData.client_name} onChange={e => setFormData(p => ({ ...p, client_name: e.target.value }))} />
                          <Input placeholder="رقم الهاتف" value={formData.client_phone} onChange={e => setFormData(p => ({ ...p, client_phone: e.target.value }))} />
                          <Input placeholder="البريد الإلكتروني" value={formData.client_email} onChange={e => setFormData(p => ({ ...p, client_email: e.target.value }))} />
                          <select value={formData.project_type} onChange={e => setFormData(p => ({ ...p, project_type: e.target.value }))} className="border rounded-md px-3 py-2 text-sm bg-background">
                            <option value="residential">سكني</option>
                            <option value="commercial">تجاري</option>
                          </select>
                          <Input placeholder="نوع العقار (شقة، فيلا، محل...)" value={formData.property_type} onChange={e => setFormData(p => ({ ...p, property_type: e.target.value }))} />
                          <Input placeholder="المساحة (م²)" type="number" value={formData.property_area} onChange={e => setFormData(p => ({ ...p, property_area: e.target.value }))} />
                        </div>
                      </div>

                      {/* Pricing System */}
                      <div>
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-construction-accent" /> نظام التسعير
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'area_based', label: 'حسب المساحة', icon: <Home className="w-5 h-5" />, desc: 'السعر = المساحة × سعر المتر' },
                            { value: 'itemized', label: 'تفصيلي بالبنود', icon: <FileText className="w-5 h-5" />, desc: 'عرض سعر مفصل لكل بند' },
                            { value: 'labor_only', label: 'تنفيذ فقط', icon: <Wrench className="w-5 h-5" />, desc: 'خامات على العميل + 20%' },
                          ].map(sys => (
                            <button
                              key={sys.value}
                              onClick={() => setFormData(p => ({ ...p, pricing_system: sys.value }))}
                              className={`p-3 rounded-xl border-2 text-center transition-all ${
                                formData.pricing_system === sys.value 
                                  ? 'border-construction-accent bg-construction-accent/5' 
                                  : 'border-border hover:border-muted-foreground'
                              }`}
                            >
                              <div className="flex justify-center mb-1 text-construction-accent">{sys.icon}</div>
                              <div className="text-xs font-bold">{sys.label}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{sys.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* System-specific fields */}
                      {formData.pricing_system === 'area_based' && (
                        <div>
                          <h3 className="font-bold text-sm mb-3">مستوى التشطيب</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {finishingLevels.map(fl => (
                              <button
                                key={fl.id}
                                onClick={() => setFormData(p => ({ ...p, finishing_level_id: fl.id }))}
                                className={`p-3 rounded-xl border-2 text-center transition-all ${
                                  formData.finishing_level_id === fl.id 
                                    ? 'border-construction-accent bg-construction-accent/5' 
                                    : 'border-border hover:border-muted-foreground'
                                }`}
                              >
                                <div className="text-sm font-bold">{fl.name}</div>
                                <div className="text-lg font-bold text-construction-accent mt-1">{fmt(fl.price_per_sqm)}</div>
                                <div className="text-[10px] text-muted-foreground">ج.م / م²</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.pricing_system === 'labor_only' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold mb-1 block">قيمة الخامات (ج.م)</label>
                            <Input type="number" value={formData.material_cost} onChange={e => setFormData(p => ({ ...p, material_cost: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-bold mb-1 block">نسبة التنفيذ (%)</label>
                            <Input type="number" value={formData.labor_percentage} onChange={e => setFormData(p => ({ ...p, labor_percentage: e.target.value }))} />
                          </div>
                        </div>
                      )}

                      {formData.pricing_system === 'itemized' && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-sm">بنود عرض السعر</h3>
                            <div className="flex gap-2">
                              <select
                                onChange={e => { if (e.target.value) addLineItem(e.target.value); e.target.value = ''; }}
                                className="text-xs border rounded-md px-2 py-1.5 bg-background"
                              >
                                <option value="">+ إضافة بند من القائمة</option>
                                {categories.map(cat => (
                                  <optgroup key={cat.id} label={cat.name}>
                                    {items.filter(i => i.category_id === cat.id).map(item => (
                                      <option key={item.id} value={item.id}>{item.description} ({item.unit})</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                              <Button variant="outline" size="sm" onClick={() => addLineItem()}>
                                <Plus className="w-3 h-3 ml-1" /> بند مخصص
                              </Button>
                            </div>
                          </div>

                          {lineItems.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">أضف بنوداً لعرض السعر</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lineItems.map((li, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-muted/50 rounded-lg p-2">
                                  <span className="text-xs text-muted-foreground mt-2 w-6">{idx + 1}</span>
                                  <Input className="flex-1 text-xs" placeholder="وصف البند" value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} />
                                  <Input className="w-16 text-xs" value={li.unit} onChange={e => updateLineItem(idx, 'unit', e.target.value)} />
                                  <Input className="w-20 text-xs" type="number" placeholder="الكمية" value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                                  <Input className="w-24 text-xs" type="number" placeholder="سعر الوحدة" value={li.unit_price} onChange={e => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                                  <div className="w-24 text-xs font-bold text-left mt-2">{fmt(li.total)} ج.م</div>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLineItem(idx)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Discount & Tax */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold mb-1 block">نسبة الخصم (%)</label>
                          <Input type="number" value={formData.discount_percentage} onChange={e => setFormData(p => ({ ...p, discount_percentage: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-bold mb-1 block">الضريبة (%)</label>
                          <Input type="number" value={formData.tax_percentage} onChange={e => setFormData(p => ({ ...p, tax_percentage: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-bold mb-1 block">صالح لمدة (يوم)</label>
                          <Input type="number" value={formData.valid_days} onChange={e => setFormData(p => ({ ...p, valid_days: e.target.value }))} />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs font-bold mb-1 block">ملاحظات</label>
                        <textarea
                          className="w-full border rounded-md p-3 text-sm bg-background resize-none"
                          rows={2}
                          value={formData.notes}
                          onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                          placeholder="ملاحظات إضافية..."
                        />
                      </div>

                      {/* Totals Preview */}
                      <div className="bg-gradient-to-l from-construction-primary/5 to-construction-accent/5 rounded-xl p-4 border border-construction-accent/20">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span>الإجمالي الفرعي</span><span className="font-bold">{fmt(totals.subtotal)} ج.م</span></div>
                          {totals.discAmt > 0 && <div className="flex justify-between text-destructive"><span>الخصم ({formData.discount_percentage}%)</span><span>-{fmt(totals.discAmt)} ج.م</span></div>}
                          {totals.taxAmt > 0 && <div className="flex justify-between"><span>الضريبة ({formData.tax_percentage}%)</span><span>{fmt(totals.taxAmt)} ج.م</span></div>}
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-construction-accent/20">
                            <span>الإجمالي النهائي</span>
                            <span className="text-construction-primary">{fmt(totals.total)} ج.م</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t flex justify-between">
                      <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>إلغاء</Button>
                      <div className="flex gap-2">
                        {editingQuotation && (
                          <Button variant="outline" onClick={() => { updateStatus(editingQuotation.id, 'pending_approval'); setShowForm(false); resetForm(); }}>
                            <ShieldCheck className="w-4 h-4 ml-1" /> حفظ وطلب موافقة
                          </Button>
                        )}
                        <Button onClick={handleSave} disabled={saving} className="bg-construction-accent hover:bg-construction-accent/90 text-construction-primary">
                          {saving ? 'جاري الحفظ...' : editingQuotation ? 'حفظ التعديلات' : 'حفظ عرض السعر'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default QuotationManagement;
