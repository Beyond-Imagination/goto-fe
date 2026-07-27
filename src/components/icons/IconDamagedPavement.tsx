import React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import { colors } from '@/styles/tokens/colors';

export interface IconProps extends SvgProps {
  size?: number;
  color?: string;
}

export const IconDamagedPavement: React.FC<IconProps> = ({
  size = 20,
  color = colors.brand.sub2,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M18 0C19.1046 2.57702e-07 20 0.895431 20 2V6.60449L18.6787 5.19434L13.0898 11.4209L7.15137 5.19922L1.28516 11.4941L0.00976562 10.4648V14.1133L1.40918 15.3145L7.1748 9.12695L13.1504 15.3877L18.7666 9.13086L20 10.4502V18C20 19.1046 19.1046 20 18 20H2C0.895431 20 1.61067e-08 19.1046 0 18V2C2.57706e-07 0.895431 0.895431 1.61064e-08 2 0H18Z"
      fill={color}
    />
  </Svg>
);
