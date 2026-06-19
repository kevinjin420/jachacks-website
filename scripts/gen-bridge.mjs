// Generates a perspective Golden Gate Bridge wireframe (Marin-headlands view)
// in JacHacks colors -> public/ggb-wireframe.svg
import { writeFileSync } from 'node:fs';

const W = 1600, H = 900;
const OR = '249,115,22';   // jac orange
const CY = '0,212,255';    // jac cyan
const el = [];
const o = (a) => `rgba(${OR},${a})`;
const c = (a) => `rgba(${CY},${a})`;
const line = (x1,y1,x2,y2,stroke,sw=1.4) =>
  el.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}"/>`);
const poly = (pts,stroke,sw=1.4,fill='none') =>
  el.push(`<polyline points="${pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);

// ---- TOWERS -------------------------------------------------------------
// near (foreground) tower
const NT = { cx:645, topY:62, baseY:772, topHalf:17, baseHalf:58 };
// far tower
const FT = { cx:1322, topY:372, baseY:486, topHalf:9, baseHalf:20 };
const half = (T,y) => T.topHalf + (T.baseHalf-T.topHalf)*((y-T.topY)/(T.baseY-T.topY));
const lX = (T,y) => T.cx - half(T,y);
const rX = (T,y) => T.cx + half(T,y);

function tower(T, stroke, sw, beams, opening){
  // legs
  line(lX(T,T.baseY),T.baseY,lX(T,T.topY),T.topY,stroke,sw);
  line(rX(T,T.baseY),T.baseY,rX(T,T.topY),T.topY,stroke,sw);
  // cap
  line(lX(T,T.topY),T.topY,rX(T,T.topY),T.topY,stroke,sw);
  line(T.cx-T.topHalf*0.5,T.topY-6,T.cx+T.topHalf*0.5,T.topY-6,stroke,sw);
  // horizontal portal struts
  for(const y of beams){
    line(lX(T,y),y,rX(T,y),y,stroke,sw);
    line(lX(T,y+8),y+8,rX(T,y+8),y+8,stroke,sw*0.7);
  }
  // X cross-braces in lower openings (the iconic portals)
  if(opening){
    for(let i=0;i<beams.length-1;i++){
      const y0=beams[i]+8, y1=beams[i+1];
      if(y0 < opening) continue;
      line(lX(T,y0),y0,rX(T,y1),y1,stroke,sw*0.6);
      line(rX(T,y0),y0,lX(T,y1),y1,stroke,sw*0.6);
    }
  }
}

// ---- MAIN CABLES (quadratic beziers) -----------------------------------
const qpt = (P0,C,P2,t) => [
  (1-t)*(1-t)*P0[0] + 2*(1-t)*t*C[0] + t*t*P2[0],
  (1-t)*(1-t)*P0[1] + 2*(1-t)*t*C[1] + t*t*P2[1],
];
const qcurve = (P0,C,P2,stroke,sw) => {
  const pts=[]; for(let i=0;i<=60;i++) pts.push(qpt(P0,C,P2,i/60)); poly(pts,stroke,sw);
};
const nearTop=[NT.cx-2,NT.topY+10];
const farTop=[FT.cx,FT.topY+2];
// right span: near tower -> far tower (sags below the straight line)
const RS={P0:nearTop, C:[982,356], P2:farTop};
// left span: near tower -> left anchorage (off frame)
const LS={P0:nearTop, C:[330,250], P2:[36,332]};
// far span continues past far tower toward right anchorage
const FS={P0:farTop, C:[1470,392], P2:[1600,470]};

// ---- DECK (perspective roadway) ----------------------------------------
const deckTopY = (x) => 660 + (470-660)*((x-NT.cx)/(FT.cx-NT.cx)); // near tower -> far tower
// near approach (toward Marin headland, lower-left)
poly([[NT.cx,676],[470,742],[300,792],[0,820]], o(.5), 1.6);     // road near edge
poly([[NT.cx,660],[470,724],[300,772],[0,798]], o(.4), 1.2);     // road far edge
// main span deck edges (near tower -> far tower -> right edge)
poly([[NT.cx,662],[FT.cx,470],[1600,452]], o(.55), 1.6);         // top (far) edge
poly([[NT.cx,690],[FT.cx,486],[1600,470]], o(.45), 1.3);         // bottom (near) edge
// under-deck stiffening truss (verticals + zigzag), main span
{
  const x0=NT.cx+30, x1=1600, n=46;
  let up=true;
  for(let i=0;i<=n;i++){
    const x=x0+(x1-x0)*i/n;
    const ty=662+(452-662)*((x-NT.cx)/(1600-NT.cx));
    const by=ty+ (28*(1-(x-NT.cx)/(1600-NT.cx))+6); // truss depth shrinks with distance
    line(x,ty,x,by,o(.22),0.8);
    if(i<n){
      const x2=x0+(x1-x0)*(i+1)/n;
      const ty2=662+(452-662)*((x2-NT.cx)/(1600-NT.cx));
      const by2=ty2+(28*(1-(x2-NT.cx)/(1600-NT.cx))+6);
      line(up?x:x, up?by:ty, up?x2:x2, up?ty2:by2, o(.18),0.7);
      up=!up;
    }
  }
}

// ---- SUSPENDERS (right span: cable -> deck) -----------------------------
for(let i=2;i<=58;i+=2){
  const t=i/60;
  const p=qpt(RS.P0,RS.C,RS.P2,t);
  if(p[0] < NT.cx+18) continue;
  const dy=deckTopY(p[0]);
  if(p[1] >= dy-6) continue;
  line(p[0],p[1],p[0],dy,o(.24),0.8);
}
// left span suspenders (down to near approach road)
for(let i=6;i<=54;i+=6){
  const t=i/60;
  const p=qpt(LS.P0,LS.C,LS.P2,t);
  const dy=676 + (820-676)*((NT.cx-p[0])/(NT.cx-0));
  if(p[1] >= dy-8) continue;
  line(p[0],p[1],p[0],dy,o(.2),0.8);
}

// ---- draw towers + cables (order: far first for depth) ------------------
tower(FT, o(.34), 1.1, [402,438], 0);
qcurve(FS.P0,FS.C,FS.P2, o(.3), 1.2);
qcurve(RS.P0,RS.C,RS.P2, o(.6), 1.8);
qcurve(LS.P0,LS.C,LS.P2, o(.5), 1.6);
tower(NT, o(.66), 2, [120,210,315,440,575,700], 300);

// ---- CITY SKYLINE (distant, mid-left) ----------------------------------
const sky=[[180,18,14],[206,12,26],[226,16,20],[250,20,40],[278,14,30],[300,22,52],
  [330,16,38],[352,26,72],[360,8,96],[392,18,46],[418,20,30],[446,16,22],[468,12,16]];
const baseY=434;
for(const [x,w,h] of sky){
  line(x,baseY,x,baseY-h,c(.3),1);
  line(x+w,baseY,x+w,baseY-h,c(.3),1);
  line(x,baseY-h,x+w,baseY-h,c(.3),1);
}
line(150,baseY,486,baseY,c(.22),1); // ground line under skyline

// ---- HEADLAND CLIFF (foreground bottom-left) ---------------------------
poly([[0,560],[70,584],[120,628],[150,612],[196,684],[236,742],[270,792],[300,900]], o(.4),1.6);
line(70,584,150,720,o(.2),1);
line(150,612,236,742,o(.2),1);
line(196,684,120,900,o(.2),1);

// ---- WATER hint --------------------------------------------------------
line(486,434,1600,440,c(.12),1);
for(const yy of [560,640,720]){
  el.push(`<path d="M ${950} ${yy} Q ${1180} ${yy-8} ${1420} ${yy}" fill="none" stroke="${c(.08)}" stroke-width="1"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke-linecap="round" stroke-linejoin="round">
${el.join('\n')}
</svg>\n`;
writeFileSync(new URL('../public/ggb-wireframe.svg', import.meta.url), svg);
console.log('wrote public/ggb-wireframe.svg with', el.length, 'elements');
