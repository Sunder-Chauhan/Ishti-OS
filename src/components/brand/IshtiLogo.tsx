
import React from 'react';
import { ISHTI_LOGO_VARIANTS } from './types';
import type { IshtiLogoProps } from './types';

export function IshtiLogo({
    variant = 'secondary',
    size,
    width,
    height,
    className,
    style,
    decorative = false,
    priority = false,
    title,
    desc,
    alt,
    ...restProps
}: IshtiLogoProps) {
    const meta = ISHTI_LOGO_VARIANTS[variant] ?? ISHTI_LOGO_VARIANTS.secondary;

    // Compute clean width and height preserving intrinsic aspect ratio
    let resolvedWidth: number | string | undefined = width;
    let resolvedHeight: number | string | undefined = height;

    if (size !== undefined) {
        if (variant === 'icon') {
            resolvedWidth = size;
            resolvedHeight = size;
        } else if (variant === 'horizontal') {
            // Horizontal lockup (680 x 240, ratio 2.833)
            if (typeof size === 'number') {
                if (size <= 120) {
                    resolvedHeight = size;
                    resolvedWidth = Math.round(size * meta.aspectRatio);
                } else {
                    resolvedWidth = size;
                    resolvedHeight = Math.round(size / meta.aspectRatio);
                }
            } else {
                resolvedHeight = size;
                resolvedWidth = 'auto';
            }
        } else {
            // Vertical lockups (primary: 400x540; secondary/mono/rev: 400x460)
            if (typeof size === 'number') {
                if (size <= 120) {
                    resolvedHeight = size;
                    resolvedWidth = Math.round(size * meta.aspectRatio);
                } else {
                    resolvedWidth = size;
                    resolvedHeight = Math.round(size / meta.aspectRatio);
                }
            } else {
                resolvedWidth = size;
                resolvedHeight = 'auto';
            }
        }
    } else if (width !== undefined && height === undefined) {
        if (typeof width === 'number') {
            resolvedHeight = Math.round(width / meta.aspectRatio);
        } else {
            resolvedHeight = 'auto';
        }
    } else if (height !== undefined && width === undefined) {
        if (typeof height === 'number') {
            resolvedWidth = Math.round(height * meta.aspectRatio);
        } else {
            resolvedWidth = 'auto';
        }
    }

    const attrWidth = typeof resolvedWidth === 'number' ? resolvedWidth : meta.intrinsicWidth;
    const attrHeight = typeof resolvedHeight === 'number' ? resolvedHeight : meta.intrinsicHeight;

    const computedStyle: React.CSSProperties = {
        aspectRatio: `${meta.intrinsicWidth} / ${meta.intrinsicHeight}`,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        maxWidth: '100%',
        height: 'auto',
        ...(typeof resolvedWidth === 'string' ? { width: resolvedWidth } : {}),
        ...(typeof resolvedHeight === 'string' ? { height: resolvedHeight } : {}),
        ...style,
    };

    const computedAlt = decorative
        ? ''
        : (alt ?? title ?? desc ?? meta.defaultAlt);

    return (
        <img
            src={meta.src}
            alt={computedAlt}
            title={decorative ? undefined : (title ?? meta.title)}
            role={decorative ? 'presentation' : 'img'}
            aria-hidden={decorative ? 'true' : undefined}
            width={attrWidth}
            height={attrHeight}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            style={computedStyle}
            className={className}
            {...restProps}
        />
    );
}

// Variant wrappers defined directly in this module to avoid circular dependency
export function IshtiLogoPrimary(props: Omit<IshtiLogoProps, 'variant'>) {
    return <IshtiLogo variant="primary" {...props} />;
}

export function IshtiLogoSecondary(props: Omit<IshtiLogoProps, 'variant'>) {
    return <IshtiLogo variant="secondary" {...props} />;
}

export function IshtiLogoIcon(props: Omit<IshtiLogoProps, 'variant'>) {
    return <IshtiLogo variant="icon" {...props} />;
}

export function IshtiLogoHorizontal(props: Omit<IshtiLogoProps, 'variant'>) {
    return <IshtiLogo variant="horizontal" {...props} />;
}

export function IshtiLogoMonochrome(props: Omit<IshtiLogoProps, 'variant'>) {
    return <IshtiLogo variant="monochrome" {...props} />;
}

export function IshtiLogoReversed(props: Omit<IshtiLogoProps, 'variant'>) {
    return <IshtiLogo variant="reversed" {...props} />;
}

export * from './types';
export default IshtiLogo;
