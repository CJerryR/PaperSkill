import { useState } from 'react';
import type { PointerEvent } from 'react';
import type { WidgetProps } from './registry';
import { Scene, C, paper, folder, tick, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';

type Tag = 'low' | 'fair' | 'high' | 'very_high';
type Doc = { id: number; tag: Tag; curated: boolean };
type Tone = 'good' | 'bad' | 'neutral' | 'warn';
type Drag = { id: number; x: number; y: number; startX: number; startY: number; moved: boolean };
const tags: Tag[] = ['low', 'fair', 'high', 'very_high'];
const labels: Record<Tag, string> = { low: '低（low）', fair: '一般（fair）', high: '高（high）', very_high: '很高（very_high）' };
const rank: Record<Tag, number> = { low: 0, fair: 1, high: 2, very_high: 3 };
const color = (tag: Tag) => tag === 'low' ? C.muted : tag === 'fair' ? C.blue : tag === 'high' ? C.green : C.purple;
const initialStatus = '资料夹还空着。第一次成功搜索会提供可编辑的起点。';

export function M3_1(_props: WidgetProps) {
  const [preset, setPreset] = useState<'seed' | 'full'>('seed');
  const [seeded, setSeeded] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedId, setSelectedId] = useState(1);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [tone, setTone] = useState<Tone>('neutral');
  const curated = docs.filter(doc => doc.curated);
  const selected = docs.find(doc => doc.id === selectedId);
  const editable = !!selected && (preset === 'seed' || selectedId === 31);
  const say = (text: string, nextTone: Tone = 'neutral') => { setStatus(text); setTone(nextTone); };
  const reset = () => { setPreset('seed'); setSeeded(false); setDocs([]); setSelectedId(1); setDrag(null); say(initialStatus); };
  const firstSearch = () => {
    if (seeded) return;
    setSeeded(true); setDocs(Array.from({ length: 10 }, (_, i) => ({ id: i + 1, tag: 'fair', curated: i < 8 })));
    setSelectedId(1); setDrag(null); say('首次成功搜索找到 10 条候选，其中前 8 条暂存为 fair。它们还不是经过判断的正确答案。');
  };
  const fullPreset = () => {
    setPreset('full'); setSeeded(true); setSelectedId(31); setDrag(null);
    setDocs(Array.from({ length: 31 }, (_, i) => ({ id: i + 1, tag: i === 29 ? 'low' : i === 30 ? 'fair' : 'high', curated: i < 30 })));
    say('满额示例：30 号是唯一 low；新候选 31 号为 fair。可直接加入，或先把 31 号改为 low，试试同级会不会替换。');
  };
  const updateTag = (tag: Tag) => {
    if (!selected || !editable) return;
    setDocs(value => value.map(doc => doc.id === selectedId ? { ...doc, tag } : doc));
    say(`${selectedId} 号的重要性已改为 ${labels[tag]}，${selected.curated ? '仍留在原来的筛选集中' : '仍在候选池，尚未加入筛选集'}。${tag === 'very_high' ? '提示规范建议先核验再晋升；这里没有虚构工具层硬性门禁。' : ''}`, tag === 'very_high' ? 'warn' : 'neutral');
  };
  const move = (id: number, keep: boolean) => {
    const doc = docs.find(value => value.id === id);
    if (!doc) return;
    if (preset === 'full' && id !== 31) { say('满额演示固定原来的 30 条资料，只编辑新候选 31 号，以便始终明确比较唯一最低项。回到首次搜索场景可自由编辑。', 'warn'); return; }
    if (!keep) {
      if (!doc.curated) { say(`${id} 号已在未保留区，全文和候选记录仍存在。`); return; }
      setDocs(value => value.map(item => item.id === id ? { ...item, curated: false } : item));
      say(`已从筛选集移除 ${id} 号；候选池记录没有被删除。`, 'neutral'); return;
    }
    if (doc.curated) { say(`${id} 号已经保留，不会重复占用一个位置。`); return; }
    if (curated.length < 30) {
      setDocs(value => value.map(item => item.id === id ? { ...item, curated: true } : item));
      say(`已保留 ${id} 号，重要性为 ${labels[doc.tag]}；当前 ${curated.length + 1} / 30 条。${doc.tag === 'very_high' ? '很高标签仍不是正确性保证，应先核验主张。' : ''}`, 'good'); return;
    }
    // The full preset deliberately keeps a single worst item; tied-best policy is not invented here.
    const worst = curated.reduce((a, b) => rank[a.tag] < rank[b.tag] ? a : b);
    if (rank[doc.tag] <= rank[worst.tag]) {
      say(`已满 30 条；${id} 号为 ${labels[doc.tag]}，没有严格高于唯一最低的 ${worst.id} 号（${labels[worst.tag]}），因此保留原集合。`, 'bad'); return;
    }
    setDocs(value => value.map(item => item.id === worst.id ? { ...item, curated: false } : item.id === id ? { ...item, curated: true } : item));
    say(`先移除唯一最低的 ${worst.id} 号，再加入更重要的 ${id} 号。容量仍为 30 / 30；被移出的原文仍在候选池。`, 'good');
  };
  const cards = () => {
    const left = (preset === 'seed' ? docs : docs.filter(doc => !doc.curated)).map((doc, i) => ({ doc, x: preset === 'seed' ? 48 + (i % 5) * 94 : 118 + i * 140, y: preset === 'seed' ? 82 + Math.floor(i / 5) * 116 : 113, w: 78, h: 96 }));
    const right = curated.map((doc, i) => ({ doc, x: 610 + (i % 6) * 64, y: 73 + Math.floor(i / 6) * 46, w: 44, h: 39 }));
    return [...left, ...right];
  };
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1080, (event.clientX - rect.left) / rect.width * 1080)), y: Math.max(0, Math.min(340, (event.clientY - rect.top) / rect.height * 340)) };
  };
  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = point(event);
    const hit = cards().slice().reverse().find(card => p.x >= card.x && p.x <= card.x + card.w && p.y >= card.y && p.y <= card.y + card.h);
    if (!hit) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(hit.doc.id); setDrag({ id: hit.doc.id, x: p.x, y: p.y, startX: p.x, startY: p.y, moved: false });
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const p = point(event);
    setDrag({ ...drag, ...p, moved: drag.moved || Math.hypot(p.x - drag.startX, p.y - drag.startY) > 8 });
  };
  const pointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const p = point(event);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      if (p.x >= 580 && p.x <= 1040 && p.y >= 45 && p.y <= 320) move(drag.id, true);
      else if (p.x <= 500 && p.y >= 45 && p.y <= 320) move(drag.id, false);
      else say('没有落入目标区域，资料状态保持原样。可拖到右侧保留、拖回左侧移除。', 'warn');
    } else say(`已选中 ${drag.id} 号。用下方按钮编辑，或按住资料页拖动。`);
    setDrag(null);
  };
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    drawDesk(ctx, w, h);
    ctx.fillStyle = C.ink; ctx.font = '600 22px sans-serif'; ctx.fillText('候选池 P', 52, 36); ctx.fillText('筛选集 C', 622, 36);
    folder(ctx, 588, 67, 450, 249, C.light);
    ctx.setLineDash([6, 5]); ctx.strokeStyle = drag?.moved ? C.orange : C.line; ctx.lineWidth = drag?.moved ? 3 : 2;
    ctx.strokeRect(30, 52, 477, 266); ctx.strokeRect(580, 51, 466, 272); ctx.setLineDash([]);
    for (const card of cards()) {
      paper(ctx, card.x, card.y, card.w, card.h, color(card.doc.tag), card.doc.id === selectedId);
      ctx.fillStyle = C.ink; ctx.font = `600 ${card.w < 50 ? 16 : 23}px sans-serif`;
      ctx.fillText(String(card.doc.id), card.x + (card.w < 50 ? 10 : 25), card.y + (card.w < 50 ? 26 : 34));
      if (card.doc.curated && card.w > 50) tick(ctx, card.x + 56, card.y + 76, C.green, 14);
    }
    if (drag?.moved) {
      const doc = docs.find(item => item.id === drag.id)!;
      ctx.save(); ctx.globalAlpha = .85;
      const x = Math.max(2, Math.min(1002, drag.x - 39)); const y = Math.max(2, Math.min(242, drag.y - 48));
      paper(ctx, x, y, 78, 96, C.orange, true);
      ctx.fillStyle = C.ink; ctx.font = '600 23px sans-serif'; ctx.fillText(String(doc.id), x + 25, y + 34); ctx.restore();
    }
  };
  return <div>
    <Scene draw={draw} height={340} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => setDrag(null)} style={{ touchAction: 'none' }} label="拖动编号资料页：放到右侧筛选集以保留，放回左侧以移除。下方选项与按钮支持相同操作。" />
    <Controls>
      <Action onClick={firstSearch} disabled={seeded}>首次成功搜索</Action>
      <Action onClick={fullPreset}>{preset === 'full' ? '重建满额场景' : '试试满额场景'}</Action>
      <Action onClick={reset}>重置全部</Action>
    </Controls>
    <Metrics items={[{ label: '候选池 P', value: `${docs.length} 条` }, { label: '筛选集 C', value: `${curated.length} / 30 条`, tone: curated.length === 30 ? 'warn' : undefined }, { label: '首次自动播种', value: seeded && preset === 'seed' ? '已种入 8 条 fair' : preset === 'full' ? '固定满额示例' : '尚未触发' }]} />
    {docs.length > 0 && <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
      <Controls><label>选中资料 <select aria-label="选中资料编号" value={selectedId} onChange={event => { setSelectedId(Number(event.target.value)); setDrag(null); }}>{docs.map(doc => <option key={doc.id} value={doc.id}>{doc.id} 号 · {doc.curated ? '已保留' : '未保留'} · {labels[doc.tag]}</option>)}</select></label></Controls>
      <Controls>{tags.map(tag => <Choice key={tag} active={selected?.tag === tag} disabled={!editable} onClick={() => updateTag(tag)}>{labels[tag]}</Choice>)}</Controls>
      <Controls><Action disabled={!editable || !!selected?.curated} onClick={() => move(selectedId, true)}>保留选中资料</Action><Action disabled={!editable || !selected?.curated} onClick={() => move(selectedId, false)}>设为未保留</Action></Controls>
      <p>当前 {selectedId} 号：{selected?.curated ? '在筛选集 C 中' : '只在候选池 P 中'}，重要性为 {selected ? labels[selected.tag] : ''}。{preset === 'full' ? '满额场景固定原有资料，只编辑 31 号，避免假定论文未规定的并列淘汰规则；重置后可自由编辑首次搜索的资料。' : '点击等级只修改标签；点击保留或拖入资料夹才会加入。'}</p>
    </div>}
    <Feedback tone={tone}>{status}</Feedback>
    <p>教学示例，重要性不代表真值。真实机制：首次成功 search / fan_out 最多种入 8 条 fair；容量上限 30，满额时只接受严格更重要的新文档。依据：第 2.1 节、算法 3、附录 K。</p>
  </div>;
}
