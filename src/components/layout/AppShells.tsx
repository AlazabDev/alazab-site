import React from 'react';
import { Outlet } from 'react-router-dom';
import FloatingChatBot from '@/components/shared/FloatingChatBot';
import FloatingSocialButton from '@/components/shared/FloatingSocialButton';
import ScrollProgressBar from '@/components/shared/ScrollProgressBar';
import StickyMobileCTA from '@/components/shared/StickyMobileCTA';
import CommandPalette from '@/components/shared/CommandPalette';

export const PublicShell: React.FC = () => (
  <>
    <Outlet />
    <ScrollProgressBar />
    <FloatingChatBot />
    <FloatingSocialButton />
    <StickyMobileCTA />
    <CommandPalette />
  </>
);

export const OperationalShell: React.FC = () => <Outlet />;

export const AdminShell: React.FC = () => <Outlet />;
