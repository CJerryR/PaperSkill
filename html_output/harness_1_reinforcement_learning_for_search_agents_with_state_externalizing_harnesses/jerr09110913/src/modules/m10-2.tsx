import React,{useState} from 'react';
import {Scene,C,drawDesk,line,Controls,Choice,Feedback,Metrics} from './desk-kit';
export const ablations=[{name:'完整系统',r:.584,fa:.667,dr:0,df:0},{name:'无重要性',r:.560,fa:.614,dr:-4.1,df:-7.9},{name:'无压缩',r:.585,fa:.620,dr:.2,df:-7.0},{name:'无播种',r:.582,fa:.624,dr:-.3,df:-6.4},{name:'隐藏证据图',r:.569,fa:.631,dr:-2.6,df:-5.4},{name:'停用核验',r:.566,fa:.641,dr:-3.1,df:-3.9},{name:'停用回看',r:.598,fa:.641,dr:2.4,df:-3.9},{name:'无内容去重',r:.611,fa:.678,dr:4.6,df:1.6},{name:'全部关闭',r:.513,fa:.624,dr:-12.2,df:-6.4}];
const signed=(n:number)=>`${n>0?'+':''}${n.toFixed(1)}`;
export function M10_2(){const[selected,setSelected]=useState(0),a=ablations[selected],base=ablations[0];return <>
<Scene height={250} label="同一检查点关闭机制前后的两种召回" draw={(ctx,w,h)=>{drawDesk(ctx,w,h);[[base.r,a.r],[base.fa,a.fa]].forEach(([b,v],i)=>{const y=42+i*91;ctx.font='23px sans-serif';ctx.fillStyle=C.ink;ctx.fillText(i===0?'最终召回':'答案召回',25,y+26);ctx.fillStyle=C.light;ctx.fillRect(174,y,780*b,18);ctx.fillStyle=v>=b?C.green:C.red;ctx.fillRect(174,y+27,780*v,18);line(ctx,174+780*b,y-4,174+780*b,y+49,C.blue,2);ctx.fillStyle=C.ink;ctx.fillText(b.toFixed(3),895,y+17);ctx.fillText(v.toFixed(3),895,y+44);});}}/>
<Controls>{ablations.map((x,i)=><Choice key={x.name} active={i===selected} onClick={()=>setSelected(i)}>{x.name}</Choice>)}</Controls>
<Metrics items={[{label:'最终召回',value:a.r.toFixed(3),tone:a.r>=base.r?'good':'bad'},{label:'答案文档召回',value:a.fa.toFixed(3),tone:a.fa>=base.fa?'good':'bad'},{label:'最终召回相对变化',value:`${signed(a.dr)}%`},{label:'答案召回相对变化',value:`${signed(a.df)}%`}]}/>
<Feedback tone={selected===0?'neutral':selected===7?'good':selected===8?'bad':'warn'}>{selected===0?'完整配置作为基线。浅色条和竖线标记原值，第二条随所选消融变化。':selected===7?'关闭内容去重后，两种召回名义上都上升。近重复gold文档ID可能被恢复，同时也会增加交付文本的冗余。':selected===8?'所有机制关闭后，最终召回降至0.513；策略仍会搜索，却更难把遇到的证据组织成筛选集。':'停用该机制后，答案文档召回下降；部分配置的一般召回仍可能小幅上升。'} 这是同一训练检查点的推理时干预，没有重新训练。</Feedback>
<div style={{marginTop:14,color:C.muted}}>论文第8页表3：100条配对BrowseComp+测试查询；相对变化沿用原表。当前最终召回差值为{signed((a.r-base.r)*100)}个百分点，答案召回差值为{signed((a.fa-base.fa)*100)}个百分点。</div>
</>}
