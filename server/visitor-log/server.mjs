import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
const dir=process.env.DATA_DIR||'/data';
fs.mkdirSync(dir,{recursive:true});
const secretFile=`${dir}/admin-password`;
if(!fs.existsSync(secretFile)) fs.writeFileSync(secretFile,crypto.randomBytes(24).toString('base64url'),{mode:0o600});
const password=fs.readFileSync(secretFile,'utf8').trim();
const origin='https://zheng-yangyang.github.io';
const rates=new Map(), geo=new Map();
const safeEqual=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function prune(){const cutoff=new Date(Date.now()-90*86400000).toISOString().slice(0,10);for(const file of fs.readdirSync(dir))if(/^\d{4}-\d{2}-\d{2}\.jsonl$/.test(file)&&file.slice(0,10)<cutoff)fs.unlinkSync(`${dir}/${file}`)}
const summaryFile=`${dir}/summary.json`;
let summary={total:0,regions:{},since:new Date().toISOString()};
if(fs.existsSync(summaryFile)) summary=JSON.parse(fs.readFileSync(summaryFile,'utf8'));
else {
 for(const f of fs.readdirSync(dir).filter(f=>/^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)))for(const line of fs.readFileSync(`${dir}/${f}`,'utf8').split('\n')){try{const e=JSON.parse(line);summary.total++;summary.regions[e.region]=(summary.regions[e.region]||0)+1;if(e.time<summary.since)summary.since=e.time}catch{}}
 fs.writeFileSync(summaryFile,JSON.stringify(summary),{mode:0o600});
}
function count(entry){summary.total++;summary.regions[entry.region]=(summary.regions[entry.region]||0)+1;fs.writeFileSync(summaryFile+'.tmp',JSON.stringify(summary),{mode:0o600});fs.renameSync(summaryFile+'.tmp',summaryFile)}
prune();setInterval(prune,86400000).unref();
async function location(ip){
 const hit=geo.get(ip);if(hit&&hit.until>Date.now())return hit.value;
 let value='未知';
 try{const r=await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`,{signal:AbortSignal.timeout(2500)});const j=await r.json();if(j.success)value=[j.country,j.region,j.city].filter(Boolean).join(' / ')}catch{}
 if(geo.size>5000)geo.clear();geo.set(ip,{value,until:Date.now()+86400000});return value;
}
http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const path=(req.url||'').split('?')[0];
 if(path==='/health'){res.end('ok');return}
 if(path==='/blog-stats/collect'){
  if(req.headers.origin!==origin){res.writeHead(403);res.end();return}
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','POST');res.writeHead(204);res.end();return}
  if(req.method!=='POST'){res.writeHead(405);res.end();return}
  const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim();
  if(rates.size>10000)rates.clear();
  const now=Date.now(),r=rates.get(ip);if(r&&now-r.start<60000&&r.count>=30){res.writeHead(429);res.end();return}
  rates.set(ip,r&&now-r.start<60000?{start:r.start,count:r.count+1}:{start:now,count:1});
  let body='';
  req.on('data',chunk=>{body+=chunk;if(body.length>2048)req.destroy()});
  req.on('end',async()=>{
   let data;try{data=JSON.parse(body)}catch{res.writeHead(400);res.end();return}
   if(typeof data.path!=='string'||!data.path.startsWith('/')||data.path.length>600){res.writeHead(400);res.end();return}
   const entry={time:new Date().toISOString(),ip,path:data.path.split(/[?#]/)[0],region:await location(ip)};
   try{fs.appendFileSync(`${dir}/${entry.time.slice(0,10)}.jsonl`,JSON.stringify(entry)+'\n',{mode:0o600});count(entry);res.writeHead(204);res.end()}catch{res.writeHead(500);res.end()}
  });return;
 }
 if(path==='/blog-stats/'||path==='/blog-stats/admin'){
  const expected='Basic '+Buffer.from('zyy:'+password).toString('base64');
  if(!safeEqual(req.headers.authorization||'',expected)){res.setHeader('WWW-Authenticate','Basic realm="Blog visit logs", charset="UTF-8"');res.writeHead(401);res.end('Login required');return}
  const regions=Object.entries(summary.regions).sort((a,b)=>b[1]-a[1]);
  const max=Math.max(1,...regions.map(r=>r[1]));
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
  res.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>博客访问统计</title><style>*{box-sizing:border-box}body{font:15px system-ui;margin:0;background:#f6f5f0;color:#282720}main{max-width:960px;margin:60px auto;padding:0 24px}h1{font-size:28px}p{color:#777}section{background:white;border:1px solid #e5e1d8;border-radius:16px;padding:28px;margin:24px 0}.total{font-size:64px;font-weight:700;color:#ae5c3e}.row{margin:24px 0}.label{display:flex;justify-content:space-between;gap:16px;margin-bottom:10px}.track{height:12px;background:#f0ece5;border-radius:6px;overflow:hidden}.bar{height:100%;background:#149d8b;border-radius:6px}small{color:#777}</style><main><h1>博客访问统计</h1><p>从 ${escape(new Date(summary.since).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}))} 开始记录</p><section><div>总阅读次数 / PV</div><div class="total">${summary.total.toLocaleString('zh-CN')}</div><small>每次页面加载计一次，包括重复访问；不是独立访客人数。</small></section><section><h2>访客地区分布</h2>${regions.length?regions.map(([region,n])=>`<div class="row"><div class="label"><span>${escape(region)}</span><strong>${n} 次 · ${(n/summary.total*100).toFixed(1)}%</strong></div><div class="track"><div class="bar" style="width:${n/max*100}%"></div></div></div>`).join(''):'<p>暂时没有访问记录，等待第一位访客。</p>'}</section></main></html>`);return;
 }
 res.writeHead(404);res.end();
}).listen(3088,'0.0.0.0');
