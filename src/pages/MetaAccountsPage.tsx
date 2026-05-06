import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { metaApi, type MetaAccount, type MetaAccountStats, type MetaMessage } from '@/lib/metaApi';
import {
  Phone, MessageSquare, Activity, Plus, Trash2, Settings, RefreshCw,
  CheckCircle, XCircle, ArrowUpDown, Send, Clock, AlertTriangle, Server
} from 'lucide-react';

const MetaAccountsPage: React.FC = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<MetaAccount | null>(null);
  const [stats, setStats] = useState<MetaAccountStats | null>(null);
  const [messages, setMessages] = useState<MetaMessage[]>([]);
  const [conversations, setConversations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverHealth, setServerHealth] = useState<Record<string, unknown> | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    display_name: '', business_name: '', waba_id: '', phone_number_id: '',
    phone_number: '', access_token: '', app_secret: '', verify_token: ''
  });

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const [accountsRes, healthRes] = await Promise.all([
        metaApi.getAccounts().catch(() => ({ data: [] })),
        metaApi.health().catch(() => null),
      ]);
      setAccounts(accountsRes.data || []);
      setServerHealth(healthRes);
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل الحسابات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const selectAccount = async (account: MetaAccount) => {
    setSelectedAccount(account);
    try {
      const [statsRes, msgsRes, convRes] = await Promise.all([
        metaApi.getAccountStats(account.id),
        metaApi.getMessages(account.id, { limit: 30 }),
        metaApi.getConversations(account.id),
      ]);
      setStats(statsRes.data);
      setMessages(msgsRes.data || []);
      setConversations(convRes.data || []);
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحميل بيانات الحساب', variant: 'destructive' });
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.display_name) return;
    try {
      await metaApi.createAccount(newAccount);
      toast({ title: 'تم', description: 'تم إنشاء الحساب بنجاح' });
      setShowAddDialog(false);
      setNewAccount({ display_name: '', business_name: '', waba_id: '', phone_number_id: '', phone_number: '', access_token: '', app_secret: '', verify_token: '' });
      loadAccounts();
    } catch (err: unknown) {
      toast({ title: 'خطأ', description: err instanceof Error ? err.message : 'خطأ', variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    try {
      await metaApi.deleteAccount(id);
      toast({ title: 'تم', description: 'تم حذف الحساب' });
      if (selectedAccount?.id === id) setSelectedAccount(null);
      loadAccounts();
    } catch (err: unknown) {
      toast({ title: 'خطأ', description: err instanceof Error ? err.message : 'خطأ', variant: 'destructive' });
    }
  };

  const webhookUrl = selectedAccount
    ? `${window.location.origin.replace(/:\d+$/, '')}:3004/api/meta/webhook/${selectedAccount.id}`
    : '';

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة حسابات Meta</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة ومراقبة حسابات واتساب الأعمال</p>
          </div>
          <div className="flex items-center gap-3">
            {serverHealth ? (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50">
                <CheckCircle className="h-3 w-3" /> السيرفر متصل
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50">
                <XCircle className="h-3 w-3" /> السيرفر غير متصل
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={loadAccounts}>
              <RefreshCw className="h-4 w-4 ml-1" /> تحديث
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 ml-1" /> حساب جديد</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader><DialogTitle>إضافة حساب WhatsApp Business</DialogTitle></DialogHeader>
                <div className="grid gap-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>اسم العرض *</Label><Input value={newAccount.display_name} onChange={e => setNewAccount(p => ({ ...p, display_name: e.target.value }))} placeholder="شركة العزب" /></div>
                    <div><Label>اسم النشاط</Label><Input value={newAccount.business_name} onChange={e => setNewAccount(p => ({ ...p, business_name: e.target.value }))} placeholder="Al-Azab Group" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>WABA ID</Label><Input value={newAccount.waba_id} onChange={e => setNewAccount(p => ({ ...p, waba_id: e.target.value }))} placeholder="123456789" /></div>
                    <div><Label>Phone Number ID</Label><Input value={newAccount.phone_number_id} onChange={e => setNewAccount(p => ({ ...p, phone_number_id: e.target.value }))} /></div>
                  </div>
                  <div><Label>رقم الهاتف</Label><Input value={newAccount.phone_number} onChange={e => setNewAccount(p => ({ ...p, phone_number: e.target.value }))} placeholder="+966..." dir="ltr" /></div>
                  <div><Label>Access Token</Label><Input type="password" value={newAccount.access_token} onChange={e => setNewAccount(p => ({ ...p, access_token: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>App Secret</Label><Input type="password" value={newAccount.app_secret} onChange={e => setNewAccount(p => ({ ...p, app_secret: e.target.value }))} /></div>
                    <div><Label>Verify Token</Label><Input value={newAccount.verify_token} onChange={e => setNewAccount(p => ({ ...p, verify_token: e.target.value }))} placeholder="سيتم إنشاؤه تلقائياً" /></div>
                  </div>
                  <Button onClick={handleCreateAccount} className="w-full mt-2">إنشاء الحساب</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Accounts List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">الحسابات ({accounts.length})</h3>
            {loading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">جاري التحميل...</CardContent></Card>
            ) : accounts.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد حسابات بعد</CardContent></Card>
            ) : accounts.map(acc => (
              <Card
                key={acc.id}
                className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedAccount?.id === acc.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => selectAccount(acc)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm">{acc.display_name}</span>
                    </div>
                    <Badge variant={acc.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {acc.status === 'active' ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>
                  {acc.phone_number && <p className="text-xs text-muted-foreground mt-1 font-mono" dir="ltr">{acc.phone_number}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Account Details */}
          <div className="lg:col-span-3">
            {!selectedAccount ? (
              <Card><CardContent className="py-20 text-center text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>اختر حساباً لعرض التفاصيل</p>
              </CardContent></Card>
            ) : (
              <Tabs defaultValue="overview" dir="rtl">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="messages">الرسائل</TabsTrigger>
                    <TabsTrigger value="conversations">المحادثات</TabsTrigger>
                    <TabsTrigger value="settings">الإعدادات</TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteAccount(selectedAccount.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Overview */}
                <TabsContent value="overview">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card><CardContent className="p-4 text-center">
                      <MessageSquare className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <p className="text-2xl font-bold">{stats?.messages.total || 0}</p>
                      <p className="text-xs text-muted-foreground">إجمالي الرسائل</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                      <ArrowUpDown className="h-6 w-6 mx-auto mb-1 text-green-500" />
                      <p className="text-2xl font-bold">{stats?.messages.inbound || 0}</p>
                      <p className="text-xs text-muted-foreground">واردة</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                      <Send className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                      <p className="text-2xl font-bold">{stats?.messages.outbound || 0}</p>
                      <p className="text-xs text-muted-foreground">صادرة</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                      <p className="text-2xl font-bold">{stats?.messages.last_24h || 0}</p>
                      <p className="text-xs text-muted-foreground">آخر 24 ساعة</p>
                    </CardContent></Card>
                  </div>

                  {Number(stats?.messages.failed) > 0 && (
                    <Card className="border-red-200 bg-red-50 mb-4">
                      <CardContent className="p-3 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{stats?.messages.failed} رسالة فاشلة</span>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader><CardTitle className="text-sm">رابط Webhook</CardTitle></CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md font-mono text-xs break-all" dir="ltr">{webhookUrl}</div>
                      <p className="text-xs text-muted-foreground mt-2">أضف هذا الرابط في إعدادات تطبيق Meta</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Messages */}
                <TabsContent value="messages">
                  <Card>
                    <CardContent className="p-0">
                      {messages.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">لا توجد رسائل</div>
                      ) : (
                        <div className="divide-y max-h-[500px] overflow-y-auto">
                          {messages.map(msg => (
                            <div key={msg.id} className="p-3 flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${msg.direction === 'inbound' ? 'bg-blue-500' : 'bg-green-500'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">{msg.customer_name || msg.phone_number}</span>
                                  <Badge variant="outline" className="text-[10px]">{msg.message_type}</Badge>
                                  <Badge variant={msg.status === 'received' ? 'default' : msg.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">
                                    {msg.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mt-0.5">{msg.content}</p>
                                <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString('ar-EG')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Conversations */}
                <TabsContent value="conversations">
                  <Card>
                    <CardContent className="p-0">
                      {conversations.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">لا توجد محادثات</div>
                      ) : (
                        <div className="divide-y">
                          {conversations.map((conv: Record<string, string | number>, i: number) => (
                            <div key={i} className="p-3 flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{String(conv.customer_name || conv.phone_number)}</p>
                                <p className="text-xs text-muted-foreground font-mono" dir="ltr">{String(conv.phone_number)}</p>
                              </div>
                              <div className="text-left">
                                <p className="text-sm">{String(conv.message_count)} رسالة</p>
                                {parseInt(String(conv.unread)) > 0 && <Badge variant="destructive" className="text-[10px]">{String(conv.unread)} جديدة</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings */}
                <TabsContent value="settings">
                  <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> إعدادات الحساب</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-xs text-muted-foreground">WABA ID</Label><p className="font-mono text-sm">{selectedAccount.waba_id || '—'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">Phone Number ID</Label><p className="font-mono text-sm">{selectedAccount.phone_number_id || '—'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">رقم الهاتف</Label><p className="font-mono text-sm" dir="ltr">{selectedAccount.phone_number || '—'}</p></div>
                        <div><Label className="text-xs text-muted-foreground">الحالة</Label><Badge variant={selectedAccount.status === 'active' ? 'default' : 'secondary'}>{selectedAccount.status}</Badge></div>
                      </div>
                      <div><Label className="text-xs text-muted-foreground">تاريخ الإنشاء</Label><p className="text-sm">{new Date(selectedAccount.created_at).toLocaleString('ar-EG')}</p></div>
                      <div><Label className="text-xs text-muted-foreground">آخر تحديث</Label><p className="text-sm">{new Date(selectedAccount.updated_at).toLocaleString('ar-EG')}</p></div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MetaAccountsPage;
