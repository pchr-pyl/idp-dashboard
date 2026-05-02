import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, Cell
} from "recharts";

// ─── UCLA Structure ───────────────────────────────────────────────────────────
// Version 3 · 20 ข้อ · คะแนน 0-3 ต่อข้อ · เต็ม 60
// ยิ่งสูง = ยิ่งเหงา
// เกณฑ์ (Russell, 1996): 20-34=น้อย, 35-49=ปานกลาง, 50-60=มาก

const DIMS = [
  {
    key: "lonely",   label: "ความรู้สึกโดดเดี่ยว",      short: "โดดเดี่ยว",  icon: "😔",
    items: [0,1,2,3,4],   // index ใน 20 ข้อ (0-based)
    color: "#EF4444",
    desc: "ข้อ 58-62 · รู้สึกโดดเดี่ยว ขาดมิตร ไม่มีใครเข้าใจ",
    note: "จัดกลุ่มตามเนื้อหา ไม่ใช่ sub-scale มาตรฐาน",
  },
  {
    key: "relation", label: "ความสัมพันธ์ทางสังคม",    short: "สัมพันธ์",   icon: "🤝",
    items: [5,6,7,8,9],
    color: "#F97316",
    desc: "ข้อ 63-67 · รอคนติดต่อก่อน ไม่มีใครพึ่ง รู้สึกถูกทอดทิ้ง",
    note: "จัดกลุ่มตามเนื้อหา ไม่ใช่ sub-scale มาตรฐาน",
  },
  {
    key: "self",     label: "ความรู้สึกเกี่ยวกับตนเอง", short: "ตนเอง",     icon: "🪞",
    items: [10,11,12,13,14],
    color: "#8B5CF6",
    desc: "ข้อ 68-72 · โดดเดี่ยวสิ้นเชิง สัมพันธ์ผิวเผิน โหยหาเพื่อน",
    note: "จัดกลุ่มตามเนื้อหา ไม่ใช่ sub-scale มาตรฐาน",
  },
  {
    key: "social",   label: "พฤติกรรมทางสังคม",         short: "พฤติกรรม",  icon: "👥",
    items: [15,16,17,18,19],
    color: "#0EA5E9",
    desc: "ข้อ 73-77 · รู้สึกถูกแยก ถอยห่างจากสังคม รู้จักคนยาก",
    note: "จัดกลุ่มตามเนื้อหา ไม่ใช่ sub-scale มาตรฐาน",
  },
];

const ITEM_LABELS = [
  "ไม่มีความสุขที่ต้องทำสิ่งต่างๆ คนเดียว",
  "ไม่มีใครให้คุยด้วย",
  "ทนไม่ได้ที่จะอยู่คนเดียวอย่างนี้",
  "ขาดมิตรภาพ",
  "รู้สึกราวกับไม่มีใครเข้าใจฉันจริงๆ",
  "มักรอให้คนอื่นติดต่อมาก่อน",
  "ไม่มีใครให้พึ่งพิง",
  "รู้สึกว่าไม่เหลือคนที่สนิทด้วยแล้ว",
  "ความสนใจไม่สอดคล้องกับคนรอบข้าง",
  "รู้สึกถูกทอดทิ้ง",
  "รู้สึกโดดเดี่ยวโดยสิ้นเชิง",
  "ไม่สามารถติดต่อสื่อสารกับคนรอบข้างได้",
  "มีความสัมพันธ์ทางสังคมเพียงผิวเผิน",
  "โหยหาการมีเพื่อนพ้อง",
  "ไม่มีใครเข้าใจฉันอย่างแท้จริง",
  "รู้สึกถูกแยกออกจากคนอื่นๆ",
  "ไม่มีความสุขที่ตัวเองถอยห่างจากสังคม",
  "การทำความรู้จักกับคนใหม่ๆ เป็นเรื่องยาก",
  "รู้สึกถูกกีดกันและถูกตัดขาดจากผู้อื่น",
  "แม้มีคนมากมายอยู่รอบตัวแต่ยังรู้สึกโดดเดี่ยว",
];

const LEVEL_CFG = [
  { key: "low",  label: "เหงาน้อย",    range: "20–34", color: "#10B981", bg: "#F0FDF4", min: 0,  max: 34 },
  { key: "mid",  label: "เหงาปานกลาง", range: "35–49", color: "#F59E0B", bg: "#FFFBEB", min: 35, max: 49 },
  { key: "high", label: "เหงามาก",     range: "50–60", color: "#EF4444", bg: "#FEF2F2", min: 50, max: 60 },
];

const getLevel = (score) => {
  if (score <= 34) return LEVEL_CFG[0];
  if (score <= 49) return LEVEL_CFG[1];
  return LEVEL_CFG[2];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const NAMES = [
  "นายสมชาย ใจดี","นางสาวมาลี รักสุข","นายประสิทธิ์ ทำงาน","นางวิภา สดใส",
  "นายกิตติ เก่งมาก","นางสาวอัญชลี ร่าเริง","นายวีระ ขยันดี","นางรัตนา มีสุข",
  "นายพิทักษ์ ตั้งใจ","นางสาวสุภา สวยงาม","นายอนุชา ดีเลิศ","นางเพ็ญศรี แจ่มใส",
  "นายชัยวัฒน์ รุ่งเรือง","นางสาวนิภา ยิ้มแย้ม","นายสุรศักดิ์ มั่นคง",
  "นางกัลยา ใสสะอาด","นายธนพล ฉลาดดี","นางสาวลัดดา สะอาด",
  "นายปิยะ เฉลียวฉลาด","นางวรรณา สุขสบาย",
];
const DEPTS = ["นโยบาย","ปฏิบัติการ","สนับสนุน"];

const genEmployee = (name, idx) => {
  const tier = idx < 4 ? [2,3] : idx < 11 ? [1,2] : [0,2];
  const answers = Array.from({ length: 20 }, () => rand(tier[0], tier[1]));
  const total = answers.reduce((s, v) => s + v, 0);
  const dimScores = DIMS.map(d => ({
    key: d.key,
    raw: d.items.reduce((s, i) => s + answers[i], 0),
    pct: Math.round((d.items.reduce((s, i) => s + answers[i], 0) / (d.items.length * 3)) * 100),
  }));
  return {
    id: idx + 1, name, dept: DEPTS[idx % 3],
    answers, total,
    level: getLevel(total),
    dimScores,
    totalPct: Math.round((total / 60) * 100),
  };
};

const employees = NAMES.map((n, i) => genEmployee(n, i));

// ─── Aggregates ───────────────────────────────────────────────────────────────
const avgDim = (dim) => Math.round(
  employees.reduce((s, e) => s + e.dimScores.find(d => d.key === dim).pct, 0) / employees.length
);

const orgRadar = DIMS.map(d => ({
  dim: d.icon + " " + d.short,
  fullLabel: d.label,
  "เหงามาก (≥50)": Math.round(
    employees.filter(e => e.level.key === "high").reduce((s, e) => s + e.dimScores.find(x => x.key === d.key).pct, 0) /
    Math.max(employees.filter(e => e.level.key === "high").length, 1)
  ),
  "ทั้งองค์กร": avgDim(d.key),
}));

const deptStackData = DEPTS.map(dept => {
  const grp = employees.filter(e => e.dept === dept);
  return {
    name: dept,
    "เหงามาก":     grp.filter(e => e.level.key === "high").length,
    "เหงาปานกลาง": grp.filter(e => e.level.key === "mid").length,
    "เหงาน้อย":    grp.filter(e => e.level.key === "low").length,
  };
});

// ─── Sub-components ───────────────────────────────────────────────────────────
const Tag = ({ label, color, small }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    padding: small ? "1px 8px" : "3px 12px",
    borderRadius: 999, fontSize: small ? 10 : 12, fontWeight: 700,
    fontFamily: "'Sarabun',sans-serif",
  }}>{label}</span>
);

const MiniBar = ({ pct, color }) => (
  <div style={{ height: 5, background: "#1E293B", borderRadius: 3, overflow: "hidden", flex: 1 }}>
    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
  </div>
);

// Gauge
const Gauge = ({ score, size = 200 }) => {
  const pctVal = score / 60;
  const startAngle = -210, endAngle = 30;
  const totalDeg = 240;
  const needleDeg = startAngle + pctVal * totalDeg;
  const cx = size / 2, cy = size * 0.58, r = size * 0.38;
  const toXY = (deg, rad) => ({
    x: cx + rad * Math.cos((deg * Math.PI) / 180),
    y: cy + rad * Math.sin((deg * Math.PI) / 180),
  });
  const arc = (s, e, ro, ri) => {
    const sp = toXY(s, ro), ep = toXY(e, ro), si = toXY(s, ri), ei = toXY(e, ri);
    const lg = Math.abs(e - s) > 180 ? 1 : 0;
    return `M${sp.x} ${sp.y} A${ro} ${ro} 0 ${lg} 1 ${ep.x} ${ep.y} L${ei.x} ${ei.y} A${ri} ${ri} 0 ${lg} 0 ${si.x} ${si.y}Z`;
  };
  const zones = [
    { s: -210, e: -210 + totalDeg * (34 / 60), color: "#6EE7B7" },
    { s: -210 + totalDeg * (34 / 60), e: -210 + totalDeg * (49 / 60), color: "#FCD34D" },
    { s: -210 + totalDeg * (49 / 60), e: 30, color: "#FCA5A5" },
  ];
  const needle = toXY(needleDeg, r * 0.82);
  const lvl = getLevel(score);
  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      {zones.map((z, i) => <path key={i} d={arc(z.s, z.e, r, r * 0.6)} fill={z.color} opacity={0.85} />)}
      {[0, 15, 30, 45, 60].map(v => {
        const deg = startAngle + (v / 60) * totalDeg;
        const o = toXY(deg, r + 4), inn = toXY(deg, r - 2), lbl = toXY(deg, r + 14);
        return (
          <g key={v}>
            <line x1={inn.x} y1={inn.y} x2={o.x} y2={o.y} stroke="#64748B" strokeWidth={1.5} />
            <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={size * 0.055} fill="#94A3B8" fontFamily="'Sarabun',sans-serif">{v}</text>
          </g>
        );
      })}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#1E293B" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size * 0.04} fill="#1E293B" />
      <circle cx={cx} cy={cy} r={size * 0.024} fill="#F8FAFC" />
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fontSize={size * 0.13}
        fontWeight="800" fill={lvl.color} fontFamily="'Sarabun',sans-serif">{score}</text>
      <text x={cx} y={cy + size * 0.21} textAnchor="middle" fontSize={size * 0.06}
        fill="#64748B" fontFamily="'Sarabun',sans-serif">/ 60</text>
    </svg>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1E293B", borderRadius: 10, padding: "12px 16px", fontFamily: "'Sarabun',sans-serif" }}>
      <div style={{ color: "#94A3B8", fontSize: 11, marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 4, alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill }} />
          <span style={{ fontSize: 12, color: "#E2E8F0" }}>{p.name}:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{p.value} คน</span>
        </div>
      ))}
    </div>
  );
};

// IDP suggestions per item
const getIDP = (itemIdx, score) => {
  if (score <= 1) return null;
  const suggestions = [
    "จัดกิจกรรมกลุ่ม / Buddy System / งานอาสาสมัคร",
    "ชมรมหรือกิจกรรมตามความสนใจ / กลุ่ม Peer Support",
    "ฝึกทักษะการอยู่กับตัวเองอย่างมีสุข / Mindfulness",
    "กิจกรรมสร้างเครือข่ายสังคมในองค์กร",
    "กลุ่มแบ่งปันประสบการณ์ / Sharing Circle",
    "ฝึกทักษะการสื่อสาร / ริเริ่มติดต่อผู้อื่นก่อน",
    "สร้างระบบ Check-in ระหว่างเพื่อนร่วมงาน",
    "กิจกรรมทีม / โปรเจกต์ร่วม",
    "กิจกรรมข้ามหน่วยงาน / ค้นหาความสนใจร่วม",
    "ให้คำปรึกษาด้านการสร้างสัมพันธ์ / EAP",
    "พบนักจิตวิทยา / ประเมินซ้ำรายเดือน",
    "ฝึกทักษะการสื่อสาร / โปรแกรม Social Skills",
    "กิจกรรมสร้างความสัมพันธ์เชิงลึก",
    "ชมรมตามความสนใจ / กิจกรรม After Work",
    "กลุ่ม Peer Support / พบนักจิตวิทยา",
    "กิจกรรมสร้างความรู้สึกเป็นส่วนหนึ่ง",
    "กิจกรรมสังสรรค์ / ลดเวลาทำงานคนเดียว",
    "Workshop ทักษะสังคม / กิจกรรม Icebreaker",
    "ให้คำปรึกษาเรื่องความรู้สึกถูกกีดกัน / EAP",
    "กิจกรรมกลุ่มย่อย / Team Building",
  ];
  return suggestions[itemIdx] || "กิจกรรมสร้างสัมพันธ์ในองค์กร";
};

// ─── Main ────────────────────────────────────────────────────────────────────
export default function UCLADashboard() {
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState(null);

  const listData = [...employees]
    .sort((a, b) => b.total - a.total)
    .filter(e => filter === "all" || e.level.key === filter);

  const highGroup = employees.filter(e => e.level.key === "high");
  const midGroup  = employees.filter(e => e.level.key === "mid");
  const lowGroup  = employees.filter(e => e.level.key === "low");
  const orgAvg    = Math.round(employees.reduce((s, e) => s + e.total, 0) / employees.length);

  return (
    <div style={{ fontFamily: "'Sarabun',sans-serif", background: "#F5F3FF", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#4C1D95 0%,#6D28D9 60%,#7C3AED 100%)",
        padding: "24px 32px 0", color: "#fff",
      }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#C4B5FD", textTransform: "uppercase", marginBottom: 6 }}>
                UCLA Loneliness Scale V.3 · มิติสังคม
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>👥 รายงานสุขภาวะสังคมบุคลากร</h1>
              <div style={{ fontSize: 12, color: "#DDD6FE", marginTop: 4 }}>
                NIDA · {employees.length} คน · คะแนนเต็ม 60 · ยิ่งสูง = ยิ่งเหงา
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "เหงามาก", value: highGroup.length, color: "#FCA5A5" },
                { label: "ปานกลาง", value: midGroup.length,  color: "#FCD34D" },
                { label: "ค่าเฉลี่ยองค์กร", value: orgAvg + " คะแนน", color: "#C4B5FD" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.12)", borderRadius: 12,
                  padding: "10px 16px", textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#DDD6FE" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Important note */}
          <div style={{
            background: "rgba(0,0,0,0.25)", borderRadius: "10px 10px 0 0",
            padding: "10px 20px", fontSize: 12, color: "#DDD6FE"
          }}>
            📌 <strong>คะแนนรวม</strong> อ้างอิง Russell (1996) ·
            <strong> 4 มิติเสริม</strong> จัดกลุ่มตามเนื้อหาแบบสอบถาม ไม่ใช่ sub-scale มาตรฐาน ใช้เพื่อออกแบบ IDP เท่านั้น
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "overview",   label: "🏢 ภาพรวมองค์กร" },
              { key: "risklist",   label: "📋 Risk List" },
              { key: "individual", label: "👤 IDP รายบุคคล" },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "10px 20px", borderRadius: "8px 8px 0 0", border: "none",
                cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "'Sarabun',sans-serif",
                background: tab === t.key ? "#F5F3FF" : "transparent",
                color: tab === t.key ? "#4C1D95" : "rgba(255,255,255,0.65)",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 32px" }}>

        {/* ══════ TAB 1: OVERVIEW ══════ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* PRIMARY: คะแนนรวม 3 ระดับ */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 4, height: 20, background: "#7C3AED", borderRadius: 2 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: "#4C1D95" }}>คะแนนรวม — 3 ระดับ (มาตรฐาน Russell, 1996)</div>
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 20, marginLeft: 14 }}>
                ใช้เป็นเกณฑ์หลักในการจัดกลุ่มความเสี่ยง · ยิ่งสูง = ยิ่งเหงา
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr) 1fr", gap: 16 }}>
                {LEVEL_CFG.map(lvl => {
                  const count = employees.filter(e => e.level.key === lvl.key).length;
                  const pct = Math.round((count / employees.length) * 100);
                  return (
                    <div key={lvl.key} style={{
                      background: lvl.bg, borderRadius: 14, padding: "20px 22px",
                      border: `1px solid ${lvl.color}33`
                    }}>
                      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{lvl.range} คะแนน</div>
                      <div style={{ fontSize: 34, fontWeight: 800, color: lvl.color }}>{count}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: lvl.color }}>{lvl.label}</div>
                      <div style={{ height: 6, background: lvl.color + "22", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: lvl.color, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{pct}% ของทั้งหมด</div>
                    </div>
                  );
                })}
                {/* Org avg */}
                <div style={{ background: "#F5F3FF", borderRadius: 14, padding: "20px 22px", border: "1px solid #DDD6FE", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>ค่าเฉลี่ยองค์กร</div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: "#7C3AED" }}>{orgAvg}</div>
                  <div style={{ fontSize: 12, color: "#7C3AED" }}>/ 60 คะแนน</div>
                  <div style={{ fontSize: 11, color: getLevel(orgAvg).color, fontWeight: 700, marginTop: 6 }}>
                    → {getLevel(orgAvg).label}
                  </div>
                </div>
              </div>

              {/* Dept stacked bar */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>แยกตามหน่วยงาน</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={deptStackData} barSize={52} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 13, fontFamily: "'Sarabun',sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                    <Bar dataKey="เหงามาก"     stackId="a" fill="#EF4444" />
                    <Bar dataKey="เหงาปานกลาง" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="เหงาน้อย"    stackId="a" fill="#10B981" radius={[4,4,0,0]} />
                    <Legend wrapperStyle={{ fontFamily: "'Sarabun',sans-serif", fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SUPPLEMENTARY: 4 มิติเสริม */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 4, height: 20, background: "#9CA3AF", borderRadius: 2 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: "#374151" }}>4 มิติเสริม — ใช้เพื่อออกแบบ IDP</div>
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 20, marginLeft: 14 }}>
                จัดกลุ่มตามเนื้อหาแบบสอบถาม ไม่ใช่ sub-scale มาตรฐาน · ใช้ดูว่า "องค์กรนี้อ่อนด้านไหน" เพื่อออกแบบกิจกรรม
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Radar */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                    Radar: โปรไฟล์ 4 มิติ — เหงามาก vs ทั้งองค์กร (%)
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={orgRadar}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="dim" tick={{ fill: "#6B7280", fontSize: 12, fontFamily: "'Sarabun',sans-serif" }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="กลุ่มเหงามาก" dataKey="เหงามาก (≥50)" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} dot={{ fill: "#EF4444", r: 4 }} />
                      <Radar name="ค่าเฉลี่ยองค์กร" dataKey="ทั้งองค์กร" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill: "#7C3AED", r: 3 }} />
                      <Legend wrapperStyle={{ fontFamily: "'Sarabun',sans-serif", fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Dim cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {DIMS.map(d => {
                    const orgPct = avgDim(d.key);
                    const highPct = highGroup.length > 0
                      ? Math.round(highGroup.reduce((s, e) => s + e.dimScores.find(x => x.key === d.key).pct, 0) / highGroup.length)
                      : 0;
                    const severity = orgPct >= 65 ? "สูง" : orgPct >= 45 ? "ปานกลาง" : "ต่ำ";
                    const sevColor = orgPct >= 65 ? "#EF4444" : orgPct >= 45 ? "#F59E0B" : "#10B981";
                    return (
                      <div key={d.key} style={{
                        background: "#F9FAFB", borderRadius: 12, padding: "14px 16px",
                        borderLeft: `4px solid ${d.color}`
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{d.icon} {d.label}</div>
                            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{d.desc}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: d.color }}>{orgPct}%</div>
                            <Tag label={severity} color={sevColor} small />
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, color: "#9CA3AF", width: 60 }}>ทั้งองค์กร</span>
                          <MiniBar pct={orgPct} color={d.color} />
                          <span style={{ fontSize: 10, color: "#9CA3AF", width: 28 }}>{orgPct}%</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                          <span style={{ fontSize: 10, color: "#EF4444", width: 60 }}>เหงามาก</span>
                          <MiniBar pct={highPct} color="#EF4444" />
                          <span style={{ fontSize: 10, color: "#EF4444", width: 28 }}>{highPct}%</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#6B7280", marginTop: 8 }}>
                          💡 กิจกรรม IDP แนะนำ: {
                            d.key === "lonely"   ? "Buddy System / กลุ่ม Peer Support / กิจกรรมอาสา" :
                            d.key === "relation" ? "Workshop ทักษะสื่อสาร / Check-in ระหว่างทีม" :
                            d.key === "self"     ? "กิจกรรมชมรม / Sharing Circle / EAP" :
                            "Team Building / กิจกรรมข้ามหน่วยงาน / Icebreaker"
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB 2: RISK LIST ══════ */}
        {tab === "risklist" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>กรองกลุ่ม:</span>
              {[["all","ทั้งหมด","#7C3AED"],["high","🔴 เหงามาก","#EF4444"],["mid","🟡 ปานกลาง","#F59E0B"],["low","🟢 เหงาน้อย","#10B981"]].map(([key,label,color]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                  fontFamily: "'Sarabun',sans-serif", cursor: "pointer", border: "none",
                  background: filter === key ? color : "#F3F4F6",
                  color: filter === key ? "#fff" : "#6B7280",
                }}>{label}</button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9CA3AF" }}>แสดง {listData.length} คน</span>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr 100px 100px 60px 60px 60px 60px 100px",
                padding: "10px 20px", background: "#F9FAFB",
                borderBottom: "1px solid #F3F4F6", gap: 8
              }}>
                {["#","ชื่อ","หน่วยงาน","ระดับ","😔","🤝","🪞","👥","คะแนนรวม"].map((h, i) => (
                  <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {h}
                  </div>
                ))}
              </div>

              {listData.map((emp, idx) => (
                <div key={emp.id}
                  onClick={() => { setSelectedEmp(emp); setTab("individual"); }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr 100px 100px 60px 60px 60px 60px 100px",
                    padding: "12px 20px", gap: 8, cursor: "pointer",
                    borderBottom: "1px solid #F9FAFB",
                    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                    borderLeft: `3px solid ${emp.level.color}`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F5F3FF"}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA"}
                >
                  <div style={{ fontSize: 11, color: "#9CA3AF", alignSelf: "center" }}>{idx + 1}</div>
                  <div style={{ alignSelf: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{emp.name}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{emp.dept}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", alignSelf: "center" }}>{emp.dept}</div>
                  <div style={{ alignSelf: "center" }}>
                    <Tag label={emp.level.label} color={emp.level.color} small />
                  </div>
                  {/* 4 dim mini bars */}
                  {DIMS.map(d => {
                    const ds = emp.dimScores.find(x => x.key === d.key);
                    return (
                      <div key={d.key} style={{ alignSelf: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: d.color }}>{ds.pct}%</div>
                        <div style={{ width: 40, height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                          <div style={{ width: `${ds.pct}%`, height: "100%", background: d.color }} />
                        </div>
                      </div>
                    );
                  })}
                  {/* คะแนนรวม */}
                  <div style={{ alignSelf: "center", textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: emp.level.color }}>{emp.total}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>/ 60</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
              ไอคอน 😔🤝🪞👥 = 4 มิติเสริม (%) · คะแนนรวม = เกณฑ์หลัก · คลิกชื่อเพื่อดู IDP
            </div>
          </div>
        )}

        {/* ══════ TAB 3: INDIVIDUAL IDP ══════ */}
        {tab === "individual" && (
          <div style={{ display: "flex", gap: 20 }}>

            {/* Left */}
            <div style={{ width: 260, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10 }}>
                เรียงจากคะแนนสูงสุด (เหงาสุด)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 680, overflowY: "auto" }}>
                {[...employees].sort((a, b) => b.total - a.total).map(emp => {
                  const isSelected = selectedEmp?.id === emp.id;
                  return (
                    <div key={emp.id} onClick={() => setSelectedEmp(emp)} style={{
                      background: isSelected ? "#F5F3FF" : "#fff",
                      borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                      border: `1px solid ${isSelected ? "#7C3AED" : "#E5E7EB"}`,
                      transition: "all 0.15s",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{emp.name}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{emp.dept}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: emp.level.color }}>{emp.total}</div>
                          <Tag label={emp.level.label} color={emp.level.color} small />
                        </div>
                      </div>
                      {/* mini dim bars */}
                      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                        {DIMS.map(d => {
                          const ds = emp.dimScores.find(x => x.key === d.key);
                          return (
                            <div key={d.key} style={{ flex: 1 }}>
                              <div style={{ fontSize: 9, color: d.color, textAlign: "center", marginBottom: 2 }}>{d.icon}</div>
                              <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ width: `${ds.pct}%`, height: "100%", background: d.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right */}
            <div style={{ flex: 1 }}>
              {!selectedEmp ? (
                <div style={{ background: "#fff", borderRadius: 16, padding: 60, textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                  <div>เลือกชื่อด้านซ้ายเพื่อดูรายละเอียด IDP</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Profile + Gauge */}
                  <div style={{
                    background: "#fff", borderRadius: 16, padding: 24,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    borderTop: `4px solid ${selectedEmp.level.color}`
                  }}>
                    <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <Gauge score={selectedEmp.total} size={200} />
                        <div style={{
                          background: selectedEmp.level.bg,
                          border: `1px solid ${selectedEmp.level.color}55`,
                          borderRadius: 10, padding: "6px 16px", marginTop: 6, display: "inline-block"
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: selectedEmp.level.color }}>
                            {selectedEmp.level.label}
                          </div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{selectedEmp.level.range} คะแนน</div>
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{selectedEmp.name}</div>
                        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>{selectedEmp.dept}</div>

                        {/* 3 zone bar */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "#6B7280" }}>คะแนนรวม UCLA</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: selectedEmp.level.color }}>{selectedEmp.total} / 60</span>
                          </div>
                          <div style={{ height: 12, background: "#F3F4F6", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                            <div style={{ position: "absolute", left: `${(34/60)*100}%`, top: 0, width: 2, height: "100%", background: "#9CA3AF" }} />
                            <div style={{ position: "absolute", left: `${(49/60)*100}%`, top: 0, width: 2, height: "100%", background: "#9CA3AF" }} />
                            <div style={{ width: `${(selectedEmp.total / 60) * 100}%`, height: "100%", background: selectedEmp.level.color, borderRadius: 6 }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>
                            <span>0 เหงาน้อย</span><span>35 ปานกลาง</span><span>50 เหงามาก</span><span>60</span>
                          </div>
                        </div>

                        {/* 4 dim summary */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                          {DIMS.map(d => {
                            const ds = selectedEmp.dimScores.find(x => x.key === d.key);
                            const lvl = ds.pct >= 65 ? "สูง" : ds.pct >= 45 ? "กลาง" : "ต่ำ";
                            const lvlColor = ds.pct >= 65 ? "#EF4444" : ds.pct >= 45 ? "#F59E0B" : "#10B981";
                            return (
                              <div key={d.key} style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", textAlign: "center", borderTop: `3px solid ${d.color}` }}>
                                <div style={{ fontSize: 16 }}>{d.icon}</div>
                                <div style={{ fontSize: 10, color: "#6B7280", margin: "3px 0" }}>{d.short}</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: d.color }}>{ds.pct}%</div>
                                <Tag label={lvl} color={lvlColor} small />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IDP รายข้อ */}
                  <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#4C1D95", marginBottom: 6 }}>
                      📝 วิเคราะห์รายข้อ — เพื่อออกแบบ IDP
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>
                      แสดงเฉพาะข้อที่คะแนน ≥ 2 (บางครั้ง/บ่อย) · จัดกลุ่มตาม 4 มิติเสริม
                    </div>

                    {DIMS.map(d => {
                      const highItems = d.items
                        .map(i => ({ idx: i, label: ITEM_LABELS[i], score: selectedEmp.answers[i] }))
                        .filter(item => item.score >= 2);
                      if (highItems.length === 0) return (
                        <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                          <span style={{ fontSize: 16 }}>{d.icon}</span>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{d.label}</span>
                          <Tag label="✓ ไม่มีข้อที่น่ากังวล" color="#10B981" small />
                        </div>
                      );
                      return (
                        <div key={d.key} style={{ marginBottom: 16, borderBottom: "1px solid #F3F4F6", paddingBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 18 }}>{d.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.label}</span>
                            <Tag label={`${highItems.length} ข้อน่ากังวล`} color={d.color} small />
                          </div>
                          {highItems.map(item => (
                            <div key={item.idx} style={{
                              background: item.score === 3 ? "#FEF2F2" : "#FFFBEB",
                              borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                              borderLeft: `3px solid ${item.score === 3 ? "#EF4444" : "#F59E0B"}`
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
                                  {item.label}
                                </span>
                                <span style={{
                                  background: item.score === 3 ? "#EF4444" : "#F59E0B",
                                  color: "#fff", padding: "1px 8px", borderRadius: 999,
                                  fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 8
                                }}>
                                  {item.score === 3 ? "บ่อยครั้ง" : "บางครั้ง"}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: "#6B7280" }}>
                                💡 {getIDP(item.idx, item.score)}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* IDP Priority */}
                  <div style={{ background: "#F5F3FF", borderRadius: 12, padding: "16px 20px", border: "1px solid #DDD6FE" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#4C1D95", marginBottom: 12 }}>
                      🎯 ลำดับความสำคัญ IDP มิติสังคม — {selectedEmp.name}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {selectedEmp.level.key === "high" && (
                        <div style={{ flex: 1, background: "#FEF2F2", borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid #EF4444" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444" }}>ด่วน 🔴</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginTop: 4 }}>พบนักจิตวิทยา / EAP</div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>คะแนนสูง ควรประเมินเพิ่มเติม</div>
                        </div>
                      )}
                      {DIMS.map(d => {
                        const ds = selectedEmp.dimScores.find(x => x.key === d.key);
                        if (ds.pct < 50) return null;
                        return (
                          <div key={d.key} style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${d.color}` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: d.color }}>{d.icon} {d.short}</div>
                            <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>
                              {d.key === "lonely"   ? "Buddy System / Peer Support" :
                               d.key === "relation" ? "ทักษะสื่อสาร / Check-in" :
                               d.key === "self"     ? "ชมรม / Sharing Circle" :
                               "Team Building / Icebreaker"}
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ flex: 1, background: "#F0FDF4", borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid #10B981" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981" }}>ติดตาม 🟢</div>
                        <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>ประเมินซ้ำทุก 3 เดือน</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
