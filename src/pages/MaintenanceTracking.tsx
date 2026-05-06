
import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "@/components/ui/use-toast";
import { MaintenanceRequestDetails, AttachmentDetails } from '@/types/maintenance';
import SearchForm from '../components/maintenance/tracking/SearchForm';
import RequestDetailsCard from '../components/maintenance/tracking/RequestDetailsCard';
import NoRequestFound from '../components/maintenance/tracking/NoRequestFound';
import EmptySearchState from '../components/maintenance/tracking/EmptySearchState';
import LoadingSpinner from '../components/maintenance/tracking/LoadingSpinner';
import { fetchMaintenanceRequest, fetchAttachments, updateRequestStatus } from '../components/maintenance/utils/apiUtils';

const MaintenanceTracking: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialRequestNumber = location.state?.requestNumber || searchParams.get('requestNumber') || '';
  
  const [requestNumber, setRequestNumber] = useState<string>(initialRequestNumber);
  const [inputRequestNumber, setInputRequestNumber] = useState<string>(initialRequestNumber);
  const [requestDetails, setRequestDetails] = useState<MaintenanceRequestDetails | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  
  useEffect(() => {
    if (requestNumber) {
      fetchRequestDetails();
    }
  }, [requestNumber]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const fetchRequestDetails = async () => {
    setIsLoading(true);
    try {
      const details = await fetchMaintenanceRequest(requestNumber);
      setRequestDetails({
        ...details,
        request_number: details.request_number || requestNumber,
        branch: details.branch || ''
      });
      
      const attachmentsList = await fetchAttachments(requestNumber);
      setAttachments(attachmentsList);

      // 显示成功消息
      toast({
        title: "تم جلب البيانات بنجاح",
        description: `تم العثور على طلب الصيانة برقم ${requestNumber}`,
        variant: "default"
      });
    } catch (error) {
      console.error('خطأ في جلب بيانات الطلب:', error);
      toast({
        title: "تعذر العثور على الطلب",
        description: "الرجاء التأكد من رقم الطلب والمحاولة مرة أخرى",
        variant: "destructive"
      });
      setRequestDetails(null);
      setAttachments([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = () => {
    if (inputRequestNumber) {
      setRequestNumber(inputRequestNumber);
    } else {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رقم الطلب",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!requestDetails) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateRequestStatus(requestDetails.id, newStatus);
      
      // تحديث البيانات المحلية
      setRequestDetails({
        ...requestDetails,
        status: newStatus,
        completion_date: newStatus === 'completed' ? new Date().toISOString() : requestDetails.completion_date
      });
      
      toast({
        title: "تم تحديث الحالة",
        description: `تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`,
      });
      
    } catch (error) {
      console.error('خطأ في تحديث الحالة:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء محاولة تحديث حالة الطلب",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'قيد الانتظار';
      case 'in progress':
      case 'in-progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status || 'غير معروف';
    }
  };
  
  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-construction-primary">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">متابعة طلب الصيانة</h1>
              <p className="text-gray-600 mt-2">تتبع حالة طلب الصيانة الخاص بك</p>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6">
              <SearchForm 
                inputRequestNumber={inputRequestNumber}
                setInputRequestNumber={setInputRequestNumber}
                handleSearch={handleSearch}
                isLoading={isLoading}
              />
              
              {isLoading && <LoadingSpinner />}
              
              {!isLoading && requestDetails && (
                <RequestDetailsCard 
                  requestDetails={requestDetails}
                  attachments={attachments}
                  isUpdatingStatus={isUpdatingStatus}
                  handleStatusChange={handleStatusChange}
                />
              )}
              
              {!isLoading && !requestDetails && requestNumber && (
                <NoRequestFound requestNumber={requestNumber} />
              )}
              
              {!isLoading && !requestDetails && !requestNumber && (
                <EmptySearchState />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MaintenanceTracking;
