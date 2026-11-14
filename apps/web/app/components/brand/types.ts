export type IshtiLogoVariant = 
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'horizontal'
  | 'monochrome'
  | 'reversed';

export interface IshtiLogoProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
  variant?: IshtiLogoVariant;
  className?: string;
  decorative?: boolean;
  title?: string;
  desc?: string;
}
