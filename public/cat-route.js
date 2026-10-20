import * as THREE from 'three';
export const catWaypoints=[[3.65,.85],[3.7,2.65],[1.65,3.45],[.1,3.45],[.3,2.9],[1.5,1.8],[1.5,.05],[2.8,-.65]];
// Supported landing positions, in the room model's local coordinates.
const stops=[[1.5,.035,2.7],[-1.5,.035,2.7],[-2.6,1.08,1.05],[-3.6,1.08,-.2],[-5.05,1.58,-.2],[-3.6,1.08,-.2],[-2.6,1.08,1.05],[-1.5,.035,2.7],[1.5,.035,2.7],[2.3,.035,-1.65],[1.5,1.22,-3.0],[2.3,.035,-1.65],[3.65,.035,.85]];
export function makeCatRoute(position,seed){
 const nodes=stops.map(p=>new THREE.Vector3(...p));
 // Choose just one neighboring stop; subdivide longer floor corridors.
 const choices=[];
 for(let i=0;i<nodes.length;i++){
  const a=nodes[i],b=nodes[(i+1)%nodes.length],steps=Math.abs(a.y-b.y)>.15?1:Math.ceil(a.distanceTo(b)/1.8);
  for(let j=0;j<steps;j++)choices.push(a.clone().lerp(b,j/steps));
 }
 const nearby=choices.filter((p,i)=>p.distanceTo(position)>.45&&p.distanceTo(position)<2.15&&choices.findIndex(q=>q.distanceTo(p)<.01)===i);
 const target=nearby[Math.floor(Math.abs(Math.sin(seed*127.1)*43758.5453)%1*nearby.length)]||nodes[0];
 const points=[position.clone(),target.clone()]; const segments=[];let total=0;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=a.distanceTo(b);if(length<.001)continue;segments.push({a,b,start:total,length,jump:Math.abs(a.y-b.y)>.15});total+=length;}
 function sample(u){const d=THREE.MathUtils.clamp(u,0,1)*total,s=segments.find(s=>d<=s.start+s.length)||segments.at(-1),t=THREE.MathUtils.clamp((d-s.start)/s.length,0,1),p=s.a.clone().lerp(s.b,t);if(s.jump)p.y+=Math.sin(Math.PI*t)*.55;return {p,jump:s.jump,t};}
 return {getLength:()=>total,getPointAt:u=>sample(u).p,getTangentAt:u=>sample(Math.min(1,u+.001)).p.sub(sample(Math.max(0,u-.001)).p).normalize(),motionAt:u=>sample(u)};
}
