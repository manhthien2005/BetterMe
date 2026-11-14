export type StudyPoint = readonly [number, number];
export type StudyTerrace = { id: string; height: number; outline: readonly StudyPoint[] };
export type StudyConnector = {
  id: string; from: StudyPoint; to: StudyPoint;
  fromY: number; toY: number; width: number; stairs?: boolean;
};

export const STUDY_TERRACES: readonly StudyTerrace[] = [
  { id: "water-garden", height: -2, outline: [[-42,38],[-40,6],[-39,-14],[-29,-23],[-13,-25],[3,-25],[15,-20],[34,-17],[41,-6],[42,18],[39,36],[29,49],[6,58],[-16,58],[-33,51]] },
  { id: "gathering-court", height: 0, outline: [[-39,-10],[-32,-18],[-14,-18],[8,-14],[16,-6],[16,46],[3,55],[-18,55],[-34,46],[-40,29]] },
  // The west landing includes the entire 4.2 m garden-ramp mouth.
  { id: "reading-terrace", height: 4, outline: [[-36,-14],[-16,-14],[-12,-8],[-12,5],[-18,9],[-38.1,9],[-39,2],[-39,-8]] },
  // Match the 4 m bridge's angled end cap (direction 12,-5; length 13).
  // A straight z=-17 edge leaves a triangular gap on one half of the entrance.
  // The return edge stays outside the bridge; the old (-12,-17) corner overhung its deck.
  { id: "sky-belvedere", height: 7, outline: [[-12,-25],[2,-25],[9,-20],[6,-17],[-8+10/13,-17+24/13],[-8-10/13,-17-24/13],[-16,-20]] }
];
export const STUDY_CONNECTORS: readonly StudyConnector[] = [
  { id:"academy-stair", from:[-25,21], to:[-25,9], fromY:0, toY:4, width:7, stairs:true },
  { id:"garden-ascent", from:[-36,33], to:[-36,9], fromY:0, toY:4, width:4.2 },
  { id:"sky-bridge", from:[-20,-12], to:[-8,-17], fromY:4, toY:7, width:4 },
  { id:"lake-north-ramp", from:[16,3], to:[28,3], fromY:0, toY:-2, width:4.4 },
  { id:"lake-south-ramp", from:[16,40], to:[28,40], fromY:0, toY:-2, width:4.4 }
];

export function insideStudyPolygon(x: number, z: number, points: readonly StudyPoint[]): boolean {
  let inside = false;
  for (let i=0, j=points.length-1; i<points.length; j=i++) {
    const [ax,az]=points[j], [bx,bz]=points[i];
    const dx=bx-ax,dz=bz-az,lengthSq=dx*dx+dz*dz;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/lengthSq));
    if(Math.hypot(x-ax-t*dx,z-az-t*dz)<.0001)return true;
    if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
  }
  return inside;
}
export function studyConnectorProgress(x: number, z: number, c: StudyConnector): number | null {
  const dx=c.to[0]-c.from[0],dz=c.to[1]-c.from[1],length=Math.hypot(dx,dz);
  const along=((x-c.from[0])*dx+(z-c.from[1])*dz)/length;
  const across=Math.abs((x-c.from[0])*dz-(z-c.from[1])*dx)/length;
  return along>=-.001&&along<=length+.001&&across<=c.width/2 ? Math.max(0,Math.min(1,along/length)) : null;
}
export function studyConnectorHeight(c: StudyConnector, t: number): number {
  if(c.id==="sky-bridge") {
    const u=Math.max(0,Math.min(1,t));
    // Level landing tangents, with a gentle crown over the eased ascent.
    return c.fromY+(c.toY-c.fromY)*u*u*(3-2*u)+.85*16*u*u*(1-u)*(1-u);
  }
  if(!c.stairs)return c.fromY+(c.toY-c.fromY)*t;
  const distance=t*12;
  const climb=distance<5 ? distance : distance<7 ? 5 : distance-2;
  return Math.min(4,Math.floor((climb+.00001)/.5)*.2);
}
/** Shared by floor meshes, props, avatar contact and the terrain-aware camera. */
export function studyGroundHeight(x: number, z: number): number | null {
  if(!insideStudyPolygon(x,z,STUDY_TERRACES[0].outline))return null;
  for(const connector of STUDY_CONNECTORS) {
    const t=studyConnectorProgress(x,z,connector);
    if(t!==null)return studyConnectorHeight(connector,t);
  }
  for(let i=STUDY_TERRACES.length-1;i>=0;i--) {
    const terrace=STUDY_TERRACES[i];
    if(insideStudyPolygon(x,z,terrace.outline))return terrace.height;
  }
  return -2;
}
