import * as THREE from 'three';
import {makeCatRoute} from './cat-route.js';
export function prepareCat(room){
 const cat=new THREE.Group();cat.name='Cream kitten';cat.position.set(3.65,.035,.85);cat.rotation.y=.32;room.add(cat);
 const cream=new THREE.Color('#f1e4cd'),lavender=new THREE.Color('#bcb0bf');
 function mesh(g,parent,color,patch=false){g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,a=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const c=new THREE.Color(color);if(patch){const wave=Math.sin(x*10+y*6)+Math.cos(z*9-y*4);if((x<-.12&&y>.1&&wave>-.3)||(z<-.15&&y>.18&&wave>.2))c.lerp(lavender,.76);}const light=.81+.18*Math.max(0,n.getY(i))+.04*Math.max(0,n.getZ(i));c.multiplyScalar(light);a.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(a,3));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true}));m.userData.action='cat';parent.add(m);return m;}
 function ball(parent,pos,scale,color=cream,patch=false){const g=new THREE.SphereGeometry(1,32,20);g.scale(...scale);const m=mesh(g,parent,color,patch);m.position.set(...pos);return m;}
 function line(parent,points,r,color){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,8,false),parent,color);}
 const body=ball(cat,[-.22,.26,-.06],[.49,.28,.37],cream,true);
 const head=new THREE.Group();head.position.set(.31,.26,.19);head.rotation.z=-.10;cat.add(head);
 ball(head,[0,0,0],[.30,.25,.245],cream,true);
 function ear(x,tilt){const s=new THREE.Shape();s.moveTo(-.12,0);s.quadraticCurveTo(-.14,.12,-.07,.28);s.quadraticCurveTo(-.04,.33,0,.28);s.quadraticCurveTo(.13,.14,.13,0);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.028,bevelThickness:.025,curveSegments:12});const e=mesh(g,head,cream);e.position.set(x,.12,-.025);e.rotation.z=tilt;e.scale.y=.78;const inner=g.clone();inner.scale(.62,.65,.25);const im=mesh(inner,e,'#dbaaa2');im.position.set(0,.035,.08);}
 ear(-.19,.24);ear(.19,-.24);
 const closedEyes=[];for(const x of [-.115,.115])closedEyes.push(line(head,[[x-.055,.015,.218],[x-.027,-.017,.242],[x+.02,-.023,.245],[x+.055,0,.225]],.013,'#82717b'));
 const openEyes=[-.115,.115].map(x=>ball(head,[x,0,.231],[.029,.042,.017],'#655767'));openEyes.forEach(m=>m.visible=false);
 ball(head,[0,-.065,.247],[.025,.018,.014],'#d4a29a');
 line(head,[[0,-.079,.249],[0,-.102,.251],[-.025,-.119,.24]],.005,'#b49491');
 line(head,[[0,-.102,.251],[.026,-.118,.239]],.005,'#b49491');
 const tucked=[ball(cat,[.18,.075,.40],[.12,.075,.13]),ball(cat,[.40,.07,.37],[.105,.07,.12])];
 const curledTail=line(cat,[[-.62,.19,.02],[-.60,.12,.28],[-.36,.10,.44],[-.08,.105,.48],[.10,.13,.44]],.095,'#bfb2c2');

 // Four articulated two-link legs, with planted stance and lifted swing phases.
 const legs=[];const axis=new THREE.Vector3(0,1,0);
 for(const front of [false,true])for(const side of [-1,1]){
   const limb=new THREE.Group();cat.add(limb);
   const upper=ball(limb,[0,0,0],[.075,.5,.075]),lower=ball(limb,[0,0,0],[.055,.5,.055]);
   const knee=ball(limb,[0,0,0],[.072,.072,.072]),paw=ball(limb,[0,0,0],[.105,.058,.07]);
   legs.push({limb,upper,lower,knee,paw,front,side,phase:(front===(side===1))?0:.5});
 }
 const tailRoot=new THREE.Group();cat.add(tailRoot);let parent=tailRoot;const tailBones=[];
 for(let i=0;i<7;i++){const b=new THREE.Group();if(i)b.position.x=-.115;parent.add(b);ball(b,[-.057,0,0],[.09,.065-i*.004,.065-i*.004],'#bfb2c2');tailBones.push(b);parent=b;}
 function segment(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(axis,b.clone().sub(a).normalize());}
 let time=0,phase=0,state='rest',stateTime=0,stand=0,speed=0,distance=0,route=null,length=0,serial=Math.floor(Math.random()*10000),lastHeading=cat.rotation.y;
 function tap(){if(state!=='rest')return;route=makeCatRoute(cat.position,++serial);length=route.getLength();distance=0;state='rise';stateTime=0;}
 function update(dt,reduced){
  dt=Math.min(dt,.05);time+=dt;stateTime+=dt;
  if(state==='rise'){stand=THREE.MathUtils.smoothstep(stateTime,0,.55);if(stateTime>=.55){stand=1;state='run';stateTime=0;}}
  let turn=0,jump=0,jumpPhase=0;
  if(state==='run'){
   // Total action: .55s rise + at most 4.6s travel + .7s settle.
   const duration=Math.min(4.6,Math.max(2.6,length/1.3)),progress=Math.min(1,stateTime/duration);
   const u=progress*progress*(3-2*progress),nextDistance=u*length,travel=nextDistance-distance;distance=nextDistance;
   const point=route.getPointAt(u),tangent=route.getTangentAt(Math.min(.999,u));cat.position.copy(point);const motion=route.motionAt(u);jump=motion.jump?Math.sin(Math.PI*motion.t):0;jumpPhase=motion.t;   const heading=Math.atan2(-tangent.z,tangent.x),error=Math.atan2(Math.sin(heading-cat.rotation.y),Math.cos(heading-cat.rotation.y));
   cat.rotation.y+=error*(1-Math.exp(-12*dt));turn=THREE.MathUtils.clamp((cat.rotation.y-lastHeading)/Math.max(.001,dt),-2,2);lastHeading=cat.rotation.y;
   phase+=travel/.62; if(progress>=1){cat.position.copy(route.getPointAt(1));cat.position.userRouteIndex=route.endIndex;speed=0;state='settle';stateTime=0;}
  }
  if(state==='settle'){stand=1-THREE.MathUtils.smoothstep(stateTime,0,.7);if(stateTime>=.7){stand=0;state='rest';stateTime=0;}}
  const moving=state==='run',bounce=jump>0?-.055*Math.sin(jumpPhase*Math.PI*2):(moving&&!reduced?.018*Math.cos(phase*Math.PI*4):0);
  body.position.set(THREE.MathUtils.lerp(-.22,-.04,stand),.26+.29*stand+bounce,THREE.MathUtils.lerp(-.06,0,stand));
  body.scale.set(1+.22*stand,1-.12*stand+(state==='rest'&&!reduced?Math.sin(time*1.65)*.018:0),1-.25*stand);
  body.rotation.z=jump>0?.16*Math.cos(jumpPhase*Math.PI):(moving&&!reduced?Math.sin(phase*Math.PI*2)*.025:0);
  head.position.set(.31+.20*stand,.26+.36*stand+bounce*.45,.19*(1-stand));head.rotation.set(-.06*stand,Math.PI*.5*stand,-.10*(1-stand));
  closedEyes.forEach(m=>m.visible=stand<.6);openEyes.forEach(m=>m.visible=stand>=.6);
  tucked.forEach(m=>{m.scale.setScalar(Math.max(.001,1-stand));});curledTail.scale.setScalar(Math.max(.001,1-stand));
  for(const leg of legs){
   leg.limb.scale.setScalar(Math.max(.001,stand));
   const cycle=(phase+leg.phase)%1,stance=cycle<.58;
   const stride=moving&&jump<.1?.18:0,offset=stance?THREE.MathUtils.lerp(stride,-stride,cycle/.58):THREE.MathUtils.lerp(-stride,stride,(cycle-.58)/.42);
   const lift=jump>0?jump*.18:(moving&&!stance?Math.sin((cycle-.58)/.42*Math.PI)*.13:0);
   const x=leg.front?.31:-.37,z=leg.side*.205;
   const hip=new THREE.Vector3(x,.49+bounce,z),foot=new THREE.Vector3(x+offset,.058+lift,z);
   const mid=hip.clone().add(foot).multiplyScalar(.5),v=foot.clone().sub(hip),len=v.length();
   // Bend elbows and hocks in opposite directions while retaining limb length.
   const bend=Math.sqrt(Math.max(.002,.285*.285-len*len/4));mid.x+=(leg.front?-1:1)*bend;
   segment(leg.upper,hip,mid);segment(leg.lower,mid,foot);leg.knee.position.copy(mid);leg.paw.position.copy(foot);
  }
  tailRoot.scale.setScalar(Math.max(.001,stand));tailRoot.position.set(-.53,.56+bounce,0);
  tailBones.forEach((b,i)=>{b.rotation.z=-.10-i*.025;b.rotation.y=(moving&&!reduced?Math.sin(phase*Math.PI*2-i*.4)*.09:0)+turn*.07;});
 }
 return {tap,update};
}
