// Night sky behind the home hero („Mond, Nebel“ of the owner's moon block): one WebGL fragment
// shader paints the sky colour, the moon (disc, core, glow), its aureole, a wide glow high up,
// a slow veil of mist and a fine grain against banding. Stars come from starfield.ts, not from
// here. The caller's ticker calls render(); the shader itself runs at most 30 fps and within a
// pixel budget. Returns null without WebGL (the CSS moon in mountain-scene.tsx stands in).

const VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

const FRAGMENT = `
precision highp float;
uniform vec2 uR, uC;
uniform float uT, uMoonR;
uniform vec3 uSky;
// Hash without sine (Dave Hoskins): sin() on large arguments loses precision on many GPUs and
// shows up as blocky, grid-aligned patches in the mist.
float h21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);
  float a=h21(i),b=h21(i+vec2(1.,0.)),c=h21(i+vec2(0.,1.)),d=h21(i+vec2(1.,1.));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
// Each octave rotated, so the value-noise grid never lines up into visible edges.
const mat2 ROT=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn(p);p=ROT*p+vec2(11.3,7.7);a*=.5;}return s;}
void main(){
  vec2 px=gl_FragCoord.xy, uv=px/uR; float ct=1.-uv.y, t=uT, asp=uR.x/uR.y;
  // The moon drifts a few pixels on slow, unrelated sines.
  vec2 c=uC+vec2(sin(t*.07)*uMoonR*.13+sin(t*.019)*uMoonR*.22, sin(t*.045+1.3)*uMoonR*.09+sin(t*.013+.6)*uMoonR*.16);
  float r=max(uMoonR*.62,1.), d=length(px-c), q=d/r;
  vec3 sky=uSky;
  // Aureole around the moon, in the site's sapphire.
  vec2 ae=(px-c)/vec2(uR.x*.23,uR.y*.23); float aur=exp(-dot(ae,ae)*1.6);
  sky+=vec3(.14,.24,.52)*aur*.2;
  // Wide glow high in the sky.
  vec2 be=(px-vec2(uR.x*.5,uR.y*.85))/vec2(uR.x*.55,uR.y*.28);
  sky+=vec3(.08,.15,.34)*exp(-dot(be,be)*1.4)*.16;
  // Veil of mist, drifting slowly through the middle of the sky; soft-edged.
  if(uv.y>.3){float veil=fbm(vec2(uv.x*asp*2.2+t*.006,ct*4.4-t*.002));
    veil=smoothstep(.48,.9,veil)*smoothstep(.66,.22,ct)*smoothstep(-.02,.2,ct);
    sky+=vec3(.045,.075,.16)*veil;}
  // Moonlight: a soft halo close around the disc.
  sky+=vec3(.55,.66,.9)*(exp(-max(q-1.,0.)*1.35)*.34+exp(-max(q-1.,0.)*.28)*.05);
  // The moon: cool white disc, darker toward the limb, faint maria, an anti-aliased edge.
  if(q<1.2){
    vec2 m=(px-c)/r;
    float limb=sqrt(max(0.,1.-dot(m,m)));
    float maria=smoothstep(.45,.75,fbm(m*2.3+vec2(3.1,1.7)));
    vec3 moon=vec3(.9,.93,.99)*(.72+.28*limb)*(1.-maria*.14);
    float edge=1.-smoothstep(1.-1.5/r,1.,q);
    sky=mix(sky,moon,edge);
  }
  // Fine grain (±0.3%) keeps the gradients free of banding.
  gl_FragColor=vec4(clamp(sky+(h21(px*.7+floor(t*8.))-.5)*.006,0.,1.),1.);
}`;

/** Pixels the shader may fill per frame; larger screens render at a lower scale. */
const PIXEL_BUDGET = 2.2e6;

export type Moon = { x: number; y: number; r: number };

export function bindNightSky(
  canvas: HTMLCanvasElement,
  { sky, moon }: { sky: [number, number, number]; moon: () => Moon },
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
  gl.uniform3f(u("uSky"), ...sky);

  let scale = 1;
  let height = 0;
  let lastFrame = -1;

  function place() {
    const m = moon();
    // WebGL's y axis starts at the bottom.
    gl!.uniform2f(uC, m.x * scale, (height - m.y) * scale);
    gl!.uniform1f(uMoonR, m.r * scale);
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
