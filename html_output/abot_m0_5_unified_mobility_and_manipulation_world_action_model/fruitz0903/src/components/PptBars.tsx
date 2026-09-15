import React, { useEffect, useState } from "react";

/**
 * PPT 模式叠加层：最左侧目录栏 + 底部上一页/下一页。
 *
 * 纯新增组件——不参与原有正文渲染，只把目录栏与底栏以固定浮层叠在页面上，
 * 并让正文让出对应空间（见 ppt-mode.css）。markup / class 与
 * paper-skill/assets/react-template 的 PPT 模式保持一致。
 */
export function PptBars({
  sections,
  active,
  onSelect,
  venue,
  title,
}: {
  sections: readonly (readonly [string, string])[];
  active: number;
  onSelect: (index: number) => void;
  venue: string;
  title: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const last = sections.length - 1;

  const go = (index: number) => {
    onSelect(Math.max(0, Math.min(last, index)));
    setDrawerOpen(false);
  };

  // 标记「PPT 模式已开启」/「目录已折叠」，供 CSS 决定正文让位宽度。
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("ppt-bars-on");
    return () => root.classList.remove("ppt-bars-on");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("ppt-sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div
      className={`slide-layout ppt-overlay ${drawerOpen ? "sidebar-open" : ""} ${
        collapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <button className="slide-sidebar-toggle" onClick={() => setDrawerOpen(!drawerOpen)}>
        <span className="slide-sidebar-toggle-icon">{drawerOpen ? "✕" : "☰"}</span>
        目录
      </button>

      {drawerOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setDrawerOpen(false)} />
      ) : null}

      <aside className="slide-sidebar">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{venue}</div>
          <div className="slide-sidebar-title">{title}</div>
        </div>
        <nav className="slide-sidebar-nav">
          {sections.map(([num, label], index) => (
            <button
              key={num}
              className={`slide-sidebar-item ${active === index ? "active" : ""}`}
              onClick={() => go(index)}
              aria-current={active === index ? "step" : undefined}
            >
              <span className="slide-sidebar-num">{num}</span>
              <span className="slide-sidebar-text">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button
        className="slide-sidebar-collapse"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "展开目录" : "折叠目录"}
      >
        {collapsed ? "☰" : "◀"}
      </button>

      <div className="slide-nav">
        <button className="slide-nav-btn" onClick={() => go(active - 1)} disabled={active === 0}>
          ← 上一页
        </button>
        <span className="slide-nav-counter">
          {active + 1} / {sections.length}
        </span>
        <button
          className="slide-nav-btn slide-nav-btn-primary"
          onClick={() => go(active + 1)}
          disabled={active === last}
        >
          下一页 →
        </button>
      </div>
    </div>
  );
}
