
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const CompanyVision: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-construction-primary to-construction-secondary">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-construction-primary mb-6">
              رؤيتنا
            </h2>
            <div className="prose prose-lg mx-auto text-gray-700">
              <p className="text-lg leading-relaxed">
                من خلال اختيارنا المستمر لتصور عملياتنا على المدى الطويل بدلاً من النهج قصير المدى، 
                نغرس نهجاً موجهاً نحو الهدف في كل جانب من جوانب عملياتنا.
              </p>
              <p className="text-lg leading-relaxed mt-4">
                بهذه الروح، تعكس كلمة "العزب" ثقافتنا، وهي كلمة تشير إلى النهر الخصب الذي يروي 
                كل من يمر به، مرتبطة بالخطط والأحلام والطموحات الرؤيوية.
              </p>
              <p className="text-base mt-6 italic text-construction-primary font-medium">
                "By consistently choosing to envision our operations in the long term rather than a short-term approach, 
                we instill a goal-oriented approach in every aspect of our operations. In this spirit, the word 'Al-Azab' 
                reflects our culture, a word that refers to the fertile river that irrigates all who pass by, associated 
                with plans, dreams, and visionary ambitions."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CompanyVision;
