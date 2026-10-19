import * as THREE from 'three';
export function prepareCat(room){
 const cat=new THREE.Group();cat.name='Sleeping cream kitten';cat.position.set(3.65,.035,.85);cat.rotation.y=.32;room.add(cat);
 const cream=new THREE.Color('#f1e4cd'),lavender=new THREE.Color('#bcb0bf');
 function mesh(g,parent,color,patch=false){g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,a=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const c=new THREE.Color(color);if(patch){const wave=Math.sin(x*10+y*6)+Math.cos(z*9-y*4);if((x<-.12&&y>.1&&wave>-.3)||(z<-.15&&y>.18&&wave>.2))c.lerp(lavender,.76);}const light=.81+.18*Math.max(0,n.getY(i))+.04*Math.max(0,n.getZ(i));c.multiplyScalar(light);a.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(a,3));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true}));m.userData.action='cat';parent.add(m);return m;}
 function ball(parent,pos,scale,color=cream,patch=false){const g=new THREE.SphereGeometry(1,32,20);g.scale(...scale);const m=mesh(g,parent,color,patch);m.position.set(...pos);return m;}
 function line(parent,points,r,color){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,8,false),parent,color);}
 const body=ball(cat,[-.22,.26,-.06],[.49,.28,.37],cream,true);
 const head=new THREE.Group();head.position.set(.31,.26,.19);head.rotation.z=-.10;cat.add(head);
 ball(head,[0,0,0],[.30,.25,.245],cream,true);
 function ear(x,tilt){const s=new THREE.Shape();s.moveTo(-.12,0);s.quadraticCurveTo(-.14,.12,-.07,.28);s.quadraticCurveTo(-.04,.33,0,.28);s.quadraticCurveTo(.13,.14,.13,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.028,bevelThickness:.025,curveSegments:12});const e=mesh(g,head,cream);e.position.set(x,.12,-.025);e.rotation.z=tilt;e.scale.y=.78;const inner=g.clone();inner.scale(.62,.65,.25);const im=mesh(inner,e,'#dbaaa2');im.position.set(0,.035,.08);}
 ear(-.19,.24);ear(.19,-.24);
 for(const x of [-.115,.115])line(head,[[x-.055,.015,.218],[x-.027,-.017,.242],[x+.02,-.023,.245],[x+.055,0,.225]],.013,'#82717b');
 ball(head,[0,-.065,.247],[.025,.018,.014],'#d4a29a');
 line(head,[[0,-.079,.249],[0,-.102,.251],[-.025,-.119,.24]],.005,'#b49491');
 line(head,[[0,-.102,.251],[.026,-.118,.239]],.005,'#b49491');
 ball(cat,[.18,.075,.40],[.12,.075,.13]);ball(cat,[.40,.07,.37],[.105,.07,.12]);
 line(cat,[[-.62,.19,.02],[-.60,.12,.28],[-.36,.10,.44],[-.08,.105,.48],[.10,.13,.44]],.095,'#bfb2c2');
 let elapsed=0,wake=0;
 return {tap(){wake=2.6;},update(dt,reduced){elapsed+=dt;wake=Math.max(0,wake-dt);const lift=wake?Math.sin(Math.min(1,wake/.45)*Math.PI/2):0;head.position.y=.26+lift*.10;head.rotation.x=-lift*.18;body.scale.y=reduced?1:1+Math.sin(elapsed*1.65)*.018;
 }};
}
