import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Matrix4, Shape, Vector3 } from "three";
import { STUDY_TERRACES, studyConnectorHeight, type StudyConnector } from "@/lib/world/plaza-study-terrain";

/** Exact top contact, closed sides and underside; the bridge alone retains a thin span. */
export function createStudyConnectorGeometry(c:StudyConnector):BufferGeometry {
  const dx=c.to[0]-c.from[0],dz=c.to[1]-c.from[1],length=Math.hypot(dx,dz);
  const bridge=c.id==="sky-bridge",bottom=Math.min(c.fromY,c.toY)-.35;
  const profile=new Shape();
  profile.moveTo(0,bridge?c.fromY-.3:bottom);
  if(bridge) {
    // Sample both sides of the closed slab from the shared curved walking surface.
    for(let i=1;i<=52;i++)profile.lineTo(length*i/52,studyConnectorHeight(c,i/52)-.3);
    for(let i=52;i>=0;i--)profile.lineTo(length*i/52,studyConnectorHeight(c,i/52));
  } else {
    profile.lineTo(length,bottom);
    profile.lineTo(length,c.toY);
  }
  if(c.stairs) {
    const segments=Math.round(length/.5);
    for(let i=segments-1;i>=0;i--) {
      const y=studyConnectorHeight(c,(i+.5)/segments);
      profile.lineTo((i+1)*length/segments,y);
      const previous=studyConnectorHeight(c,Math.max(0,(i-.5)/segments));
      const bevel=y>previous ? .018 : 0;
      profile.lineTo(i*length/segments+bevel,y);
      profile.lineTo(i*length/segments,y-bevel);
    }
  } else if(!bridge) profile.lineTo(0,c.fromY);
  profile.closePath();
  const geometry=new ExtrudeGeometry(profile,{depth:c.width,steps:1,bevelEnabled:false});
  const normal=new Vector3(-dz/length,0,dx/length);
  const transform=new Matrix4().makeBasis(new Vector3(dx/length,0,dz/length),new Vector3(0,1,0),normal);
  transform.setPosition(c.from[0]-normal.x*c.width/2,0,c.from[1]-normal.z*c.width/2);
  geometry.applyMatrix4(transform);
  const normals=geometry.getAttribute("normal"),styles=new Float32Array(normals.count);
  for(let i=0;i<normals.count;i++)styles[i]=bridge?0:c.stairs?
    (Math.abs(normals.getX(i))>.9?2:0):normals.getY(i)>.7?1:2;
  geometry.setAttribute("groundStyle",new Float32BufferAttribute(styles,1));
  return geometry;
}

/** The rim shares the floor's exact boundary; the final fan closes the island below. */
export function createStudyRockGeometry():BufferGeometry {
  const points:number[]=[],indices:number[]=[];
  const outline=STUDY_TERRACES[0].outline,ringSize=outline.length*3;
  for(let ring=0;ring<5;ring++) {
    const scale=[1,1.045,.93,.7,.4][ring],height=[-2.01,-6,-17,-30,-42][ring];
    for(let edge=0;edge<outline.length;edge++)for(let i=0;i<3;i++) {
      const a=outline[edge],b=outline[(edge+1)%outline.length],t=i/3;
      const jitter=ring===0?0:Math.sin(edge*17+i*8+ring*31)*1.8;
      points.push((a[0]+(b[0]-a[0])*t)*scale+jitter*.2,
        height+(ring===0?0:jitter),16+(a[1]+(b[1]-a[1])*t-16)*scale+jitter*.2);
    }
  }
  for(let ring=0;ring<4;ring++)for(let i=0;i<ringSize;i++) {
    const a=ring*ringSize+i,b=ring*ringSize+(i+1)%ringSize;
    indices.push(a,b,a+ringSize,b,b+ringSize,a+ringSize);
  }
  const bottom=points.length/3;points.push(0,-45,16);
  for(let i=0;i<ringSize;i++)indices.push(bottom,ringSize*4+i,ringSize*4+(i+1)%ringSize);
  const indexed=new BufferGeometry();
  indexed.setAttribute("position",new Float32BufferAttribute(points,3));indexed.setIndex(indices);
  const geometry=indexed.toNonIndexed();indexed.dispose();geometry.computeVertexNormals();
  return geometry;
}
