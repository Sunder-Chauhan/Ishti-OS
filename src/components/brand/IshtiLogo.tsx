'use client';

import React from 'react';
import { IshtiLogoIcon } from './IshtiLogoIcon';
import { IshtiLogoSecondary } from './IshtiLogoSecondary';
import { IshtiLogoPrimary } from './IshtiLogoPrimary';
import { IshtiLogoHorizontal } from './IshtiLogoHorizontal';
import { IshtiLogoMonochrome } from './IshtiLogoMonochrome';
import { IshtiLogoReversed } from './IshtiLogoReversed';
import type { IshtiLogoProps } from './types';

export function IshtiLogo({
  variant = 'secondary',
  ...props
}: IshtiLogoProps) {
  switch (variant) {
    case 'primary':
      return <IshtiLogoPrimary {...props} />;
    case 'icon':
      return <IshtiLogoIcon {...props} />;
    case 'horizontal':
      return <IshtiLogoHorizontal {...props} />;
    case 'monochrome':
      return <IshtiLogoMonochrome {...props} />;
    case 'reversed':
      return <IshtiLogoReversed {...props} />;
    case 'secondary':
    default:
      return <IshtiLogoSecondary {...props} />;
  }
}

export * from './IshtiLogoIcon';
export * from './IshtiLogoSecondary';
export * from './IshtiLogoPrimary';
export * from './IshtiLogoHorizontal';
export * from './IshtiLogoMonochrome';
export * from './IshtiLogoReversed';
export * from './types';
