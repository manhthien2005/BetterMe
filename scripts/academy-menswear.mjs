// Khoa's tailored menswear has its own silhouette; no robe/skirt pattern is reused.
export function addAcademyMenswear({ part, mat, rigid, blend, torsoWeights, joint, mix, smooth }) {
  const coat=part("Academy_Robe"), lining=part("Academy_Lining");
  const rows=[[1.312,.065,.067,.50],[1.28,.138,.09,.58],[1.24,.180,.114,.72],
    [1.14,.174,.127,.78],[1.02,.166,.127,.82],[.92,.177,.132,.90],
    [.81,.187,.139,.94],[.68,.198,.146,.98]];
  const panel=(v,u,inset=0)=>{
    const t=v*(rows.length-1), i=Math.min(rows.length-2,Math.floor(t));
    const [y,rx,rz,gap]=rows[i].map((n,c)=>mix(n,rows[i+1][c],t-i));
    const a=mix(gap,Math.PI*2-gap,u), x=Math.sin(a)*(rx-inset);
    const side=x>=0?"left":"right", follow=smooth((.94-y)/.3)*.3;
    return {p:[x,y,Math.cos(a)*(rz-inset)-.014],w:y>.94?torsoWeights(y):blend("hips",`${side}UpperLeg`,follow),tone:.9+.055*Math.cos(a*3)};
  };
  coat.surface(mat.robe,32,64,(v,u)=>panel(v,u),true);
  lining.surface(mat.lining,32,64,(v,u)=>panel(v,u,.003));
  // Shoulder yoke closes the saddle between the neck opening and the sleeve tubes.
  const shoulderYoke=(v,u,inset=0)=>{
    const a=mix(.52,Math.PI*2-.52,u),x=Math.sin(a)*mix(.055,.175,v);
    const y=mix(1.33,1.275,v)+Math.sin(v*Math.PI)*.022-inset;
    const z=Math.cos(a)*mix(.060,.114,v)-.014;
    return {p:[x,y,z],w:blend("upperChest",`${x>=0?"left":"right"}UpperArm`,smooth((Math.abs(x)-.085)/.10)),tone:.94};
  };
  coat.surface(mat.robe,12,48,(v,u)=>shoulderYoke(v,u),true);
  lining.surface(mat.lining,12,48,(v,u)=>shoulderYoke(v,u,.002));
  for(const sign of [1,-1]) {
    const sleeve=(v,u,inset=0)=>{
      const x=sign*mix(.105,.529,v), a=u*Math.PI*2;
      const radius=mix(.065,.039,v)+.005*Math.sin(v*Math.PI)-inset;
      const shoulder=smooth((Math.abs(x)-.105)/.10), elbow=smooth((Math.abs(x)-.285)/.10);
      return {p:[x,1.274+Math.cos(a)*radius,-.025+Math.sin(a)*radius],
        w:[[joint("upperChest"),1-shoulder],[joint(`${sign===1?"left":"right"}UpperArm`),shoulder*(1-elbow)],[joint(`${sign===1?"left":"right"}LowerArm`),shoulder*elbow]],tone:.91+.06*Math.cos(a)};
    };
    coat.surface(mat.robe,20,28,(v,u)=>sleeve(v,u),sign===-1);
    lining.surface(mat.lining,20,28,(v,u)=>sleeve(v,u,.003),sign===1);
    coat.surface(mat.shirt,2,28,(v,u)=>sleeve(.97+v*.03,u,-.0005),sign===-1);
    // Notched lapels sit on the chest rather than forming a flared collar.
    const lapel=[[.046,1.304,.051],[.117,1.269,.083],[.091,1.235,.111],[.121,1.211,.108],[.068,1.085,.132]];
    const points=lapel.map(([x,y,z])=>[x*sign,y,z]);
    coat.polygon(mat.robe,sign===1?[...points].reverse():points,torsoWeights);
    const pocket=[[.097,1.025,.112],[.156,1.031,.073],[.155,1.018,.074],[.097,1.013,.114]].map(([x,y,z])=>[x*sign,y,z]);
    coat.polygon(mat.robe,sign===1?[...pocket].reverse():pocket,torsoWeights);
  }
  coat.finish();lining.finish();
  const uniform=part("Academy_Uniform");
  uniform.surface(mat.shirt,16,48,(v,u)=>{
    const y=mix(1.313,.955,v),a=u*Math.PI*2,shoulder=smooth((1.313-y)/.07);
    return {p:[Math.sin(a)*mix(.052,.148,shoulder),y,Math.cos(a)*mix(.057,.108,shoulder)-.012],w:torsoWeights(y)};
  },true);
  uniform.surface(mat.vest,24,64,(v,u)=>{
    const a=u*Math.PI*2, neckline=Math.max(0,1-Math.abs(Math.sin(a))/.52)*Math.max(0,Math.cos(a));
    const top=1.286-.112*neckline,y=mix(top,.932,v);
    return {p:[Math.sin(a)*mix(.148,.158,smooth((y-1.02)/.20)),y,Math.cos(a)*.121-.009],w:torsoWeights(y),tone:.9+.07*Math.cos(a)};
  },true);
  for(const sign of [1,-1]){
    const p=[[.008,1.303,.054],[.043,1.302,.055],[.035,1.260,.107],[.012,1.282,.095]].map(([x,y,z])=>[sign*x,y,z]);
    uniform.polygon(mat.shirt,sign===1?[...p].reverse():p,rigid("upperChest"));
  }
  uniform.polygon(mat.tie,[[-.013,1.285,.101],[.013,1.285,.101],[.008,1.259,.116],[-.008,1.259,.116]].reverse(),rigid("upperChest"));
  uniform.polygon(mat.tie,[[-.008,1.260,.117],[.008,1.260,.117],[.014,1.125,.125],[0,1.106,.125],[-.014,1.125,.125]].reverse(),torsoWeights);
  for(const y of [1.14,1.093,1.046,.999,.952])uniform.surface(mat.silver,1,12,(v,u)=>({p:[Math.cos(u*Math.PI*2)*v*.003,y+Math.sin(u*Math.PI*2)*v*.003,.114],w:torsoWeights(y)}),true);
  uniform.finish();
  const details=part("Academy_RoleDetails");
  for(const sign of [1,-1]){
    const side=sign===1?"left":"right";
    const trouserRows=[[.95,.083,.091],[.84,.076,.085],[.69,.063,.069],[.5,.054,.059],[.32,.052,.054],[.113,.048,.050]];
    details.surface(mat.vest,30,40,(v,u)=>{
      const t=v*(trouserRows.length-1),i=Math.min(trouserRows.length-2,Math.floor(t));
      const [y,rx,rz]=trouserRows[i].map((n,c)=>mix(n,trouserRows[i+1][c],t-i));
      const a=u*Math.PI*2;
      return {p:[sign*.077156+Math.sin(a)*rx,y,-.025+Math.cos(a)*rz],w:blend(`${side}UpperLeg`,`${side}LowerLeg`,smooth((.57-y)/.18)),tone:.88+.08*Math.cos(a*2)};
    },true);
    // Straight trouser legs finish in plain leather ankle shoes.
    details.surface(mat.boots,8,32,(v,u)=>{
      const a=u*Math.PI*2,y=mix(.115,.064,v);
      return {p:[sign*.077156+Math.sin(a)*mix(.038,.041,v),y,-.027+Math.cos(a)*.043],w:blend(`${side}LowerLeg`,`${side}Foot`,smooth(v))};
    },true);
  }
  const pin=[[.111,1.231,.111],[.129,1.225,.098],[.126,1.204,.101],[.110,1.211,.113]];
  details.polygon(mat.silver,[...pin].reverse(),rigid("upperChest"));
  details.polygon(mat.shirt,[[.114,1.225,.114],[.123,1.222,.108],[.122,1.213,.109],[.113,1.216,.115]].reverse(),rigid("upperChest"));
  details.finish();
  const glasses=part("Academy_Glasses");
  for(const sign of [1,-1]){
    glasses.surface(mat.boots,8,64,(v,u)=>{
      const a=u*Math.PI*2,b=v*Math.PI*2;
      const sx=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.55), sy=Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.65);
      return {p:[sign*.037+sx*(.028+Math.cos(b)*.0014),1.445+sy*(.017+Math.cos(b)*.0014),.085+Math.sin(b)*.0014],w:rigid("head")};
    },true);
    glasses.polygon(mat.boots,[[sign*.064,1.448,.085],[sign*.098,1.452,.005],[sign*.098,1.455,.005],[sign*.064,1.451,.085]],rigid("head"));
  }
  glasses.polygon(mat.boots,[[-.010,1.448,.085],[.010,1.448,.085],[.010,1.451,.085],[-.010,1.451,.085]],rigid("head"));
  glasses.finish();
}
