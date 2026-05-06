
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceRequestSummary, Priority } from '@/types/maintenance';
import MaintenanceRequestsList from '@/components/maintenance/MaintenanceRequestsList';

const MaintenanceList: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequestSummary[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequestSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('id, title, service_type, status, priority, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match MaintenanceRequestSummary interface
      const transformedData: MaintenanceRequestSummary[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        service_type: item.service_type || 'غير محدد',
        status: item.status || 'Open',
        priority: item.priority || 'medium',
        preferred_date: item.created_at, // Use created_at as fallback
        created_at: item.created_at
      }));
      
      setRequests(transformedData);
      setFilteredRequests(transformedData);
    } catch (error) {
      console.error('خطأ في جلب طلبات الصيانة:', error);
      toast({
        title: "تعذر جلب الطلبات",
        description: "حدث خطأ أثناء محاولة جلب طلبات الصيانة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, priorityFilter, requests]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterRequests = () => {
    let filtered = [...requests];

    // تطبيق فلتر البحث بالنص
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (request.service_type && request.service_type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // تطبيق فلتر الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // تطبيق فلتر الأولوية
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    // تحديث الحالة في القائمة المحلية
    const updatedRequests = requests.map(req => 
      req.id === requestId ? {...req, status: newStatus} : req
    );
    setRequests(updatedRequests);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-construction-primary">قائمة طلبات الصيانة</h1>
                <p className="text-gray-600 mt-1">عرض وإدارة جميع طلبات الصيانة</p>
              </div>
              <Link to="/maintenance-request">
                <Button className="mt-4 md:mt-0 bg-construction-primary text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                    <path d="M12 5v14"></path>
                    <path d="M5 12h14"></path>
                  </svg>
                  طلب صيانة جديد
                </Button>
              </Link>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">تصفية الطلبات</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="ابحث بالعنوان أو نوع الخدمة"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="حالة الطلب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="open">قيد الانتظار</SelectItem>
                      <SelectItem value="inprogress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأولويات</SelectItem>
                      <SelectItem value={Priority.LOW}>{Priority.LOW}</SelectItem>
                      <SelectItem value={Priority.MEDIUM}>{Priority.MEDIUM}</SelectItem>
                      <SelectItem value={Priority.HIGH}>{Priority.HIGH}</SelectItem>
                      <SelectItem value={Priority.URGENT}>{Priority.URGENT}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6">
              <MaintenanceRequestsList 
                requests={filteredRequests} 
                isLoading={isLoading} 
                onStatusChange={handleStatusChange}
                refreshRequests={fetchRequests}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MaintenanceList;
