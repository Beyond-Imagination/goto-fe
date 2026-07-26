import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  loading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  style,
  ...props
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
    };

    if (size === 'sm') {
      base.paddingVertical = spacing[2];
      base.paddingHorizontal = spacing[3];
    } else if (size === 'lg') {
      base.paddingVertical = spacing[4];
      base.paddingHorizontal = spacing[6];
    } else {
      base.paddingVertical = spacing[3];
      base.paddingHorizontal = spacing[4];
    }

    if (disabled) {
      base.backgroundColor = colors.background.regular;
      base.borderWidth = 1;
      base.borderColor = colors.border.regular;
      return base;
    }

    switch (variant) {
      case 'secondary':
        base.backgroundColor = colors.brand.sub1;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1;
        base.borderColor = colors.border.regular;
        break;
      case 'text':
        base.backgroundColor = 'transparent';
        break;
      case 'primary':
      default:
        base.backgroundColor = colors.brand.main;
        break;
    }

    return base;
  };

  const getTextColor = (): string => {
    if (disabled) return colors.text.disabled;
    switch (variant) {
      case 'secondary':
        return colors.text.inverse;
      case 'outline':
        return colors.text.primary;
      case 'text':
        return colors.brand.main;
      case 'primary':
      default:
        return colors.text.inverse;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[getContainerStyle(), style as ViewStyle]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          variant={size === 'sm' ? 'body-3' : size === 'lg' ? 'body-1' : 'body-2'}
          weight="semibold"
          color={getTextColor()}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
