import { Image, Platform } from 'react-native';
import { SvgUri } from 'react-native-svg';

type FigmaSvgProps = {
  readonly height: number;
  readonly source: string;
  readonly width: number;
};

/** SVG는 네이티브에서 SvgUri로, 웹에서 Image로 렌더링합니다. */
export function FigmaSvg({ height, source, width }: FigmaSvgProps) {
  if (Platform.OS === 'web') {
    return <Image resizeMode="stretch" source={{ uri: source }} style={{ height, width }} />;
  }

  return <SvgUri height={height} uri={source} width={width} />;
}
