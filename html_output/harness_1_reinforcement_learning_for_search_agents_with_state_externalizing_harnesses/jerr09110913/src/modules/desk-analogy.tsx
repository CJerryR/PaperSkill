import React from 'react';
import type {WidgetProps} from './registry';
import {Scene,C,drawDesk,paper,folder,pen,line,tick,magnifier} from './desk-kit';
export function AnalogyVisual({chapter=1,variant}:{chapter?:number;variant?:'old'|'new'}){
 return <Scene width={560} height={140} animate label={variant==='old'?'翻找堆叠资料':variant==='new'?'资料夹保留书签':`第${chapter}章的书桌类比`} draw={(ctx,w,h,t)=>{
  drawDesk(ctx,w,h);const q=(t%3.2)/3.2, wave=Math.sin(q*Math.PI*2), progress=.5-.5*Math.cos(q*Math.PI*2); const color=variant==='old'?C.red:C.green;
  if(variant){if(variant==='old'){paper(ctx,215,28,120,78,C.light);paper(ctx,221,23,120,78,C.light);}else folder(ctx,200,24,160,83,C.blue);paper(ctx,230+wave*16,17,100,76,color,true); if(variant==='old'){ctx.fillStyle='#e0e6d5';ctx.fillRect(309,12,34,progress*52);}else tick(ctx,380,72,C.green,20);return;}
  switch(chapter){
   case 1:paper(ctx,208,34,120,67,C.light);paper(ctx,218,26,120,67,C.light);paper(ctx,230+wave*45,14,95,76,C.blue,true);break;
   case 2:{const pw=60+progress*115;paper(ctx,280-pw/2,18,pw,83,C.blue,true);line(ctx,280,24,280,94,C.line,1);break;}
   case 3:paper(ctx,220,26,135,74,C.light);ctx.save();ctx.translate(296,22-wave*10);ctx.strokeStyle=C.blue;ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(-7,-11,15,36,6);ctx.stroke();ctx.restore();break;
   case 4:paper(ctx,210,17,150,90,C.light);ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(280,65,38,23,0,0,progress*Math.PI*2);ctx.stroke();pen(ctx,280+38*Math.cos(progress*Math.PI*2),65+23*Math.sin(progress*Math.PI*2),-.5);break;
   case 5:paper(ctx,210,21,150,83,C.light);magnifier(ctx,274+wave*25,57,25);break;
   case 6:paper(ctx,160,24,90,77,C.light);paper(ctx,318,24,90,77,C.light);line(ctx,235,63,235+progress*104,63,C.blue,3);pen(ctx,235+progress*104,53,-.5);break;
   case 7:paper(ctx,200,22,165,86,C.light);ctx.setLineDash([3,5]);line(ctx,228,64,330,64,C.light,2);ctx.setLineDash([]);line(ctx,228,64,228+102*progress,64,C.blue,3);pen(ctx,228+102*progress,54,-.5);break;
   case 8:folder(ctx,207,19,150,89,C.blue);paper(ctx,213,22,12+130*Math.abs(Math.cos(q*Math.PI)),79,C.blue,true);break;
   case 9:paper(ctx,209,20,150,88,C.light);ctx.fillStyle='#f07e4780';ctx.fillRect(229,56,100*progress,12);pen(ctx,229+100*progress,57,-.7,C.orange);break;
   case 10:folder(ctx,200,24,160,85,C.blue);ctx.fillStyle=C.dark;ctx.beginPath();ctx.roundRect(200,24,25+progress*135,85,6);ctx.fill();tick(ctx,391,67,C.green,26);break;
  }
 }}/>
}
export function DeskAnalogy({chapterId}:WidgetProps){return <AnalogyVisual chapter={Number(chapterId.split('-')[1])||1}/>;}
