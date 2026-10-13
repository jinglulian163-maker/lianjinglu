import {env} from 'cloudflare:workers';
import {identity} from '../board/route';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const fail=(message:string,status=400)=>{throw {message,status};};
const error=(e:any)=>json({error:e?.status?e.message:'照片暂时无法保存，请稍后重试。'},e?.status||503);
const valid=(id:string|null)=>id&&/^[a-zA-Z0-9-]{1,64}$/.test(id);
function sameOrigin(r:Request){if(r.headers.get('origin')!==new URL(r.url).origin||r.headers.get('sec-fetch-site')==='cross-site')fail('请从小屋页面上传照片。',403);}
async function limitedBody(r:Request){
  const max=12*1024*1024;if(Number(r.headers.get('content-length'))>max)fail('单张照片最大 12 MB。',413);
  const reader=r.body?.getReader();if(!reader)fail('请选择照片。');let size=0;const chunks:Uint8Array[]=[];
  while(true){const part=await reader!.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader!.cancel();fail('单张照片最大 12 MB。',413);}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
export async function GET(r:Request){try{
  const {id,db}=await identity(r);const photoId=new URL(r.url).searchParams.get('id');
  if(photoId){
    if(!valid(photoId))fail('照片编号无效。');
    const p=await db.prepare('SELECT * FROM photos WHERE id=? AND ready=1').bind(photoId).first<any>();
    if(!p||(p.deleted&&p.owner!==id))fail('照片不存在。',404);
    const file=await env.BUCKET!.get(`photos/${p.id}`);if(!file)fail('照片正在保存，请稍后重试。',404);
    return new Response(file.body,{headers:{'Content-Type':p.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}});
  }
  const {results}=await db.prepare('SELECT p.id,p.name,p.size,p.created,p.deleted,m.slot AS author_slot,p.owner=? AS mine FROM photos p JOIN members m ON p.owner=m.id WHERE p.ready=1 AND (p.deleted=0 OR p.owner=?) ORDER BY p.created DESC').bind(id,id).all();
  return json({photos:results});
}catch(e){return error(e);}}
export async function POST(r:Request){try{
  sameOrigin(r);const {id,db}=await identity(r);const photoId=new URL(r.url).searchParams.get('id');if(!valid(photoId))fail('照片编号无效。');
  if(!env.BUCKET)fail('云端相册正在准备，请稍后重试。',503);
  const bytes=await limitedBody(r);let mime='';
  if(bytes.length>12&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)mime='image/jpeg';
  else if(bytes.length>24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))mime='image/png';
  else if(bytes.length>12&&new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')mime='image/webp';
  if(!mime)fail('支持 JPG、PNG、WebP；请将 HEIC 等格式转换后再上传。',415);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
  let name='照片';try{name=decodeURIComponent(r.headers.get('x-photo-name')||'照片').slice(0,120);}catch{}
  const count=await db.prepare('SELECT COUNT(*) AS n,SUM(size) AS bytes FROM photos').first<any>();
  const existing=await db.prepare('SELECT * FROM photos WHERE id=?').bind(photoId).first<any>();
  if(!existing&&(count.n>=1000||Number(count.bytes||0)+bytes.length>2*1024*1024*1024))fail('相册空间已满，请联系小屋主人扩容。',409);
  await db.prepare('INSERT OR IGNORE INTO photos(id,owner,name,mime,size,digest,created) VALUES(?,?,?,?,?,?,?)').bind(photoId,id,name,mime,bytes.length,digest,Date.now()).run();
  const row=await db.prepare('SELECT * FROM photos WHERE id=?').bind(photoId).first<any>();
  if(row.owner!==id||row.digest!==digest)fail('上传编号冲突，请重新选择照片。',409);
  if(row.ready)return json({ok:true,id:photoId});
  await env.BUCKET.put(`photos/${photoId}`,bytes,{httpMetadata:{contentType:mime}});
  await db.prepare('UPDATE photos SET ready=1 WHERE id=?').bind(photoId).run();
  return json({ok:true,id:photoId});
}catch(e){return error(e);}}
export async function PATCH(r:Request){try{
  sameOrigin(r);const {id,db}=await identity(r);const p=await r.json() as any;
  if(!valid(p.id)||!['remove','restore'].includes(p.action))fail('操作无效。');
  const result=await db.prepare('UPDATE photos SET deleted=? WHERE id=? AND owner=? AND ready=1').bind(p.action==='remove'?1:0,p.id,id).run();
  if(!result.meta.changes)fail('只能移除或恢复自己上传的照片。',403);
  return json({ok:true});
}catch(e){return error(e);}}
