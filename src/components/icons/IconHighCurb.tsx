import React from 'react';
import Svg, { Rect, Path, SvgProps } from 'react-native-svg';
import { colors } from '@/styles/tokens/colors';

export interface IconProps extends SvgProps {
  size?: number;
  color?: string;
}

export const IconHighCurb: React.FC<IconProps> = ({
  size = 20,
  color = colors.brand.sub2,
  ...props
}) => (
  <Svg width={size} height={(size * 22) / 20} viewBox="0 0 20 22" fill="none" {...props}>
    <Rect y="9" width="10" height="11" rx="1" fill={color} />
    <Path
      d="M14.5 10V20M17 17.5L14.5 20L12 17.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M14.5 12.5V2.5M17 5L14.5 2.5L12 5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);
