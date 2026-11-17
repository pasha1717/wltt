const {chromium}=require('playwright');const strat=process.argv[2]||'karma',GUNS=+process.argv[3]||200;
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+require('path').join(__dirname,'index.html'));await pg.waitForTimeout(300);
const r=await pg.evaluate(([strat,GUNS])=>{clearInterval(1);for(let i=1;i<50;i++)clearInterval(i);pencere(null);toast=()=>{};
 const log=[],mil={};const rec=(k)=>{if(!mil[k])mil[k]=Math.round(now())};
 function enIyiPlan(a){let best=null;
   const tipler=Object.keys(TIPLER).filter(t=>TIPLER[t].lvl<=S.ofis&&(strat!=='tarla'||t==='tarla')&&(strat!=='hayvan'||['sut','kanatli','besi'].includes(t)||S.ofis<1));
   for(const tip of tipler){const urunler=["tarla","sera","bahce"].includes(tip)?Object.keys(URUN).filter(k=>URUN[k].tip===tip):[null];
     for(const u of urunler){const D=tasarimVarsayilan(a);D.tip=tip;if(u)D.urun=u;D.alan=a.donum;D.sulama=a.su==="kuru"?0:(u&&URUN[u].sulu?3:1);D.isi=0;
       if(a.su==="kuru"&&u&&URUN[u].sulu){D.don.kuyu=1;D.sulama=3}
       const P0=plan(D);if(P0.max)D.adet=P0.max;const P=plan(D);if(P.err)continue;
       let gunluk;if(P.net)gunluk=P.net;else if(tip==="besi")gunluk=(P.gelir*.9-P.yenile)/P.gun;else if(P.tekrar)gunluk=(P.kg*piyasa(u)*P.fm*.85-P.op)/P.tekrar;else gunluk=(P.gelir*.85-P.base)/P.gun;
       const roi=gunluk/P.toplam;if(P.toplam>S.kasa*.9)continue;if(!best||gunluk>best.g)best={D,P,g:gunluk,roi}}}
   return best}
 for(let d=0;d<GUNS;d++){
  for(let h=0;h<2;h++){ilerle(GUN/2);
   for(const p of S.projeler){if(p.durum==="hasat")hasatKaldir(p);
     for(const m of [...(p.musteri||[])]){if(m.teklif>=birimFiyat(p)*.9||now()>m.bitis-.5){sat(p,m.qty,Math.min(m.max*.98,birimFiyat(p)*1.02)>m.teklif&&Math.random()<.6?Math.min(m.max,birimFiyat(p)):m.teklif,m.ad);p.musteri=p.musteri.filter(x=>x!==m);S.stat.pazarlik=(S.stat.pazarlik||0)+1}}
     if(p.stok>0&&p.durum==="satista"&&now()-(p.bas+p.sure)>2.5)sat(p,p.stok,birimFiyat(p)*.85,"Hal");
     if(p.stok>0&&p.durum==="uretimde"&&p.stok>p.kg*1.5)sat(p,p.stok,birimFiyat(p)*.85,"Hal")}}
  // görev
  for(let i=0;i<3;i++){const g=GOREV[S.gorev||0];if(g&&g.ok()){para(g.o);S.gorev=(S.gorev||0)+1}}
  // personel
  if(!S.personel.muhendis&&S.kasa>4e6&&strat!=='hayvan')S.personel.muhendis=1;
  if(!S.personel.satis&&S.kasa>8e6)S.personel.satis=1;
  if(!S.personel.veteriner&&S.kasa>6e6&&S.projeler.some(p=>p.net))S.personel.veteriner=1;
  // ofis
  const o=OFIS[S.ofis+1];if(o&&S.kasa>o.c*1.6){S.kasa-=o.c;S.ofis++;rec('ofis'+S.ofis)}
  // ihale
  for(const ih of S.ihaleler)if(!ih.sonuc&&!ih.teklif&&ih.m<=S.ofis&&S.kasa>ih.bedel*.9){const tm=Math.round(ih.bedel*.03);S.kasa-=tm;ih.teminat=tm;ih.teklif=Math.round(ih.bedel*.74);S.stat.teklif=(S.stat.teklif||0)+1}
  // biten projeleri yeniden başlat / boş arsaya proje
  for(const a of S.arsalar){if(aktifProje()>=OFIS[S.ofis].max)break;if(S.projeler.some(p=>p.arsa===a.id&&p.durum!=="bitti"))continue;const bp=enIyiPlan(a);if(bp&&bp.g>0)projeKur(bp.D)}
  // arazi al: boş slot varsa
  if(aktifProje()<OFIS[S.ofis].max&&S.arsalar.every(a=>S.projeler.some(p=>p.arsa===a.id&&p.durum!=="bitti"))){
    let cand=[];for(const il of S.acik){const I=IL[il];for(let ii=0;ii<Math.min(I.d.length,12);ii++)for(const a of araziler(il,ii))if(!a.satildi&&!S.arsalar.some(x=>x.id===a.id))cand.push(a)}
    cand=cand.filter(a=>a.fiyat*1.04<S.kasa*.6).sort((x,y)=>y.donum*(x.cls<2?1.2:1)/y.fiyat-x.donum/x.fiyat).slice(0,25);
    let best=null;for(const a of cand){a.endeks0=S.endeks;S.arsalar.push(a);const bp=enIyiPlan(a);S.arsalar.pop();if(bp&&(!best||bp.g/(a.fiyat+bp.P.toplam)>best.r))best={a,r:bp.g/(a.fiyat+bp.P.toplam)}}
    if(best){S.kasa-=Math.round(best.a.fiyat*1.04);S.arsalar.push(best.a)}}
  // yeni il
  if(S.acik.length<6&&S.kasa>2.5e7){const c=ILLER.filter(i=>!S.acik.includes(i.p)).sort((a,b)=>ilAcmaBedeli(a.p)-ilAcmaBedeli(b.p))[0];if(c){S.kasa-=ilAcmaBedeli(c.p);S.acik.push(c.p)}}
  // yatırım fazlası
  for(const y of YATIRIM)if((S.yatirim[y.k]||0)<3&&S.kasa>y.c*4&&aktifProje()>=OFIS[S.ofis].max){S.kasa-=y.c;S.yatirim[y.k]=(S.yatirim[y.k]||0)+1}
  const sv=servet();if(sv>2e7)rec('20M');if(sv>5e7)rec('50M');if(sv>1e8)rec('100M');if(sv>5e8)rec('500M');
  if(d%20===19)log.push([d+1,Math.round(sv/1e5)/10,Math.round(S.kasa/1e5)/10,S.arsalar.length,S.ofis,S.projeler.filter(p=>p.durum!=="bitti").map(p=>p.tip[0]).join("")])}
 const tipKar={};for(const p of S.projeler){const t=p.tip+(p.urun?':'+p.urun:'');const o=tipKar[t]||(tipKar[t]={n:0,ciro:0,yat:0,net:0});o.n++;o.ciro+=p.ciro||0;o.yat+=p.yatirim||0;o.net+=(p.net||0)}return{tipKar,log,mil,gorev:S.gorev,stat:S.stat,ihale:S.stat.ihaleK||0,not:S.not}},[strat,GUNS]);
console.log(strat,JSON.stringify(r.mil),'görev',r.gorev,'ihaleK',r.ihale,'satış',Math.round(r.stat.satis/1e6)+'M');for(const l of r.log)console.log(' gün',l[0],'servet',l[1]+'M','kasa',l[2]+'M','arsa',l[3],'ofis',l[4],l[5]);for(const [k,v] of Object.entries(r.tipKar))console.log(' ',k,v.n,'ciro',Math.round(v.ciro/1e3)+'k','yatırım',Math.round(v.yat/1e3)+'k','net/gün',Math.round(v.net));console.log('ERR',errs.slice(0,3));await b.close()})();
