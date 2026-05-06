
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Wrench, CheckCircle, Clock } from "lucide-react";

interface DashboardStatsProps {
  totalProjects: number;
  pendingMaintenance: number;
  completedTasks: number;
  activeProjects: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalProjects,
  pendingMaintenance,
  completedTasks,
  activeProjects
}) => {
  const stats = [
    {
      title: "إجمالي المشاريع",
      value: totalProjects,
      icon: Building2,
      color: "text-blue-600"
    },
    {
      title: "طلبات الصيانة المعلقة",
      value: pendingMaintenance,
      icon: Wrench,
      color: "text-yellow-600"
    },
    {
      title: "المهام المكتملة",
      value: completedTasks,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "المشاريع النشطة",
      value: activeProjects,
      icon: Clock,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
