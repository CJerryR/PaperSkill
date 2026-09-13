import { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { Scene, C, paper, folder, tick, drawDesk, Controls, Action, Feedback, Metrics } from './desk-kit';

export function M1_1(_props: WidgetProps) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setStep(value => Math.min(4, value + 1)), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => { if (step === 4) setRunning(false); }, [step]);
  const count = [3, 5, 7, 9, 9][step];
  const reset = () => { setRunning(false); setStep(0); };
  const final = step === 4;
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    drawDesk(ctx, w, h);
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(540, 30); ctx.lineTo(540, h - 24); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = '600 22px sans-serif';
    ctx.fillText('逐条记录', 64, 42); ctx.fillText('显式状态', 620, 42);
    // Both panels derive their arrivals from the very same step.
    for (let i = 0; i < 3; i++) {
      paper(ctx, 76 + i * 100, 84, 82, 110, i === 1 ? C.orange : C.light, i === 1);
      ctx.fillStyle = C.ink; ctx.font = '600 20px sans-serif'; ctx.fillText(String(i + 1), 105 + i * 100, 113);
    }
    // Later pages physically cover the once visible answer-page bookmark.
    for (let i = 3; i < count; i++) {
      const row = Math.floor((i - 3) / 3);
      const x = 98 + ((i - 3) % 3) * 96;
      const y = 106 + row * 34;
      paper(ctx, x, y, 82, 104, C.light);
      ctx.fillStyle = C.muted; ctx.font = '18px sans-serif'; ctx.fillText(String(i + 1), x + 27, y + 30);
    }
    folder(ctx, 612, 96, 412, 143, C.light);
    for (let i = 0; i < Math.min(count - 1, 8); i++) {
      paper(ctx, 748 + (i % 4) * 52, 88 + Math.floor(i / 4) * 54, 42, 70, C.light);
    }
    paper(ctx, 640, 69, 91, 141, C.green, true);
    ctx.fillStyle = C.ink; ctx.font = '600 24px sans-serif'; ctx.fillText('2', 675, 102);
    tick(ctx, 688, 160, C.green, 23);
    if (final) {
      ctx.strokeStyle = C.red; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(426, 209); ctx.lineTo(451, 234); ctx.moveTo(451, 209); ctx.lineTo(426, 234); ctx.stroke();
      tick(ctx, 982, 220, C.green, 25);
    }
  };
  return <div>
    <Scene draw={draw} label="同一批资料随共同阶段增加。左边新增纸页遮住2号答案页，右边资料夹持续标记2号页。" />
    <Controls>
      <Action onClick={() => { setStep(0); setRunning(true); }} disabled={running}>开始同步对照</Action>
      <Action onClick={reset}>重置</Action>
    </Controls>
    <Metrics items={[{ label: '共同阶段', value: `${step} / 4` }, { label: '两侧各看过', value: `${count} 页` }, { label: '资料夹的答案页标记', value: '2号 · 保留', tone: 'good' }]} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, margin: '16px 0', fontVariantNumeric: 'tabular-nums' }}>
      <div><strong>逐条记录</strong><p>{final ? '教学终局：交付 7、8、9 号页，遗漏已见过的 2 号答案页。' : '每轮追加同样的新资料。2 号页仍存在于记录中，但逐渐被新内容遮住。'}</p></div>
      <div><strong>显式状态</strong><p>{final ? '教学终局：交付 2、7、9 号页，先前的 2 号答案页仍在筛选集。' : '同样接收新资料，同时把 2 号页的保留状态放在资料夹中。'}</p></div>
    </div>
    <Feedback tone={final ? 'good' : 'neutral'}>{step === 0 ? '两侧看到了相同资料，答案页都在眼前。' : final ? '示例里，资料夹保留了答案页；哪些页相关，仍要由策略判断。' : `第 ${step} 轮新资料到达：两侧都看过 ${count} 页，已经标出的证据需要被持续保存。`}</Feedback>
    <p>教学示例：这里预设了一次漏选，用来解释记账负担；没有模拟真实模型，也不代表论文测得的遗忘概率。</p>
  </div>;
}
