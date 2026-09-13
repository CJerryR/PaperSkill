import React, { useState } from 'react';
import { Scene, C, paper, pen, line, tick, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';
import type { WidgetProps } from './registry';

const phases = [
  { title: '生成并筛选范例', copy: 'GPT-5.4 在同一套运行框架中执行工具调用。保留格式有效、交付非空文档且最终召回不低于 0.10 的轨迹。', metrics: [{ label: '过滤后轨迹', value: '899' }, { label: '来源家族', value: '4' }, { label: '召回门槛', value: '0.10' }] },
  { title: '逐回合学习操作', copy: '一段轨迹包含多个回合，每个回合展开为一条监督样本。SFT 学习工具格式、筛选节奏与核验规范，step 550 检查点用于初始化 RL。', metrics: [{ label: '样本单位', value: '每回合' }, { label: 'LoRA 秩', value: '32' }, { label: '训练轮次', value: '3' }] },
  { title: '采样完整搜索轨迹', copy: 'RL 只使用 SEC 的 3453 条训练查询。每步采样 128 条查询，每条查询生成 8 次完整搜索；每次搜索结束后才计算奖励。', metrics: [{ label: '查询 / 步', value: '128' }, { label: '轨迹 / 查询', value: '8' }, { label: '轨迹 / 步', value: '1024' }] },
  { title: '从组内差异学习', copy: 'CISPO 使用同一查询下的回报差异形成组内学习信号。下面的 8 个回报为教学示例，按总体标准差计算示意标准化值，不是训练日志或优化器的完整实现。', metrics: [{ label: '奖励时机', value: '终局' }, { label: '比较范围', value: '同一查询' }, { label: 'KL 锚定系数', value: '0' }] },
];

export const M7_1: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const [groupMode, setGroupMode] = useState<'different' | 'constant'>('different');
  const rewards = groupMode === 'constant' ? Array(8).fill(0.5) as number[] : [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const mean = rewards.reduce((sum, value) => sum + value, 0) / rewards.length;
  const deviation = Math.sqrt(rewards.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rewards.length);
  const advantages = rewards.map(value => deviation > 0 ? (value - mean) / deviation : 0);
  const phase = phases[stage];
  const feedback = stage === 0 ? '先用范例学习工具格式和编辑规范。' : stage === 1 ? '899 是轨迹数，每轮展开后才形成监督样本，不能把两者混为一谈。' : stage === 2 ? '128 × 8 = 1024：这是每个训练步采样的完整搜索次数，不是查询总数。' : groupMode === 'constant' ? '这一组没有相对好坏；同奖励组会被丢弃，不贡献梯度。' : '不同回报提供组内比较信号：高于组均值与低于组均值的轨迹获得不同方向的示意优势。';

  return <div>
    <Scene label="SFT 范例本与八条 RL 搜索轨迹" draw={(ctx, w, h) => {
      drawDesk(ctx, w, h);
      ctx.save();
      paper(ctx, 90, 47, 245, 190, C.light, stage < 2);
      paper(ctx, 107, 39, 245, 190, C.blue, stage < 2);
      ctx.fillStyle = C.ink; ctx.font = '22px sans-serif';
      ctx.fillText('范例本', 118, 28); ctx.fillText('整段轨迹', 577, 28);
      for (let index = 0; index < 6; index++) {
        const selected = stage === 1 ? index < 4 : index < 2;
        line(ctx, 135, 76 + index * 24, 314, 76 + index * 24, selected ? C.blue : C.line, selected ? 4 : 2);
        if (stage === 1 && selected) tick(ctx, 124, 76 + index * 24, C.green, 7);
      }
      if (stage < 2) pen(ctx, 277, 167 - stage * 22, -0.6, C.wood);
      const baseline = stage === 3 ? 153 : 231;
      line(ctx, 465, baseline, 1006, baseline, C.muted, 2);
      for (let index = 0; index < 8; index++) {
        const x = 486 + index * 65;
        const value = stage === 3 ? advantages[index] : rewards[index];
        const barHeight = stage === 3 ? Math.abs(value) * 47 : stage === 2 ? 116 + (index % 3) * 13 : 36;
        const barY = stage === 3 && value < 0 ? baseline : baseline - barHeight;
        const color = stage < 2 ? C.light : stage === 2 ? C.blue : groupMode === 'constant' ? C.orange : value >= 0 ? C.green : C.red;
        ctx.fillStyle = color; ctx.globalAlpha = stage < 2 ? 0.4 : 0.85;
        ctx.fillRect(x, barY, 35, Math.max(barHeight, 3));
        ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = stage >= 2 ? 3 : 1;
        ctx.strokeRect(x - 2, barY - 2, 39, Math.max(barHeight, 3) + 4);
        ctx.fillStyle = C.ink; ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(index + 1), x + 17, 260);
      }
      ctx.restore();
    }} />
    <Controls>
      <Action onClick={() => setStage(value => Math.max(0, value - 1))} disabled={stage === 0}>上一步</Action>
      <span aria-live="polite">{stage + 1} / 4 · {phase.title}</span>
      <Action onClick={() => setStage(value => Math.min(3, value + 1))} disabled={stage === 3}>下一步</Action>
      <Action onClick={() => { setStage(0); setGroupMode('different'); }}>重置</Action>
    </Controls>
    <div style={{ minHeight: 128 }}>
      <p>{phase.copy}</p>
      <Metrics items={phase.metrics} />
    </div>
    {stage === 3 && <div>
      <Controls>
        <Choice active={groupMode === 'different'} onClick={() => setGroupMode('different')}>不同回报</Choice>
        <Choice active={groupMode === 'constant'} onClick={() => setGroupMode('constant')}>相同回报</Choice>
        <span>组均值 {mean.toFixed(2)} · 标准差 {deviation.toFixed(3)}</span>
      </Controls>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
          <thead><tr><th style={{ textAlign: 'left', padding: '8px' }}>轨迹</th><th style={{ textAlign: 'right', padding: '8px' }}>终局回报</th><th style={{ textAlign: 'right', padding: '8px' }}>示意优势</th></tr></thead>
          <tbody>{rewards.map((reward, index) => <tr key={index} style={{ borderTop: `1px solid ${C.line}` }}>
            <td style={{ padding: '7px 8px' }}>{index + 1}</td><td style={{ padding: '7px 8px', textAlign: 'right' }}>{reward.toFixed(2)}</td>
            <td style={{ padding: '7px 8px', textAlign: 'right', color: groupMode === 'constant' ? C.muted : advantages[index] >= 0 ? C.green : C.red }}>{groupMode === 'constant' ? '不参与更新' : `${advantages[index] >= 0 ? '+' : '−'}${Math.abs(advantages[index]).toFixed(3)}`}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>}
    <Feedback tone={stage === 3 ? groupMode === 'constant' ? 'warn' : 'good' : 'neutral'}>{feedback}</Feedback>
  </div>;
};
