import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';
import { shadows } from '@/styles/tokens/shadows';

export interface CardProps extends ViewProps {
  elevation?: keyof typeof shadows;
  padding?: keyof typeof spacing;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  elevation = 'sm',
  padding = 4,
  style,
  children,
  ...props
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    padding: spacing[padding] ?? spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows[elevation],
    ...StyleSheet.flatten(style),
  };

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

export default Card;
