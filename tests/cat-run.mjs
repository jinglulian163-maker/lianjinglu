import fs from 'node:fs';import assert from 'node:assert/strict';import * as THREE from '../public/vendor/three.module.js';
const three=new URL('../public/vendor/three.module.js',import.meta.url).href;
const route=fs.readFileSync(new URL('../public/cat-route.js',import.meta.url),'utf8').replace("'three'",JSON.stringify(three));const routeURL='data:text/javascript;base64,'+Buffer.from(route).toString('base64');
const source=fs.readFileSync(new URL('../public/cat.js',import.meta.url),'utf8').replace("'three'",JSON.stringify(three)).replace("'./cat-route.js'",JSON.stringify(routeURL));
const {prepareCat}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const room=new THREE.Group(),cat=prepareCat(room),root=room.getObjectByName('Cream kitten');
for(let run=0;run<8;run++){const start=root.position.clone();cat.tap();let moved=0;for(let f=0;f<1200;f++){cat.update(1/60,false);assert(Number.isFinite(root.rotation.y));assert(root.position.x>-.7&&root.position.x<4.1);assert(root.position.z> -1.1&&root.position.z<3.8);moved=Math.max(moved,root.position.distanceTo(start));}assert(moved>2);const end=root.position.clone();for(let f=0;f<120;f++)cat.update(1/60,false);assert(root.position.distanceTo(end)<1e-9);}
console.log('PASS: 8 repeat runs move, remain in floor corridor, stop and can restart.');
