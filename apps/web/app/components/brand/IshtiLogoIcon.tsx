'use client';

import React from 'react';
import { IshtiLogo } from './IshtiLogo';
import type { IshtiLogoProps } from './types';

export type IshtiLogoIconProps = Omit<IshtiLogoProps, 'variant'>;

export function IshtiLogoIcon(props: IshtiLogoIconProps) {
  return <IshtiLogo variant="icon" {...props} />;
}
