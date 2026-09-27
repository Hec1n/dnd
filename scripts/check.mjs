import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('data/site-manifest.json'));
const docs=new Map(manifest.pages.map(p=>[p,read(p)]));
const ids=new Map();
let checkedLinks=0;
for(const [file,h] of docs){
 if(/\{\{[\w-]+\}\}/.test(h))throw Error(`${file}: unexpanded template`);
 const found=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 if(new Set(found).size!==found.length)throw Error(`${file}: duplicate id`);
 ids.set(file,new Set(found));
 const stack=[],voids=new Set(['meta','link','br','hr','img','input']);
 for(const m of h.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)){
  const tag=m[2].toLowerCase();if(voids.has(tag))continue;
  if(m[1]){if(stack.pop()!==tag)throw Error(`${file}: mismatched ${tag}`);}else stack.push(tag);
 }
 if(stack.length)throw Error(`${file}: unclosed tags`);
 if((h.match(/aria-current="page"/g)||[]).length!==1)throw Error(`${file}: active navigation`);
 if(!h.includes('<html lang="ru">'))throw Error(`${file}: missing language`);
}
for(const [file,h] of docs){
 for(const m of h.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const href=m[1];if(/^(https?:|data:)/.test(href))continue;
  const [target,hash]=href.split('#');const dest=target||file;
  if(!fs.existsSync(path.join(root,dest)))throw Error(`${file}: missing ${dest}`);
  if(hash&&(!ids.has(dest)||!ids.get(dest).has(hash)))throw Error(`${file}: missing anchor ${href}`);
  checkedLinks++;
 }
}
const old=read('legacy-links.js');
for(const [hash,expected] of Object.entries({characters:'characters.html',stats:'stats.html',growth:'growth.html',equipment:'equipment.html',magic:'magic.html',summons:'magic.html#summons',origins:'races.html#origins',pantheon:'faith.html#pantheon',questions:'roadmap.html',beshaba:'faith.html#beshaba','weapon-abilities':'combat.html#abilities'})){
 let actual;vm.runInNewContext(old,{location:{hash:'#'+hash,replace:v=>{actual=v;}},window:{addEventListener(){}}});
 if(actual!==expected)throw Error(`Legacy redirect ${hash}`);
 const [dest,anchor]=actual.split('#');if(!docs.has(dest)||(anchor&&!ids.get(dest).has(anchor)))throw Error(`Legacy destination ${actual}`);
}
const catalogs=JSON.parse(read('data/catalogs.json'));
if(catalogs.races.length!==68||catalogs.gods.length!==24||catalogs.weapons.reduce((n,w)=>n+w.items.length,0)!==36)throw Error('Lost catalog entries');
const characters=docs.get('characters.html');
for(const [id,values] of [['neko',[1,1,2,1,2,1,1,1,0,1]],['human',[1,1,1,1,1,1,1,1,2,1]]]){
 const html=characters.split(`<section id="${id}"`)[1].split('</section>')[0];
 const rows=[...html.matchAll(/<tr><th scope="row">[^<]+<\/th><td>(\d+)<\/td><td>(\d+)<\/td><\/tr>/g)];
 if(rows.length!==10||rows.some((r,i)=>Number(r[1])!==values[i]||Number(r[2])!==values[i]))throw Error(`Stats changed: ${id}`);
 if(!html.includes('5 ХП'))throw Error(`HP changed: ${id}`);
}
if(!docs.get('stats.html').includes('От 2 до 4')||!characters.includes('Владение нэн — 1-й уровень'))throw Error('Missing clarified rules');
console.log(JSON.stringify({pages:docs.size,localLinksAndAssets:checkedLinks,legacyRoutes:11,races:68,weapons:36,gods:24,characterTables:'preserved',proposedSkills:manifest.proposedSkills,tavernItems:manifest.beer+manifest.food+manifest.drinks,status:'OK'},null,2));
