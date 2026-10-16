import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from '../public/vendor/three.module.js';
const moduleSource=fs.readFileSync(new URL('../public/curtains.js',import.meta.url),'utf8').replace("'three'",JSON.stringify(new URL('../public/vendor/three.module.js',import.meta.url).href));
const {installCurtains}=await import('data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64'));
const b=fs.readFileSync(new URL('../public/assets/soft-hours-room.glb',import.meta.url));const size=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+size)),bin=b.subarray(28+size);
const room=new THREE.Group(),meshes=[];
for(const n of g.nodes.filter(n=>n.name.startsWith('curtain'))){const primitive=g.meshes[n.mesh].primitives[0],a=g.accessors[primitive.attributes.POSITION],v=g.bufferViews[a.bufferView];const raw=bin.subarray((v.byteOffset||0)+(a.byteOffset||0),(v.byteOffset||0)+(a.byteOffset||0)+a.count*12);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(Uint8Array.from(raw).buffer),3));const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial());mesh.userData.action=n.name;meshes.push(mesh);room.add(mesh)}
const handlers={};globalThis.localStorage={getItem:()=>null,setItem:(k,v)=>{globalThis.saved=JSON.parse(v)}};globalThis.window={addEventListener(){}};globalThis.document={addEventListener(){},body:{append(){}},createElement(){return {setAttribute(){},style:{},classList:{toggle(){}}}}};
const canvas={addEventListener(k,fn){handlers[k]=fn},style:{},classList:{remove(){}},getBoundingClientRect:()=>({left:0,top:0,width:1000,height:800})};
const c=installCurtains({room,camera:new THREE.PerspectiveCamera(),canvas,controls:{enabled:true},meshes,hoverLabel:{}});assert.equal(c.count,2);
const widths=()=>meshes.map(m=>m.geometry.boundingBox.max.z-m.geometry.boundingBox.min.z);const before=widths();handlers.keydown({key:'c',preventDefault(){}});const after=widths();assert(after.every((w,i)=>w>before[i]*2));assert(Object.values(saved).every(v=>v===1));handlers.keydown({key:'c',preventDefault(){}});assert(widths().every((w,i)=>Math.abs(w-before[i])<.00001));assert(Object.values(saved).every(v=>v===0));console.log('PASS actual GLB: two curtains, full expansion, original fold restoration, saved state');
