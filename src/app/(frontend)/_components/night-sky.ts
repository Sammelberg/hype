// Night sky behind the home hero („Mond, Nebel“ of the owner's moon block): one WebGL fragment
// shader paints the sky colour, the moon (disc, core, glow), its aureole, a wide glow high up,
// two layers of night clouds with silver linings, lit from within by a hidden wandering light,
// trailing strands, mist in the valleys (new on every load, drifting on the wind) and a fine grain against banding. Stars come from starfield.ts, not from
// here. The caller's ticker calls render(); the shader itself runs at most 30 fps and within a
// pixel budget. Returns null without WebGL (the CSS moon in mountain-scene.tsx stands in).

const VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

const FRAGMENT = `
precision highp float;
uniform vec2 uR, uC;
uniform float uT, uMoonR, uMoonOn, uCradleOn;
uniform vec2 uCradle, uCradleS;
uniform vec3 uSky;
uniform vec2 uSeed;
// Hash without sine (Dave Hoskins): sin() on large arguments loses precision on many GPUs and
// shows up as blocky, grid-aligned patches in the mist.
float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);
  float a=h21(i),b=h21(i+vec2(1.,0.)),c=h21(i+vec2(0.,1.)),d=h21(i+vec2(1.,1.));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
// Each octave rotated, so the value-noise grid never lines up into visible edges.
const mat2 ROT=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p=ROT*p+vec2(11.3,7.7);a*=.5;}return s;}
float fbm3(vec2 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*vn(p);p=ROT*p+vec2(11.3,7.7);a*=.5;}return s;}
// A cloud field that lives like one: a slowly drifting warp reshapes the body, and each finer
// octave drifts a little faster than the one below, so edges fray and re-form instead of the
// whole shape sliding or pulsing.
float cloud(vec2 p,float t){
  vec2 w=vec2(fbm3(p*.45+vec2(t*.018,0.)),fbm3(p*.45+vec2(5.2,t*.014)));
  p+=(w-.5)*1.2;
  float s=0.,a=.5;
  for(int i=0;i<5;i++){s+=a*vn(p+vec2(.01,.003)*t*float(i));p=ROT*p+vec2(11.3,7.7);a*=.5;}
  return s;}
void main(){
  vec2 px=gl_FragCoord.xy, uv=px/uR; float ct=1.-uv.y, t=uT, asp=uR.x/uR.y;
  // The moon drifts a few pixels on slow, unrelated sines.
  vec2 c=uC+vec2(sin(t*.07)*uMoonR*.13+sin(t*.019)*uMoonR*.22, sin(t*.045+1.3)*uMoonR*.09+sin(t*.013+.6)*uMoonR*.16);
  float r=max(uMoonR*.62,1.), d=length(px-c), q=d/r;
  vec3 sky=uSky;
  // One slow breath (~12 s) for the moon's aureole.
  float breath=.5+.5*sin(t*.52);
  // Aureole around the moon, in the site's sapphire.
  vec2 ae=(px-c)/vec2(uR.x*.23,uR.y*.23); float aur=exp(-dot(ae,ae)*1.6);
  sky+=vec3(.14,.24,.52)*aur*(.18+.04*breath)*uMoonOn;
  // Wide glow high in the sky.
  vec2 be=(px-vec2(uR.x*.5,uR.y*.85))/vec2(uR.x*.55,uR.y*.28);
  sky+=vec3(.08,.15,.34)*exp(-dot(be,be)*1.4)*.21;
  // A hidden light wanders behind the clouds, very slowly (minutes per crossing): no source is
  // ever seen, only the clouds glowing from within where it passes and a faint sheen around it.
  vec2 lp=vec2(uR.x*(.7+.18*sin(t*.011+uSeed.x)),uR.y*(.8+.06*sin(t*.017+uSeed.y)));
  vec2 le=(px-lp)/vec2(uR.x*.26,uR.y*.22); float hidden=exp(-dot(le,le));
  sky+=vec3(.03,.05,.11)*hidden*.35;
  // The triangle motif is never left in an empty sky, without it showing: over a wide, soft area
  // around it the clouds lean a little thicker and a faint veil drifts through, so it simply
  // seems to happen to stand in mist, never the same.
  vec2 ne=(px-uCradle)/(uCradleS*vec2(2.6,2.4)); float near=exp(-dot(ne,ne)*.8)*uCradleOn;
  // Night clouds in two layers on one wind (a new sky on every load, uSeed): a far bank, large,
  // faint and slow, and a nearer one with finer, brighter billows. Coverage varies across the sky
  // so banks open into gaps; tops catch the glow from above, undersides stay dim, and every edge
  // carries a thin silver lining. Fine strands trail from the banks. The clouds gather on the
  // right: the left half carries the headline, so the sky there stays light and open.
  if(uv.y>.22){
    float right=smoothstep(.22,.78,uv.x);
    float band=smoothstep(.74,.22,ct)*smoothstep(-.02,.18,ct)*mix(.25,1.,right);
    band=mix(band,1.,near*.6);
    vec2 pf=vec2(uv.x*asp*1.1,ct*2.6)+uSeed.yx-vec2(t*.006,0.);
    float df=smoothstep(.58-.08*smoothstep(.22,.78,uv.x)-.05*near,.86,cloud(pf,t*.7));
    vec2 pn=vec2(uv.x*asp*1.6,ct*4.)+uSeed-vec2(t*.014,0.);
    float fn=cloud(pn,t);
    float cover=.54-.12*right-.09*near+.24*(vn(pn*.22+vec2(3.1,t*.004))-.5);
    float dn=smoothstep(cover,cover+.2,fn);
    float lit=clamp(.5+(fn-cloud(pn-vec2(0.,.18),t))*2.4,0.,1.);
    sky+=vec3(.028,.048,.105)*df*band*.6;
    sky+=mix(vec3(.022,.036,.084),vec3(.08,.115,.22),lit)*dn*band;
    // Glow from within, where the hidden light stands behind a bank.
    sky+=vec3(.07,.11,.22)*hidden*(dn*.9+df*.45)*band;
    // Silver lining: brightest on the lit edges, stronger near the hidden light.
    float rim=dn*(1.-dn)*4.*lit;
    sky+=vec3(.1,.14,.25)*rim*rim*band*(.5+1.6*hidden);
    // Strands: a thin ridge of stretched noise, trailing on the same wind.
    vec2 pw=vec2(uv.x*asp*.7,ct*9.)+uSeed*1.3-vec2(t*.02,0.);
    float w=fbm(pw+vec2(fbm3(pw*.6+vec2(0.,t*.02))*.8,0.));
    float strand=smoothstep(.56,.66,w)*smoothstep(.76,.66,w);
    sky+=vec3(.026,.042,.09)*strand*band*(.35+df+hidden);}
  if(uCradleOn>.5){
    vec2 pv=(px-uCradle)/uR.y*5.+uSeed*.7+vec2(-t*.03,t*.008);
    float v=fbm(pv+vec2(fbm3(pv*.6+vec2(t*.02,0.))*.9,0.));
    sky+=vec3(.036,.058,.12)*near*(.08+.45*smoothstep(.4,.85,v));}
  // Mist in the valleys: a low veil behind the ridges, slowly rising and drifting.
  if(uv.y<.46){
    vec2 pm=vec2(uv.x*asp*1.3-t*.01,uv.y*6.-t*.012)+uSeed;
    float mist=smoothstep(.42,.82,fbm(pm+vec2(fbm3(pm*.5+t*.01)*.9,0.)));
    mist*=smoothstep(.08,.22,uv.y)*smoothstep(.46,.26,uv.y)*mix(.45,1.,smoothstep(.2,.75,uv.x));
    sky+=vec3(.04,.065,.13)*mist*(.8+.4*hidden);}
  // Moonlight: a bright silver halo close around the disc and a wide, faint sheen.
  sky+=vec3(.74,.8,.92)*(exp(-max(q-1.,0.)*1.2)*.5+exp(-max(q-1.,0.)*.26)*.08)*uMoonOn;
  // The moon: bright silver-white disc, a touch darker toward the limb, faint maria, an
  // anti-aliased edge.
  if(uMoonOn>.5&&q<1.2){
    vec2 m=(px-c)/r;
    float limb=sqrt(max(0.,1.-dot(m,m)));
    float maria=smoothstep(.45,.75,fbm(m*2.3+vec2(3.1,1.7)));
    vec3 moon=vec3(.97,.98,1.)*(.86+.14*limb)*(1.-maria*.08);
    float edge=1.-smoothstep(1.-1.5/r,1.,q);
    sky=mix(sky,moon,edge);
  }
  // Fine grain (±0.3%) keeps the gradients free of banding.
  gl_FragColor=vec4(clamp(sky+(h21(px*.7+floor(t*8.))-.5)*.006,0.,1.),1.);
}`;

/** Pixels the shader may fill per frame; larger screens render at a lower scale. */
const PIXEL_BUDGET = 2.2e6;

export type Moon = { x: number; y: number; r: number };
/** Box the sky keeps misty behind (the triangle motif), CSS px relative to the canvas. */
export type Cradle = { x: number; y: number; w: number; h: number } | null;

export function bindNightSky(
  canvas: HTMLCanvasElement,
  {
    sky,
    moon,
    showMoon = true,
    cradle = () => null,
  }: {
    sky: [number, number, number];
    moon: () => Moon;
    showMoon?: boolean;
    cradle?: () => Cradle;
  },
) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const shader = (type: number, source: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = shader(gl.VERTEX_SHADER, VERTEX);
  const fs = shader(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uR = u("uR");
  const uC = u("uC");
  const uT = u("uT");
  const uMoonR = u("uMoonR");
  const uCradle = u("uCradle");
  const uCradleS = u("uCradleS");
  const uCradleOn = u("uCradleOn");
  gl.uniform3f(u("uSky"), ...sky);
  // Without the moon the shader paints only sky, glow and mist.
  gl.uniform1f(u("uMoonOn"), showMoon ? 1 : 0);
  // A fresh mist pattern on every page load.
  gl.uniform2f(u("uSeed"), Math.random() * 97, Math.random() * 61);

  let scale = 1;
  let height = 0;
  let lastFrame = -1;
  let placed = -1;

  function place() {
    const m = moon();
    // WebGL's y axis starts at the bottom.
    gl!.uniform2f(uC, m.x * scale, (height - m.y) * scale);
    gl!.uniform1f(uMoonR, m.r * scale);
    const c = cradle();
    gl!.uniform1f(uCradleOn, c ? 1 : 0);
    if (c) {
      gl!.uniform2f(uCradle, (c.x + c.w / 2) * scale, (height - c.y - c.h / 2) * scale);
      gl!.uniform2f(uCradleS, Math.max(c.w / 2, 40) * scale, Math.max(c.h / 2, 30) * scale);
    }
    placed = lastFrame;
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    height = h;
    const base = Math.min(window.devicePixelRatio || 1, 1.25);
    scale = Math.max(0.7, base * Math.min(1, Math.sqrt(PIXEL_BUDGET / (w * h * base * base))));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(uR, canvas.width, canvas.height);
    place();
    lastFrame = -1;
  }

  /** Draws the sky at time t (seconds); skips frames closer than 1/30 s unless forced. */
  function render(t: number, force = false) {
    if (!force && lastFrame >= 0 && t - lastFrame < 1 / 30) return;
    lastFrame = t;
    // Layout can shift after load (fonts, the motif's own sizing): re-read placement now and then.
    if (t - placed > 1) place();
    gl!.uniform1f(uT, t);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  const observer = new ResizeObserver(() => {
    resize();
    render(lastFrame < 0 ? 0 : lastFrame, true);
  });
  observer.observe(canvas);
  resize();

  return { render, place, destroy: () => observer.disconnect() };
}
