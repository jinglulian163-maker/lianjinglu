import {identity} from '../board/route';
export const dynamic='force-dynamic';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}});
const fail=(message:string,status=400):never=>{throw {message,status};};
const error=(e:any)=>json({error:e?.status?e.message:'暂时没有连上小屋，请稍后再试。'},e?.status||503);
const valid=(v:any)=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(v);
export async function GET(r:Request){try{
 const {id,slot,db}=await identity(r),now=Date.now();
 const data=await db.batch([
 db.prepare('SELECT slot,COALESCE(seen,0) AS seen FROM members LEFT JOIN presence ON members.id=presence.member'),
 db.prepare('SELECT l.id,l.title,l.unlock_at,l.created,l.opened,m.slot AS sender,l.sender=? AS mine,CASE WHEN l.sender=? OR l.unlock_at<=? THEN l.body ELSE NULL END AS body FROM letters l JOIN members m ON m.id=l.sender WHERE l.sender=? OR l.recipient=? ORDER BY l.created DESC').bind(id,id,now,id,slot),
 db.prepare('SELECT id,body FROM pillow_notes ORDER BY created DESC LIMIT 50')]);
 return json({me:slot,now,members:data[0].results.map((m:any)=>({slot:m.slot,online:now-m.seen<70000})),letters:data[1].results,phrases:data[2].results});
 }catch(e){return error(e);}}
export async function POST(r:Request){try{
 if(r.headers.get('origin')!==new URL(r.url).origin||r.headers.get('sec-fetch-site')==='cross-site')fail('请从小屋页面操作。',403);
 if(Number(r.headers.get('content-length'))>20000)fail('内容太长。',413);
 const raw=await r.text();if(raw.length>10000)fail('内容太长。',413);
 const p=JSON.parse(raw),{id,slot,db}=await identity(r),now=Date.now();
 if(p.action==='heartbeat'){await db.prepare('INSERT INTO presence(member,seen) VALUES(?,?) ON CONFLICT(member) DO UPDATE SET seen=excluded.seen').bind(id,now).run();return json({ok:true});}
 if(!valid(p.id))fail('编号无效。');
 if(p.action==='open'){
 const row=await db.prepare('SELECT * FROM letters WHERE id=? AND recipient=?').bind(p.id,slot).first<any>();if(!row)fail('找不到这封信。',404);if(row.unlock_at>now)fail('还没到拆信的时间。',403);
 await db.prepare('UPDATE letters SET opened=1 WHERE id=?').bind(p.id).run();return json({ok:true,body:row.body});}
 if(p.action==='phrase'){
 const body=String(p.body||'').trim();if(!body||body.length>100)fail('写一句 100 字以内的小纸条吧。');
 const count=await db.prepare('SELECT COUNT(*) AS n FROM pillow_notes').first<any>();if(count.n>=50)fail('抱枕里已经藏了 50 张纸条。');
 await db.prepare('INSERT OR IGNORE INTO pillow_notes(id,owner,body,created) VALUES(?,?,?,?)').bind(p.id,id,body,now).run();
 const row=await db.prepare('SELECT owner,body FROM pillow_notes WHERE id=?').bind(p.id).first<any>();if(row.owner!==id||row.body!==body)fail('编号冲突，请重新打开。',409);return json({ok:true});}
 if(p.action!=='letter')fail('操作无效。');
 const title=String(p.title||'').trim(),body=String(p.body||'').trim(),unlock=p.unlock_at;
 if(!title||title.length>80||!body||body.length>3000||!Number.isSafeInteger(unlock)||unlock<0||unlock>now+10*366*86400000)fail('请检查标题、正文和拆信时间（最远十年）。');
 const count=await db.prepare('SELECT COUNT(*) AS n FROM letters').first<any>();if(count.n>=1000)fail('信箱已满，请联系小屋主人。');
 await db.prepare('INSERT OR IGNORE INTO letters(id,sender,recipient,title,body,unlock_at,created,opened) VALUES(?,?,?,?,?,?,?,0)').bind(p.id,id,slot==='J'?'K':'J',title,body,unlock,now).run();
 const row=await db.prepare('SELECT sender,title,body,unlock_at FROM letters WHERE id=?').bind(p.id).first<any>();if(row.sender!==id||row.title!==title||row.body!==body||row.unlock_at!==unlock)fail('编号冲突，请重新打开信纸。',409);
 return json({ok:true});
 }catch(e){return error(e);}}
