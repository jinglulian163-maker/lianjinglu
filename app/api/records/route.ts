import {env} from 'cloudflare:workers';
import {identity} from '../board/route';
export const dynamic='force-dynamic';
const fail=(message:string,status=400):never=>{throw {message,status};};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
const error=(e:any)=>json({error:e?.status?e.message:'唱片暂时无法保存，请稍后重试。'},e?.status||503);
const valid=(v:string|null)=>v&&/^[a-zA-Z0-9-]{1,64}$/.test(v);
export async function GET(r:Request){try{
 const {db}=await identity(r),url=new URL(r.url),id=url.searchParams.get('id');
 if(!id){const {results}=await db.prepare('SELECT id,title,memory,day,cover_mime,created FROM records WHERE ready=1 ORDER BY created DESC').all();return json({records:results});}
 if(!valid(id))fail('唱片编号无效。');
 const row=await db.prepare('SELECT * FROM records WHERE id=? AND ready=1').bind(id).first<any>();if(!row)fail('找不到这张唱片。',404);
 const cover=url.searchParams.get('asset')==='cover',size=cover?row.cover_size:row.size;
 if(!size)fail('没有封面。',404);
 let range:{offset:number,length:number}|undefined;
 const h=r.headers.get('range');if(h&&!cover){const m=/^bytes=(\d*)-(\d*)$/.exec(h);if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 const start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Math.min(size-1,Number(m[2])):size-1):size-1;
 if(!Number.isSafeInteger(start)||start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});range={offset:start,length:end-start+1};}
 const f=await env.BUCKET!.get(`records/${id}/${cover?'cover':'audio'}`,range?{range}:undefined);if(!f)fail('音频正在准备，请稍后重试。',404);
 const headers:Record<string,string>={'Content-Type':cover?row.cover_mime:row.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Length':String(range?.length||size)};
 if(range)headers['Content-Range']=`bytes ${range.offset}-${range.offset+range.length-1}/${size}`;
 return new Response(f.body,{status:range?206:200,headers});
 }catch(e){return error(e);}}
export async function POST(r:Request){try{
 if(r.headers.get('origin')!==new URL(r.url).origin||r.headers.get('sec-fetch-site')==='cross-site')fail('请从小屋页面上传。',403);
 const {id:owner,db}=await identity(r),id=new URL(r.url).searchParams.get('id');if(!valid(id))fail('唱片编号无效。');
 const limit=23*1024*1024;const reader=r.body?.getReader();if(!reader)fail('请选择音频。');let n=0;const chunks:Uint8Array[]=[];
 while(true){const p=await reader.read();if(p.done)break;n+=p.value.length;if(n>limit){await reader.cancel();fail('音频最大 20 MB，封面最大 2 MB。',413);}chunks.push(p.value);}
 const raw=new Uint8Array(n);let offset=0;for(const c of chunks){raw.set(c,offset);offset+=c.length;}chunks.length=0;
 const form=await new Response(raw,{headers:{'Content-Type':r.headers.get('content-type')||''}}).formData();
 const audio=form.get('audio'),cover=form.get('cover'),title=String(form.get('title')||'').trim(),memory=String(form.get('memory')||'').trim(),day=String(form.get('day')||'');
 if(!title||title.length>80||memory.length>500||day.length>10)fail('请检查标题和回忆文字。');
 if(!(audio instanceof File)||audio.size<16||audio.size>20*1024*1024)fail('请选择 20 MB 以内的音频。',413);
 const bytes=new Uint8Array(await audio.arrayBuffer()),s=new TextDecoder().decode(bytes.slice(0,12));let mime='';
 if(s.startsWith('ID3')||(bytes[0]===255&&(bytes[1]&224)===224))mime='audio/mpeg';
 else if(s.startsWith('RIFF')&&s.slice(8)==='WAVE')mime='audio/wav';
 else if(s.startsWith('OggS'))mime='audio/ogg';
 else if(s.slice(4,8)==='ftyp')mime='audio/mp4';
 else if(bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163)mime='audio/webm';
 if(!mime)fail('请上传 MP3、WAV、M4A、OGG 或 WebM 音频。',415);
 let cb:Uint8Array|null=null,cm='';if(cover instanceof File&&cover.size){if(cover.size>2*1024*1024)fail('封面最大 2 MB。',413);cb=new Uint8Array(await cover.arrayBuffer());
 if(cb[0]===255&&cb[1]===216&&cb[2]===255)cm='image/jpeg';else if([137,80,78,71,13,10,26,10].every((v,i)=>cb![i]===v))cm='image/png';else if(new TextDecoder().decode(cb.slice(0,4))==='RIFF'&&new TextDecoder().decode(cb.slice(8,12))==='WEBP')cm='image/webp';else fail('封面支持 JPG、PNG、WebP。',415);}
 const hash=async (data:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(v=>v.toString(16).padStart(2,'0')).join('');
 const digest=await hash(new TextEncoder().encode(JSON.stringify([title,memory,day,cm,await hash(bytes),cb?await hash(cb):''])));
 const existing=await db.prepare('SELECT owner,ready,digest FROM records WHERE id=?').bind(id).first<any>();
 if(existing&&(existing.owner!==owner||existing.digest!==digest))fail('唱片编号冲突，请重新选择音频。',409);if(existing?.ready)return json({ok:true,id});
 const quota=await db.prepare('SELECT COUNT(*) AS n,COALESCE(SUM(size+cover_size),0) AS bytes FROM records').first<any>();
 if(!existing&&(quota.n>=200||quota.bytes+audio.size+(cb?.length||0)>2*1024*1024*1024))fail('唱片架已满，请联系小屋主人扩容。',409);
 await db.prepare('INSERT OR IGNORE INTO records(id,owner,title,memory,day,mime,size,cover_mime,cover_size,digest,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(id,owner,title,memory,day,mime,audio.size,cm,cb?.length||0,digest,Date.now()).run();
 const reserved=await db.prepare('SELECT owner,digest,ready FROM records WHERE id=?').bind(id).first<any>();
 if(reserved.owner!==owner||reserved.digest!==digest)fail('唱片编号冲突，请重新选择音频。',409);
 if(reserved.ready)return json({ok:true,id});
 await env.BUCKET!.put(`records/${id}/audio`,bytes,{httpMetadata:{contentType:mime}});if(cb)await env.BUCKET!.put(`records/${id}/cover`,cb,{httpMetadata:{contentType:cm}});
 await db.prepare('UPDATE records SET ready=1 WHERE id=? AND owner=?').bind(id,owner).run();return json({ok:true,id});
 }catch(e){return error(e);}}
