import { useState, type PointerEvent, type KeyboardEvent } from 'react';
import type { WidgetProps } from './registry';
import { Scene, C, paper, folder, tick, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';

type Drag = { id: number; x: number; y: number; startX: number; startY: number; moved: boolean };
const dragThreshold = 6; // CSS pixels: consistent for mouse and touch at every canvas width.
const docs = [1, 2, 3, 4, 5];
const descriptions = ['答案页', '答案页', '辅助证据', '辅助证据', '无关资料'];
const guard = (event: KeyboardEvent<HTMLElement>) => {
  if (event.key.startsWith('Arrow')) event.stopPropagation();
};
const sourceRect = (id: number) => ({ x: 48 + (id - 1) * 101, y: 96, w: 77, h: 106 });
const retainedRect = (index: number) => ({ x: 645 + (index % 3) * 113, y: 57 + Math.floor(index / 3) * 105, w: 77, h: 87 });

export function M4_1(_props: WidgetProps) {
  const [curated, setCurated] = useState<number[]>([1, 3]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [changed, setChanged] = useState(false);
  const relevant = curated.filter(id => id <= 4).length;
  const answer = curated.filter(id => id <= 2).length;
  const precision = curated.length ? relevant / curated.length : 0;
  const choose = (id: number, include?: boolean) => {
    setCurated(previous => {
      const retain = include ?? !previous.includes(id);
      return retain ? [...new Set([...previous, id])].sort((a, b) => a - b) : previous.filter(item => item !== id);
    });
    setChanged(true);
  };
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1080, (event.clientX - box.left) * 1080 / box.width)), y: Math.max(0, Math.min(280, (event.clientY - box.top) * 280 / box.height)) };
  };
  const startDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    const position = point(event);
    const hit = (r: { x: number; y: number; w: number; h: number }) => position.x >= r.x && position.x <= r.x + r.w && position.y >= r.y && position.y <= r.y + r.h;
    const id = curated.find((_, index) => hit(retainedRect(index))) ?? docs.find(item => hit(sourceRect(item)));
    if (id === undefined) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id, ...position, startX: event.clientX, startY: event.clientY, moved: false });
  };
  const endDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const position = point(event);
    const moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= dragThreshold;
    if (moved) choose(drag.id, position.x >= 585 && position.x <= 1040 && position.y >= 28 && position.y <= 268);
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  let message = '最终召回 2/4，答案文档召回 1/2；轨迹已经见过全部相关资料。';
  let tone: 'neutral' | 'good' | 'bad' | 'warn' = 'neutral';
  if (changed) {
    if (!answer) { message = '资料曾经出现，但最终筛选集没有留下答案页。轨迹召回仍是 4/4，答案文档召回已降到 0/2。'; tone = 'bad'; }
    else if (answer === 2) { message = `两张答案页都已保留，答案文档召回为 2/2；全部相关证据仍要单独检查，目前保留 ${relevant}/4。`; tone = 'good'; }
    else { message = `已留下 ${relevant}/4 张相关资料，但只有 1/2 张答案页。发现资料和最终选择是两件事。`; }
    if (curated.includes(5)) { message += ` 资料 5 不增加召回，当前精确率为 ${(precision * 100).toFixed(0)}%。`; if (tone !== 'bad') tone = 'warn'; }
  }
  return <div onKeyDown={guard}>
    <Scene label="教学示例：把文档拖入右侧资料夹保留，或拖出移除；下方按钮提供相同操作。" height={280}
      onPointerDown={startDrag}
      onPointerMove={(event: PointerEvent<HTMLCanvasElement>) => {
        if (!drag) return;
        const moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= dragThreshold;
        setDrag({ ...drag, ...point(event), moved });
      }}
      onPointerUp={endDrag}
      onPointerCancel={() => setDrag(null)}
      style={{ touchAction: 'none', cursor: drag?.moved ? 'grabbing' : 'grab' }}
      draw={(ctx, width, height) => {
        drawDesk(ctx, width, height);
        folder(ctx, 585, 28, 455, 235, C.light);
        if (drag?.moved) { ctx.strokeStyle = drag.x >= 585 ? C.green : C.orange; ctx.lineWidth = 3; ctx.setLineDash([9, 5]); ctx.strokeRect(590, 35, 443, 220); ctx.setLineDash([]); }
        ctx.font = '600 18px system-ui'; ctx.fillStyle = C.ink;
        ctx.fillText('候选池', 48, 60); ctx.fillText('筛选集', 602, 53);
        const renderPage = (id: number, rect: { x: number; y: number; w: number; h: number }, selected: boolean) => {
          paper(ctx, rect.x, rect.y, rect.w, rect.h, C.blue, selected);
          const marks = id <= 2 ? 2 : id <= 4 ? 1 : 0;
          for (let mark = 0; mark < marks; mark++) { ctx.fillStyle = id <= 2 ? C.blue : C.dark; ctx.fillRect(rect.x + 12 + mark * 14, rect.y, 8, 22); }
          ctx.fillStyle = C.ink; ctx.font = '600 21px system-ui'; ctx.fillText(String(id), rect.x + 32, rect.y + 55);
          if (selected) tick(ctx, rect.x + 54, rect.y + rect.h - 17, C.green, 10);
        };
        docs.forEach(id => renderPage(id, sourceRect(id), curated.includes(id)));
        curated.forEach((id, index) => renderPage(id, retainedRect(index), true));
        if (drag?.moved) { ctx.save(); ctx.globalAlpha = 0.86; renderPage(drag.id, { x: Math.max(0, Math.min(1003, drag.x - 38)), y: Math.max(0, Math.min(174, drag.y - 53)), w: 77, h: 106 }, true); ctx.restore(); }
      }} />
    <p style={{ margin: '12px 0' }}>双书签：答案页 1、2；单书签：辅助证据 3、4；无书签：无关资料 5。拖入右侧资料夹保留，拖出移除。</p>
    <Controls>{docs.map(id => <Choice key={id} active={curated.includes(id)} onClick={() => choose(id)}>{curated.includes(id) ? '移除' : '保留'}资料 {id} · {descriptions[id - 1]}</Choice>)}</Controls>
    <Controls><Action onClick={() => { setCurated([]); setDrag(null); setChanged(true); }}>清空筛选集</Action><Action onClick={() => { setCurated([1, 3]); setDrag(null); setChanged(false); }}>恢复初始</Action></Controls>
    <Metrics items={[
      { label: '最终召回', value: `${(relevant / 4 * 100).toFixed(0)}% · ${relevant}/4` },
      { label: '轨迹召回', value: '100% · 4/4' },
      { label: '答案文档召回', value: `${(answer / 2 * 100).toFixed(0)}% · ${answer}/2` },
    ]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10, margin: '12px 0' }}>
      <p style={{ margin: 0 }}>参考集合：R = {'{1, 2, 3, 4}'}<br />答案文档：A = {'{1, 2}'}</p>
      <p style={{ margin: 0 }}>轨迹文档：P = {'{1, 2, 3, 4, 5}'}<br />筛选集：C = {'{' + curated.join(', ') + '}'}</p>
    </div>
    <Feedback tone={tone}>{message}</Feedback>
    <p style={{ marginBottom: 0 }}>教学示例的参考集合固定且非空。FA Recall 可以高于或低于最终 Recall；两项都不等于回答正确率。精确率另为 {relevant}/{curated.length || 0}（空集合按 0 显示）。</p>
  </div>;
}
