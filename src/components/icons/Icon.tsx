import React from 'react';
import type { AccessibilityProps } from 'react-native';
import { IconConstruction } from '@/components/icons/IconConstruction';
import { IconDamagedPavement } from '@/components/icons/IconDamagedPavement';
import { IconHighCurb } from '@/components/icons/IconHighCurb';
import { IconLongDistance } from '@/components/icons/IconLongDistance';
import { IconNarrowPath } from '@/components/icons/IconNarrowPath';
import { IconStairs } from '@/components/icons/IconStairs';
import { IconSteepSlope } from '@/components/icons/IconSteepSlope';

export type IconName =
  | '긴보행거리'
  | '계단'
  | '공사구간'
  | '높은턱'
  | '보도파손'
  | '급경사'
  | '좁은통로'
  | 'long-distance'
  | 'stairs'
  | 'construction'
  | 'high-curb'
  | 'damaged-pavement'
  | 'steep-slope'
  | 'narrow-path';

export interface IconProps extends AccessibilityProps {
  name: IconName;
  size?: number;
  color?: string;
  testID?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, color, ...props }) => {
  switch (name) {
    case '긴보행거리':
    case 'long-distance':
      return <IconLongDistance size={size} color={color} {...props} />;
    case '계단':
    case 'stairs':
      return <IconStairs size={size} color={color} {...props} />;
    case '공사구간':
    case 'construction':
      return <IconConstruction size={size} color={color} {...props} />;
    case '높은턱':
    case 'high-curb':
      return <IconHighCurb size={size} color={color} {...props} />;
    case '보도파손':
    case 'damaged-pavement':
      return <IconDamagedPavement size={size} color={color} {...props} />;
    case '급경사':
    case 'steep-slope':
      return <IconSteepSlope size={size} color={color} {...props} />;
    case '좁은통로':
    case 'narrow-path':
      return <IconNarrowPath size={size} color={color} {...props} />;
    default:
      return null;
  }
};

export default Icon;
