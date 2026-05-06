
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface WelcomeCardProps {
  userName?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName }) => {
  return (
    <Card className="mb-8 bg-gradient-to-r from-construction-primary to-construction-secondary text-white">
      <CardHeader>
        <CardTitle className="text-2xl">
          مرحباً {userName ? `، ${userName}` : ''}
        </CardTitle>
        <CardDescription className="text-white/80">
          إدارة المشاريع وطلبات الصيانة من مكان واحد
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Link to="/maintenance-request">
            <Button variant="secondary" size="sm">
              <Plus className="ml-2 h-4 w-4" />
              طلب صيانة جديد
            </Button>
          </Link>
          <Link to="/project-management">
            <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-construction-primary">
              <FileText className="ml-2 h-4 w-4" />
              إدارة المشاريع
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
