
import React from 'react';
import { ExternalLink, Store, Youtube } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CompanyLinks: React.FC = () => {
  const links = [
    {
      title: "المتجر الإلكتروني",
      description: "تصفح منتجاتنا وخدماتنا",
      url: "https://alazab-co.daftra.com/",
      icon: Store,
      color: "bg-construction-accent"
    },
    {
      title: "فيس بوك",
      description: "تابعنا على فيس بوك",
      url: "https://www.facebook.com/alazab24",
      icon: ExternalLink,
      color: "bg-construction-primary"
    },
    {
      title: "انستجرام",
      description: "شاهد أعمالنا على انستجرام",
      url: "https://www.instagram.com/alazab.co/",
      icon: ExternalLink,
      color: "bg-construction-secondary"
    },
    {
      title: "يوتيوب",
      description: "قناتنا على يوتيوب",
      url: "https://www.youtube.com/@al-azab_co",
      icon: Youtube,
      color: "bg-construction-dark"
    },
    {
      title: "واتساب",
      description: "تواصل معنا عبر واتساب",
      url: "https://wa.me/c/201004006620",
      icon: ExternalLink,
      color: "bg-construction-accent"
    },
    {
      title: "خيوط (Threads)",
      description: "تابعنا على خيوط",
      url: "https://www.threads.com/@alazab.co",
      icon: ExternalLink,
      color: "bg-construction-primary"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-construction-primary mb-4">
            روابطنا الاجتماعية
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            تابعنا على منصاتنا الرقمية للحصول على آخر التحديثات والأعمال
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  {link.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{link.description}</p>
                <Button asChild className="w-full bg-construction-primary hover:bg-construction-dark text-white">
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    زيارة الرابط
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyLinks;
