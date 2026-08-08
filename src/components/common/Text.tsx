import React from 'react';
import {
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';
import { colors } from '@/styles/tokens/colors';
import { fontFamily, fontSize } from '@/styles/tokens/typography';

export interface TextProps extends RNTextProps {
  variant?: keyof typeof fontSize;
  weight?: keyof typeof fontFamily;
  color?: string;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body-2',
  weight = 'regular',
  color = colors.text.primary,
  style,
  children,
  ...props
}) => {
  const fontStyle = fontSize[variant];

  const combinedStyle: TextStyle = {
    fontFamily: fontFamily[weight],
    fontSize: fontStyle.fontSize,
    lineHeight: fontStyle.lineHeight,
    letterSpacing: fontStyle.letterSpacing,
    color,
    ...StyleSheet.flatten(style),
  };

  return (
    <RNText style={combinedStyle} {...props}>
      {children}
    </RNText>
  );
};

export default Text;
