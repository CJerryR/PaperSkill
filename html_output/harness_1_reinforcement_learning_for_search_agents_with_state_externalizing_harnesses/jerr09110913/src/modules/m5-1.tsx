import { useState, type KeyboardEvent } from 'react';
import type { WidgetProps } from './registry';
import { Scene, C, paper, magnifier, tick, line, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';

type Claim = 'all' | 'partial';
type RecordItem = { doc: 1 | 2; claim: Claim; supports: boolean; reason: string };
type Notice = { tone: 'neutral' | 'good' | 'bad' | 'warn'; text: string } | null;
const claims: Record<Claim, string> = {
  all: '馆舍于 1878 年完成，设计师为 De Keyser。',
  partial: '馆舍于 1878 年完成。',
};
const texts = {
  1: '这座馆舍于 1878 年完成。此段记录没有给出设计师姓名。',
  2: '这座馆舍于 1878 年完成，由 De Keyser 设计。',
};
const guard = (event: KeyboardEvent<HTMLElement>) => { if (event.key.startsWith('Arrow')) event.stopPropagation(); };

export function M5_1(_props: WidgetProps) {
  const [doc, setDoc] = useState<1 | 2>(1);
  const [claim, setClaim] = useState<Claim>('all');
  const [cache, setCache] = useState<Record<string, RecordItem>>({});
  const [shown, setShown] = useState<string | null>(null);
  const [tags, setTags] = useState<Record<1 | 2, 'high' | 'very_high'>>({ 1: 'high', 2: 'high' });
  const [notice, setNotice] = useState<Notice>(null);
  const key = `${doc}:${claim}`;
  const verdict = shown === key ? cache[key] : undefined;
  const changeDoc = (next: 1 | 2) => { setDoc(next); setShown(null); setNotice(null); };
  const changeClaim = (next: Claim) => { setClaim(next); setShown(null); setNotice(null); };
  const verify = () => {
    const existing = cache[key];
    const supports = doc === 2 || claim === 'partial';
    const result: RecordItem = existing ?? { doc, claim, supports, reason: supports ? (claim === 'partial' ? '原文明确出现完成年份 1878，支持这个单一条件。' : '原文同时写明完成年份 1878 与设计师 De Keyser，覆盖完整主张。') : '原文给出完成年份，却没有给出设计师姓名；缺少第二个条件。未支持不等于反驳。' };
    setCache(previous => ({ ...previous, [key]: result }));
    setShown(key);
    setNotice({ tone: result.supports ? 'good' : 'bad', text: `${existing ? '读取已保存的核验记录。' : '已把本次判断和理由写入核验记录 V。'}${result.supports ? '示例原文支持所选主张；' : '这份资料没有同时支持全部条件；'}重要性 I 仍为 ${tags[doc]}，核验不会自动改标签。` });
  };
  const promote = () => {
    setTags(previous => ({ ...previous, [doc]: 'very_high' }));
    if (!cache[key]) setNotice({ tone: 'warn', text: '标签已修改为 very_high；当前文档与主张尚未核验。系统提示规范要求先核验再设为 very_high，但这里不把规范伪装成执行层硬门禁。' });
    else if (!cache[key].supports) setNotice({ tone: 'warn', text: '标签已修改为 very_high，但已保存的核验结果未支持完整主张。提高重要性不会补出缺失的证据，应重新检查依据。' });
    else setNotice({ tone: 'good', text: '策略根据已保存的支持判断，把文档设为 very_high。核验记录 V 保留原判断；重要性 I 是这次单独操作的结果。' });
  };
  const reset = () => { setDoc(1); setClaim('all'); setCache({}); setShown(null); setTags({ 1: 'high', 2: 'high' }); setNotice(null); };
  const defaultNotice: NonNullable<Notice> = cache[key]
    ? { tone: 'neutral', text: '已切换到这组文档与主张。缓存仍在 V 中；点击“核验支持”可重新显示对应记录，标签独立保留。' }
    : { tone: 'neutral', text: `${tags[doc] === 'high' ? '高优先级' : '很高优先级'}表示值得关注，还没有完成当前文档与这条主张的核验。` };
  const feedback = notice ?? defaultNotice;
  return <div onKeyDown={guard}>
    <Scene label="教学示例：原文与主张并排，支持标记来自核验，书签来自独立的重要性操作。" height={280} draw={(ctx, width, height) => {
      drawDesk(ctx, width, height);
      line(ctx, 370, 136, 650, 136, C.line, 2);
      paper(ctx, 125, 41, 246, 203, C.blue, true);
      paper(ctx, 650, 69, 272, 144, C.blue, false);
      ctx.fillStyle = tags[doc] === 'very_high' ? C.orange : C.blue;
      ctx.fillRect(145, 41, 19, 53);
      if (tags[doc] === 'very_high') { ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(141, 38, 27, 61); }
      for (let index = 0; index < 4; index++) line(ctx, 178, 102 + index * 26, 330 - (index % 2) * 26, 102 + index * 26, C.light, 5);
      for (let index = 0; index < (claim === 'all' ? 2 : 1); index++) line(ctx, 681, 127 + index * 27, 886, 127 + index * 27, C.dark, 5);
      const glassX = doc === 1 ? 489 : 515;
      magnifier(ctx, glassX, 121, 36);
      if (verdict) {
        if (verdict.supports) tick(ctx, glassX, 119, C.green, 23);
        else { line(ctx, glassX - 14, 107, glassX + 14, 135, C.red, 5); line(ctx, glassX + 14, 107, glassX - 14, 135, C.red, 5); }
      } else { ctx.fillStyle = C.muted; ctx.font = '600 27px system-ui'; ctx.fillText('?', glassX - 7, 130); }
      ctx.font = '600 18px system-ui'; ctx.fillStyle = C.ink; ctx.fillText('原文', 260, 73); ctx.fillText('主张', 755, 99);
      ctx.font = '600 21px system-ui'; ctx.fillText(String(doc), 143, 223);
    }} />
    <Controls><Choice active={doc === 1} onClick={() => changeDoc(1)}>文档一 · 仅完成年份</Choice><Choice active={doc === 2} onClick={() => changeDoc(2)}>文档二 · 年份和设计师</Choice></Controls>
    <Controls><Choice active={claim === 'all'} onClick={() => changeClaim('all')}>完整主张 · 两个条件</Choice><Choice active={claim === 'partial'} onClick={() => changeClaim('partial')}>单一条件 · 完成年份</Choice></Controls>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 16, margin: '14px 0' }}>
      <div><strong>原文 · 文档{doc === 1 ? '一' : '二'}</strong><p style={{ margin: '6px 0' }}>{texts[doc]}</p></div>
      <div><strong>策略提交的主张</strong><p style={{ margin: '6px 0' }}>{claims[claim]}</p></div>
    </div>
    <Controls><Action onClick={verify}>{cache[key] ? '核验支持 · 读取缓存' : '核验支持 · 写入记录'}</Action><Action onClick={promote}>设为很高 very_high</Action><Action onClick={reset}>重置全部</Action></Controls>
    <Metrics items={[
      { label: '当前支持判断', value: verdict ? (verdict.supports ? 'yes · 支持' : 'no · 未支持') : '未展示' },
      { label: `文档 ${doc} 的重要性 I`, value: tags[doc] },
      { label: '核验记录 V', value: `${Object.keys(cache).length} 条` },
    ]} />
    <div style={{ minHeight: 74, margin: '12px 0' }}><strong>判断依据</strong><p style={{ margin: '6px 0' }}>{verdict ? verdict.reason : '尚未显示当前组合的判断。先选择文档与主张，再核验对应的文本支持关系。'}</p></div>
    <Feedback tone={feedback.tone}>{feedback.text}</Feedback>
    <details style={{ marginTop: 14 }}><summary>查看已保存的核验记录（按文档与主张区分）</summary>
      {Object.keys(cache).length === 0 ? <p>V 为空。修改重要性不会创建核验记录。</p> : <ul style={{ paddingLeft: 20 }}>{Object.entries(cache).map(([entryKey, entry]) => <li key={entryKey} style={{ margin: '8px 0' }}>文档 {entry.doc} · {entry.claim === 'all' ? '完整主张' : '单一条件'} · {entry.supports ? 'yes' : 'no'}：{entry.reason}</li>)}</ul>}
    </details>
    <p style={{ marginBottom: 0 }}>上述两份文本和判断均为固定教学示例。论文中的 verify 使用大模型判断支持关系，可能误判；yes 不是事实保证，重要性标签也不是核验结论。</p>
  </div>;
}
