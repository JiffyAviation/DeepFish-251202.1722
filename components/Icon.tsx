import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconProps extends Partial<LucideProps> {
  name: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = (Icons as any)[name];

  if (!LucideIcon) {
    return <Icons.HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
};