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
   try{fs.appendFileSync(`${dir}/${entry.time.slice(0,10)}.jsonl`,JSON.stringify(entry)+'\n',{mode:0o600});res.writeHead(204);res.end()}catch{res.writeHead(500);res.end()}
  });return;
 }
 if(path==='/blog-stats/'||path==='/blog-stats/admin'){
  const expected='Basic '+Buffer.from('zyy:'+password).toString('base64');
  if(!safeEqual(req.headers.authorization||'',expected)){res.setHeader('WWW-Authenticate','Basic realm="Blog visit logs", charset="UTF-8"');res.writeHead(401);res.end('Login required');return}
  const files=fs.readdirSync(dir).filter(f=>/^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)).sort().reverse();
  const rows=[];for(const f of files){for(const line of fs.readFileSync(`${dir}/${f}`,'utf8').trim().split('\n').reverse()){try{rows.push(JSON.parse(line))}catch{}if(rows.length>=1000)break}if(rows.length>=1000)break}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
  res.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>博客来访日志</title><style>body{font:15px system-ui;margin:30px;color:#222}table{border-collapse:collapse;width:100%}td,th{text-align:left;border-bottom:1px solid #ddd;padding:12px;overflow-wrap:anywhere}</style><h1>博客来访日志</h1><p>最近 ${rows.length} 条 · 保留 90 天 · 时间为北京时间 · 地区为 IP 近似位置</p><table><tr><th>时间</th><th>IP</th><th>地区</th><th>页面</th></tr>${rows.map(e=>`<tr><td>${escape(new Date(e.time).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}))}</td><td>${escape(e.ip)}</td><td>${escape(e.region)}</td><td>${escape(e.path)}</td></tr>`).join('')}</table></html>`);return;
 }
 res.writeHead(404);res.end();
}).listen(3088,'0.0.0.0');
