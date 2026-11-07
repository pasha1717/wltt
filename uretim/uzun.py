import glob,os,re,sys
# sesi olmayan videoları seslendirme karakteriyle kısa→uzun yazdırır; arg verilirse yalnız o videonun karakteri
def n(a):
    m=0
    for s in open(f'public/{a}/metin.txt'):
        for p in re.findall(r'\[[^\]]*\]|\S+',s.strip()): m+=len(p.split('|',1)[-1].replace('_',' '))+1
    return m
if len(sys.argv)>1: print(n(sys.argv[1])); sys.exit()
L=sorted((n(os.path.basename(f)[:-3]),os.path.basename(f)[:-3]) for f in glob.glob('uretim/aciklamalar/*.md') if not os.path.exists('public/'+os.path.basename(f)[:-3]+'/ses.mp3'))
for x,a in L: print(a,x)
