import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { codeToHtml } from 'shiki';
import GithubSlugger from 'github-slugger';
export const categories = [
  {id:'agent',name:'AI & Agent',subtitle:'理解智能，构建工具',symbol:'✳'},
  {id:'golang',name:'Go & 工程',subtitle:'从语言到系统的细节',symbol:'⌘'},
  {id:'interview-preparation',name:'算法 & 成长',subtitle:'把学习变成日常',symbol:'↗'},
  {id:'others',name:'随笔 & 实践',subtitle:'想法、记录与小实验',symbol:'☷'},
  {id:'llm',name:'大语言模型',subtitle:'探索模型背后的原理',symbol:'◌'},
  {id:'infra',name:'基础设施',subtitle:'系统运行的基石',symbol:'⊞'},
  {id:'web',name:'Web 开发',subtitle:'连接想法与界面',symbol:'⊙'},
];
function walk(dir:string):string[] {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.md')&&!e.name.startsWith('_')?[path.join(dir,e.name)]:[])}
export const posts = walk('content/posts').map(file=>{
  const {data,content}=matter(fs.readFileSync(file,'utf8'));
  const slug=file.replace(/^content\/posts\//,'').replace(/\/index\.md$|\.md$/,'');
  return {...data,title:String(data.title),description:String(data.description||''),tags:(data.tags||[]) as string[],category:slug.split('/')[0],slug,url:`/posts/${slug}/`,body:content,date:new Date(data.date),minutes:Math.max(1,Math.ceil(content.replace(/```[\s\S]*?```/g,'').length/650))};
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
