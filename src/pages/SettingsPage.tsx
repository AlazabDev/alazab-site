
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  Database,
  Key
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const settingSections = [
    {
      title: "الإشعارات",
      icon: Bell,
      settings: [
        { label: "إشعارات البريد الإلكتروني", enabled: true },
        { label: "الإشعارات الفورية", enabled: false },
        { label: "تحديثات المشاريع", enabled: true },
      ]
    },
    {
      title: "الأمان والخصوصية",
      icon: Shield,
      settings: [
        { label: "المصادقة الثنائية", enabled: false },
        { label: "تسجيل الأنشطة", enabled: true },
        { label: "إخفاء الملف الشخصي", enabled: false },
      ]
    },
    {
      title: "المظهر واللغة",
      icon: Palette,
      settings: [
        { label: "الوضع الليلي", enabled: false },
        { label: "اللغة العربية", enabled: true },
        { label: "حجم الخط الكبير", enabled: false },
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">الإعدادات</h2>
          <p className="text-gray-600">إدارة إعدادات النظام والتفضيلات الشخصية</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {settingSections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="w-5 h-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.settings.map((setting, settingIndex) => (
                  <div key={settingIndex} className="flex items-center justify-between">
                    <Label htmlFor={`setting-${index}-${settingIndex}`} className="flex-1">
                      {setting.label}
                    </Label>
                    <Switch
                      id={`setting-${index}-${settingIndex}`}
                      checked={setting.enabled}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                تغيير كلمة المرور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button className="w-full">تحديث كلمة المرور</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                النسخ الاحتياطي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                آخر نسخة احتياطية: 15 ديسمبر 2024
              </p>
              <Button variant="outline" className="w-full">
                إنشاء نسخة احتياطية الآن
              </Button>
              <Button variant="outline" className="w-full">
                استعادة من نسخة احتياطية
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
