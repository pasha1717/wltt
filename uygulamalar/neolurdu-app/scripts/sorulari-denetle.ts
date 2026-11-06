// Kullanım: npx tsx scripts/sorulari-denetle.ts [paket-dosyası.ts]
// Dosya verilirse yalnız onu, verilmezse bütün soru bankasını denetler.
import path from "node:path";

type Soru = { id: string; k: string; s: string; d: string; y: string[]; a: string };
const KAT = ["Uzay", "Doğa", "Vücut", "İcatlar", "Dünya", "Bilim"];
const norm = (x: string) => x.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü0-9,\- ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const hedef = process.argv[2];
  let sorular: Soru[];
  if (hedef) {
    const m = await import(path.resolve(hedef));
    sorular = Object.values(m).find(Array.isArray) as Soru[];
  } else {
    sorular = (await import(path.resolve("src/sorular.ts"))).SORULAR;
  }
  const hatalar: string[] = [];
  const idler = new Set<string>(), sorus = new Map<string, string>();
  for (const q of sorular) {
    const yer = q.id || "(id yok)";
    if (!q.id || idler.has(q.id)) hatalar.push(`${yer}: id boş ya da tekrar`);
    idler.add(q.id);
    if (!KAT.includes(q.k)) hatalar.push(`${yer}: bilinmeyen kategori ${q.k}`);
    if (!Array.isArray(q.y) || q.y.length !== 2) hatalar.push(`${yer}: tam 2 yanlış şık olmalı`);
    const siklar = [q.d, ...(q.y || [])].map(norm);
    if (new Set(siklar).size !== 3) hatalar.push(`${yer}: şıklar birbirinden farklı olmalı`);
    if (siklar.some((x) => !x)) hatalar.push(`${yer}: boş şık`);
    if ([q.d, ...(q.y || [])].some((x) => /^(hepsi|hiçbiri|hiçbiri değil|yukarıdakilerin hepsi)$/i.test(x))) hatalar.push(`${yer}: "hepsi/hiçbiri" şıkkı yasak`);
    if (!q.s || q.s.length > 140) hatalar.push(`${yer}: soru boş ya da 140 karakterden uzun (${q.s?.length})`);
    if ([q.d, ...(q.y || [])].some((x) => x.length > 60)) hatalar.push(`${yer}: 60 karakterden uzun şık`);
    if (!q.a || q.a.length > 260) hatalar.push(`${yer}: açıklama boş ya da 260 karakterden uzun`);
    if (/değildir\?|hangisi yanlış/i.test(q.s)) hatalar.push(`${yer}: olumsuz soru kalıbı`);
    const n = norm(q.s);
    if (sorus.has(n)) hatalar.push(`${yer}: aynı soru metni ${sorus.get(n)} ile`);
    sorus.set(n, q.id);
  }
  const say: Record<string, number> = {};
  sorular.forEach((q) => (say[q.k] = (say[q.k] || 0) + 1));
  console.log(`Toplam ${sorular.length} soru`, say);
  if (hatalar.length) { console.log(`${hatalar.length} sorun:\n` + hatalar.slice(0, 200).join("\n")); process.exit(1); }
  console.log("Sorun yok.");
}
main();
