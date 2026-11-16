'use client';

import React from 'react';
import { IshtiLogo } from './IshtiLogo';
import type { IshtiLogoProps } from './types';

export type IshtiLogoReversedProps = Omit<IshtiLogoProps, 'variant'>;

export function IshtiLogoReversed(props: IshtiLogoReversedProps) {
  return <IshtiLogo variant="reversed" {...props} />;
}
