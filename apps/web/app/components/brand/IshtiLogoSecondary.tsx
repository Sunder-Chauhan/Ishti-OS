'use client';

import React from 'react';
import { IshtiLogo } from './IshtiLogo';
import type { IshtiLogoProps } from './types';

export type IshtiLogoSecondaryProps = Omit<IshtiLogoProps, 'variant'>;

export function IshtiLogoSecondary(props: IshtiLogoSecondaryProps) {
  return <IshtiLogo variant="secondary" {...props} />;
}
