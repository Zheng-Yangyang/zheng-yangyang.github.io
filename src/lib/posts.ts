import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { codeToHtml } from 'shiki';
import GithubSlugger from 'github-slugger';
export const categories = [
  {id:'agent',name:'AI 与 Agent',subtitle:'模型、工具与智能应用',symbol:'✳'},
  {id:'engineering',name:'编程与工程',subtitle:'语言、系统与开发实践',symbol:'⌘'},
  {id:'interview-preparation',name:'算法与求职',subtitle:'算法练习、面试与求职复盘',symbol:'↗'},
  {id:'others',name:'生活与回忆',subtitle:'个人经历与生活随笔',symbol:'☷'},
];
const legacyCategories: Record<string,string> = {golang:'engineering',web:'engineering',infra:'engineering',llm:'agent'};
function resolveCategory(data:Record<string,any>,slug:string) {
  const original = data.categories?.[0] || slug.split('/')[0];
  const category = legacyCategories[original] || original;
  if (!categories.some(c=>c.id===category)) throw new Error(`Unknown category: ${original} (${slug})`);
  return category;
}
function walk(dir:string):string[] {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.md')&&!e.name.startsWith('_')?[path.join(dir,e.name)]:[])}
export const posts = walk('content/posts').map(file=>{
  const {data,content}=matter(fs.readFileSync(file,'utf8'));
  const slug=file.replace(/^content\/posts\//,'').replace(/\/index\.md$|\.md$/,'');
  return {...data,title:String(data.title),description:String(data.description||''),tags:(data.tags||[]) as string[],category:resolveCategory(data,slug),slug,url:`/posts/${slug}/`,body:content,date:new Date(data.date),minutes:Math.max(1,Math.ceil(content.replace(/```[\s\S]*?```/g,'').length/650))};
}).filter(p=>!p.draft).sort((a,b)=>b.date.getTime()-a.date.getTime() || a.title.localeCompare(b.title,'zh-CN'));
export const dateLabel=(date:Date)=>new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Shanghai'}).format(date);
export const tagSlug=(tag:string)=>tag.toLowerCase().replace(/\s+/g,'-');
export const tags=[...new Set(posts.flatMap(p=>p.tags))];
export async function renderPost(post:typeof posts[number]) {
  const slugger=new GithubSlugger(); const headings:{depth:number;text:string;slug:string}[]=[];
  const md=new Marked(markedHighlight({async:true,highlight:async(code,lang)=>{
    try {return await codeToHtml(code,{lang:lang||'text',theme:'github-dark'})} catch {return await codeToHtml(code,{lang:'text',theme:'github-dark'})}
  }}));
  md.use({renderer:{heading({tokens,depth}) {const text=this.parser.parseInline(tokens);const plain=text.replace(/<[^>]*>/g,'');const slug=slugger.slug(plain);headings.push({depth,text:plain,slug});return `<h${depth} id="${slug}">${text}</h${depth}>`;}}});
  let html=await md.parse(post.body);
  // Shiki supplies complete pre/code markup; remove the wrapper added by marked.
  html=html.replace(/<pre><code[^>]*>(<pre class="shiki[\s\S]*?<\/pre>)\s*<\/code><\/pre>/g,'$1');
  html=html.replace(/src="(?!https?:|\/|data:)([^\"]+)"/g,(_,src)=>`src="${post.url}${src}" loading="lazy"`);
  return {html,headings};
}
