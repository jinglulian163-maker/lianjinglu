import * as THREE from 'three';

// Folded fabric bundles sit on the three existing wardrobe shelves.
export function prepareWardrobeClothes(room) {
  const palette=['#c2cdd9','#eee1c7','#ccc2d9','#bfcbb6','#e3c6c5'];
  function bundle(x,y,z,w,h,d,color,angle){
    const geometry=new THREE.BoxGeometry(w,h,d,12,6,10);
    const p=geometry.attributes.position,r=.055;
    const inner=new THREE.Vector3(w/2-r,h/2-r,d/2-r);
    for(let i=0;i<p.count;i++){
      const v=new THREE.Vector3().fromBufferAttribute(p,i);
      const q=v.clone().clamp(inner.clone().negate(),inner);
      v.sub(q).normalize().multiplyScalar(r).add(q);
      p.setXYZ(i,v.x,v.y,v.z);
    }
    geometry.computeVertexNormals();
    const colors=[],base=new THREE.Color(color),n=geometry.attributes.normal;
    for(let i=0;i<p.count;i++){
      const shade=.83+.14*Math.max(0,n.getY(i))+.025*Math.sin(p.getX(i)*35+p.getZ(i)*21);
      colors.push(base.r*shade,base.g*shade,base.b*shade);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const cloth=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true}));
    cloth.position.set(x,y+h/2,z);cloth.rotation.y=angle;cloth.userData.action='wardrobe';
    cloth.name='Folded clothing';room.add(cloth);
    // A fine fold line across the front gives each bundle a fabric edge.
    const seamGeo=new THREE.CylinderGeometry(.007,.007,w-.13,16);
    seamGeo.rotateZ(Math.PI/2);
    const seamColor=base.clone().multiplyScalar(.76),cs=[];
    for(let i=0;i<seamGeo.attributes.position.count;i++)cs.push(seamColor.r,seamColor.g,seamColor.b);
    seamGeo.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));
    const seam=new THREE.Mesh(seamGeo,new THREE.MeshBasicMaterial({vertexColors:true}));
    seam.position.set(0,-h*.12,d/2-.005);seam.userData.action='wardrobe';cloth.add(seam);
  }
  const album=new THREE.Group();album.name='Memory album';
  function albumPart(w,h,d,x,y,z,color){
    const g=new THREE.BoxGeometry(w,h,d),c=new THREE.Color(color),a=[];
    for(let i=0;i<g.attributes.position.count;i++)a.push(c.r,c.g,c.b);
    g.setAttribute('color',new THREE.Float32BufferAttribute(a,3));
    const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true}));m.position.set(x,y,z);m.userData.action='wardrobeAlbum';album.add(m);
  }
  albumPart(.62,.1,.56,3.43,2.54,-3.17,'#b6a1bc');
  albumPart(.47,.008,.37,3.43,2.595,-3.17,'#f3e8d2');
  albumPart(.24,.009,.18,3.43,2.603,-3.17,'#9aafbf');
  room.add(album);
  [0.255,1.175,2.195].forEach((shelf,row)=>{
    [3.43,4.31].forEach((x,col)=>{
      const count=row===2?2:3;
      for(let i=0;i<count;i++)bundle(x+(i%2?.018:-.012),shelf+i*.145,-3.23,.72-i*.025,.145,.72,palette[(row*2+col+i)%palette.length],(i%2?1:-1)*.025);
    });
  });
}
