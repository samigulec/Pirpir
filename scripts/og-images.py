# Paylaşım önizleme görselleri (public/og/home-<dil>.png, 1200×630) için HTML üretir.
# Kullanım: sunucu localhost:3000'de açıkken  python3 scripts/og-images.py && node scripts/og-images-render.cjs
# Metinler messages/<dil>/home.json'dan, karakterler assets/'ten gelir; yazı tipleri sitenin kendisinden.
import re, json, os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+"/"
def svg(n):
    s=open(R+"assets/characters/"+n+".svg").read()
    s=re.sub(r"<\?xml[^>]*>\s*","",s); return re.sub(r'aria-label="[^"]*"','aria-hidden="true"',s,count=1)
P,B=svg("pirpir-mutlu"),svg("bulut")
INK,MUTED,PRIMARY,SKY,CORAL,FIELD="#1E2A44","#56607A","#2F5BD3","#EAF3FF","#FF8A65","#F5F8FD"
CITY={"tr":"İstanbul","es":"Estambul"}
check='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F5BD3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>'
swap='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E2A44" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M16 3l4 4-4 4M20 17H4M8 13l-4 4 4 4"/></svg>'
out={}
for l in ["tr","en","nl","de","fr","es","it"]:
    h=json.load(open(f"{R}messages/{l}/home.json"))
    t=h["trust"]; s=h["search"]
    chips=''.join(f'<span style="display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:10px 18px;font-weight:800;font-size:19px;white-space:nowrap">{check}{t[k]}</span>' for k in ["secure","clear"])
    D="font-family:var(--font-fredoka),var(--font-baloo),sans-serif"
    out[l]=f"""<style>*{{box-sizing:border-box}}body{{margin:0}} .ch svg{{width:100%;height:100%;display:block}}</style>
<div id="cap" style="position:relative;width:1200px;height:630px;overflow:hidden;background:{SKY};font-family:var(--font-nunito),sans-serif;color:{INK}">
  <svg style="position:absolute;left:0;top:0" width="1200" height="630" aria-hidden="true"><path d="M 760 360 C 700 470, 820 560, 980 560" fill="none" stroke="#9CC3FF" stroke-width="6" stroke-linecap="round" stroke-dasharray="3 16"/></svg>
  <div class="ch" style="position:absolute;left:730px;top:150px;width:420px;height:294px">{P}</div>
  <div class="ch" style="position:absolute;left:960px;top:40px;width:170px;height:117px">{B}</div>
  <div style="position:absolute;left:64px;top:0;bottom:0;width:720px;display:flex;flex-direction:column;justify-content:center;gap:18px">
    <div style="{D};font-weight:700;font-size:64px;line-height:1;letter-spacing:-0.01em">pir<span style="color:{CORAL}">p</span>ir</div>
    <div style="{D};font-weight:700;font-size:62px;line-height:1.05;letter-spacing:-0.01em;margin-top:18px">{h["hero"]["title"]}</div>
    <div style="font-size:26px;font-weight:600;color:{MUTED};line-height:1.35">{h["hero"]["subtitle"]}</div>
    <div style="display:flex;align-items:center;gap:8px;background:#fff;border-radius:24px;padding:10px;margin-top:10px;box-shadow:0 18px 48px rgba(47,91,211,0.14);width:660px">
      <span style="flex:1;background:{FIELD};border-radius:16px;padding:8px 16px;display:flex;flex-direction:column"><span style="font-size:15px;font-weight:800;color:{MUTED}">{s["from"]}</span><span style="font-size:23px;font-weight:800">Amsterdam</span></span>
      <span style="width:44px;height:44px;border-radius:50%;background:#FFD166;display:flex;align-items:center;justify-content:center;flex:none;margin:0 -26px;position:relative;border:4px solid #fff;box-sizing:content-box">{swap}</span>
      <span style="flex:1;background:{FIELD};border-radius:16px;padding:8px 16px 8px 30px;display:flex;flex-direction:column"><span style="font-size:15px;font-weight:800;color:{MUTED}">{s["to"]}</span><span style="font-size:23px;font-weight:800">{CITY.get(l,"Istanbul")}</span></span>
      <span style="{D};background:{PRIMARY};color:#fff;border-radius:16px;padding:0 22px;height:66px;display:flex;align-items:center;font-weight:600;font-size:22px;white-space:nowrap">{s["submit"]}</span>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px">{chips}</div>
  </div>
  <div style="position:absolute;right:48px;bottom:34px;font-weight:800;font-size:22px;color:{MUTED}">flypirpir.nl</div>
</div>"""
json.dump(out,open(R+"scripts/.og-html.json","w"))
