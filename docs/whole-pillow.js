import * as THREE from 'three';

// A single watertight surface, without separate upper/lower shells or a waist seam.
export function createWholePillow(original){
 original.computeBoundingBox();
 const center=original.boundingBox.getCenter(new THREE.Vector3()),half=original.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(.5);

 const positions=[],colors=[],uv=[],indices=[],rings=24,segments=64;
 const power=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p);
 function vertex(x,y,z){
  const px=center.x+x*half.x,py=center.y+y*half.y,pz=center.z+z*half.z;
  positions.push(px,py,pz);
  const shade=.80+.20*(y+1)/2;
  colors.push(shade,shade,shade);uv.push((x+1)/2,(z+1)/2);
 }
 vertex(0,1,0);
 for(let r=1;r<rings;r++){const theta=Math.PI*r/rings,radial=Math.pow(Math.sin(theta),.5);for(let s=0;s<segments;s++){const phi=2*Math.PI*s/segments;vertex(radial*power(Math.cos(phi),.4),power(Math.cos(theta),.85),radial*power(Math.sin(phi),.4));}}
 const bottom=positions.length/3;vertex(0,-1,0);
 for(let s=0;s<segments;s++){const next=(s+1)%segments;indices.push(0,1+next,1+s);for(let r=0;r<rings-2;r++){const a=1+r*segments+s,b=1+r*segments+next,c=a+segments,d=b+segments;indices.push(a,b,c,b,d,c);}const base=1+(rings-2)*segments;indices.push(bottom,base+s,base+next);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

export function dressPillow(mesh){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#a8bdcf';ctx.fillRect(0,0,1024,512);
 // Cream woven checks, drawn once; no texture work during animation.
 ctx.strokeStyle='#eee4c9';ctx.lineWidth=13;
 for(let x=58;x<1024;x+=160){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}
 for(let y=62;y<512;y+=132){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
 ctx.strokeStyle='#f8efdc';ctx.globalAlpha=.25;ctx.lineWidth=1;
 for(let y=0;y<512;y+=4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y+1);ctx.stroke();}ctx.globalAlpha=1;
 // One small corner daisy, without repeating the motif across the pillow.
 const fx=760,fy=180;ctx.fillStyle='#f5ebd3';
 for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.ellipse(fx+Math.cos(a)*25,fy+Math.sin(a)*25,23,13,a,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle='#d9b66f';ctx.beginPath();ctx.arc(fx,fy,14,0,Math.PI*2);ctx.fill();
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;mesh.material.map=texture;
 mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox,center=box.getCenter(new THREE.Vector3()),half=box.getSize(new THREE.Vector3()).multiplyScalar(.5),points=[];
 for(let i=0;i<128;i++){const a=i/128*Math.PI*2,c=Math.cos(a),s=Math.sin(a);points.push(new THREE.Vector3(center.x+half.x*Math.sign(c)*Math.abs(c)**.4,center.y,center.z+half.z*Math.sign(s)*Math.abs(s)**.4));}
 const curve=new THREE.CatmullRomCurve3(points,true),geo=new THREE.TubeGeometry(curve,160,.014,6,true),colors=[];
 const cream=new THREE.Color('#e8ddc2');for(let i=0;i<geo.attributes.position.count;i++)colors.push(cream.r,cream.g,cream.b);geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const piping=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true}));piping.name='pillowCreamPiping';piping.userData.action='bed';mesh.add(piping);
}
