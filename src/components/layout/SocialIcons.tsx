import React from 'react';

interface SocialIconProps {
  src: string;
  alt: string;
  href: string;
  bgColor?: string;
}

export const SocialIcon: React.FC<SocialIconProps> = ({ src, alt, href, bgColor = 'bg-gray-100' }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`p-2 rounded-full ${bgColor} hover:scale-110 transition-transform shadow-md hover:shadow-lg`}
    >
      <img src={src} alt={alt} className="w-5 h-5 object-contain" />
    </a>
  );
};
