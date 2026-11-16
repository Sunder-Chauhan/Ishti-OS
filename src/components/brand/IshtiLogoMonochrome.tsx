'use client';

import React from 'react';
import { IshtiLogo } from './IshtiLogo';
import type { IshtiLogoProps } from './types';

export type IshtiLogoMonochromeProps = Omit<IshtiLogoProps, 'variant'>;

export function IshtiLogoMonochrome(props: IshtiLogoMonochromeProps) {
  return <IshtiLogo variant="monochrome" {...props} />;
}
