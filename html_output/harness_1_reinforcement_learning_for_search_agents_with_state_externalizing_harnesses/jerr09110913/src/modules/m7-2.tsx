import React, { useState } from 'react';
import { Scene, C, paper, folder, line, tick, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';
import type { WidgetProps } from './registry';

export type RewardScenario = 'empty' | 'found' | 'kept';

export function computeReward(scenario: RewardScenario, tools: number) {
  const curated = scenario === 'empty' ? [] : scenario === 'found' ? [3, 4] : [1, 2, 3, 4];
  const precision = curated.length ? 1 : 0;
  const recall = curated.length / 4;
  const answerRecall = curated.filter(id => id <= 2).length / 2;
  const f2 = 4 * precision + recall > 0 ? 5 * precision * recall / (4 * precision + recall) : 0;
  const terms = [
    { label: '集合质量', expression: '0.7F₂', value: 0.7 * f2 },
    { label: '轨迹召回', expression: '0.3ρτ', value: 0.3 },
    { label: '答案文档召回', expression: '0.8ρA', value: 0.8 * answerRecall },
    { label: '轨迹答案召回', expression: '0.4ρτA', value: 0.4 },
    { label: '答案命中奖', expression: '𝟙[ρA>0]', value: answerRecall > 0 ? 1 : 0 },
    { label: '工具多样性', expression: '0.15min(ν/6,1)', value: 0.15 * Math.min(tools / 6, 1) },
    { label: '漏选惩罚', expression: '−0.35max(ρτA−ρA,0)', value: -0.35 * Math.max(1 - answerRecall, 0) },
    { label: '回合惩罚', expression: '本例固定12轮', value: 0 },
  ];
  const raw = terms.reduce((sum, term) => sum + term.value, 0);
  return { curated, precision, recall, answerRecall, f2, terms, raw, reward: scenario === 'empty' ? -0.2 : Math.max(0.001, raw) };
}

export const M7_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [scenario, setScenario] = useState<RewardScenario>('found');
  const [tools, setTools] = useState(3);
  const result = computeReward(scenario, tools);
  const rangeId = `${chapterId}-${moduleId}-tools`;
  const feedback = scenario === 'empty' ? '空筛选集直接得到 −0.2，跳过其余公式，也不应用正奖励下限。增加工具种类不会改变这个结果。' : scenario === 'found' ? `答案出现在轨迹中，却没进入筛选集；漏选项扣除 0.350。${tools >= 6 ? '多样性奖励已在 6 种工具时饱和，不能补回漏掉的答案。' : '工具奖励增加，仍不能替代把答案文档选入集合。'}` : tools > 6 ? '保留答案获得多项质量奖励；达到 6 种工具后，多样性项保持 0.150，不再增长。' : '保留答案同时获得集合质量、答案召回和命中奖励；发现证据与最终选入分别得到计分。';
  const signed = (value: number) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(3)}`;

  return <div>
    <Scene label="筛选文档与终局奖励各项贡献" draw={(ctx, w, h) => {
      drawDesk(ctx, w, h); ctx.save();
      folder(ctx, 45, 65, 395, 177, C.light);
      ctx.fillStyle = C.ink; ctx.font = '22px sans-serif'; ctx.fillText('筛选集', 52, 37); ctx.fillText('奖励贡献', 526, 37);
      result.curated.forEach((id, index) => {
        const x = 72 + index * 86;
        paper(ctx, x, 92, 69, 116, C.green, id <= 2);
        ctx.fillStyle = C.ink; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(id), x + 34, 143);
        if (id <= 2) tick(ctx, x + 34, 179, C.green, 15);
        else line(ctx, x + 20, 179, x + 48, 179, C.blue, 4);
      });
      ctx.textAlign = 'left';
      const origin = 595; const scale = 118;
      line(ctx, origin, 65, origin, 244, C.muted, 2);
      if (scenario === 'empty') {
        ctx.fillStyle = C.red; ctx.fillRect(origin - 0.2 * scale, 148, 0.2 * scale, 39);
        ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.strokeRect(origin - 0.2 * scale - 2, 146, 0.2 * scale + 4, 43);
        ctx.font = '26px sans-serif'; ctx.fillText('−0.200', origin + 12, 177);
      } else {
        let cursor = origin;
        const colors = [C.green, C.blue, C.green, C.purple, C.green, C.orange];
        result.terms.slice(0, 6).forEach((term, index) => {
          const span = term.value * scale;
          ctx.fillStyle = colors[index]; ctx.fillRect(cursor, 103, span, 39);
          if (span > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(cursor, 103, span, 39); }
          cursor += span;
        });
        const loss = Math.abs(result.terms[6].value) * scale;
        ctx.fillStyle = C.red; ctx.fillRect(origin - loss, 176, loss, 34);
        ctx.strokeStyle = C.red; ctx.lineWidth = 3;
        if (loss > 0) ctx.strokeRect(origin - loss, 176, loss, 34);
        ctx.fillStyle = C.ink; ctx.font = '23px sans-serif';
        ctx.fillText(signed(result.terms.slice(0, 6).reduce((sum, term) => sum + term.value, 0)), origin + 7, 89);
        ctx.fillStyle = loss > 0 ? C.red : C.muted; ctx.fillText(signed(result.terms[6].value), origin + 7, 200);
      }
      ctx.restore();
    }} />
    <Controls>
      <Choice active={scenario === 'empty'} onClick={() => setScenario('empty')}>未交付</Choice>
      <Choice active={scenario === 'found'} onClick={() => setScenario('found')}>找到但漏选</Choice>
      <Choice active={scenario === 'kept'} onClick={() => setScenario('kept')}>保留答案</Choice>
      <Action onClick={() => { setScenario('found'); setTools(3); }}>重置</Action>
    </Controls>
    <Controls>
      <label htmlFor={rangeId}>工具种类 <span className="val">{tools}</span></label>
      <input id={rangeId} type="range" min={1} max={8} step={1} value={tools} onInput={event => setTools(Number(event.currentTarget.value))} onChange={event => setTools(Number(event.currentTarget.value))} onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }} />
    </Controls>
    <Metrics items={[{ label: '终局奖励', value: result.reward.toFixed(3) }, { label: '最终召回', value: result.recall.toFixed(2) }, { label: '答案文档召回', value: result.answerRecall.toFixed(2) }, { label: '固定回合数', value: '12' }]} />
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer' }}>奖励分项与集合明细</summary>
      <p>教学集合：候选池 P = {'{1, 2, 3, 4, 5}'}，相关集 R = {'{1, 2, 3, 4}'}，答案集 A = {'{1, 2}'}。当前 C = {'{' + result.curated.join(', ') + '}'}；轨迹召回与轨迹答案召回均为 1。</p>
      <Metrics items={[{ label: '精确率 p', value: result.precision.toFixed(2) }, { label: 'F₂', value: result.f2.toFixed(3) }, { label: '非空奖励下限', value: '0.001' }]} />
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontVariantNumeric: 'tabular-nums' }}>
          <thead><tr><th style={{ width: '37%', textAlign: 'left', padding: 8 }}>分项</th><th style={{ width: '37%', textAlign: 'left', padding: 8 }}>计算</th><th style={{ width: '26%', textAlign: 'right', padding: 8 }}>贡献</th></tr></thead>
          <tbody>{result.terms.map(term => <tr key={term.label} style={{ borderTop: `1px solid ${C.line}` }}>
            <td style={{ padding: 8, overflowWrap: 'anywhere' }}>{term.label}</td><td style={{ padding: 8, overflowWrap: 'anywhere' }}>{term.expression}</td><td style={{ padding: 8, textAlign: 'right', color: scenario === 'empty' ? C.muted : term.value < 0 ? C.red : C.ink }}>{scenario === 'empty' ? '跳过' : signed(term.value)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p>回合惩罚的起始阈值为 20、上限为 0.02；论文没有给出完整分段式。本例固定 12 轮，使用未触发回合惩罚的比较，不推算后续斜率。（论文第 5–6、18 页）</p>
    </details>
    <Feedback tone={scenario !== 'kept' ? 'bad' : tools > 6 ? 'neutral' : 'good'}>{feedback}</Feedback>
  </div>;
};
