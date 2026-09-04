module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';
  const plugins = [];

  if (isProduction) {
    plugins.push([
      'transform-remove-console',
      {
        // 운영 환경에서 크리티컬 에러 및 Sentry 등의 추적을 위해 error 레벨만 보존
        exclude: ['error'],
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
