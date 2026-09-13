import React, { useState } from 'react';
import { Scene, C, paper, folder, tick, line, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';
import type { WidgetProps } from './registry';

export type HarnessAction = 'search' | 'curate' | 'review' | 'verify' | 'end';
export type HarnessState = { turn: number; pool: number[]; curated: number[]; tags: Record<number, string>; verified: number[]; history: HarnessAction[]; ended: boolean; autoSeeded: boolean };
export const initialHarnessState = (): HarnessState => ({ turn: 0, pool: [], curated: [], tags: {}, verified: [], history: [], ended: false, autoSeeded: false });

export function transitionHarness(state: HarnessState, action: HarnessAction): HarnessState {
  if (state.ended || (['curate', 'review', 'verify'].includes(action) && state.pool.length === 0)) return state;
  const next: HarnessState = { ...state, turn: state.turn + 1, pool: [...state.pool], curated: [...state.curated], tags: { ...state.tags }, verified: [...state.verified], history: [...state.history] };
  if (action === 'search') {
    next.pool = [1, 2, 3];
    next.history.push(action);
    if (!state.autoSeeded) { next.curated = [1, 2, 3]; next.tags = { 1: 'fair', 2: 'fair', 3: 'fair' }; next.autoSeeded = true; }
  } else if (action === 'curate') {
    next.curated = [1, 2]; next.tags = { 1: 'high', 2: 'high' };
  } else if (action === 'verify') {
    if (!next.verified.includes(2)) next.verified.push(2);
  } else if (action === 'end') next.ended = true;
  if (next.turn >= 40) next.ended = true;
  return next;
}

const actions: { action: HarnessAction; label: string }[] = [
  { action: 'search', label: '搜索候选' }, { action: 'curate', label: '筛选证据' }, { action: 'review', label: '回看原文' }, { action: 'verify', label: '核验主张' }, { action: 'end', label: '结束搜索' },
];
type StateGroup = 'pool' | 'curated' | 'graph' | 'verified' | 'history' | 'budget';
const groups: { key: StateGroup; label: string; x: number; y: number }[] = [
  { key: 'pool', label: '1 · P / D 候选与全文', x: 600, y: 65 },
  { key: 'curated', label: '2 · C / I 集合与标签', x: 770, y: 65 },
  { key: 'graph', label: '3 · G 证据图', x: 940, y: 65 },
  { key: 'verified', label: '4 · V 核验记录', x: 600, y: 230 },
  { key: 'history', label: '5 · H 搜索历史', x: 770, y: 230 },
  { key: 'budget', label: '6 · B 示例轮预算', x: 940, y: 230 },
];
const groupValue = (state: HarnessState, group: StateGroup): string => {
  if (group === 'pool') return state.pool.length ? `P={${state.pool.join(',')}}；D保存3篇全文` : 'P=∅；D=∅';
  if (group === 'curated') return state.curated.length ? state.curated.map(id => `${id}:${state.tags[id]}`).join('，') : 'C=∅；I=∅';
  if (group === 'graph') return state.pool.length ? '文档1、2共享实体（教学例）' : 'G=∅';
  if (group === 'verified') return state.verified.length ? '文档2支持指定主张：yes' : 'V=∅';
  if (group === 'history') return state.history.length ? `${state.history.length}次搜索` : 'H=∅';
  return `已用${state.turn}轮；剩余${40 - state.turn}轮`;
};
const groupCount = (state: HarnessState, group: StateGroup): number => group === 'pool' ? state.pool.length : group === 'curated' ? state.curated.length : group === 'graph' ? state.pool.length ? 1 : 0 : group === 'verified' ? state.verified.length : group === 'history' ? state.history.length : 40 - state.turn;
const readGroups: Record<HarnessAction, StateGroup[]> = { search: ['pool', 'graph'], curate: ['pool', 'curated'], review: ['pool'], verify: ['pool', 'verified'], end: ['curated'] };

export const M8_1: React.FC<WidgetProps> = () => {
  const [state, setState] = useState<HarnessState>(initialHarnessState);
  const [previous, setPrevious] = useState<HarnessState>(initialHarnessState);
  const [selectedAction, setSelectedAction] = useState<HarnessAction | null>(null);
  const run = (action: HarnessAction) => {
    const next = transitionHarness(state, action);
    if (next === state) return;
    setPrevious(state); setState(next); setSelectedAction(action);
  };
  const disabled = (action: HarnessAction) => state.ended || (['curate', 'review', 'verify'].includes(action) && state.pool.length === 0);
  const changed = new Set(groups.filter(group => groupValue(previous, group.key) !== groupValue(state, group.key)).map(group => group.key));
  const accessed = new Set(selectedAction ? readGroups[selectedAction] : []);
  const feedback = state.ended ? state.curated.length ? `${state.turn === 40 && selectedAction !== 'end' ? '已到40轮上限。' : ''}提交当前筛选集 {${state.curated.join(', ')}}；下游组织答案不属于这一步。` : '空集合终止：没有证据可交付。' : selectedAction === null ? '策略尚未行动，框架状态为空。' : selectedAction === 'search' ? previous.autoSeeded ? '相同文档再次出现：候选不重复添加，也不重新播种；之前的筛选结果保留下来。' : '新增3篇候选并建立3条 fair 暂存记录；全文和共现线索也被保存，下一次观察呈现更新后的状态。' : selectedAction === 'curate' ? '筛选集只保留文档1、2，并标为 high；文档3的全文仍在 D 中，没有被删除。' : selectedAction === 'review' ? '从全文库 D 回看文档2，不发起语料搜索，也不改变筛选集与重要性。' : previous.verified.length ? '同一主张已有核验记录；本次仍返回 yes，C 与 I 没有自动改变。' : 'V 新增核验记录，C 与 I 没有自动改变；标签晋升仍由策略单独决定。';
  const observation = state.ended ? `end_search 返回 {${state.curated.join(', ')}}` : selectedAction === 'review' ? '文档2全文片段：青禾展于2025年6月在东馆开放。（教学示例）' : selectedAction === 'verify' ? '主张：青禾展于2025年6月在东馆开放。文档2：yes；理由：文本同时支持时间与地点。（教学示例）' : selectedAction === 'search' ? '返回文档1、2、3；文档1、2共享实体“青禾展”，文档3为无关候选。（教学示例）' : selectedAction === 'curate' ? '筛选集 {1,2}；重要性均为 high；其余状态继续保存。' : '尚无工具结果。';
  const strokeArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
    line(ctx, x1, y1, x2, y2, color, width);
    const angle = Math.atan2(y2 - y1, x2 - x1); const size = 8;
    line(ctx, x2, y2, x2 - size * Math.cos(angle - 0.5), y2 - size * Math.sin(angle - 0.5), color, width);
    line(ctx, x2, y2, x2 - size * Math.cos(angle + 0.5), y2 - size * Math.sin(angle + 0.5), color, width);
  };

  return <div>
    <Scene height={320} label="策略、五种动作、六组持久状态与下一次观察的交互图" onPointerDown={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - bounds.left) * 1080 / bounds.width; const y = (event.clientY - bounds.top) * 320 / bounds.height;
      const hit = actions.findIndex((_, index) => Math.abs(x - 326) < 46 && Math.abs(y - (39 + index * 57)) < 23);
      if (hit >= 0 && !disabled(actions[hit].action)) run(actions[hit].action);
    }} draw={(ctx, w, h) => {
      drawDesk(ctx, w, h); ctx.save();
      const actionY = selectedAction ? 39 + actions.findIndex(item => item.action === selectedAction) * 57 : 0;
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(525, 14, 507, 276, 14); ctx.stroke();
      actions.forEach((item, index) => {
        const y = 39 + index * 57; const active = item.action === selectedAction;
        line(ctx, 163, 153, 281, y, active ? C.blue : C.line, active ? 4 : 1.5);
      });
      if (selectedAction) groups.forEach(group => {
        if (!accessed.has(group.key) && !changed.has(group.key)) return;
        ctx.setLineDash(changed.has(group.key) ? [] : [7, 5]);
        strokeArrow(ctx, 371, actionY, group.x - 65, group.y, changed.has(group.key) ? C.green : C.blue, changed.has(group.key) ? 3.5 : 2.5);
      });
      ctx.setLineDash([]);
      ctx.fillStyle = '#fffef8'; ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(102, 153, 61, 45, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '23px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('策略', 102, 160);
      actions.forEach((item, index) => {
        const y = 39 + index * 57; const active = item.action === selectedAction;
        ctx.fillStyle = active ? C.blue : '#fffef8'; ctx.strokeStyle = disabled(item.action) ? C.line : active ? C.blue : C.dark; ctx.lineWidth = active ? 4 : 2;
        ctx.beginPath(); ctx.roundRect(281, y - 22, 90, 44, 13); ctx.fill(); ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : disabled(item.action) ? C.muted : C.ink; ctx.font = '23px sans-serif'; ctx.fillText(String(index + 1), 326, y + 8);
      });
      groups.forEach((group, index) => {
        const active = changed.has(group.key); const inspected = accessed.has(group.key);
        ctx.fillStyle = active ? '#eaf4eb' : '#fffef8'; ctx.strokeStyle = active ? C.green : inspected ? C.blue : C.light; ctx.lineWidth = active ? 4 : inspected ? 3 : 1.5;
        ctx.beginPath(); ctx.roundRect(group.x - 63, group.y - 39, 126, 78, 10); ctx.fill(); ctx.stroke();
        if (group.key === 'pool') paper(ctx, group.x - 41, group.y - 21, 30, 40, C.blue, inspected);
        else if (group.key === 'curated') folder(ctx, group.x - 45, group.y - 15, 40, 32, C.dark);
        else if (group.key === 'graph') {
          line(ctx, group.x - 43, group.y + 10, group.x - 19, group.y - 9, state.pool.length ? C.purple : C.line, 3);
          for (const [dx, dy] of [[-43, 10], [-19, -9]]) { ctx.beginPath(); ctx.arc(group.x + dx, group.y + dy, 6, 0, Math.PI * 2); ctx.fillStyle = C.purple; ctx.fill(); }
        } else if (group.key === 'verified') { if (state.verified.length) tick(ctx, group.x - 28, group.y, C.green, 26); else line(ctx, group.x - 44, group.y, group.x - 13, group.y, C.line, 3); }
        else if (group.key === 'history') { for (let i = 0; i < 3; i++) line(ctx, group.x - 43, group.y - 12 + i * 12, group.x - 10, group.y - 12 + i * 12, i < state.history.length ? C.blue : C.line, 3); }
        else { ctx.strokeStyle = C.dark; ctx.lineWidth = 3; ctx.strokeRect(group.x - 44, group.y - 16, 32, 34); ctx.fillStyle = C.dark; const available = (40 - state.turn) / 40; ctx.fillRect(group.x - 40, group.y + 13 - 27 * available, 24, 27 * available); }
        ctx.fillStyle = active ? C.green : C.ink; ctx.font = '25px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(groupCount(state, group.key)), group.x + 27, group.y + 7);
        ctx.font = '17px sans-serif'; ctx.fillStyle = C.muted; ctx.fillText(String(index + 1), group.x + 47, group.y - 21);
      });
      if (selectedAction && !state.ended) {
        line(ctx, 770, 289, 770, 308, C.blue, 2.5); line(ctx, 770, 308, 102, 308, C.blue, 2.5); strokeArrow(ctx, 102, 308, 102, 203, C.blue, 2.5);
        ctx.fillStyle = C.bg; ctx.fillRect(443, 294, 100, 25); ctx.fillStyle = C.blue; ctx.font = '20px sans-serif'; ctx.fillText('下一观察', 493, 312);
      }
      ctx.restore();
    }} />
    <Controls>{actions.map((item, index) => <Choice key={item.action} active={selectedAction === item.action} disabled={disabled(item.action)} onClick={() => run(item.action)}>{index + 1} · {item.label}</Choice>)}
      <Action onClick={() => { setState(initialHarnessState()); setPrevious(initialHarnessState()); setSelectedAction(null); }}>重置</Action>
    </Controls>
    <Metrics items={[{ label: '当前回合', value: `${state.turn} / 40` }, { label: '候选池', value: state.pool.length }, { label: '筛选集', value: state.curated.length }, { label: '核验记录', value: state.verified.length }]} />
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead><tr><th style={{ width: '25%', textAlign: 'left', padding: 8 }}>状态</th><th style={{ width: '31%', textAlign: 'left', padding: 8 }}>操作前</th><th style={{ width: '32%', textAlign: 'left', padding: 8 }}>操作后</th><th style={{ width: '12%', textAlign: 'left', padding: 8 }}>变化</th></tr></thead>
        <tbody>{groups.map(group => <tr key={group.key} style={{ borderTop: `1px solid ${C.line}`, background: changed.has(group.key) ? '#f1f7ed' : 'transparent' }}>
          <th scope="row" style={{ textAlign: 'left', padding: 8, overflowWrap: 'anywhere', fontWeight: 500 }}>{group.label}</th>
          <td style={{ padding: 8, overflowWrap: 'anywhere' }}>{groupValue(previous, group.key)}</td><td style={{ padding: 8, overflowWrap: 'anywhere' }}>{groupValue(state, group.key)}</td>
          <td style={{ padding: 8, overflowWrap: 'anywhere', color: changed.has(group.key) ? C.green : C.muted }}>{changed.has(group.key) ? '已改' : accessed.has(group.key) ? '读取' : '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <details style={{ marginTop: 14 }}><summary style={{ cursor: 'pointer' }}>{state.ended ? '交付记录' : '本轮观察'}</summary><p>{observation}</p><p>图中实线与加粗边框表示状态改动，虚线表示读取；数字对应上方动作与状态表。轮数预算用于这个教学状态机，未模拟真实 tokenizer 或提示压缩。</p></details>
    <Feedback tone={state.ended ? state.curated.length ? 'good' : 'bad' : selectedAction === 'verify' ? 'good' : 'neutral'}>{feedback}</Feedback>
  </div>;
};
