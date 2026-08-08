import React from 'react';
import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';
import { colors } from '@/styles/tokens/colors';

import stairsIcon from '@/assets/icons/stairs.png';

export interface IconProps extends Omit<ImageProps, 'source' | 'style'> {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}

export const IconStairs: React.FC<IconProps> = ({
  size = 20,
  color = colors.brand.sub2,
  style,
  ...props
}) => (
  <Image
    source={stairsIcon}
    style={[{ width: size, height: size, tintColor: color }, style]}
    {...props}
  />
);
