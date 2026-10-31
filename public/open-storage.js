import * as THREE from 'three';
export function installOpenStorage(room){
 const source=room.getObjectByName('room'),g=source.geometry,parts=[],removed=new Set(),colored=[];
 function extract(a,b,action,pivot){
  const ids=[];for(const id of g.index.array)if(id>=a&&id<=b){ids.push(id);removed.add(id);}
  const geo=new THREE.BufferGeometry();for(const [key,attr] of Object.entries(g.attributes)){const data=new attr.array.constructor(ids.length*attr.itemSize);ids.forEach((id,j)=>{for(let k=0;k<attr.itemSize;k++)data[j*attr.itemSize+k]=attr.array[id*attr.itemSize+k];});geo.setAttribute(key,new THREE.BufferAttribute(data,attr.itemSize,attr.normalized));}
  // Reuse the room material: cloning it drops the custom night shader callback.
  const mesh=new THREE.Mesh(geo,source.material);mesh.userData.action=action;pivot.add(mesh);return mesh;
 }
 function box(parent,w,h,d,x,y,z,color){const material=new THREE.MeshBasicMaterial({color}),m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);colored.push({material,day:new THREE.Color(color)});return m;}
 for(let i=0;i<6;i++){
  const action='drawer'+i,pivot=new THREE.Group();room.add(pivot);extract(158619+i*210,158828+i*210,action,pivot);
  const x=.01+(i%3)*.75,y=.24+Math.floor(i/3)*.41;
  const tray=new THREE.Group();pivot.add(tray);box(tray,.65,.035,.65,x,y+.025,-3.08,'#d5ba87');box(tray,.035,.29,.65,x-.31,y+.16,-3.08,'#e5cda0');box(tray,.035,.29,.65,x+.31,y+.16,-3.08,'#e5cda0');box(tray,.65,.29,.035,x,y+.16,-3.4,'#d9c092');tray.traverse(o=>{if(o.isMesh)o.userData.action=action;});parts.push({pivot,action,open:false,kind:'drawer'});
 }
 for(let i=0;i<2;i++){
  const action='storageBox'+i,pivot=new THREE.Group(),x=i?4.44:3.34,y=i?3.55:3.58,z=i?-3.82:-3.87;room.add(pivot);
  const lid=extract(i?166591:166303,i?166686:166398,action,pivot);lid.geometry.translate(-x,-y,-z);pivot.position.set(x,y,z);
  // Remove the solid body and replace it with an open container.
  const a=i?166495:166207,b=i?166590:166302;for(const id of g.index.array)if(id>=a&&id<=b)removed.add(id);
  const body=new THREE.Group();room.add(body);const color=i?'#ddc8cd':'#b08b56',cy=3.19,cx=i?4.44:3.34,cz=i?-3.41:-3.48;
  const inside=i?'#927b94':'#765d65';
  box(body,.92,.035,.72,cx,cy,cz,inside);
  box(body,.035,.37,.72,cx-.44,cy+.20,cz,color);box(body,.035,.37,.72,cx+.44,cy+.20,cz,color);
  box(body,.92,.37,.035,cx,cy+.20,cz-.34,color);box(body,.92,.37,.035,cx,cy+.20,cz+.34,color);
  // The darker inner panels make the open top read as a hollow container.
  box(body,.85,.31,.008,cx,cy+.205,cz-.318,inside);box(body,.85,.31,.008,cx,cy+.205,cz+.318,inside);
  box(body,.008,.31,.63,cx-.416,cy+.205,cz,inside);box(body,.008,.31,.63,cx+.416,cy+.205,cz,inside);
  body.traverse(o=>{if(o.isMesh)o.userData.action=action;});parts.push({pivot,action,open:false,kind:'lid'});
 }
 const keep=[];for(let i=0;i<g.index.count;i+=3)if(!removed.has(g.index.array[i]))keep.push(g.index.array[i],g.index.array[i+1],g.index.array[i+2]);g.setIndex(keep);
 const nightTint=new THREE.Color('#66718c');
 return {toggle(action){const p=parts.find(p=>p.action===action);if(p)p.open=!p.open;},setNight(amount){for(const c of colored)c.material.color.copy(c.day).lerp(c.day.clone().multiply(nightTint),amount);},update(dt,reduced){for(const p of parts){const target=p.open?(p.kind==='drawer'?.66:-1.65):0;if(p.kind==='drawer')p.pivot.position.z=reduced?target:THREE.MathUtils.damp(p.pivot.position.z,target,9,dt);else p.pivot.rotation.x=reduced?target:THREE.MathUtils.damp(p.pivot.rotation.x,target,9,dt);}}};
}
