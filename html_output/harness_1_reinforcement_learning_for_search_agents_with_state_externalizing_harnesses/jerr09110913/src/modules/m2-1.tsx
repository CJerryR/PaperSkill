import { useState } from 'react';
import type { PointerEvent } from 'react';
import type { WidgetProps } from './registry';
import { Scene, C, paper, folder, line, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';

type View = 'summary' | 'full' | 'review';
const fullText = ['D02：青岚实验室于 2021 年在临川成立。', '实验室在 2023 年启动水文档案数字化项目，首批处理了河流观测记录。', '项目负责人是陈禾；这段资料没有说明项目是否获得国际认证。'];
const summaries = [
  ['P · 候选池', '已见 D01、D02、D03'], ['C · 筛选集', '暂留 D02'], ['I · 重要性', 'D02 = high（高）'], ['G · 证据图', '青岚实验室 ↔ D02'], ['V · 核验记录', '暂无已核验主张'], ['H · 搜索历史', '“青岚 实验室 档案”'], ['B · 预算', '示例已用 1 轮']
];
export function M2_1(_props: WidgetProps) {
  const [selected, setSelected] = useState<View>('summary');
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    drawDesk(ctx, w, h);
    const isSummary = selected === 'summary';
    folder(ctx, 664, 81, 323, 159, C.light);
    paper(ctx, isSummary ? 68 : 96, isSummary ? 48 : 80, isSummary ? 328 : 270, isSummary ? 184 : 145, C.orange, isSummary);
    paper(ctx, selected === 'full' ? 692 : 714, selected === 'full' ? 43 : 64, selected === 'full' ? 255 : 217, selected === 'full' ? 193 : 163, C.blue, selected !== 'summary');
    ctx.fillStyle = C.ink; ctx.font = '600 23px sans-serif';
    ctx.fillText('提示摘要', 139, 123); ctx.fillText('外部全文', 761, 123);
    if (selected === 'review') {
      line(ctx, 678, 165, 410, 165, C.green, 5);
      line(ctx, 410, 165, 428, 153, C.green, 5);
      line(ctx, 410, 165, 428, 177, C.green, 5);
      paper(ctx, 246, 150, 166, 101, C.green, true);
    }
    ctx.fillStyle = selected === 'review' ? C.green : C.blue;
    ctx.beginPath(); ctx.arc(535, 166, 33, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(535, 166, 15, .7, 5.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(548, 150); ctx.lineTo(553, 162); ctx.lineTo(540, 159); ctx.stroke();
  };
  const clickScene = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 1080;
    setSelected(x < 445 ? 'summary' : x > 620 ? 'full' : 'review');
  };
  return <div>
    <Scene draw={draw} onPointerDown={clickScene} label="点击左侧便签看摘要、右侧资料夹看全文，或中间回看箭头。下方有等价按钮。" />
    <Controls>
      <Choice active={selected === 'summary'} onClick={() => setSelected('summary')}>摘要便签</Choice>
      <Choice active={selected === 'full'} onClick={() => setSelected('full')}>全文资料库</Choice>
      <Choice active={selected === 'review'} onClick={() => setSelected('review')}>回看已见资料</Choice>
      <Action onClick={() => setSelected('summary')}>重置</Action>
    </Controls>
    <Metrics items={[{ label: '当前可见层', value: selected === 'summary' ? '提示侧摘要' : selected === 'full' ? '外部 D 全文库' : 'review_docs 返回' }, { label: '全文库', value: 'D01 / D02 / D03' }, { label: '本次新增语料搜索', value: '0 次', tone: selected === 'review' ? 'good' : undefined }]} />
    <div style={{ minHeight: 220, padding: '12px 0' }}>
      {selected === 'summary' ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '8px 16px' }}>{summaries.map(([label, text]) => <div key={label}><strong>{label}</strong><div>{text}</div></div>)}</div> : <><strong>{selected === 'full' ? 'D02 · 全文库中保存的三句原文' : 'review_docs(D02) · 本次重新呈现的原文'}</strong>{fullText.map(text => <p key={text}>{text}</p>)}</>}
    </div>
    <Feedback tone={selected === 'review' ? 'good' : 'neutral'}>{selected === 'summary' ? '提示里看到的是搜索状态摘要，完整原文仍在外面。' : selected === 'full' ? 'D 保存已经取回的原文。摘要省略了一句话，并不代表它从全文库中被删除。' : 'review_docs 从现有 D02 取回上下文，本次没有调用新的语料搜索。原文也保留了“没有说明”的边界。'}</Feedback>
    <p>以上文档和状态是教学示例。外置记忆仍受上下文预算影响；极端情况下，提示侧的摘要也可能被裁剪。依据：表 1、附录 F。</p>
  </div>;
}
