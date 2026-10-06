import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
// Keep article assets at their existing public URLs, without duplicating Markdown.
function articleAssets() {
  const walk = (dir, dest) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
      const source = path.join(dir, entry.name), target = path.join(dest, entry.name);
      if (entry.isDirectory()) walk(source, target);
      else if (!entry.name.endsWith('.md') && !entry.name.startsWith('.')) {
        fs.mkdirSync(path.dirname(target), {recursive:true}); fs.copyFileSync(source,target);
      }
    }
  };
  return {name:'article-assets', hooks:{
    'astro:build:done':({dir})=>walk('content/posts',path.join(dir.pathname,'posts')),
    'astro:server:setup':({server})=>server.middlewares.use((req,res,next)=>{
      let url; try {url=decodeURIComponent((req.url||'').split('?')[0])} catch {return next()}
      if(!url.startsWith('/posts/') || !/\.(png|jpe?g|svg|gif|webp)$/i.test(url)) return next();
      const root=path.resolve('content/posts'), file=path.resolve('content',url.slice(1));
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file)) return next();
      const ext=path.extname(file).toLowerCase();
      res.setHeader('Content-Type',ext==='.svg'?'image/svg+xml':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':`image/${ext.slice(1)}`);
      fs.createReadStream(file).pipe(res);
    })
  }};
}
export default defineConfig({site:'https://zheng-yangyang.github.io',output:'static',devToolbar:{enabled:false},publicDir:'static',trailingSlash:'always',integrations:[articleAssets()]});
