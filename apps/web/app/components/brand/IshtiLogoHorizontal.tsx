'use client';

import React from 'react';
import { IshtiLogo } from './IshtiLogo';
import type { IshtiLogoProps } from './types';

export type IshtiLogoHorizontalProps = Omit<IshtiLogoProps, 'variant'>;

export function IshtiLogoHorizontal(props: IshtiLogoHorizontalProps) {
  return <IshtiLogo variant="horizontal" {...props} />;
}
