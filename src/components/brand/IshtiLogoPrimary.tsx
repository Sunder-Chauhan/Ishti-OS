'use client';

import React from 'react';
import { IshtiLogo } from './IshtiLogo';
import type { IshtiLogoProps } from './types';

export type IshtiLogoPrimaryProps = Omit<IshtiLogoProps, 'variant'>;

export function IshtiLogoPrimary(props: IshtiLogoPrimaryProps) {
  return <IshtiLogo variant="primary" {...props} />;
}
