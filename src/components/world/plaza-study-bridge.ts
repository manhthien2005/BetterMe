import { BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute, Matrix4, Shape, Vector3 } from "three";
import { BRIDGE_LENGTH, BRIDGE_POST_STATIONS, BRIDGE_RAIL_OFFSET, SKY_BRIDGE, skyBridgePoint } from "@/lib/world/plaza-study-bridge";
import type { PlazaAssetPart } from "./fantasy-plaza-assets";
import { createStudyConnectorGeometry } from "./plaza-study-ground";
import { beveledBlock, timberBeam } from "./plaza-study-joinery";

export function createSkyBridgeDetails(): PlazaAssetPart[] {
  const parts: PlazaAssetPart[] = [];
  const add = (geometry: BufferGeometry, material: PlazaAssetPart["material"], color: string) =>
    parts.push({ geometry, material, color });
  const start = new Vector3(...skyBridgePoint(0, 0)), end = new Vector3(...skyBridgePoint(0, BRIDGE_LENGTH));
  const along = end.clone().sub(start).setY(0).normalize(), normal = new Vector3(-along.z, 0, along.x);
  const yaw = Math.atan2(-normal.z, normal.x);
  const block = (across: number, run: number, y: number, w: number, h: number, d: number,
    material: PlazaAssetPart["material"], color: string, bevel = .018) =>
    add(beveledBlock(w, h, d, bevel).rotateY(yaw).translate(...skyBridgePoint(across, run, y)), material, color);
  const rail = (across: number, y: number, w: number, h: number, color: string) => {
    const x=w/2, v=h/2, bevel=.018;
    const section=[[-x+bevel,-v],[x-bevel,-v],[x,-v+bevel],[x,v-bevel],
      [x-bevel,v],[-x+bevel,v],[-x,v-bevel],[-x,-v+bevel]];
    const positions:number[]=[],indices:number[]=[];
    // Shared rings make every bend watertight, including the shallow upper crest.
    for(let i=0;i<=26;i++) {
      for(const [dx,dy] of section)positions.push(...skyBridgePoint(across+dx,BRIDGE_LENGTH*i/26,y+dy));
      if(i<26)for(let j=0;j<8;j++) {
        const a=i*8+j,b=i*8+(j+1)%8;
        indices.push(a,a+8,b,b,a+8,b+8);
      }
    }
    for(let i=1;i<7;i++)indices.push(0,i,i+1,26*8,26*8+i+1,26*8+i);
    const indexed=new BufferGeometry();
    indexed.setAttribute("position",new Float32BufferAttribute(positions,3));indexed.setIndex(indices);
    const geometry=indexed.toNonIndexed();indexed.dispose();geometry.computeVertexNormals();
    add(geometry,"wood",color);
  };

  // The curved closed core backs the narrow seams; the boards meet the sampler.
  add(createStudyConnectorGeometry(SKY_BRIDGE).translate(0, -.016, 0), "wood", "#68503c");
  const transform = new Matrix4().makeBasis(along, new Vector3(0, 1, 0), normal);
  transform.setPosition(start.x - normal.x * SKY_BRIDGE.width / 2, 0, start.z - normal.z * SKY_BRIDGE.width / 2);
  const rise = (run: number) => skyBridgePoint(0, run)[1];
  for (let i = 0; i < 26; i++) {
    const a = i * .5 + (i === 0 ? 0 : .004), b = (i + 1) * .5 - (i === 25 ? 0 : .004), bevel = .009;
    const profile = new Shape().moveTo(a, rise(a) - .1).lineTo(b, rise(b) - .1)
      .lineTo(b, rise(b) - bevel).lineTo(b - bevel, rise(b - bevel))
      .lineTo(a + bevel, rise(a + bevel)).lineTo(a, rise(a) - bevel);
    profile.closePath();
    add(new ExtrudeGeometry(profile, { depth: SKY_BRIDGE.width, bevelEnabled: false, steps: 1 })
      .applyMatrix4(transform), "wood", ["#ad8c67", "#b3936f", "#a78967", "#b0916c"][i % 4]);
  }

  const ribY = (run: number) => -.8 - 1.25 * (2 * run / BRIDGE_LENGTH - 1) ** 2;
  for (const side of [-1, 1]) {
    const across = side * BRIDGE_RAIL_OFFSET;
    // Stone corbels reach back into each bank beneath the timber rib ends.
    for (const endRun of [0, BRIDGE_LENGTH]) {
      const centerRun = endRun === 0 ? -.3 : BRIDGE_LENGTH + .55;
      const offset = rise(endRun) + ribY(endRun) - .18 - rise(centerRun);
      block(across, centerRun, offset, .6, .4, 1.6, "stone", "#c5b99e", .025);
    }
    // Recess the beam faces beneath the wider stone feet to avoid coplanar overlap.
    rail(across, -.13, .40, .3, "#77583f");
    rail(across, 1.06, .21, .14, "#89694b");
    rail(across, .43, .12, .1, "#74553e");
    // One closed extruded rib avoids cracks between adjacent curved segments.
    const rib = new Shape();
    for (let i = 0; i <= 16; i++) {
      const run = i * BRIDGE_LENGTH / 16, y = rise(run) + ribY(run) - .17;
      if (i === 0) rib.moveTo(run, y); else rib.lineTo(run, y);
    }
    for (let i = 16; i >= 0; i--) {
      const run = i * BRIDGE_LENGTH / 16;
      rib.lineTo(run, rise(run) + ribY(run) + .17);
    }
    rib.closePath();
    const ribTransform = transform.clone();
    ribTransform.setPosition(start.x + normal.x * (across - .18), 0, start.z + normal.z * (across - .18));
    add(new ExtrudeGeometry(rib, { depth: .36, bevelEnabled: false, steps: 1 }).applyMatrix4(ribTransform), "wood", "#785b43");

    for (const run of BRIDGE_POST_STATIONS) {
      // A deeper foot meets the curved edge beam while the post stays plumb.
      block(across, run, -.035, .44, .24, .48, "stone", "#c5b99e", .02);
      block(across, run, .14, .38, .11, .42, "stone", "#dfd1b3", .018);
      add(timberBeam(skyBridgePoint(across, run, .18), skyBridgePoint(across, run, 1.16), .26, .26), "wood", "#785a41");
      add(new BoxGeometry(.3, .04, .3).rotateY(yaw).translate(...skyBridgePoint(across, run, 1.12)), "metal", "#ad966a");
      add(new BoxGeometry(.37, .055, .37).rotateY(yaw).translate(...skyBridgePoint(across, run, 1.18)), "metal", "#435960");
      add(new CylinderGeometry(.10, .28, .12, 4).rotateY(Math.PI / 4 + yaw)
        .translate(...skyBridgePoint(across, run, 1.265)), "metal", "#61767b");
      add(timberBeam(skyBridgePoint(across, run, ribY(run)), skyBridgePoint(across, run, -.17), .18, .2), "wood", "#8a6a4b");
    }
    // Low diamonds keep the upper half open to the mountain view.
    for (let bay = 0; bay < BRIDGE_POST_STATIONS.length - 1; bay++) {
      const middle = (BRIDGE_POST_STATIONS[bay] + BRIDGE_POST_STATIONS[bay + 1]) / 2;
      const corners = [[middle - .62, .72], [middle, 1.06], [middle + .62, .72], [middle, .43]];
      for (let i = 0; i < 4; i++) {
        const a = corners[i], b = corners[(i + 1) % 4];
        add(timberBeam(skyBridgePoint(across, a[0], a[1]), skyBridgePoint(across, b[0], b[1]), .055, .065), "wood", "#9c7e58");
      }
    }
  }
  for (const run of BRIDGE_POST_STATIONS) {
    add(timberBeam(skyBridgePoint(-2.45, run, -.32), skyBridgePoint(2.45, run, -.32), .22, .28), "wood", "#8f704e");
  }
  return parts;
}
