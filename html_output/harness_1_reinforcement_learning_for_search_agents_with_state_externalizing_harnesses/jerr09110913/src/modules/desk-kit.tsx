import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',wood:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',line:'#d7deea'};
type Draw=(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;
type SceneProps=Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>,'width'|'height'> & {draw:Draw;width?:number;height?:number;animate?:boolean;label:string};
export function Scene({draw,width=1080,height=280,animate=false,label,style,...rest}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null), drawRef=useRef(draw), paint=useRef<()=>void>(()=>{}); drawRef.current=draw;
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';let raf=0,visible=false; const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const render=()=>{ctx.clearRect(0,0,width,height);drawRef.current(ctx,width,height,reduced?1.4:performance.now()/1000);canvas.classList.add('is-ready');};paint.current=render;
  const frame=()=>{render();if(visible&&animate&&!reduced)raf=requestAnimationFrame(frame);};
  const stop=()=>{visible=false;cancelAnimationFrame(raf);};const start=()=>{if(visible)return;visible=true;frame();};
  render();const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();paint.current=()=>{};};
 },[width,height,animate]);
 useEffect(()=>{paint.current();},[draw]);
 return <canvas {...rest} ref={ref} role="img" aria-label={label} style={{width:'100%',height:'auto',touchAction:rest.onPointerDown?'none':'auto',...style}}/>;
}
export function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.line,width=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
export function drawDesk(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.fillStyle='#ecefdf';ctx.fillRect(0,h-25,w,25);line(ctx,0,h-25,w,h-25,C.light,2);}
export function paper(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.blue,selected=false){
 ctx.save();ctx.fillStyle='#dfe4d4';ctx.beginPath();ctx.roundRect(x+3,y+5,w,h,5);ctx.fill();ctx.fillStyle='#fffef8';ctx.strokeStyle=selected?color:C.light;ctx.lineWidth=selected?3:1.5;ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fill();ctx.stroke();
 ctx.fillStyle=selected?color:'#d9e1d0';ctx.fillRect(x+Math.min(12,w*.16),y+11,Math.max(6,w*.5),3);
 if(h>45){for(let i=0;i<Math.min(5,Math.floor((h-30)/13));i++)line(ctx,x+w*.15,y+29+i*13,x+w*.82,y+29+i*13,C.line,2);}
 ctx.beginPath();ctx.moveTo(x+w-15,y);ctx.lineTo(x+w-15,y+14);ctx.lineTo(x+w,y+14);ctx.fillStyle='#edf0e4';ctx.fill();
 if(selected){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+w-14,y-2);ctx.lineTo(x+w-4,y-2);ctx.lineTo(x+w-4,y+24);ctx.lineTo(x+w-9,y+19);ctx.lineTo(x+w-14,y+24);ctx.closePath();ctx.fill();}ctx.restore();
}
export function folder(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string=C.blue){ctx.save();ctx.fillStyle='#dce5d0';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y+14,w,h-14,8);ctx.fill();ctx.stroke();ctx.beginPath();ctx.roundRect(x+6,y,w*.35,24,6);ctx.fill();ctx.stroke();ctx.fillStyle='#edf1e5';ctx.beginPath();ctx.roundRect(x+5,y+24,w-10,h-29,6);ctx.fill();ctx.restore();}
export function pen(ctx:CanvasRenderingContext2D,x:number,y:number,angle=-.45,color:string=C.wood){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.fillRect(-5,-55,10,53);ctx.fillStyle='#dfc49c';ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(5,-2);ctx.lineTo(0,10);ctx.closePath();ctx.fill();ctx.fillStyle=C.ink;ctx.beginPath();ctx.moveTo(-2,6);ctx.lineTo(2,6);ctx.lineTo(0,11);ctx.closePath();ctx.fill();ctx.restore();}
export function tick(ctx:CanvasRenderingContext2D,x:number,y:number,color:string=C.green,size=20){line(ctx,x-size*.4,y,x-size*.1,y+size*.3,color,3);line(ctx,x-size*.1,y+size*.3,x+size*.5,y-size*.4,color,3);}
export function magnifier(ctx:CanvasRenderingContext2D,x:number,y:number,r=25){ctx.save();ctx.fillStyle='#ffffffb0';ctx.strokeStyle=C.blue;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();line(ctx,x+r*.7,y+r*.7,x+r*1.5,y+r*1.5,C.wood,8);ctx.restore();}
export function Controls({children}:React.PropsWithChildren){return <div className="chip-row" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}} style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,margin:'16px 0'}}>{children}</div>;}
type ButtonProps=React.ButtonHTMLAttributes<HTMLButtonElement> & {active?:boolean};
export function Choice({active=false,children,style,...props}:ButtonProps){return <button {...props} type="button" className={'chip'+(active?' selected':'')} aria-pressed={active} style={{maxWidth:'100%',whiteSpace:'normal',opacity:props.disabled ? 0.45 : 1,...style}}>{children}</button>;}
export function Action({children,style,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>){return <button {...props} type="button" className="chip" style={{background:props.disabled?'#f0f2ee':C.blue,color:props.disabled?C.muted:'#fff',maxWidth:'100%',whiteSpace:'normal',...style}}>{children}</button>;}
export function Feedback({tone='neutral',children}:React.PropsWithChildren<{tone?:'good'|'bad'|'neutral'|'warn'}>){return <div role="status" aria-live="polite" className={'feedback'+(tone==='good'?' good':tone==='bad'?' bad':'')} style={{minHeight:66,overflowWrap:'anywhere',...(tone==='warn'?{color:C.wood,borderLeftColor:C.orange,background:'#fff3e9'}:{})}}>{children}</div>;}
export function Metrics({items}:{items:{label:string;value:React.ReactNode;tone?:string}[]}){return <div style={{display:'flex',flexWrap:'wrap',gap:'12px 28px',margin:'14px 0',fontVariantNumeric:'tabular-nums'}}>{items.map(x=><div key={x.label} style={{minWidth:120,flex:'1 1 120px'}}><div style={{color:C.muted,fontSize:'0.88em'}}>{x.label}</div><strong style={{display:'block',fontSize:'1.3em',color:x.tone==='bad'?C.red:x.tone==='good'?C.green:C.blue}}>{x.value}</strong></div>)}</div>;}
export function DeskKit(){return null;}
