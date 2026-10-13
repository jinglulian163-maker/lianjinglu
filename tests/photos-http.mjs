import assert from 'node:assert/strict';
const base='http://127.0.0.1:4174';
const id='photo-test-'+crypto.randomUUID();
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=','base64');
async function request(user,method='GET',body,query='',origin=base){return fetch(base+'/api/photos'+query,{method,headers:{...(user?{'oai-authenticated-user-id':user}:{}),'Origin':origin,'Content-Type':method==='POST'?'image/png':'application/json','X-Photo-Name':encodeURIComponent('测试照片.png')},body});}
assert.equal((await request(null)).status,401);
assert.equal((await request('local_seedy','POST',bytes,'?id='+id,'https://other.test')).status,403);
assert.equal((await request('local_seedy','POST',Buffer.from('<svg/>'),'?id='+id)).status,415);
assert.equal((await request('local_seedy','POST',bytes,'?id='+id)).status,200);
assert.equal((await request('local_seedy','POST',bytes,'?id='+id)).status,200);
const list=await(await request('local_k')).json();assert.equal(list.photos.filter(p=>p.id===id).length,1);
assert.deepEqual(Buffer.from(await(await request('local_k','GET',undefined,'?id='+id)).arrayBuffer()),bytes);
assert.equal((await request('local_k','PATCH',JSON.stringify({id,action:'remove'}))).status,403);
assert.equal((await request('local_seedy','PATCH',JSON.stringify({id,action:'remove'}))).status,200);
assert.equal((await request('local_k','GET',undefined,'?id='+id)).status,404);
assert.equal((await request('local_seedy','PATCH',JSON.stringify({id,action:'restore'}))).status,200);
assert.equal((await request('local_k','GET',undefined,'?id='+id)).status,200);
await request('local_seedy','PATCH',JSON.stringify({id,action:'remove'}));
console.log('PASS: local D1/R2 upload, fresh list and image read, retry without duplicates, identity/CSRF/type protection, owner-only removal and recovery.');
