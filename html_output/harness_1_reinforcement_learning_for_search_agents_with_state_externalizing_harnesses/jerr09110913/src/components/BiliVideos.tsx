import React from 'react';
import type { BiliDef } from '../types';

/** External reading links: no third-party cover images or video redistribution. */
export function BiliVideos({ items }: { items: BiliDef[] }) {
  return (
    <section className="dl-related-section">
      <h3>延伸学习 · B 站讲解视频</h3>
      <p>以下为外部背景课程链接，不是 Harness-1 作者对本论文的讲解。</p>
      <div className="dl-video-strip">
        {items.filter(it => it.bvid?.startsWith('BV')).map(it => (
          <a key={it.bvid} className="dl-video-card"
            href={`https://www.bilibili.com/video/${it.bvid}`}
            target="_blank" rel="noopener noreferrer" data-bvid={it.bvid}>
            <div className="dl-video-link-cover">
              <div className="dl-video-play">▶</div>
              <span className="dl-video-link-tag">B 站</span>
            </div>
            <strong>{it.title}</strong>
          </a>
        ))}
      </div>
    </section>
  );
}
