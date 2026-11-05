// Yayın (release) derlemesini yükleme anahtarıyla imzalar.
// Anahtar bilgileri repoda DEĞİL, ~/.gradle/gradle.properties dosyasında durur:
//   NEOLURDU_UPLOAD_STORE_FILE=/tam/yol/neolurdu-upload.jks
//   NEOLURDU_UPLOAD_STORE_PASSWORD=...
//   NEOLURDU_UPLOAD_KEY_ALIAS=upload
//   NEOLURDU_UPLOAD_KEY_PASSWORD=...
// Bu bilgiler yoksa derleme eskisi gibi hata ayıklama anahtarıyla imzalanır.
const { withAppBuildGradle } = require("expo/config-plugins");

const IMZA = `
        release {
            if (project.hasProperty('NEOLURDU_UPLOAD_STORE_FILE')) {
                storeFile file(NEOLURDU_UPLOAD_STORE_FILE)
                storePassword NEOLURDU_UPLOAD_STORE_PASSWORD
                keyAlias NEOLURDU_UPLOAD_KEY_ALIAS
                keyPassword NEOLURDU_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withYayinImzasi(config) {
  return withAppBuildGradle(config, (c) => {
    let g = c.modResults.contents;
    if (g.includes("NEOLURDU_UPLOAD_STORE_FILE")) return c;
    g = g.replace(/signingConfigs \{\n/, (m) => m + IMZA.slice(1) + "\n");
    g = g.replace(
      /(release \{\n\s*\/\/ Caution![^\n]*\n[^\n]*\n\s*)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('NEOLURDU_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
    );
    c.modResults.contents = g;
    return c;
  });
};
