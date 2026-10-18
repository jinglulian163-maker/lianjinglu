import * as THREE from 'three';

// Vertex ranges identify the original quilt (including sewn flowers) and bed pillows.
// Keep the original positions as the exact tidy pose; never accumulate deformation.
export async function prepareBed(room){
 const response=await fetch('./bed-parts.json');if(!response.ok)throw Error('Bed parts unavailable');
 const parts=await response.json(),source=room.getObjectByName('room'),g=source.geometry;
 const owners=new Map();for(const [name,ranges] of Object.entries(parts))for(const [a,b] of ranges)for(let i=a;i<=b;i++)owners.set(i,name);
 const buckets={room:[],quilt:[],bedPillowA:[],bedPillowB:[]},indices=g.index?.array||Array.from({length:g.attributes.position.count},(_,i)=>i);
 for(let i=0;i<indices.length;i+=3){const name=owners.get(indices[i])||'room';buckets[name].push(indices[i],indices[i+1],indices[i+2]);}
 const result={};
 for(const name of ['quilt','bedPillowA','bedPillowB']){
  const geometry=new THREE.BufferGeometry();
  for(const [key,attr] of Object.entries(g.attributes)){const values=new attr.array.constructor(buckets[name].length*attr.itemSize);buckets[name].forEach((id,j)=>{for(let k=0;k<attr.itemSize;k++)values[j*attr.itemSize+k]=attr.array[id*attr.itemSize+k];});geometry.setAttribute(key,new THREE.BufferAttribute(values,attr.itemSize,attr.normalized));}
  const mesh=new THREE.Mesh(geometry,source.material.clone());mesh.name=name;mesh.userData.action='bed';source.parent.add(mesh);result[name]=mesh;
 }
 g.setIndex(buckets.room);return result;
}

export function installBed(parts){
 const button=document.getElementById('bedButton'),status=document.getElementById('bedStatus');
 const quilt=parts.quilt,position=quilt.geometry.attributes.position,original=position.array.slice();
 const pillows=[parts.bedPillowA,parts.bedPillowB].map(mesh=>{mesh.geometry.computeBoundingBox();const center=mesh.geometry.boundingBox.getCenter(new THREE.Vector3());mesh.geometry.translate(-center.x,-center.y,-center.z);mesh.position.copy(center);return {mesh,center};});
 let progress=0,from=0,to=0,elapsed=0,moving=false;
 function toggle(){if(moving)return;from=progress;to=progress===0?1:0;elapsed=0;moving=true;if(button){button.disabled=true;button.textContent=to?'正在闹腾…':'正在铺好…';}status.textContent=to?'枕头蹦开了，被子也鼓起来啦。':'被子慢慢铺平，枕头回到原位。';}
 function pose(t,hop){
  for(let i=0;i<original.length;i+=3){const x=original[i],y=original[i+1],z=original[i+2],edge=THREE.MathUtils.smoothstep(y,.35,1.05),bump=Math.exp(-((x+3.2)**2*1.7+(z-.2)**2*.75));position.array[i]=x+t*.12*Math.sin(z*2)*edge;position.array[i+1]=y+t*(.62*bump+.10*(1+Math.sin(z*5+x*2)))*edge;position.array[i+2]=z+t*.18*Math.sin(x*3)*edge;}
  position.needsUpdate=true;quilt.geometry.computeBoundingSphere();
  pillows.forEach(({mesh,center},i)=>{const sign=i?1:-1;mesh.position.copy(center).add(new THREE.Vector3(sign*.19*t,hop*(i?.7:.45)+t*(i?-.08:.12),t*(i?.82:.24)));mesh.rotation.set(t*(i?.18:-.12),sign*t*.26,sign*t*.10);});
 }
 if(button){button.disabled=false;button.addEventListener('click',toggle);}
 return {toggle,update(dt,reduced){if(!moving)return;elapsed+=dt;const t=reduced?1:Math.min(1,elapsed/1.65),ease=t*t*(3-2*t);progress=from+(to-from)*ease;pose(progress,reduced?0:Math.sin(Math.PI*t)**2*(to?1:.4));if(t===1){moving=false;if(button){button.disabled=false;button.textContent=to?'整理床铺':'一键乱床';button.setAttribute('aria-pressed',String(to===1));}status.textContent=to?'床铺乱好啦，再点一次就能整理。':'床铺已经整理好。';}}};
}
