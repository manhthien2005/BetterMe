export const vertexShader=`
varying vec3 waterWorld;
varying vec4 waterClip;
varying vec2 waterUv;
void main(){
 waterUv=uv;
 waterWorld=(modelMatrix*vec4(position,1.0)).xyz;
 waterClip=projectionMatrix*viewMatrix*vec4(waterWorld,1.0);
 gl_Position=waterClip;
}`;

const common=`
uniform sampler2D sceneColor;
uniform sampler2D sceneDepth;
uniform sampler2D reflectionColor;
uniform mat4 inverseProjection;
uniform mat4 cameraProjection;
uniform mat4 cameraWorld;
uniform mat4 captureView;
uniform mat4 reflectionMatrix;
uniform vec3 towardCamera;
uniform vec3 towardSun;
uniform float streamAmount;
uniform float poolLanding;
uniform float studyTime;
uniform float studyDaylight;
varying vec3 waterWorld;
varying vec4 waterClip;
varying vec2 waterUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
}
vec3 worldAt(vec2 uv){
 float depth=texture2D(sceneDepth,uv).r;
 vec4 p=inverseProjection*vec4(uv*2.0-1.0,depth*2.0-1.0,1.0);
 return (cameraWorld*vec4(p.xyz/p.w,1.0)).xyz;
}
// Captures are staggered: project into the camera that produced the texture.
vec2 screenAt(vec3 p){
 vec4 clip=cameraProjection*captureView*vec4(p,1.0);
 return clip.xy/clip.w*.5+.5;
}
`;

export const surfaceShader=common+`
vec2 rippleSlope(vec2 p){
 // Analytic derivatives keep the ripples smooth without noisy finite differences.
 vec2 d0=normalize(vec2(.8,.6)),d1=normalize(vec2(-.4,1.0));
 vec2 slope=d0*cos(dot(p,d0)*3.2-studyTime*.8)*.045
           +d1*cos(dot(p,d1)*5.1-studyTime*.57)*.028;
 float flow=p.y-studyTime*.8;
 slope+=vec2(.16,1.0)*cos(flow*8.0+p.x*1.3)*(.008+streamAmount*.018);
 return slope;
}
void main(){
 vec2 uv=screenAt(waterWorld);
 vec3 viewDirection=cameraProjection[2][3]==-1.0?normalize(cameraPosition-waterWorld):towardCamera;
 vec2 p=waterWorld.xz;
 vec2 slope=rippleSlope(p);
 vec3 normal=normalize(vec3(-slope.x,1.0,-slope.y));
 vec3 bedPoint=worldAt(uv);
 float depth=clamp(waterWorld.y-bedPoint.y,0.0,3.0);
 float contact=smoothstep(.005,.14,depth);
 // Refraction offsets are projected from world space, so they follow camera rotation/zoom.
 vec2 refracted=clamp(screenAt(waterWorld+vec3(normal.x,0.0,normal.z)*min(depth,1.2)*.6),.001,.999);
 // Do not pull foreground grass or bank pixels into the underwater image.
 if(worldAt(refracted).y>waterWorld.y-.025)refracted=uv;
 vec3 bed=texture2D(sceneColor,refracted).rgb;
 float distanceInWater=min(4.0,depth/max(abs(viewDirection.y),.18));
 vec3 absorption=exp(-vec3(1.12,.38,.27)*distanceInWater);
 vec3 water=bed*absorption+vec3(.018,.085,.075)*(1.0-absorption)*studyDaylight;
 // A broad, low-contrast bed modulation avoids a glitter texture on the surface.
 float caustic=pow(max(0.0,sin(p.x*4.7+p.y*2.1-studyTime*.5)*sin(p.y*4.0-p.x*1.4+studyTime*.36)),5.0);
 water+=bed*caustic*.06*exp(-distanceInWater)*contact;
 vec4 projected=reflectionMatrix*vec4(waterWorld,1.0);
 vec4 bent=reflectionMatrix*vec4(waterWorld+vec3(normal.x,0.0,normal.z)*.7,1.0);
 vec2 reflectedUv=clamp(mix(projected.xy/projected.w,bent.xy/bent.w,contact),.002,.998);
 vec3 reflection=texture2D(reflectionColor,reflectedUv).rgb;
 float facing=clamp(abs(dot(normal,viewDirection)),0.0,1.0);
 float fresnel=.0204+.9796*pow(1.0-facing,5.0);
 water=mix(water,reflection,fresnel*contact);
 vec3 halfLight=normalize(towardSun+viewDirection);
 float gloss=pow(max(0.0,dot(normal,halfLight)),180.0);
 water+=mix(vec3(.53,.69,1.0),vec3(1.0,.89,.66),studyDaylight)*gloss*.7*contact*studyDaylight;
 gl_FragColor=vec4(water,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export const fallShader=common+`
void main(){
 vec2 uv=screenAt(waterWorld);
 float t=1.0-waterUv.y;
 // A gravity travel coordinate makes features descend faster toward the tail.
 float travel=sqrt(.08+t)-sqrt(.08);
 float flow=travel*15.0-studyTime*2.6;
 float bend=(noise(vec2(t*3.2-studyTime*.2,8.7))-.5)*1.8*smoothstep(.1,.9,t);
 float sheets=noise(vec2(waterUv.x*8.0+bend,flow));
 float threads=noise(vec2(waterUv.x*34.0+bend*2.0,flow*1.4+5.1));
 float strands=sheets*.65+threads*.35;
 float fiber=smoothstep(.40,.75,strands);
 float aeration=smoothstep(.48,.78,noise(vec2(waterUv.x*15.0+bend,flow*2.3)))
                *smoothstep(.22,.72,t);
 float edgeWidth=.055+.055*t;
 float irregular=(sheets-.5)*.075*t;
 float edge=smoothstep(0.0,edgeWidth,waterUv.x+irregular)*smoothstep(0.0,edgeWidth,1.0-waterUv.x-irregular);
 float breakup=mix(1.0,smoothstep(.23,.51,sheets+.13*threads),smoothstep(.48,.93,t));
 float fade=mix((1.0-smoothstep(.77,1.0,t+(threads-.4)*.07))*breakup,1.0,poolLanding);
 vec3 behind=texture2D(sceneColor,clamp(uv+vec2((strands-.5)*.0018,0.0),.001,.999)).rgb;
 vec3 silver=mix(vec3(.16,.32,.34),vec3(.71,.85,.86),fiber*.67+aeration*.33)*studyDaylight;
 float opacity=mix(.73,.48,smoothstep(.02,.28,t))+.21*fiber+.11*aeration;
 gl_FragColor=vec4(mix(behind,silver,.47+.30*fiber+.16*aeration),edge*fade*opacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
