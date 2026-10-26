import * as THREE from 'three';
export function installTurntable(room){
 const disc=room.getObjectByName('recordDisc'),arm=room.getObjectByName('recordArm');let playing=false,angle=0;
 function pivot(mesh,point){if(!mesh)return null;const p=new THREE.Group();p.position.copy(point);mesh.geometry.translate(-point.x,-point.y,-point.z);mesh.parent.add(p);p.add(mesh);return p;}
 let dp=null,ap=null;
 if(disc){disc.geometry.computeBoundingBox();const center=disc.geometry.boundingBox.getCenter(new THREE.Vector3());dp=pivot(disc,center);disc.userData.action='record';}
 if(arm){arm.geometry.computeBoundingBox();const box=arm.geometry.boundingBox;ap=pivot(arm,new THREE.Vector3(box.max.x-.017,box.max.y-.017,box.min.z+.017));arm.userData.action='record';}
 return {setPlaying(value){playing=value;},get anchor(){return dp?dp.getWorldPosition(new THREE.Vector3()):new THREE.Vector3(-.64,1.5,-3.2);},update(delta,reduced){
 if(dp&&playing&&!reduced)dp.rotation.y+=delta*3.49;
 angle=reduced?(playing?0:-.5):THREE.MathUtils.damp(angle,playing?0:-.5,5,delta);
 if(ap){ap.rotation.y=angle;ap.rotation.x=playing?0:-.06;}
 }};
}
