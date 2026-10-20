import * as THREE from 'three';
// A clear loop around the floor cushions, bed and cabinet. The cat stays inside
// these corridors; random direction and stopping points change each excursion.
export const catWaypoints=[[3.65,.85],[3.7,2.65],[1.65,3.45],[.1,3.45],[.3,2.9],[1.5,1.8],[1.5,.05],[2.8,-.65]];
export function makeCatRoute(position,seed){
 const nodes=catWaypoints.map(([x,z])=>new THREE.Vector3(x,.035,z));
 let nearest=0;nodes.forEach((p,i)=>{if(p.distanceToSquared(position)<nodes[nearest].distanceToSquared(position))nearest=i;});
 const direction=seed%2?1:-1,count=5+seed%4,points=[position.clone()];
 if(position.distanceTo(nodes[nearest])>.05)points.push(nodes[nearest].clone());
 for(let j=1;j<=count;j++)points.push(nodes[(nearest+direction*j+nodes.length*2)%nodes.length].clone());
 return new THREE.CatmullRomCurve3(points,false,'centripetal',.2);
}
