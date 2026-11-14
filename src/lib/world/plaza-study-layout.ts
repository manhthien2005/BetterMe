import type { Vec3Tuple } from "./types";
import { STUDY_CONNECTORS } from "./plaza-study-terrain";

export const STUDY_BOUNDS = { minX: -42, maxX: 42, minZ: -25, maxZ: 58 };
export const STUDY_FOUNTAIN: Vec3Tuple = [0, 0, 12];
export const STUDY_LAKE = { x: 28, z: 23, rx: 7.5, rz: 11 };
export const STUDY_PAVILIONS = [
  { id: "grand-pavilion", x: -25, z: -2, width: 13, depth: 11, height: 6.4 },
  { id: "lake-pavilion", x: 28, z: -5, width: 8, depth: 7, height: 4.6 }
] as const;
export const STUDY_BENCHES = [
  {x:-8,z:-23,yaw:Math.PI},{x:1,z:-23,yaw:Math.PI},
  {x:-32,z:-11,yaw:Math.PI},{x:35,z:-9,yaw:-Math.PI/2},
  {x:-27,z:-6,yaw:0},{x:-28.5,z:1,yaw:Math.PI/2},
  {x:28,z:-7,yaw:Math.PI},{x:20,z:23,yaw:-Math.PI/2},
  {x:31,z:35.5,yaw:Math.PI},{x:-32.8,z:28,yaw:Math.PI/2},
  {x:-14.5,z:41,yaw:0},{x:-7,z:47,yaw:Math.PI/2},{x:7,z:47,yaw:-Math.PI/2}
] as const;
export const STUDY_TABLES = [{x:-22,z:-4},{x:24.5,z:-5},{x:-11,z:32}] as const;
export const STUDY_TREES = [
  // Keep the placeholder trunk and crown clear of the finished bridge rail.
  [-37,-12,7],[-15.2,-8.8,5],[-13,-21,5],[6.5,-19,4],[34,-14,6],
  [-32,6,5],[-17,6,5],[-10,0,5],[10,-6,5],[37,7,6],
  [-39,21,6],[-33,42,7],[-32,46,7],[-13,49,6],[12,49,7],[30,44,6],[38,34,5],
  [-7,35,4],[9,30,4],[-18,27,4],[19.5,16,4],[-32,21,5]
] as const;
// Centerlines stop at terrace boundaries; connectors provide the actual ascent.
export const STUDY_PATHS = [
  {width:5.2,points:[[0,51],[0,39],[0,28],[0,23]]},
  {width:5,points:[[0,1],[0,-5],[0,-11]]},
  // Meet the open foot of the stair, rather than cutting through its east rail.
  {width:4.5,points:[[-10,12],[-16,20],[-22,23],[-25,21]]},
  {width:4,points:[[-25,9],[-25,4],[-25,-2]]},
  {width:2.8,points:[[-25,-2],[-24.5,-7],[-24.5,-11],[-20,-11],[-20,-12]]},
  {width:3.4,points:[[-8,-17],[-6,-20],[0,-21]]},
  {width:3.4,points:[[-4,32],[-19,38],[-30,37],[-36,33]]},
  {width:3.4,points:[[-36,9],[-35,0],[-25,-2]]},
  {width:3.8,points:[[9,6],[12,3],[16,3]]},
  {width:3.4,points:[[28,3],[28,-5]]},
  {width:3.2,points:[[28,-5],[36,0],[39,15],[37,30],[32,38],[28,40]]},
  {width:3.6,points:[[16,40],[6,40],[0,39],[-19,38]]},
  {width:2.2,points:[[28,3],[28,7],[21,10],[18,15],[18,29],[21,36],[28,36],[28,40]]},
  {width:3.2,points:[[-10,21],[-16,28],[-22,32],[-19,38]]},
  {width:3.2,points:[[-23,38],[-23,40],[-23,43]]},
  {width:2.8,points:[[-30,37],[-28,34],[-28,32.5]]},
  ...STUDY_CONNECTORS.map(c=>({width:c.width,points:[c.from,c.to]}))
] as const;
