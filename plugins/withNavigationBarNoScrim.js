const { withAndroidStyles, AndroidConfig } = require("expo/config-plugins");

// 안드로이드가 엣지투엣지 화면에서 제스처 내비게이션 바 위에 자동으로 깔아주는
// 반투명 회색 스크림(대비 강제)을 끈다. 흰 배경 화면 하단에 회색 띠로 보이던 원인.
module.exports = function withNavigationBarNoScrim(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: "android:enforceNavigationBarContrast",
      value: "false"
    });

    return config;
  });
};
