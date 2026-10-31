import * as THREE from 'three';

export function installCoffeeMachine(room,meshes){
 const root=new THREE.Group();root.name='Coffee machine';room.add(root);
 const colored=[];
 const mat=(day,night)=>{const material=new THREE.MeshBasicMaterial({color:day});colored.push({material,day:new THREE.Color(day),night:new THREE.Color(night)});return material;};
 const cream=mat('#f4e8d2','#66728a'),blue=mat('#a9c4d6','#506786'),wood=mat('#bb8b61','#63526a'),gold=mat('#c8a773','#79718b'),dark=mat('#736c7b','#3c455e');
 function piece(geometry,material,x,y,z){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.userData.action='coffeeMachine';root.add(mesh);meshes.push(mesh);return mesh;}
 function block(w,h,d,m,x,y,z){return piece(new THREE.BoxGeometry(w,h,d),m,x,y,z);}
 function roundedBox(w,h,d,m,x,y,z){const s=new THREE.Shape(),r=.075;s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:d-.06,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.03,bevelThickness:.03,curveSegments:4});g.translate(0,0,-d/2+.03);return piece(g,m,x,y,z);}
 const cx=1.84,cz=-3.43;
 roundedBox(.68,.65,.51,cream,cx,1.74,cz-.08);
 block(.61,.31,.035,blue,cx,1.88,cz+.195);
 block(.74,.065,.58,cream,cx,1.39,cz-.05);
 block(.47,.025,.35,dark,cx-.23,1.43,cz+.18);
 block(.22,.045,.33,gold,cx-.28,2.10,cz-.05);
 piece(new THREE.CylinderGeometry(.064,.064,.15,16),wood,cx+.1,2.19,cz-.05);
 // A short horizontal arm brings the spout over the cup already on the cabinet.
 block(.53,.09,.12,cream,cx-.51,1.91,cz+.17);
 piece(new THREE.CylinderGeometry(.043,.035,.15,12),gold,cx-.77,1.80,cz+.17);
 piece(new THREE.CylinderGeometry(.055,.055,.018,16),gold,cx-.13,1.90,cz+.224).rotation.x=Math.PI/2;
 piece(new THREE.CylinderGeometry(.055,.055,.018,16),gold,cx+.13,1.90,cz+.224).rotation.x=Math.PI/2;
 piece(new THREE.CylinderGeometry(.026,.026,.02,12),wood,cx-.13,1.90,cz+.239).rotation.x=Math.PI/2;
 piece(new THREE.SphereGeometry(.027,10,8),wood,cx+.13,1.90,cz+.239);
 block(.065,.31,.08,wood,cx+.385,1.78,cz+.04);
 piece(new THREE.SphereGeometry(.068,12,10),wood,cx+.385,1.98,cz+.04);
 // The existing right-hand cup stays in place; liquid appears inside it.
 const liquid=piece(new THREE.CylinderGeometry(.105,.105,.012,24),mat('#8b6048','#604764'),1.15,1.607,-3.42);
 liquid.userData.action='coffeeMachine';liquid.visible=false;
 const stream=piece(new THREE.CylinderGeometry(.019,.013,.30,12),mat('#a47653','#9e8298'),1.07,1.66,-3.26);
 stream.visible=false;
 let pourTime=0,drink='coffee';
 return {
  brew(value){drink=value==='milkTea'?'milkTea':'coffee';pourTime=2.7;liquid.visible=true;liquid.scale.setScalar(.12);stream.visible=true;const c=drink==='milkTea'?'#d5aa84':'#8b6048';liquid.material.color.set(c);stream.material.color.set(c);},
  setNight(amount){for(const c of colored){if(c.material===liquid.material||c.material===stream.material)continue;c.material.color.lerpColors(c.day,c.night,amount);}},
  update(dt){if(pourTime<=0)return;pourTime=Math.max(0,pourTime-dt);const progress=1-pourTime/2.7;liquid.scale.set(Math.min(1,.12+progress*1.3),1,Math.min(1,.12+progress*1.3));stream.visible=pourTime>.45;stream.scale.y=.7+Math.sin(progress*20)*.06;}
 };
}
