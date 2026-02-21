'use client';

// AI Processor back layer - visible when sidebar is in AI mode
// Currently a visual placeholder; will connect to real AI processing state later

export function SidebarAILayer() {
  return (
    <div className="layer-ai">
      <div className="ai-pulse-container" />

      <div className="ai-header">
        <div>
          <h2 className="ai-title">AI Processor</h2>
          <div className="ai-subtitle">Report ID: #SMH-2024-0215</div>
        </div>
        <div className="ai-status-badge">Running</div>
      </div>

      <div className="ai-timeline">
        <ProcessNode status="done" title="Data Ingestion" desc="MLS & Tax Records Synced" icon="check" />
        <ProcessNode
          status="active"
          title="Analyzing Comparables"
          desc="Processing nearby sales..."
          icon="sparkle"
          progress={72}
        />
        <ProcessNode status="pending" title="Generating Report" desc="Waiting for analysis" icon="document" />
        <ProcessNode status="pending" title="AI Recommendations" desc="Scheduled" icon="share" />
      </div>

      <div className="ai-footer">
        <div className="ai-time-row">
          <span>Est. Time Remaining</span>
          <span className="ai-time-value">00:01:34</span>
        </div>
        <button type="button" className="ai-cancel-btn">
          Cancel Process
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

function ProcessNode({ status, title, desc, icon, progress }) {
  return (
    <div className={`process-node ${status}`}>
      <div className="node-icon">
        <NodeIcon type={icon} />
      </div>
      <div className="node-content">
        <div className="node-title">{title}</div>
        <div className="node-desc">{desc}</div>
        {progress != null && (
          <div className="node-progress">
            <div className="node-progress-bar">
              <div className="node-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="node-progress-text">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

function NodeIcon({ type }) {
  switch (type) {
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
        </svg>
      );
    case 'document':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    case 'share':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
      );
    default:
      return null;
  }
}
