import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '@/assets/logo-alazab-animated.gif';

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact';
  linkTo?: string;
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  linkTo = '/', 
  className = '',
  showText = true 
}) => {
  const getLogoSize = () => {
    switch (variant) {
      case 'icon':
        return 'h-10 w-auto';
      case 'compact':
        return 'h-12 w-auto';
      case 'full':
      default:
        return 'h-14 w-auto';
    }
  };

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image */}
      <div className="relative">
        <img 
          src={logoImage} 
          alt="العزب للمقاولات المتكاملة" 
          className={`${getLogoSize()} object-contain transition-transform duration-300 hover:scale-105`}
        />
      </div>

      {/* Text - Only show if showText is true and not icon variant */}
      {showText && variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-construction-primary to-construction-accent bg-clip-text text-transparent leading-tight">
            العزب
          </h1>
          <p className="text-[10px] md:text-xs font-medium text-construction-dark/70 leading-tight">
            للمقاولات المتكاملة
          </p>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link 
        to={linkTo}
        className="focus:outline-none focus:ring-2 focus:ring-construction-accent rounded-lg p-1 transition-all duration-300"
        aria-label="العودة للصفحة الرئيسية - العزب للمقاولات المتكاملة"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
