
import React from 'react';

interface TechStackBadgesProps {
  technologies: string[];
}

const TechStackBadges: React.FC<TechStackBadgesProps> = ({ technologies }) => {
  const getTechColor = (tech: string) => {
    const colors: { [key: string]: string } = {
      'React': 'bg-blue-100 text-blue-800',
      'Angular': 'bg-red-100 text-red-800',
      'Vue.js': 'bg-green-100 text-green-800',
      'Express.js': 'bg-gray-100 text-gray-800',
      'Node.js': 'bg-green-100 text-green-800',
      'PostgreSQL': 'bg-blue-100 text-blue-800',
      'MongoDB': 'bg-green-100 text-green-800',
      'Firebase': 'bg-yellow-100 text-yellow-800',
      'TypeScript': 'bg-blue-100 text-blue-800',
      'JavaScript': 'bg-yellow-100 text-yellow-800',
      'Python': 'bg-blue-100 text-blue-800',
      'Laravel': 'bg-red-100 text-red-800',
      'Bootstrap': 'bg-purple-100 text-purple-800',
      'Tailwind': 'bg-cyan-100 text-cyan-800',
      'Supabase': 'bg-green-100 text-green-800',
      'AWS': 'bg-orange-100 text-orange-800',
    };
    
    return colors[tech] || 'bg-construction-light text-construction-primary';
  };

  if (!technologies || technologies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-800">التقنيات المستخدمة</h4>
      <div className="flex flex-wrap gap-2">
        {technologies.map((tech, index) => (
          <span
            key={index}
            className={`px-3 py-1 rounded-full text-sm font-medium ${getTechColor(tech)} transition-all duration-200 hover:scale-105`}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TechStackBadges;
