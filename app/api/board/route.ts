import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status=200) => Response.json(data, {status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const fail = (message: string,status=400) => { throw {message,status}; };
async function identity(request: Request) {
  const id=request.headers.get('oai-authenticated-user-id');
  if(!id) fail('请先登录，再打开你们的公告板。',401);
  const db=env.DB!;
  if(!db) fail('公告板正在准备，请稍后重试。',503);
  const existing=await db.prepare('SELECT slot FROM members WHERE id=?').bind(id).first<{slot:string}>();
  if(existing) return {id:id!,slot:existing.slot,db};
  const email=(request.headers.get('oai-authenticated-user-email')||'').toLowerCase();
  const config=env as unknown as Record<string,string>;
  const slot=email===config.BOARD_J_EMAIL?.toLowerCase()?'J':email===config.BOARD_K_EMAIL?.toLowerCase()?'K':null;
  if(!slot) fail('这个公告板只属于 J 和 K。朋友的登录账号尚未配置时，请先联系小屋主人。',403);
  await db.prepare('INSERT OR IGNORE INTO members(id,slot) VALUES(?,?)').bind(id,slot).run();
  const member=await db.prepare('SELECT slot FROM members WHERE id=?').bind(id).first<{slot:string}>();
  if(!member) fail('这个署名已绑定另一个账号，请联系小屋主人。',403);
  return {id:id!,slot:member!.slot,db};
}
function error(e:any) { return reply({error:e?.status?e.message:'暂时未能连接公告板，请稍后重试。'},e?.status||503); }
export async function GET(request:Request) {
  try {
    const {id,slot,db}=await identity(request);
    const results=await db.batch([
      db.prepare('SELECT n.*,m.slot AS author_slot, COALESCE(r.version,0) AS seen_version, COALESCE((SELECT MAX(version) FROM reads WHERE note=n.id AND member<>?),0) AS other_seen FROM notes n JOIN members m ON n.author=m.id LEFT JOIN reads r ON r.note=n.id AND r.member=? ORDER BY n.pinned DESC,n.created DESC').bind(id,id),
      db.prepare('SELECT r.id,r.note,r.body,r.created,m.slot AS author_slot FROM replies r JOIN members m ON m.id=r.author ORDER BY r.created'),
      db.prepare('SELECT slot FROM members ORDER BY slot')
    ]);
    return reply({me:slot,partnerReady:results[2].results.length===2,notes:results[0].results.map((n:any)=>({...n,author:undefined,mine:n.author===id})),replies:results[1].results});
  } catch(e){return error(e);}
}
export async function POST(request:Request) {
  try {
    if(request.headers.get('origin')!==new URL(request.url).origin || request.headers.get('sec-fetch-site')==='cross-site') fail('请从小屋页面提交。',403);
    if(!request.headers.get('content-type')?.startsWith('application/json')) fail('请求格式不正确。');
    const raw=await request.text(); if(raw.length>20000) fail('内容太长了。',413);
    const p=JSON.parse(raw); const {id,db}=await identity(request); const now=Date.now();
    const text=(v:unknown,max:number)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)fail(`请填写 1–${max} 个字。`);return (v as string).trim();};
    const validId=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(v);
    if(p.action==='read') {
      if(!Array.isArray(p.items)||p.items.length>1000)fail('读取记录无效。');
      const statements=p.items.filter((x:any)=>validId(x.id)&&Number.isInteger(x.version)&&x.version>0).map((x:any)=>db.prepare('INSERT INTO reads(note,member,version) SELECT id,?,MIN(version,?) FROM notes WHERE id=? ON CONFLICT(note,member) DO UPDATE SET version=MAX(reads.version,excluded.version)').bind(id,x.version,x.id));
      if(statements.length)await db.batch(statements); return reply({ok:true});
    }
    if(!validId(p.id))fail('便签编号无效。');
    if(p.action==='create') {
      const body=text(p.body,2000);
      const count=await db.prepare('SELECT COUNT(*) AS n FROM notes').first<{n:number}>();
      if((count?.n||0)>=1000)fail('公告板已满，请联系小屋主人扩容。');
      await db.prepare('INSERT OR IGNORE INTO notes(id,author,body,created,updated) VALUES(?,?,?,?,?)').bind(p.id,id,body,now,now).run();
      const saved=await db.prepare('SELECT author,body FROM notes WHERE id=?').bind(p.id).first<any>();
      if(saved?.author!==id||saved?.body!==body)fail('便签编号冲突，请重新打开编辑器。',409);
      return reply({ok:true});
    }
    const note=await db.prepare('SELECT * FROM notes WHERE id=?').bind(p.id).first<any>();
    if(!note)fail('找不到这张便签。',404);
    if(p.action==='reply') {
      if(note.deleted||note.archived)fail('请先把便签移回公告板再回复。',409);
      if(!validId(p.replyId))fail('回复编号无效。');const body=text(p.body,500);
      await db.batch([
        db.prepare('UPDATE notes SET version=version+1,updated=? WHERE id=? AND deleted=0 AND archived=0 AND NOT EXISTS(SELECT 1 FROM replies WHERE id=?)').bind(now,p.id,p.replyId),
        db.prepare('INSERT OR IGNORE INTO replies(id,note,author,body,created) SELECT ?,id,?,?,? FROM notes WHERE id=? AND deleted=0 AND archived=0').bind(p.replyId,id,body,now,p.id),
        db.prepare('INSERT INTO reads(note,member,version) SELECT id,?,version FROM notes WHERE id=? ON CONFLICT(note,member) DO UPDATE SET version=MAX(reads.version,excluded.version)').bind(id,p.id)
      ]);return reply({ok:true});
    }
    if(!Number.isInteger(p.version)||p.version!==note.version)fail('这张便签刚刚有了更新，已为你保留草稿，请刷新后重试。',409);
    if(['edit','delete','restore'].includes(p.action)&&note.author!==id)fail('只能修改或移除自己写的便签。',403);
    if(note.deleted&&p.action!=='restore')fail('这张便签已放入纸篓。',409);
    const actions:Record<string,[string,any]>={edit:['body',p.action==='edit'?text(p.body,2000):''],pin:['pinned',note.pinned?0:1],archive:['archived',note.archived?0:1],delete:['deleted',1],restore:['deleted',0]};
    const action=actions[p.action];if(!action)fail('操作无效。');
    const result=await db.prepare(`UPDATE notes SET ${action[0]}=?,updated=?,version=version+1 WHERE id=? AND version=?`).bind(action[1],now,p.id,p.version).run();
    if(!result.meta.changes)fail('便签刚刚有更新，请刷新后重试。',409);
    return reply({ok:true});
  }catch(e){return error(e);}
}
