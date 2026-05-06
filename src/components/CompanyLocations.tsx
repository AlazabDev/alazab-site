
import React from 'react';
import { MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CompanyLocations: React.FC = () => {
  const locations = [
    {
      title: "المقر الرئيسي - القاهرة",
      address: "مصر، القاهرة، المعادي، ش 500 متفرع من ش الجزائر",
      phone: "+201004006620",
      iframe: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3455.7082683207286!2d31.27876292548312!3d29.987812974952103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1458396627ebf27d%3A0x15bc48a54f2e9a92!2z2KfZhNi52LLYqCDZhNmE2YXZgtin2YjZhNin2Kog2YjYp9mE2KrZiNix2YrYr9in2Ko!5e0!3m2!1sar!2seg!4v1749129394818!5m2!1sar!2seg"
    },
    {
      title: "فرع الدقهلية - نبروه",
      address: "مصر، الدقهلية، مدينة نبروه، ش المحطة",
      phone: "+201014536600",
      iframe: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d854.1247240780544!2d31.30022173046193!3d31.095862998400694!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzHCsDA1JzQ1LjEiTiAzMcKwMTcnNTguNSJF!5e0!3m2!1sar!2seg!4v1749127640901!5m2!1sar!2seg"
    },
    {
      title: "فرع الإسكندرية",
      address: "مصر، الإسكندرية، سموحة، طريق الحرية",
      phone: "+201004006620",
      iframe: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d54678!2d29.9553!3d31.2156!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDEyJzU2LjIiTiAyOcKwNTcnMTkuMSJF!5e0!3m2!1sar!2seg!4v1749129206014!5m2!1sar!2seg"
    }
  ];

  return (
    <section className="py-16 bg-construction-primary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            مقراتنا وفروعنا في مصر
          </h2>
          <p className="text-construction-light max-w-2xl mx-auto">
            نخدمكم من خلال شبكة فروع مصر — القاهرة والدقهلية والإسكندرية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {locations.map((location, index) => (
            <Card key={index} className="overflow-hidden bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-construction-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {location.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={location.iframe}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-construction-primary flex-shrink-0" />
                    {location.address}
                  </p>
                  <p className="text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-construction-primary" />
                    <a href={`tel:${location.phone}`} className="hover:text-construction-primary transition">
                      {location.phone}
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyLocations;
