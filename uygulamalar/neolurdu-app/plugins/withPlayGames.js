// Play Games Services uygulama kimliğini (Play Console > Play Games Services > Yapılandırma'daki sayısal proje kimliği)
// AndroidManifest'e ekler. Kimlik boşsa hiçbir şey eklenmez ve bulut kaydı kapalı kalır.
const { withAndroidManifest, withStringsXml, AndroidConfig } = require("expo/config-plugins");

module.exports = function withPlayGames(config, { appId } = {}) {
  if (!appId) return config;
  config = withStringsXml(config, (c) => {
    c.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "game_services_project_id", translatable: "false" }, _: String(appId) }],
      c.modResults,
    );
    return c;
  });
  config = withAndroidManifest(config, (c) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, "com.google.android.gms.games.APP_ID", "@string/game_services_project_id");
    return c;
  });
  return config;
};
