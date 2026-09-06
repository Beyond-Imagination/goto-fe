module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';
  const plugins = [];

  if (isProduction) {
    plugins.push([
      'transform-remove-console',
      {
        // error 로그와 console.tron 안전장치는 운영 번들에서도 보존합니다.
        exclude: ['error', 'tron'],
      },
    ]);
  }

  // react-native-reanimated 플러그인은 항상 배열의 마지막이어야 합니다.
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
