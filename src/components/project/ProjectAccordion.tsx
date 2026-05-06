
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionItem {
  title: string;
  content: string;
}

interface ProjectAccordionProps {
  items: AccordionItem[];
}

const ProjectAccordion: React.FC<ProjectAccordionProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleAccordion(index)}
            className="w-full px-4 py-3 text-right bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors duration-200"
          >
            <span className="font-medium text-gray-800">{item.title}</span>
            {openIndex === index ? (
              <ChevronUp size={20} className="text-construction-primary" />
            ) : (
              <ChevronDown size={20} className="text-construction-primary" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-4 py-3 bg-white">
              <p className="text-gray-600 leading-relaxed">{item.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectAccordion;
