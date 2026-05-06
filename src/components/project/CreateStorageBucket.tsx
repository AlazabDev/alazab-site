
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DatabaseIcon } from "lucide-react";

const CreateStorageBucket: React.FC = () => {
  const [creating, setCreating] = useState(false);
  const [bucketExists, setBucketExists] = useState(false);
  const { toast } = useToast();

  // التحقق من وجود خزنة التخزين عند تحميل المكون
  useEffect(() => {
    checkBucketExists();
  }, []);

  const checkBucketExists = async () => {
    try {
      console.log("Checking if bucket 'projects' exists...");
      const { data, error } = await supabase.storage.getBucket('projects');
      
      if (data && !error) {
        console.log("Bucket 'projects' exists");
        setBucketExists(true);
      } else {
        console.log("Bucket 'projects' doesn't exist or error:", error);
      }
    } catch (error) {
      console.error("Error checking bucket existence:", error);
    }
  };

  const handleCreateBucket = async () => {
    try {
      setCreating(true);
      console.log("Creating bucket 'projects'...");
      
      // إنشاء خزنة تخزين جديدة للمشاريع
      const { data, error } = await supabase
        .storage
        .createBucket('projects', {
          public: true,
          fileSizeLimit: 10485760, // 10 ميجابايت
        });
      
      if (error) {
        console.error("Error creating bucket:", error);
        // التحقق مما إذا كان الخطأ بسبب وجود الخزنة بالفعل
        if (error.message && error.message.includes('already exists')) {
          toast({
            title: "خزنة التخزين موجودة بالفعل",
            description: "يمكنك استخدامها لتحميل الملفات"
          });
          setBucketExists(true);
        } else {
          throw error;
        }
      } else {
        console.log("Bucket 'projects' created successfully");
        toast({
          title: "تم إنشاء خزنة التخزين بنجاح",
          description: "يمكنك الآن تحميل الملفات للمشاريع"
        });
        setBucketExists(true);
      }
    } catch (error: unknown) {
      console.error("Error creating storage bucket:", error);
      
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء خزنة التخزين",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء محاولة إنشاء خزنة التخزين"
      });
    } finally {
      setCreating(false);
    }
  };

  if (bucketExists) {
    return null; // لا تعرض الزر إذا كانت الخزنة موجودة
  }

  return (
    <Button 
      onClick={handleCreateBucket}
      disabled={creating}
      className="flex items-center gap-2"
    >
      <DatabaseIcon size={16} />
      {creating ? 'جارٍ الإنشاء...' : 'إنشاء خزنة تخزين للمشروعات'}
    </Button>
  );
};

export default CreateStorageBucket;
