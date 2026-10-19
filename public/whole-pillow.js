import * as THREE from 'three';

// A single watertight surface, without separate upper/lower shells or a waist seam.
export function createWholePillow(original){
 original.computeBoundingBox();
 const center=original.boundingBox.getCenter(new THREE.Vector3()),half=original.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(.5);

 const positions=[],colors=[],indices=[],rings=24,segments=64;
 const power=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p);
 function vertex(x,y,z){
  const px=center.x+x*half.x,py=center.y+y*half.y,pz=center.z+z*half.z;
  positions.push(px,py,pz);
  const shade=.90+.10*(y+1)/2; const palette=[[.91,.84,.64],[.72,.69,.80],[.95,.89,.73],[.85,.75,.69]]; const color=palette[Math.min(3,Math.floor((z+1)*2))];
  colors.push(...color.map(v=>v*shade));
 }
 vertex(0,1,0);
 for(let r=1;r<rings;r++){const theta=Math.PI*r/rings,radial=Math.pow(Math.sin(theta),.5);for(let s=0;s<segments;s++){const phi=2*Math.PI*s/segments;vertex(radial*power(Math.cos(phi),.4),power(Math.cos(theta),.85),radial*power(Math.sin(phi),.4));}}
 const bottom=positions.length/3;vertex(0,-1,0);
 for(let s=0;s<segments;s++){const next=(s+1)%segments;indices.push(0,1+next,1+s);for(let r=0;r<rings-2;r++){const a=1+r*segments+s,b=1+r*segments+next,c=a+segments,d=b+segments;indices.push(a,b,c,b,d,c);}const base=1+(rings-2)*segments;indices.push(bottom,base+s,base+next);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
