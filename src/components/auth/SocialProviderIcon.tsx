import { Image, Platform, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

import type { SocialProvider } from '@/components/auth/socialProviders';
import { socialButton } from '@/components/auth/tokens';
import { FIGMA_LOGIN_ASSETS } from '@/design/figmaLoginAssets';

interface SocialProviderIconProps {
  readonly provider: SocialProvider;
}

interface FigmaSvgProps {
  readonly height: number;
  readonly source: string;
  readonly style?: object;
  readonly width: number;
}

export function SocialProviderIcon({ provider }: SocialProviderIconProps) {
  if (provider === 'kakao') {
    return (
      <View accessible={false} style={styles.iconFrame}>
        <FigmaSvg height={socialButton.kakaoAssetSize} source={FIGMA_LOGIN_ASSETS.kakao} width={socialButton.kakaoAssetSize} />
      </View>
    );
  }

  if (provider === 'naver') {
    return (
      <View accessible={false} style={styles.iconFrame}>
        <FigmaSvg height={socialButton.naverAssetSize} source={FIGMA_LOGIN_ASSETS.naver} width={socialButton.naverAssetSize} />
      </View>
    );
  }

  return (
    <View accessible={false} style={styles.googleIcon}>
      <FigmaSvg source={FIGMA_LOGIN_ASSETS.googleBlue} style={socialButton.googleLayers.blue} {...socialButton.googleLayers.blue} />
      <FigmaSvg source={FIGMA_LOGIN_ASSETS.googleGreen} style={socialButton.googleLayers.green} {...socialButton.googleLayers.green} />
      <FigmaSvg source={FIGMA_LOGIN_ASSETS.googleYellow} style={socialButton.googleLayers.yellow} {...socialButton.googleLayers.yellow} />
      <FigmaSvg source={FIGMA_LOGIN_ASSETS.googleRed} style={socialButton.googleLayers.red} {...socialButton.googleLayers.red} />
    </View>
  );
}

function FigmaSvg({ height, source, style, width }: FigmaSvgProps) {
  if (Platform.OS === 'web') {
    return (
      <Image
        accessible={false}
        resizeMode="stretch"
        source={{ uri: source }}
        style={[style, { height, width }]}
      />
    );
  }

  return <SvgUri height={height} style={style} uri={source} width={width} />;
}

const styles = StyleSheet.create({
  iconFrame: {
    alignItems: 'center',
    height: socialButton.iconFrameSize,
    justifyContent: 'center',
    width: socialButton.iconFrameSize,
  },
  googleIcon: {
    height: socialButton.googleIconSize,
    overflow: 'hidden',
    position: 'relative',
    width: socialButton.googleIconSize,
  },
});
