import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface UserAvatarProps {
  className?: string;
  fallbackClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ className = 'h-9 w-9', fallbackClassName = '' }) => {
  const { profile, initials } = useUserProfile();

  return (
    <Avatar className={className}>
      {profile?.avatarUrl ? (
        <AvatarImage src={profile.avatarUrl} alt={profile.fullName} className="object-cover" />
      ) : null}
      <AvatarFallback className={`bg-construction-accent font-bold text-construction-primary ${fallbackClassName}`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
