import * as THREE from 'three';
export const catWaypoints=[[3.65,.85],[3.7,2.65],[1.65,3.45],[.1,3.45],[.3,2.9],[1.5,1.8],[1.5,.05],[2.8,-.65]];
// Supported landing positions, in the room model's local coordinates.
const stops=[[1.5,.035,2.7],[-1.5,.035,2.7],[-2.6,1.08,1.05],[-3.6,1.08,-.2],[-5.05,1.58,-.2],[-3.6,1.08,-.2],[-2.6,1.08,1.05],[-1.5,.035,2.7],[1.5,.035,2.7],[2.3,.035,-1.65],[1.5,1.22,-3.0],[2.3,.035,-1.65],[3.65,.035,.85]];
export function makeCatRoute(position,seed){
 const nodes=stops.map(p=>new THREE.Vector3(...p));
 // Keep progress through the route so repeated clicks visit every surface.
 const start=position.clone();let nearest=0;
 nodes.forEach((p,i)=>{if(p.distanceToSquared(start)<nodes[nearest].distanceToSquared(start))nearest=i;});
 const cursor=Number.isInteger(position.userRouteIndex)?position.userRouteIndex:nearest;
 const points=[start];let travelled=0,last=start,index=cursor;
 for(let step=1;step<=3;step++){
  const next=(cursor+step)%nodes.length,p=nodes[next],d=last.distanceTo(p);
  if(travelled+d>6&&points.length>1)break;
  points.push(p.clone());travelled+=d;last=p;index=next;
  if(p.y>.5)break;
 }
 const endIndex=index; const segments=[];let total=0;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=a.distanceTo(b);if(length<.001)continue;segments.push({a,b,start:total,length,jump:Math.abs(a.y-b.y)>.15});total+=length;}
 function sample(u){const d=THREE.MathUtils.clamp(u,0,1)*total,s=segments.find(s=>d<=s.start+s.length)||segments.at(-1),t=THREE.MathUtils.clamp((d-s.start)/s.length,0,1),p=s.a.clone().lerp(s.b,t);if(s.jump)p.y+=Math.sin(Math.PI*t)*.55;return {p,jump:s.jump,t};}
 return {endIndex,getLength:()=>total,getPointAt:u=>sample(u).p,getTangentAt:u=>sample(Math.min(1,u+.001)).p.sub(sample(Math.max(0,u-.001)).p).normalize(),motionAt:u=>sample(u)};
}
