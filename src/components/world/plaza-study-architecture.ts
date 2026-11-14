import { BoxGeometry, BufferGeometry, CircleGeometry, CylinderGeometry, DodecahedronGeometry, ExtrudeGeometry, Float32BufferAttribute, RingGeometry, Shape, TorusGeometry, Vector3 } from "three";
import { STUDY_CASCADE, STUDY_COLONNADES, STUDY_LECTURE_COURT, STUDY_LECTURE_SEATS, STUDY_OBSERVATORY, STUDY_OBSERVATORY_POSTS, STUDY_REFLECTING_POOL, STUDY_STAIR_PLANTERS, studyColonnadePosts } from "@/lib/world/plaza-study-architecture";
import { studyGroundHeight } from "@/lib/world/plaza-study-terrain";
import type { PlazaAssetPart } from "./fantasy-plaza-assets";
import { createReadingCloisters } from "./plaza-study-cloister";

type AddGeometry = (geometry:BufferGeometry,material:PlazaAssetPart["material"],color:string)=>void;

/** Open, upturned octagonal roof; the underface stays visible from the courtyard. */
function octagonalRoof(radius:number,height:number) {
  const vertices:number[]=[],indices:number[]=[];
  for(const [scale,y] of [[1,.2],[.86,0],[.4,height*.72],[.08,height]]) {
    for(let i=0;i<8;i++) {
      const a=(i+.5)*Math.PI/4;
      vertices.push(Math.cos(a)*radius*scale,y,Math.sin(a)*radius*scale);
    }
  }
  for(let row=0;row<3;row++)for(let i=0;i<8;i++) {
    const a=row*8+i,b=row*8+(i+1)%8;
    indices.push(a,a+8,b,b,a+8,b+8);
  }
  for(let i=1;i<7;i++){indices.push(0,i,i+1);indices.push(24,24+i+1,24+i);}
  const geometry=new BufferGeometry();
  geometry.setAttribute("position",new Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** Adds study architecture to the same material batches as the surrounding plaza. */
export function addPlazaAcademyArchitecture(add:AddGeometry,roof:(w:number,d:number,h:number)=>BufferGeometry) {
  const lecture=STUDY_LECTURE_COURT;
  const floor=(x:number,z:number)=>studyGroundHeight(x,z)??0;
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,material:PlazaAssetPart["material"],color:string,yaw=0)=>
    add(new BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),material,color);
  const beam=(a:Vector3,b:Vector3,width:number,height:number,color:string,material:PlazaAssetPart["material"]="wood")=>{
    const delta=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5);
    add(new BoxGeometry(width,height,delta.length()).lookAt(delta.normalize()).translate(mid.x,mid.y,mid.z),material,color);
  };
  const disc=(x:number,y:number,z:number,r:number,color:string)=>add(new CircleGeometry(r,64).rotateX(-Math.PI/2).translate(x,y,z),"stone",color);
  const seatArc=(radius:number,angle:number,width:number,depth:number,height:number,y:number,color:string)=>{
    const half=width/(2*radius),shape=new Shape();
    for(let i=0;i<=4;i++) {
      const a=angle-half+i*half/2,r=radius+depth/2;
      if(i===0)shape.moveTo(Math.cos(a)*r,-Math.sin(a)*r);
      else shape.lineTo(Math.cos(a)*r,-Math.sin(a)*r);
    }
    for(let i=4;i>=0;i--) {
      const a=angle-half+i*half/2,r=radius-depth/2;
      shape.lineTo(Math.cos(a)*r,-Math.sin(a)*r);
    }
    shape.closePath();
    add(new ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1}).rotateX(-Math.PI/2).translate(lecture.x,y,lecture.z),"stone",color);
  };

  // Lower wings create an inhabited courtyard beneath the principal roof.
  for (const part of createReadingCloisters()) add(part.geometry, part.material, part.color);
  for(const c of STUDY_COLONNADES) {
    if (c.id === "west-cloister" || c.id === "north-cloister") continue;
    const y=floor(c.x,c.z),top=y+c.height;
    box(c.x,y+.015,c.z,c.width+.7,.03,c.depth+.7,"stone","#d6ccb2");
    for(const p of studyColonnadePosts(c)) {
      box(p.x,y+.18,p.z,.6,.36,.6,"stone","#dcd1b5");
      box(p.x,y+c.height/2,p.z,.28,c.height,.28,"wood","#695345");
      box(p.x,top-.28,p.z,.7,.2,.7,"wood","#a08660");
      for(const side of [-1,1]) {
        const alongX=c.width>c.depth;
        beam(new Vector3(p.x,top-.9,p.z),new Vector3(p.x+(alongX?side*.6:0),top-.22,p.z+(alongX?0:side*.6)),.12,.15,"#9f8365");
      }
    }
    for(const side of [-1,1]) {
      box(c.x,top-.12,c.z+side*c.depth/2,c.width+.5,.26,.2,"wood","#695345");
      box(c.x+side*c.width/2,top-.12,c.z,.2,.26,c.depth+.5,"wood","#695345");
    }
    if(c.pergola) {
      for(let i=0;i<=18;i++)box(c.x,top+.08,c.z-c.depth/2+i*c.depth/18,c.width+1,.18,.12,"wood","#947657");
      // Small vine masses make a light canopy, retaining gaps for sky and water views.
      for(let i=0;i<6;i++)for(const side of [-1,1]) {
        add(new DodecahedronGeometry(1).scale(.65,.24,1.05).translate(c.x+side*1.5,top+.3,c.z-5+i*2),"foliage",i%2?"#829c75":"#60826b");
      }
    } else {
      add(roof(c.width+2,c.depth+2,c.id==="arrival-gate"?1.7:1.3).translate(c.x,top,c.z),"stone","#526a79");
      for(const side of [-1,1])box(c.x,top+.18,c.z+side*(c.depth/2+.96),c.width+2,.08,.1,"metal","#c0a775");
    }
  }

  // The observatory is an open destination, not a closed tower on the viewing edge.
  const o=STUDY_OBSERVATORY,y=floor(o.x,o.z),top=y+o.height;
  disc(o.x,y+.025,o.z,4.05,"#d6ccb2");
  add(new RingGeometry(2.65,2.72,64).rotateX(-Math.PI/2).translate(o.x,y+.032,o.z),"metal","#b0a17c");
  for(const [i,p] of STUDY_OBSERVATORY_POSTS.entries()) {
    box(p.x,y+.2,p.z,.55,.4,.55,"stone","#e2d7bb");
    add(new CylinderGeometry(.16,.22,o.height,8).translate(p.x,y+o.height/2,p.z),"wood","#695345");
    const next=STUDY_OBSERVATORY_POSTS[(i+1)%8];
    beam(new Vector3(p.x,top-.14,p.z),new Vector3(next.x,top-.14,next.z),.24,.3,"#947657");
    beam(new Vector3(p.x,top-.9,p.z),new Vector3((p.x+next.x)/2,top-.14,(p.z+next.z)/2),.13,.16,"#947657");
    beam(new Vector3(p.x,top+.2,p.z),new Vector3(p.x*.12,top+1.8,o.z+(p.z-o.z)*.12),.09,.1,"#c0a775","metal");
  }
  add(octagonalRoof(4.65,2).translate(o.x,top,o.z),"stone","#506879");
  add(octagonalRoof(2.3,1.3).translate(o.x,top+1.7,o.z),"stone","#526a79");
  for(const tilt of [0,Math.PI/2])add(new TorusGeometry(.7,.035,6,32).rotateY(tilt).rotateZ(.35).translate(o.x,top+3.5,o.z),"metal","#c5ad7e");
  add(new DodecahedronGeometry(.16).translate(o.x,top+3.5,o.z),"glow","#ffd59c");
  box(o.x,top+2.9,o.z,.12,.5,.12,"metal","#c5ad7e");
  for(const tilt of [0,Math.PI/2])add(new TorusGeometry(.85,.035,6,40).rotateY(tilt).rotateZ(.35).translate(o.x,y+3.6,o.z),"metal","#c5ad7e");
  add(new DodecahedronGeometry(.24).translate(o.x,y+3.6,o.z),"metal","#c0a775");
  box(o.x,y+4.6,o.z,.035,1,.035,"metal","#c5ad7e");

  // Three open arcs make an outdoor lecture room; the north side is its entrance.
  disc(lecture.x,.027,lecture.z,lecture.radius,"#c5c1ab");
  disc(lecture.x,.032,lecture.z,3.5,"#e0d8be");
  add(new RingGeometry(3.4,3.48,64).rotateX(-Math.PI/2).translate(lecture.x,.037,lecture.z),"metal","#b0a17c");
  for(const s of STUDY_LECTURE_SEATS) {
    const radius=Math.hypot(s.x-lecture.x,s.z-lecture.z),angle=Math.PI/2-s.yaw;
    seatArc(radius,angle,s.width,s.depth,s.height,0,"#9e9c8f");
    seatArc(radius,angle,s.width+.035,s.depth+.07,.07,s.height,"#ded5bb");
  }
  // Terraced planting gives the grand stair a composed approach at every level.
  for(const p of STUDY_STAIR_PLANTERS) {
    box(p.x,p.height/2,p.z,p.width,p.height,p.depth,"stone","#aeb0a1");
    box(p.x,p.height+.04,p.z,p.width+.16,.12,p.depth+.16,"stone","#ded5bb");
    box(p.x,p.height+.13,p.z,p.width-.35,.12,p.depth-.35,"foliage","#57754e");
    for(let i=0;i<3;i++)add(new DodecahedronGeometry(.7).scale(1,.5,1).translate(p.x+(i-1)*.85,p.height+.4,p.z),"foliage",i===1?"#d5b4cc":"#829c75");
  }

  // Still reflecting water and a separate stepped cascade are contrasting garden rooms.
  const p=STUDY_REFLECTING_POOL;
  box(p.x,.13,p.z,p.width+.4,.26,p.depth+.4,"stone","#c5c7ab");
  box(p.x,.268,p.z,p.width,.025,p.depth,"water","#5b9d96");
  for(const side of [-1,1]) {
    box(p.x+side*(p.width/2+.12),.31,p.z,.22,.12,p.depth+.4,"stone","#e2d7bb");
    box(p.x,.31,p.z+side*(p.depth/2+.12),p.width+.4,.12,.22,"stone","#e2d7bb");
  }
  // Small planted islets keep the pool a garden feature rather than another fountain.
  for(const [x,z,r] of [[-29.7,27.4,.65],[-26.2,28.8,.45]]) {
    add(new CylinderGeometry(r,r*1.1,.32,8).translate(x,.4,z),"stone","#aeb0a1");
    add(new DodecahedronGeometry(r).scale(1.1,.5,1).translate(x,.65,z),"foliage","#60826b");
  }
  for(const c of STUDY_CASCADE) {
    const bottom=floor(c.x,c.z),water=bottom+c.height;
    box(c.x,bottom+c.height/2,c.z,c.width,c.height,c.depth,"stone","#9e9c8f");
    box(c.x,water+.025,c.z,c.width-.45,.04,c.depth-.15,"water","#5b9d96");
    for(const side of [-1,1])box(c.x+side*(c.width/2-.1),water+.08,c.z,.2,.16,c.depth,"stone","#ded5bb");
    box(c.x,water-.48,c.z+c.depth/2+.015,c.width-.65,1,.035,"water","#a8d1b9");
    for(const side of [-1,1])box(c.x+side*(c.width/2+.2),bottom+.8,c.z,.25,1.6,.7,"stone","#c5c1ab");
  }
}
