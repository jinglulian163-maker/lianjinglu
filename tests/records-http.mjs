import assert from 'node:assert/strict';
const base='http://127.0.0.1:4174',id='record-test-'+crypto.randomUUID();
const wav=Buffer.alloc(44+8000*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
function form(){const f=new FormData();f.set('title','本地测试唱片');f.set('memory','仅用于本地验证');f.set('day','2026-10-17');f.set('audio',new Blob([wav],{type:'audio/wav'}),'test.wav');return f;}
function request(user,method='GET',body,query='',extra={}){return fetch(base+'/api/records'+query,{method,headers:{...(user?{'oai-authenticated-user-id':user}:{}),Origin:base,...extra},body});}
assert.equal((await request(null)).status,401);
assert.equal((await request('local_seedy','POST',form(),'?id='+id,{Origin:'https://other.test'})).status,403);
let res=await request('local_seedy','POST',form(),'?id='+id);assert.equal(res.status,200,await res.text());
assert.equal((await request('local_seedy','POST',form(),'?id='+id)).status,200);
assert.equal((await request('local_k','POST',form(),'?id='+id)).status,409);
const list=await(await request('local_k')).json();assert.equal(list.records.filter(x=>x.id===id).length,1);
res=await request('local_k','GET',null,'?id='+id);assert.deepEqual(Buffer.from(await res.arrayBuffer()),wav);
res=await request('local_k','GET',null,'?id='+id,{Range:'bytes=10-29'});assert.equal(res.status,206);assert.equal(res.headers.get('content-range'),`bytes 10-29/${wav.length}`);assert.deepEqual(Buffer.from(await res.arrayBuffer()),wav.subarray(10,30));
assert.equal((await request('local_k','GET',null,'?id='+id,{Range:'bytes=999999-'})).status,416);
console.log('PASS local D1/R2 audio persistence, shared list, retry, identity, CSRF, byte-range playback');
