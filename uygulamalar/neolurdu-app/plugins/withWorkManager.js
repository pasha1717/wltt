// Reklam SDK'sı WorkManager 2.7.0 + Room 2.2.5 getiriyor; R8 küçültmesi WorkDatabase_Impl sınıfını silince
// uygulama açılışta "Failed to create an instance of androidx.work.impl.WorkDatabase" ile çöküyordu.
// Çözüm: güncel WorkManager'ı zorla ve Room veritabanı sınıflarını R8'den koru.
const fs = require("fs");
const path = require("path");
const { withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");

const WORK = 'implementation("androidx.work:work-runtime:2.11.2")';
const KURALLAR = `
# WorkManager / Room: veritabanı sınıfları yansıma (reflection) ile oluşturulur, silinmemeli
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class androidx.work.impl.WorkDatabase_Impl { *; }
`;

module.exports = function withWorkManager(config) {
  config = withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes("androidx.work:work-runtime")) {
      c.modResults.contents = c.modResults.contents.replace(/dependencies \{\n/, (m) => `${m}    ${WORK}\n`);
    }
    return c;
  });
  config = withDangerousMod(config, ["android", async (c) => {
    const f = path.join(c.modRequest.platformProjectRoot, "app/proguard-rules.pro");
    const s = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
    if (!s.includes("WorkDatabase_Impl")) fs.writeFileSync(f, s + KURALLAR);
    return c;
  }]);
  return config;
};
