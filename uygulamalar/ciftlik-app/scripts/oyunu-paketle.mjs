// ../ciftlik içindeki oyunu tek bir HTML metnine çevirip src/oyun.ts dosyasına yazar.
// Oyunda değişiklik yaptıktan sonra: npm run paketle
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "ciftlik");
const oku = (ad) => readFileSync(join(kok, ad), "utf8");
let govde = oku("index.html");
for (const ad of ["iller.js", "ilceler.js"]) {
  const etiket = `<script src="${ad}"></script>`;
  if (!govde.includes(etiket)) throw new Error(`${ad} etiketi bulunamadı`);
  govde = govde.replace(etiket, () => `<script>${oku(ad).replace(/<\/script/gi, "<\\/script")}</script>`);
}
const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html,body{margin:0}body{font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>${govde}</body></html>`;
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "src", "oyun.ts"),
  `// Bu dosya scripts/oyunu-paketle.mjs ile üretilir, elle düzenleme.\nexport const OYUN_HTML: string = ${JSON.stringify(html)};\n`);
console.log(`src/oyun.ts yazıldı (${Math.round(html.length / 1024)} KB)`);
