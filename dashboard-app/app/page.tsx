"use client";

import { useState, useEffect } from "react";

type IncidentStatus = "OPEN" | "Investigating" | "Resolved";
type BugType = "SYNTAX_ERROR" | "TYPE_MISMATCH" | "LOGIC_ERROR" | "ASYNC_ERROR" | "NULL_DEREF";

interface IIncident {
  id: string;
  timestamp: string;
  bugType: BugType;
  service: string;
  filePath: string;
  description: string;
  status: IncidentStatus;
  thinkingMode: boolean;
  fixAttempts: number;
}

const BUG_PALETTE: Record<BugType, { bg: string; text: string; dot: string }> = {
  SYNTAX_ERROR:  { bg: "rgba(249,115,22,0.12)",  text: "#fb923c", dot: "#f97316" },
  TYPE_MISMATCH: { bg: "rgba(167,139,250,0.12)", text: "#c4b5fd", dot: "#a78bfa" },
  LOGIC_ERROR:   { bg: "rgba(250,204,21,0.12)",  text: "#fde047", dot: "#facc15" },
  ASYNC_ERROR:   { bg: "rgba(56,189,248,0.12)",  text: "#7dd3fc", dot: "#38bdf8" },
  NULL_DEREF:    { bg: "rgba(244,63,94,0.12)",   text: "#fb7185", dot: "#f43f5e" },
};

const STATUS_STYLE: Record<IncidentStatus, { color: string; label: string }> = {
  OPEN:          { color: "#f43f5e", label: "OPEN" },
  Investigating: { color: "#facc15", label: "INVESTIGATING" },
  Resolved:      { color: "#4ade80", label: "RESOLVED" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Radial health gauge ── */
function HealthGauge({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? "#4ade80" : score >= 50 ? "#facc15" : "#f43f5e";
  const label = score >= 80 ? "NOMINAL" : score >= 50 ? "DEGRADED" : "CRITICAL";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={144} height={144} viewBox="0 0 144 144">
        {/* track */}
        <circle cx={72} cy={72} r={r} fill="none" stroke="#1e293b" strokeWidth={12} />
        {/* fill */}
        <circle
          cx={72} cy={72} r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 72 72)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        {/* glow ring */}
        <circle cx={72} cy={72} r={r - 10} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.08} />
        <text x={72} y={66} textAnchor="middle" fill={color} fontSize={28} fontFamily="'JetBrains Mono', 'Fira Code', monospace" fontWeight={700} letterSpacing={-1}>
          {score}
        </text>
        <text x={72} y={84} textAnchor="middle" fill="#475569" fontSize={10} fontFamily="'JetBrains Mono', 'Fira Code', monospace" letterSpacing={3}>
          HEALTH
        </text>
      </svg>
      <div style={{
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        letterSpacing: "0.2em",
        color,
        padding: "3px 10px",
        border: `1px solid ${color}44`,
        borderRadius: 2,
        background: `${color}11`,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, accent, sub }: { label: string; value: number | string; accent: string; sub?: string }) {
  return (
    <div style={{
      background: "rgba(15,23,42,0.6)",
      border: `1px solid ${accent}33`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 4,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", letterSpacing: "0.18em", color: "#64748b" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: accent, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>{sub}</div>}
    </div>
  );
}

/* ── Pulsing status dot ── */
function StatusDot({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 8, height: 8, flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.35,
        animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:0.35}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}`}</style>
    </span>
  );
}

/* ── Log-style incident row ── */
function IncidentRow({ inc }: { inc: IIncident }) {
  const bug = BUG_PALETTE[inc.bugType] || {
  bg: "rgba(100,100,100,0.15)",
  text: "#cbd5e1",
  dot: "#64748b"
};
  const st = STATUS_STYLE[inc.status];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "90px 1fr 130px 90px",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px",
      borderBottom: "1px solid #0f172a",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 11,
      cursor: "default",
      transition: "background 0.15s",
    }}
    onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.07)")}
    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* timestamp */}
      <div style={{ color: "#334155", letterSpacing: "0.04em" }}>{timeAgo(inc.timestamp)}</div>

      {/* service + bug */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ color: "#cbd5e1", letterSpacing: "0.05em" }}>{inc.service}</div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "1px 6px", borderRadius: 2,
          background: bug.bg, color: bug.text, fontSize: 10, width: "fit-content",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: bug.dot, flexShrink: 0 }} />
          {inc.bugType}
        </div>
      </div>

      {/* file */}
      <div style={{ color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10 }}>
        {inc.filePath || "—"}
      </div>

      {/* status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <StatusDot color={st.color} />
        <span style={{ color: st.color, fontSize: 10, letterSpacing: "0.1em" }}>{st.label}</span>
      </div>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 20px 8px",
      borderBottom: "1px solid #1e293b",
    }}>
      <span style={{
        fontSize: 10,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        letterSpacing: "0.22em",
        color: "#64748b",
      }}>
        {label}
      </span>
      {count !== undefined && (
        <span style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          color: "#334155", background: "#1e293b",
          padding: "1px 7px", borderRadius: 20,
        }}>
          {count}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
    </div>
  );
}

/* ══════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════ */
/* ══════════════════════════════════
   NOTIFICATION POPUP
══════════════════════════════════ */
function NotificationPopup({ notification, onClose }: { notification: any; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: 'rgba(74, 222, 128, 0.15)',
      border: '1px solid #4ade80',
      borderRadius: 8,
      padding: '16px 24px',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out',
      backdropFilter: 'blur(10px)',
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>✅</span>
        <div>
          <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 14 }}>INCIDENT RESOLVED</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>
            {notification?.type} in {notification?.service} fixed
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<any>(null);
  const [lastResolvedId, setLastResolvedId] = useState<number>(0);
  const [healthData, setHealthData] = useState<any>(null);
  const [hasShownInitialPopup, setHasShownInitialPopup] = useState(false);

  useEffect(() => {
    // Load last shown notification ID from localStorage
    const stored = localStorage.getItem('lastShownNotificationId');
    const savedId = stored ? parseInt(stored, 10) : 0;
    setLastResolvedId(savedId);
    setHasShownInitialPopup(true);
  }, []);

  useEffect(() => {
    if (!hasShownInitialPopup) return;

    const fetchIncidents = async () => {
      try {
        const response = await fetch("/api/incidents");
        const data = await response.json();
        if (data.incidents && Array.isArray(data.incidents)) {
          const enrichedIncidents: IIncident[] = data.incidents.map((i: any) => ({
            id: i.id,
            timestamp: i.timestamp,
            bugType: (i.type || "").trim() as BugType,
            service: i.service,
            filePath: i.filePath,
            description: `${i.type} in ${i.service}`,
            status: (i.status || "OPEN") as IncidentStatus,
            thinkingMode: false,
            fixAttempts: 0,
          }));
          setIncidents(enrichedIncidents);
        }
      } catch (error) {
        console.error("Failed to fetch incidents:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch notification for popup
    const checkNotification = async () => {
      try {
        const res = await fetch("/api/notify");
        const data = await res.json();
        if (data.notification && data.notification.id > lastResolvedId) {
          setNotification(data.notification);
          setLastResolvedId(data.notification.id);
          localStorage.setItem('lastShownNotificationId', data.notification.id.toString());
        }
      } catch (e) { /* ignore */ }
    };

    // Fetch service health
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHealthData(data);
      } catch (e) { /* ignore */ }
    };

    fetchIncidents();
    checkNotification();
    checkHealth();
    const interval = setInterval(() => {
      fetchIncidents();
      checkNotification();
      checkHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [lastResolvedId, hasShownInitialPopup]);

  const openIncidents    = incidents.filter(i => i.status === "OPEN");
  const resolvedByClaud  = incidents.filter(i => i.status === "Resolved");
  const health           = Math.max(0, 100 - openIncidents.length * 15);

  /* Split into active vs resolved for table sections */
  const activeIncidents   = incidents.filter(i => i.status !== "Resolved");
  const resolvedIncidents = incidents.filter(i => i.status === "Resolved");

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#080f1c",
      color: "#e2e8f0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      overflow: "hidden",
    }}>
      {/* Notification Popup */}
      {notification && (
        <NotificationPopup
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ──────────────── LEFT SIDEBAR ──────────────── */}
      <div style={{
        width: 260,
        flexShrink: 0,
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        background: "rgba(10,18,33,0.8)",
      }}>
        {/* Logo / title */}
        <div style={{
          padding: "18px 20px 16px",
          borderBottom: "1px solid #1e293b",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
              flexShrink: 0,
              boxShadow: "0 0 8px #4ade80aa",
              animation: "pulse 2s infinite",
            }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: "#94a3b8" }}>
              CHAOS·OPS
            </span>
          </div>
          <div style={{ fontSize: 9, color: "#334155", marginTop: 6, letterSpacing: "0.1em" }}>
            INCIDENT COMMAND CENTER
          </div>
        </div>

        {/* Health gauge */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "center" }}>
          <HealthGauge score={health} />
        </div>

        {/* Stat cards */}
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid #1e293b" }}>
          <StatCard label="ACTIVE INCIDENTS" value={openIncidents.length} accent="#f43f5e" />
          <StatCard label="RESOLVED BY CLAUDE" value={resolvedByClaud.length} accent="#4ade80" />
        </div>

        {/* Service Health Status */}
        {healthData && (
          <div style={{ padding: "14px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#334155", marginBottom: 10 }}>SERVICE STATUS</div>
            {healthData.services?.map((s: any) => (
              <div key={s.name} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 0", fontSize: 10,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: s.status === 'online' ? '#4ade80' : s.status === 'error' ? '#facc15' : '#f43f5e'
                }} />
                <span style={{ color: "#94a3b8", flex: 1 }}>{s.name.replace('-service', '')}</span>
                <span style={{ color: s.status === 'online' ? '#4ade80' : s.status === 'error' ? '#facc15' : '#f43f5e' }}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bug type legend */}
        <div style={{ padding: "14px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#334155", marginBottom: 10 }}>BUG TYPES</div>
          {(Object.keys(BUG_PALETTE) as BugType[]).map(bt => (
            <div key={bt} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 0",
              borderBottom: "1px solid #0f172a",
              fontSize: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: BUG_PALETTE[bt].dot, flexShrink: 0 }} />
              <span style={{ color: BUG_PALETTE[bt].text, letterSpacing: "0.06em", flex: 1 }}>{bt}</span>
              <span style={{ color: "#334155" }}>
                {incidents.filter(i => i.bugType === bt).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────── MAIN PANEL ──────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1px solid #1e293b",
          background: "rgba(10,18,33,0.6)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em" }}>
              SYSTEM·HEALTH·MONITOR
            </span>
            <span style={{
              fontSize: 9, letterSpacing: "0.15em",
              padding: "2px 8px", borderRadius: 2,
              background: health >= 80 ? "rgba(74,222,128,0.1)" : health >= 50 ? "rgba(250,204,21,0.1)" : "rgba(244,63,94,0.1)",
              color: health >= 80 ? "#4ade80" : health >= 50 ? "#facc15" : "#f43f5e",
              border: `1px solid ${health >= 80 ? "#4ade8033" : health >= 50 ? "#facc1533" : "#f43f5e33"}`,
            }}>
              {health >= 80 ? "● ALL SYSTEMS GO" : health >= 50 ? "● PARTIAL OUTAGE" : "● MAJOR INCIDENT"}
            </span>
          </div>
          <div style={{ fontSize: 9, color: "#334155", letterSpacing: "0.1em" }}>
            AUTO·REFRESH 5s
          </div>
        </div>

        {/* Table area */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, color: "#334155", fontSize: 12, letterSpacing: "0.1em" }}>
              INITIALIZING TELEMETRY...
            </div>
          ) : incidents.length === 0 ? (
            <div style={{ padding: 40, color: "#334155", fontSize: 12, letterSpacing: "0.1em" }}>
              NO INCIDENTS DETECTED — SYSTEM CLEAN
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr 130px 90px",
                gap: 12,
                padding: "8px 20px",
                borderBottom: "1px solid #1e293b",
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "#334155",
                background: "rgba(10,18,33,0.4)",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}>
                <div>TIME</div>
                <div>SERVICE / BUG</div>
                <div>FILE PATH</div>
                <div>STATUS</div>
              </div>

              {/* Active incidents */}
              {activeIncidents.length > 0 && (
                <>
                  <SectionHeader label="ACTIVE INCIDENTS" count={activeIncidents.length} />
                  {activeIncidents.map(inc => <IncidentRow key={inc.id} inc={inc} />)}
                </>
              )}

              {/* Resolved */}
              {resolvedIncidents.length > 0 && (
                <>
                  <SectionHeader label="RESOLVED BY CLAUDE" count={resolvedIncidents.length} />
                  {resolvedIncidents.map(inc => <IncidentRow key={inc.id} inc={inc} />)}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid #1e293b",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10,18,33,0.6)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 20 }}>
            {(Object.keys(STATUS_STYLE) as IncidentStatus[]).map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: "#475569", letterSpacing: "0.1em" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_STYLE[s].color }} />
                {s.toUpperCase()}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: "#1e293b", letterSpacing: "0.1em" }}>
            INCIDENTS TOTAL: {incidents.length}
          </div>
        </div>
      </div>
    </div>
  );
}
