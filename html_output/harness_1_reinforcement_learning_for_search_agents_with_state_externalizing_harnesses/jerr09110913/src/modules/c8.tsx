import {C56Formula} from "./c56-formula";
import {c78FormulaSupport as formulaSupport} from "../data/tutorial";
import {useState} from 'react';
import {c78Ui} from '../data/tutorial';
import {c78Data as d,c78SourceSnapshots,c78Q5Evidence,c78PaperRoot} from '../data/tutorial';
import {useC78Motion} from './c78-motion';
import './c78.css';
export const sourceSnapshots=c78SourceSnapshots;
export const q5Evidence=c78Q5Evidence;
type Action='old'|'actor'|'date'|'dateonly'|'unknown'|'submit';
type Practice={view:Action|null;read:string[];selected:string[];submitted:boolean};
export const emptyPractice:Practice={view:null,read:[],selected:[],submitted:false};
export function executePractice(p:Practice,a:Action):Practice{return {...p,view:a,read:a==='actor'||a==='date'?Array.from(new Set([...p.read,a])):p.read,submitted:a==='submit'};}
export function selectEvidence(p:Practice,key:string):Practice{if(!p.read.includes(key))return p;return {...p,submitted:false,selected:p.selected.includes(key)?p.selected.filter(x=>x!==key):[...p.selected,key]};}
export function practiceSupport(p:Practice){return {identity:p.read.includes('actor')&&p.selected.includes('actor'),date:p.read.includes('date')&&p.selected.includes('date')};}
export function C8(){
 const [index,setIndex]=useState(0),[selectedDoc,setSelectedDoc]=useState<string|null>(null),m=useC78Motion(1400),s=sourceSnapshots[index];
 const phase=m.progress<.12/1.4?0:m.progress<.36/1.4?1:m.progress<.62/1.4?2:m.progress<.90/1.4?3:m.progress<1.18/1.4?4:5;
 const choose=(i:number,animate:boolean)=>{setIndex(i);setSelectedDoc(null);if(animate)m.start();else m.finish()};
 const actor=index>=2&&(index>2||phase>=3),date=index>=4&&(index>4||phase>=3);
 return <div className="c78 c8" ref={m.ref} onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation()}}><p>{d.qIntro}</p><p>{c78Ui["c8.Text3"]}</p>
 <div className="c78-timeline" aria-label="7个公开阶段">{sourceSnapshots.map((v,i)=><button key={v.title} aria-pressed={index===i} onClick={()=>choose(i,false)}>{v.title}<br/>原轮次 {v.turn}</button>)}</div>
 <div className="c78-controls"><button id="c8-prev" disabled={index===0||m.running} onClick={()=>choose(index-1,false)}>上一公开节点</button><button id="c8-next" className="primary-action" disabled={index===6||m.running} onClick={()=>choose(index+1,true)}>下一公开节点</button>{m.running&&<><button onClick={m.pause}>{m.paused?'继续':'暂停'}</button><button onClick={m.finish}>直接查看结果</button></>}<button id="c8-reset" onClick={()=>choose(0,false)}>重置</button></div>
 <p className="c78-stage" aria-live="polite">公开阶段 {index+1}/7 · 原轮次 {s.turn} · {['选中节点','已有观察','本轮动作','工具返回','公开状态差异','本节点已展示'][phase]}</p><div className="c78-track"><span style={{width:m.progress*100+'%'}}/></div>
 <div className="c78-grid c78-four"><section className={'c78-cell '+(phase===1?'active':'')}><strong>已有观察 · sₜ中的已知信息</strong><p>{d.qObservation[index]}</p></section><section className={'c78-cell '+(phase===2?'active':'')}><strong>本轮动作 · aₜ</strong><p>{d.qActions[index]}</p><p className="c78-muted">部分阶段合并多轮，按公开描述重述，未公开参数不补造。</p></section><section className={'c78-cell '+(phase===3?'active':'')}><strong>工具返回 · oₜ₊₁</strong><p>{phase>=3?d.qReturns[index]:'执行后揭示该阶段已公开返回。'}</p></section><section className={'c78-cell '+(phase===4?'active':'')}><strong>状态差异 · sₜ → sₜ₊₁</strong><p>{phase>=4?d.qDiffs[index]:'观察与动作已定位；等待展示公开状态差异。'}</p></section></div>
 <div className={'c78-relation '+(actor?'supported':'')}>人物 → 角色 → 游戏：{actor?'演员原文已出现，连接Drew Gehling → Gord → Bully。':'尚未展示演员原文，不提前认定支持。'}</div><div className={'c78-relation '+(date?'supported':'')}>游戏 → 平台 → 日期：{date?'发行商列表节选已出现，连接Bully → PS2 → 2006年10月17日。':'尚未展示对应平台的发行依据。'}</div>
 <p className="c78-feedback">{phase===5?s.text:'当前正在揭示该公开阶段；状态变化以原文披露为限。'}</p>
 <section className="c78-evidence"><h4>对应原文：{s.title} · 原轮次{s.turn}</h4><p>{s.text}</p><p><a href={c78PaperRoot+s.anchor} target="_blank" rel="noreferrer">在原文中定位当前片段</a> · <a href={c78PaperRoot+'A17.T12'} target="_blank" rel="noreferrer">Q.5轨迹概览</a></p>
 {s.c.length>0?<><h4>该节点公开的精选快照</h4><div className="c78-controls" role="group" aria-label="公开精选文档">{s.c.map(v=><button aria-pressed={selectedDoc===v} onClick={()=>setSelectedDoc(v)} key={v}>{v}</button>)}</div><p className="c78-feedback">{selectedDoc?`当前核对：${selectedDoc}。这是本节点原文披露的精选记录；没有公开的正文或前序增删不作推断。`:'选择一份记录，在这里核对它的公开ID与重要性。'}</p></>:<p>此节点未公布完整精选快照，保留未知。</p>}
 <h4>机制解读：动作改变状态，再构建下一次观察</h4><C56Formula text={formulaSupport.stateText} symbols={{"sₜ":formulaSupport.state["sₜ"]+d.qObservation[index], "aₜ":formulaSupport.state["aₜ"]+d.qActions[index], "sₜ₊₁":formulaSupport.state["sₜ₊₁"]+d.qDiffs[index], "oₜ₊₁":formulaSupport.state["oₜ₊₁"]+d.qReturns[index]}}/><p>{c78Ui["c8.Text4"]}</p><p>当前动作：{d.qActions[index]}。该阶段可确认的状态变化：{d.qDiffs[index]}</p><p><a href={c78PaperRoot+'alg1'} target="_blank" rel="noreferrer">Algorithm 1：策略与框架的交互循环</a> · <a href={c78PaperRoot+'A17.SS5'} target="_blank" rel="noreferrer">附录Q.5：原始案例</a></p><p className="c78-muted">{d.qBoundary}</p><details><summary>核对原文中的ID写法差异</summary><p>{c78Ui["c8.Text5"]}</p><p>{c78Ui["c8.Text6"]}</p><p>{c78Ui["c8.Text7"]}</p></details></section></div>
}
