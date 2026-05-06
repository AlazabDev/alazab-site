import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Calendar, Search, RotateCcw, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '../components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';

type MrStatus = Database['public']['Enums']['mr_status'];

interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  service_type: string;
  status: MrStatus;
  created_at: string;
  location: string;
}

const MaintenanceReports: React.FC = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState('2025-08-01');
  const [toDate, setToDate] = useState('2025-08-03');
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch maintenance requests within date range
      const { data: requests, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate + 'T23:59:59');

      if (error) throw error;

      // Calculate stats - using the actual enum values
      const total = requests?.length || 0;
      const pending = requests?.filter(r => r.status === 'Open' || (r.status as string) === 'Waiting').length || 0;
      const inProgress = requests?.filter(r => r.status === 'InProgress' || (r.status as string) === 'Assigned').length || 0;
      const completed = requests?.filter(r => r.status === 'Completed').length || 0;

      setStats({
        totalRequests: total,
        pendingRequests: pending,
        inProgressRequests: inProgress,
        completedRequests: completed
      });

      setRecentRequests((requests || []).map(req => ({
        ...req,
        service_type: req.service_type || 'غير محدد',
        location: req.location || '',
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFromDate('2025-08-01');
    setToDate('2025-08-03');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      'Open': { label: 'في انتظار الموافقة', variant: 'secondary' },
      'InProgress': { label: 'قيد التنفيذ', variant: 'default' },
      'Completed': { label: 'مكتمل', variant: 'outline' },
      'Cancelled': { label: 'ملغي', variant: 'destructive' },
      'Assigned': { label: 'معين', variant: 'default' },
      'Waiting': { label: 'في الانتظار', variant: 'secondary' },
      'Rejected': { label: 'مرفوض', variant: 'destructive' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const pieData = [
    { name: 'قيد التنفيذ', value: stats.inProgressRequests, color: '#ff8c00' },
    { name: 'قيد التعديل', value: stats.pendingRequests, color: '#1e3a8a' },
    { name: 'مكتملة', value: stats.completedRequests, color: '#16a34a' }
  ];

  const lineData = [
    { name: 'March', value: 0 },
    { name: 'April', value: 0 },
    { name: 'May', value: 0 },
    { name: 'June', value: 0 },
    { name: 'July', value: 0 },
    { name: 'August', value: stats.totalRequests }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold">تقارير الصيانة</h1>
            <p className="text-blue-100 mt-1">طلبات الصيانة والإحصائيات › التقارير</p>
          </div>

          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">من تاريخ:</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">إلى تاريخ:</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>
              <Button onClick={resetFilters} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 ml-2" />
                إعادة تعيين
              </Button>
              <Button onClick={fetchData} size="sm">
                <Search className="h-4 w-4 ml-2" />
                تصفية
              </Button>
              <span className="text-sm text-gray-600">August 2025 - August 2025</span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalRequests}</div>
                  <div className="text-sm text-gray-600">إجمالي الطلبات</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{stats.pendingRequests}</div>
                  <div className="text-sm text-gray-600">الطلبات المعلقة</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-800 mb-2">{stats.inProgressRequests}</div>
                  <div className="text-sm text-gray-600">الطلبات قيد التنفيذ</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.completedRequests}</div>
                  <div className="text-sm text-gray-600">الطلبات المكتملة</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">حالة الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded"></div>
                      <span className="text-sm">قيد التنفيذ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-800 rounded"></div>
                      <span className="text-sm">قيد التعديل</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">مكتملة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">إحصائيات طلبات الصيانة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#1e3a8a" 
                          strokeWidth={3}
                          dot={{ fill: '#1e3a8a', strokeWidth: 2, r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-800 rounded"></div>
                      <span className="text-sm">طلبات صيانة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle>أحدث طلبات الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الإجراءات</TableHead>
                        <TableHead>تاريخ الطلب</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الخدمة</TableHead>
                        <TableHead>العقار</TableHead>
                        <TableHead>رقم الطلب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/maintenance-request-details/${request.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            {new Date(request.created_at).toLocaleDateString('ar-SA')} 12:00
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>{request.service_type}</TableCell>
                          <TableCell>{request.location || 'غير محدد'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              {request.id.substring(0, 20)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {recentRequests.length === 0 && !loading && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            لا توجد طلبات في الفترة المحددة
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MaintenanceReports;
