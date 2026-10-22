import fs from 'node:fs';import assert from 'node:assert/strict';import * as THREE from '../public/vendor/three.module.js';
const three=new URL('../public/vendor/three.module.js',import.meta.url).href;
const route=fs.readFileSync(new URL('../public/cat-route.js',import.meta.url),'utf8').replace("'three'",JSON.stringify(three));const routeURL='data:text/javascript;base64,'+Buffer.from(route).toString('base64');
const source=fs.readFileSync(new URL('../public/cat.js',import.meta.url),'utf8').replace("'three'",JSON.stringify(three)).replace("'./cat-route.js'",JSON.stringify(routeURL));
const {prepareCat}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const room=new THREE.Group(),cat=prepareCat(room),root=room.getObjectByName('Cream kitten');
const heights=new Set();
for(let run=0;run<20;run++){const start=root.position.clone();cat.tap();for(let f=0;f<300;f++){cat.update(1/60,false);assert(Number.isFinite(root.rotation.y));assert(root.position.x>-5.5&&root.position.x<4.1);assert(root.position.z>-3.5&&root.position.z<3.8);}assert(root.position.distanceTo(start)>.1);const end=root.position.clone();heights.add(end.y.toFixed(2));for(let f=0;f<120;f++)cat.update(1/60,false);assert(root.position.distanceTo(end)<1e-9);}
assert(heights.has('1.08')&&heights.has('1.58')&&heights.has('1.22'));
console.log('PASS: 20 actions stop within five seconds, restart and visit bed, sill and cabinet.');