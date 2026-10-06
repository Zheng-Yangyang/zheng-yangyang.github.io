import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(root);const errors=[];
for(const file of files.filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(file,'utf8');
 for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
  const url=match[1].split('#')[0].split('?')[0];
  if(/^(https?:|data:|mailto:)/.test(url))continue;
  let decoded;try{decoded=decodeURIComponent(url)}catch{continue}
  const target=decoded.startsWith('/')?path.join(root,decoded):path.resolve(path.dirname(file),decoded);
  if(!fs.existsSync(target)&&!fs.existsSync(path.join(target,'index.html')))errors.push(`${path.relative(root,file)} → ${url}`);
 }
 if(html.includes('/Users/zyy/'))errors.push(`${file}: local filesystem path exposed`);
}
for(const route of ['index.html','search/index.html','archives/index.html','tags/index.html','posts/agent/claude-code/index.html','index.xml','404.html'])if(!fs.existsSync(path.join(root,route)))errors.push(`Missing ${route}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Verified ${files.filter(f=>f.endsWith('.html')).length} pages: internal links, images, legacy article routes and RSS.`);
