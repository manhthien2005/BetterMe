/** Shared massing positions keep the polygon architecture and collision aligned. */
export const STUDY_COLONNADES = [
  { id:"west-cloister", x:-35, z:-3, width:3.6, depth:12, height:4.1, pergola:false },
  { id:"north-cloister", x:-28, z:-11, width:10, depth:3, height:4.8, pergola:false },
  { id:"lake-pergola", x:38.6, z:19, width:3, depth:12, height:3.6, pergola:true },
  { id:"arrival-gate", x:0, z:48, width:9, depth:2.2, height:5.3, pergola:false }
] as const;

export function studyColonnadePosts(c: typeof STUDY_COLONNADES[number]) {
  const alongX=c.width>c.depth;
  const count=c.id==="arrival-gate"?1:2;
  return Array.from({length:count+1},(_,i)=>i/count).flatMap(t=>[-1,1].map(side=>({
    x:c.x+(alongX?(t-.5)*c.width:side*c.width/2),
    z:c.z+(alongX?side*c.depth/2:(t-.5)*c.depth)
  })));
}

export const STUDY_OBSERVATORY = { x:0, z:-21, radius:3.6, height:5.1 };
export const STUDY_OBSERVATORY_POSTS = Array.from({length:8},(_,i)=>{
  const angle=(i+.5)*Math.PI/4;
  return {x:Math.cos(angle)*3.6,z:-21+Math.sin(angle)*3.6};
});
export const STUDY_REFLECTING_POOL = {x:-28,z:28,width:7.4,depth:5};
export const STUDY_CASCADE = Array.from({length:3},(_,i)=>({
  x:31.5,z:10+i*1.4,width:3.5+i*.7,depth:1.6,height:3.1-i
}));
export const STUDY_STAIR_PLANTERS = [-31.2,-18.8].flatMap(x=>[0,1,2].map(i=>({
  x,z:18-i*4,width:3.2,depth:2.6,height:.65+i*.95
})));
export const STUDY_LECTURE_COURT = {x:-23,z:42,radius:8};
export const STUDY_LECTURE_SEATS = [4.5,6,7.5].flatMap((radius,row)=>
  Array.from({length:15},(_,i)=>{
    const angle=(i+.5)*Math.PI/15;
    return {x:STUDY_LECTURE_COURT.x+Math.cos(angle)*radius,z:STUDY_LECTURE_COURT.z+Math.sin(angle)*radius,
      width:2*radius*Math.sin(Math.PI/30)-.06,depth:1.1,height:(row+1)*.45,
      yaw:Math.PI/2-angle};
  })
);
