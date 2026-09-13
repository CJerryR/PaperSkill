import { useState, type KeyboardEvent } from 'react';
import type { WidgetProps } from './registry';
import { Scene, C, paper, tick, line, drawDesk, Controls, Choice, Action, Feedback, Metrics } from './desk-kit';

const entities = ['Brussels', 'Grande Synagogue', '1878', 'De Keyser'];
const associations = [[0, 1, 2, 3], [0, 1], [0], [2]];
const docPositions = [{ x: 74, y: 43 }, { x: 323, y: 43 }, { x: 74, y: 160 }, { x: 323, y: 160 }];
const entityPositions = [{ x: 811, y: 61 }, { x: 948, y: 126 }, { x: 811, y: 210 }, { x: 654, y: 224 }];
const stages = ['四份资料，分散阅读', '找到重复出现的实体', '选出值得回看的桥接页', '回看 D1 的原文', '提取下一跳候选线索'];
const detail = [
  'D1、D2、D3、D4 已存于全文库 D。现在只是四份分散的资料，还没有展开它们之间的联系。',
  'Brussels 同时出现在 D1、D2、D3。选择下面的实体名称，可以检查它连接哪些页。图中的序号与按钮对应。',
  'D1 同时连接 Brussels、Grande Synagogue 和 1878；它横跨多个重复出现的实体，因此是值得回看的候选桥接页。',
  '教学原文：Brussels 的 Grande Synagogue 馆舍在 1878 年完成；这一段还出现了 De Keyser。回看直接读取全文库 D，没有再次搜索语料，也没有新增文档。',
  '回看后，单例 De Keyser 成为下一跳候选。策略可以考虑搜索 “Grande Synagogue De Keyser 1878”，再检查找到的文档是否支持目标主张。这里只展示候选搜索，没有调用检索或宣称查证完成。',
];
const guard = (event: KeyboardEvent<HTMLElement>) => { if (event.key.startsWith('Arrow')) event.stopPropagation(); };

export function M6_1(_props: WidgetProps) {
  const [step, setStep] = useState(0);
  const [entity, setEntity] = useState(0);
  const goTo = (next: number) => {
    const bounded = Math.max(0, Math.min(4, next));
    setStep(bounded);
    if (bounded === 4) setEntity(3);
    else if (entity === 3 || bounded <= 1) setEntity(0);
  };
  const linked = associations.flatMap((items, index) => items.includes(entity) ? [index + 1] : []);
  const bridgeVisible = step >= 2;
  const feedback = step === 0 ? '单独阅读时，跨页联系容易藏在记录里。下一步展开已有资料的共现结构。'
    : step === 1 ? `${entities[entity]} 连接 ${linked.map(id => `D${id}`).join('、')}。重复出现只提示关联，还没有证明目标主张。`
    : step === 2 ? 'D1 连接多个频繁实体，成为值得回看的桥接候选。图结构帮助排序，语义相关性仍需策略判断。'
    : step === 3 ? '已从全文库回看 D1。文档集合没有增加，原文中的单例名字可以被重新注意到。'
    : 'De Keyser 可以成为下一跳线索；共现尚不能证明主张，这条线索仍未核验。';
  return <div onKeyDown={guard}>
    <Scene label={`教学示例第${step}步：${stages[step]}。文档到实体的连线在下方列表有等价说明。`} height={280} draw={(ctx, width, height) => {
      drawDesk(ctx, width, height);
      if (step >= 1) associations.forEach((items, docIndex) => items.forEach(entityIndex => {
        if (entityIndex === 3 && step < 4) return;
        const start = docPositions[docIndex]; const end = entityPositions[entityIndex];
        const active = entityIndex === entity;
        line(ctx, start.x + 139, start.y + 42, end.x, end.y, active ? (entityIndex === 3 ? C.orange : C.blue) : C.line, active ? 3 : 1.5);
      }));
      docPositions.forEach((position, index) => {
        const selected = step >= 1 && associations[index].includes(entity);
        paper(ctx, position.x, position.y, 139, 86, C.blue, selected);
        if (index === 0 && bridgeVisible) { ctx.fillStyle = C.orange; ctx.fillRect(position.x + 12, position.y, 14, 32); ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(position.x - 4, position.y - 4, 147, 94); }
        ctx.fillStyle = C.ink; ctx.font = '600 21px system-ui'; ctx.fillText(`D${index + 1}`, position.x + 48, position.y + 39);
        for (let row = 0; row < 2; row++) line(ctx, position.x + 26, position.y + 55 + row * 13, position.x + 112, position.y + 55 + row * 13, C.light, 3);
        if (index === 0 && step >= 3) tick(ctx, position.x + 112, position.y + 24, C.green, 12);
      });
      if (step >= 1) entityPositions.forEach((position, index) => {
        if (index === 3 && step < 4) return;
        ctx.fillStyle = index === entity ? (index === 3 ? C.orange : C.blue) : C.light;
        ctx.strokeStyle = index === entity ? C.ink : C.dark; ctx.lineWidth = index === entity ? 4 : 2;
        ctx.beginPath(); ctx.arc(position.x, position.y, index === entity ? 24 : 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.font = '600 19px system-ui'; ctx.fillStyle = index === entity ? '#ffffff' : C.ink; ctx.fillText(String(index + 1), position.x - 6, position.y + 7);
      });
      ctx.font = '600 18px system-ui'; ctx.fillStyle = C.ink; ctx.fillText('资料页', 74, 24); ctx.fillText('实体线索', 774, 24);
    }} />
    <Controls><Action disabled={step === 0} onClick={() => goTo(step - 1)}>上一步</Action><Action disabled={step === 4} onClick={() => goTo(step + 1)}>下一步</Action><Action onClick={() => { setStep(0); setEntity(0); }}>重置</Action></Controls>
    <Metrics items={[{ label: '当前步骤', value: `${step}/4 · ${stages[step]}` }, { label: '全文库 D', value: '4 份文档 · 未改变' }, { label: '桥接候选', value: bridgeVisible ? 'D1 · 待判断' : '尚未选出' }]} />
    <Controls>{entities.slice(0, step === 4 ? 4 : 3).map((name, index) => <Choice key={name} disabled={step === 0} active={step > 0 && entity === index} onClick={() => setEntity(index)}>{index + 1} · {name}</Choice>)}</Controls>
    <div style={{ minHeight: 128, margin: '14px 0' }}><strong>{stages[step]}</strong><p style={{ margin: '7px 0' }}>{detail[step]}</p>
      {step > 0 && <p style={{ margin: '7px 0' }}>当前高亮：{entities[entity]} → {linked.map(id => `D${id}`).join('、')}。{entity === 3 ? '仅在 D1 出现；尚未核验。' : `共 ${linked.length} 份文档提到它。`}</p>}
    </div>
    <Feedback tone={step === 4 ? 'warn' : 'neutral'}>{feedback}</Feedback>
    <details style={{ marginTop: 14 }}><summary>检查固定的文档—实体对应关系</summary>
      <ul style={{ paddingLeft: 20 }}>{associations.map((items, index) => <li key={index} style={{ margin: '7px 0' }}>D{index + 1}：{items.map(item => entities[item]).join('、')}{index === 0 ? '（De Keyser 是单例）' : ''}</li>)}</ul>
    </details>
    <p style={{ marginBottom: 0 }}>这是依据论文结构简化的教学示例，名称仅用来演示跨页联系。论文证据图通过正则提取多词大写实体、年份与日期；单词 Brussels 在这里用于简化共现教学，不表示通用命名实体识别器。连线不是逻辑蕴含，也不是因果关系。</p>
  </div>;
}
