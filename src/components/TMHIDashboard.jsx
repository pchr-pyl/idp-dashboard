import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";

// ─── TMHI-15 Structure ────────────────────────────────────────────────────────
// 15 ข้อ · ข้อละ 1-4 คะแนน · เต็ม 60
// ข้อ 1-3, 7-15 ปกติ | ข้อ 4-6 Reverse (4→1, 3→2, 2→3, 1→4)
// ยิ่งสูง = สุขภาพจิตดี
// เกณฑ์กรมสุขภาพจิต 2550:
//   51-60 = ดีกว่าคนทั่วไป
//   44-50 = เท่ากับคนทั่วไป
//   ≤ 43  = ต่ำกว่าคนทั่วไป

const LEVEL_CFG = [
  { key: "high", label: "ดีกว่าคนทั่วไป",  range: "51–60", color: "#10B981", bg: "#F0FDF4", min: 51, max: 60 },
  { key: "mid",  label: "เท่ากับคนทั่วไป",  range: "44–50", color: "#F59E0B", bg: "#FFFBEB", min: 44, max: 50 },
  { key: "low",  label: "ต่ำกว่าคนทั่วไป",  range: "≤ 43",  color: "#EF4444", bg: "#FEF2F2", min: 0,  max: 43 },
];

const getLevel = (score) => {
  if (score >= 51) return LEVEL_CFG[0];
  if (score >= 44) return LEVEL_CFG[1];
  return LEVEL_CFG[2];
};

// 5 มิติเสริม (จัดกลุ่มตามเนื้อหา ไม่ใช่ sub-scale มาตรฐาน)
const DIMS = [
  {
    key: "happiness", label: "ความสุขในชีวิต",      short: "ความสุข",   icon: "😊",
    items: [0,1,2],   // 0-based index ใน 15 ข้อ
    color: "#F59E0B",
    desc: "ข้อ 1-3 · พึงพอใจ สบายใจ ภูมิใจในตนเอง",
  },
  {
    key: "stress",    label: "ความยืดหยุ่นทางใจ",   short: "ยืดหยุ่น",  icon: "💪",
    items: [3,4,5],   // ข้อ 4-6 (Reverse แล้ว)
    color: "#6366F1",
    desc: "ข้อ 4-6 (Reverse) · ไม่เบื่อหน่าย ไม่ผิดหวัง ไม่รู้สึกทุกข์",
  },
  {
    key: "selfmgmt",  label: "การจัดการตนเอง",       short: "จัดการ",    icon: "🎯",
    items: [6,7,8],
    color: "#10B981",
    desc: "ข้อ 7-9 · ยอมรับปัญหา ควบคุมอารมณ์ เผชิญเหตุร้าย",
  },
  {
    key: "empathy",   label: "การเห็นอกเห็นใจ",      short: "เห็นใจ",    icon: "🤝",
    items: [9,10,11],
    color: "#EC4899",
    desc: "ข้อ 10-12 · เห็นอกเห็นใจ สุขในการช่วยเหลือ ให้ความช่วยเหลือ",
  },
  {
    key: "family",    label: "ความมั่นคงครอบครัว",    short: "ครอบครัว",  icon: "🏠",
    items: [12,13,14],
    color: "#14B8A6",
    desc: "ข้อ 13-15 · มั่นคงปลอดภัย ครอบครัวดูแล ผูกพันกัน",
  },
];

const ITEM_LABELS = [
  "รู้สึกพึงพอใจในชีวิต",
  "รู้สึกสบายใจ",
  "รู้สึกภูมิใจในตนเอง",
  "รู้สึกเบื่อหน่ายท้อแท้กับการดำเนินชีวิต (R)",
  "รู้สึกผิดหวังในตนเอง (R)",
  "รู้สึกว่าชีวิตมีแต่ความทุกข์ (R)",
  "สามารถทำใจยอมรับปัญหาที่แก้ไขไม่ได้",
  "มั่นใจว่าจะควบคุมอารมณ์ได้เมื่อมีเหตุคับขัน",
  "มั่นใจที่จะเผชิญกับเหตุร้ายแรงในชีวิต",
  "รู้สึกเห็นอกเห็นใจเมื่อผู้อื่นมีความทุกข์",
  "รู้สึกเป็นสุขในการช่วยเหลือผู้อื่นที่มีปัญหา",
  "ให้ความช่วยเหลือแก่ผู้อื่นเมื่อมีโอกาส",
  "รู้สึกมั่นคงปลอดภัยเมื่ออยู่ในครอบครัว",
  "เชื่อว่าครอบครัวจะดูแลเมื่อป่วยหนัก",
  "สมาชิกในครอบครัวมีความรักและผูกพันต่อกัน",
];

// IDP suggestion per item
const IDP_MAP = [
  "กิจกรรม Gratitude Journal / สำรวจสิ่งดีในชีวิตประจำวัน",
  "Mindfulness 10 นาที/วัน / กิจกรรมลดความเครียด",
  "Coaching เสริมสร้างความภาคภูมิใจ / บันทึกความสำเร็จ",
  "โปรแกรมจัดการความเครียด / เทคนิคผ่อนคลาย",
  "พบนักจิตวิทยา / ปรับมุมมองต่อตนเอง (Reframing)",
  "กลุ่ม Peer Support / พูดคุยกับผู้เชี่ยวชาญ EAP",
  "ฝึกทักษะการยอมรับ (Acceptance) / Resilience Training",
  "Workshop จัดการอารมณ์ / EQ Training",
  "โปรแกรม Resilience / กิจกรรมสร้างความแข็งแกร่งทางใจ",
  "กิจกรรมอาสาสมัคร / งานจิตอาสาในองค์กร",
  "สร้างโอกาสช่วยเหลือเพื่อนร่วมงาน / Mentor Program",
  "ส่งเสริมวัฒนธรรมการช่วยเหลือในทีม",
  "กิจกรรม Work-Life Balance / ลดชั่วโมงทำงาน",
  "บริการปรึกษาครอบครัว / EAP Program",
  "กิจกรรมสร้างสัมพันธ์ครอบครัว / Family Day",
];

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
  const tier = idx < 5 ? [1,3] : idx < 13 ? [2,4] : [3,4];
  // raw answers 1-4 per item
  const rawAnswers = Array.from({ length: 15 }, () => rand(tier[0], tier[1]));
  // scored: ข้อ 4-6 (index 3,4,5) reverse = 5 - raw
  const scored = rawAnswers.map((v, i) => (i >= 3 && i <= 5) ? (5 - v) : v);
  const total = scored.reduce((s, v) => s + v, 0);

  const dimScores = DIMS.map(d => {
    const raw = d.items.reduce((s, i) => s + scored[i], 0);
    return {
      key: d.key,
      raw,
      pct: Math.round((raw / (d.items.length * 4)) * 100),
    };
  });

  return {
    id: idx + 1, name, dept: DEPTS[idx % 3],
    rawAnswers, scored, total,
    level: getLevel(total),
    dimScores,
    totalPct: Math.round((total / 60) * 100),
  };
};

const employees = NAMES.map((n, i) => genEmployee(n, i));

// ─── Aggregates ───────────────────────────────────────────────────────────────
const avgDim = (key) => Math.round(
  employees.reduce((s, e) => s + e.dimScores.find(d => d.key === key).pct, 0) / employees.length
);
const orgAvg = Math.round(employees.reduce((s, e) => s + e.total, 0) / employees.length);

const orgRadar = DIMS.map(d => ({
  dim: d.icon + " " + d.short,
  fullLabel: d.label,
  "ต่ำกว่าคนทั่วไป (≤43)": Math.round(
    employees.filter(e => e.level.key === "low")
      .reduce((s, e) => s + e.dimScores.find(x => x.key === d.key).pct, 0) /
    Math.max(employees.filter(e => e.level.key === "low").length, 1)
  ),
  "ค่าเฉลี่ยองค์กร": avgDim(d.key),
}));

const deptData = DEPTS.map(dept => {
  const grp = employees.filter(e => e.dept === dept);
  return {
    name: dept,
    "ดีกว่าคนทั่วไป":  grp.filter(e => e.level.key === "high").length,
    "เท่ากับคนทั่วไป":  grp.filter(e => e.level.key === "mid").length,
    "ต่ำกว่าคนทั่วไป":  grp.filter(e => e.level.key === "low").length,
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
  <div style={{ height: 5, background: "#E5E7EB", borderRadius: 3, overflow: "hidden", flex: 1 }}>
    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
  </div>
);

// Gauge - ยิ่งสูงยิ่งดี (สีกลับจาก UCLA)
const Gauge = ({ score, size = 200 }) => {
  const pctVal = score / 60;
  const startAngle = -210, totalDeg = 240;
  const needleDeg = startAngle + pctVal * totalDeg;
  const cx = size / 2, cy = size * 0.58, r = size * 0.38;
  const toXY = (deg, rad) => ({
    x: cx + rad * Math.cos((deg * Math.PI) / 180),
    y: cy + rad * Math.sin((deg * Math.PI) / 180),
  });
  const arc = (s, e, ro, ri) => {
    const sp = toXY(s, ro), ep = toXY(e, ro);
    const si = toXY(s, ri), ei = toXY(e, ri);
    const lg = Math.abs(e - s) > 180 ? 1 : 0;
    return `M${sp.x} ${sp.y} A${ro} ${ro} 0 ${lg} 1 ${ep.x} ${ep.y} L${ei.x} ${ei.y} A${ri} ${ri} 0 ${lg} 0 ${si.x} ${si.y}Z`;
  };
  // ยิ่งสูงยิ่งดี → แดงซ้าย เขียวขวา
  const zones = [
    { s: -210, e: -210 + totalDeg * (43/60), color: "#FCA5A5" },
    { s: -210 + totalDeg * (43/60), e: -210 + totalDeg * (50/60), color: "#FCD34D" },
    { s: -210 + totalDeg * (50/60), e: 30, color: "#6EE7B7" },
  ];
  const needle = toXY(needleDeg, r * 0.82);
  const lvl = getLevel(score);
  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      {zones.map((z, i) => <path key={i} d={arc(z.s, z.e, r, r * 0.6)} fill={z.color} opacity={0.85} />)}
      {[0,15,30,45,60].map(v => {
        const deg = startAngle + (v/60) * totalDeg;
        const o = toXY(deg, r+4), inn = toXY(deg, r-2), lbl = toXY(deg, r+14);
        return (
          <g key={v}>
            <line x1={inn.x} y1={inn.y} x2={o.x} y2={o.y} stroke="#64748B" strokeWidth={1.5} />
            <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={size*0.055} fill="#94A3B8" fontFamily="'Sarabun',sans-serif">{v}</text>
          </g>
        );
      })}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#1E293B" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size*0.04} fill="#1E293B" />
      <circle cx={cx} cy={cy} r={size*0.024} fill="#F8FAFC" />
      <text x={cx} y={cy+size*0.1} textAnchor="middle" fontSize={size*0.13}
        fontWeight="800" fill={lvl.color} fontFamily="'Sarabun',sans-serif">{score}</text>
      <text x={cx} y={cy+size*0.21} textAnchor="middle" fontSize={size*0.06}
        fill="#64748B" fontFamily="'Sarabun',sans-serif">/ 60</text>
    </svg>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1E293B", borderRadius:10, padding:"12px 16px", fontFamily:"'Sarabun',sans-serif" }}>
      <div style={{ color:"#94A3B8", fontSize:11, marginBottom:8 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:"flex", gap:10, marginBottom:4, alignItems:"center" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:p.fill }} />
          <span style={{ fontSize:12, color:"#E2E8F0" }}>{p.name}:</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{p.value} คน</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────
export default function TMHIDashboard() {
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState(null);

  const listData = [...employees]
    .sort((a,b) => a.total - b.total)
    .filter(e => filter === "all" || e.level.key === filter);

  const lowGroup  = employees.filter(e => e.level.key === "low");
  const midGroup  = employees.filter(e => e.level.key === "mid");
  const highGroup = employees.filter(e => e.level.key === "high");

  return (
    <div style={{ fontFamily:"'Sarabun',sans-serif", background:"#FFF7ED", minHeight:"100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#92400E 0%,#B45309 50%,#D97706 100%)",
        padding:"24px 32px 0", color:"#fff",
      }}>
        <div style={{ maxWidth:1140, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, letterSpacing:3, color:"#FDE68A", textTransform:"uppercase", marginBottom:6 }}>
                TMHI-15 · Thai Mental Health Indicator 2007 · มิติสุขภาพจิต
              </div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>🧠 รายงานสุขภาพจิตบุคลากร</h1>
              <div style={{ fontSize:12, color:"#FDE68A", marginTop:4 }}>
                NIDA · {employees.length} คน · คะแนนเต็ม 60 · ยิ่งสูง = สุขภาพจิตดีกว่า
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              {[
                { label:"ต่ำกว่าคนทั่วไป", value:lowGroup.length,  color:"#FCA5A5" },
                { label:"เท่ากับคนทั่วไป", value:midGroup.length,  color:"#FCD34D" },
                { label:"ค่าเฉลี่ยองค์กร",  value:orgAvg+" คะแนน", color:"#6EE7B7" },
              ].map((s,i) => (
                <div key={i} style={{
                  background:"rgba(255,255,255,0.12)", borderRadius:12,
                  padding:"10px 16px", textAlign:"center",
                  border:"1px solid rgba(255,255,255,0.2)"
                }}>
                  <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:"#FDE68A" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:"10px 10px 0 0", padding:"10px 20px", fontSize:12, color:"#FDE68A" }}>
            📌 <strong>คะแนนรวม</strong> อ้างอิงเกณฑ์กรมสุขภาพจิต 2550 ·
            <strong> 5 มิติเสริม</strong> จัดกลุ่มตามเนื้อหาแบบสอบถาม ไม่ใช่ sub-scale มาตรฐาน ·
            ข้อ 4-6 คิดคะแนน Reverse แล้ว
          </div>

          <div style={{ display:"flex", gap:4 }}>
            {[
              { key:"overview",   label:"🏢 ภาพรวมองค์กร" },
              { key:"risklist",   label:"📋 Risk List" },
              { key:"individual", label:"👤 IDP รายบุคคล" },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding:"10px 20px", borderRadius:"8px 8px 0 0", border:"none",
                cursor:"pointer", fontSize:13, fontWeight:700,
                fontFamily:"'Sarabun',sans-serif",
                background: tab === t.key ? "#FFF7ED" : "transparent",
                color: tab === t.key ? "#92400E" : "rgba(255,255,255,0.65)",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1140, margin:"0 auto", padding:"24px 32px" }}>

        {/* ══ TAB 1: OVERVIEW ══ */}
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* PRIMARY: คะแนนรวม 3 ระดับ */}
            <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <div style={{ width:4, height:20, background:"#D97706", borderRadius:2 }} />
                <div style={{ fontSize:15, fontWeight:800, color:"#92400E" }}>คะแนนรวม — 3 ระดับ (เกณฑ์กรมสุขภาพจิต 2550)</div>
              </div>
              <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:20, marginLeft:14 }}>
                ใช้เป็นเกณฑ์หลักในการจัดกลุ่มความเสี่ยง · ยิ่งสูง = สุขภาพจิตดีกว่า
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr) 1fr", gap:16 }}>
                {LEVEL_CFG.map(lvl => {
                  const count = employees.filter(e => e.level.key === lvl.key).length;
                  const p = Math.round((count/employees.length)*100);
                  return (
                    <div key={lvl.key} style={{ background:lvl.bg, borderRadius:14, padding:"20px 22px", border:`1px solid ${lvl.color}33` }}>
                      <div style={{ fontSize:11, color:"#6B7280", marginBottom:4 }}>{lvl.range} คะแนน</div>
                      <div style={{ fontSize:34, fontWeight:800, color:lvl.color }}>{count}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:lvl.color }}>{lvl.label}</div>
                      <div style={{ height:6, background:lvl.color+"22", borderRadius:3, marginTop:10, overflow:"hidden" }}>
                        <div style={{ width:`${p}%`, height:"100%", background:lvl.color }} />
                      </div>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:6 }}>{p}% ของทั้งหมด</div>
                    </div>
                  );
                })}
                <div style={{ background:"#FFF7ED", borderRadius:14, padding:"20px 22px", border:"1px solid #FDE68A", textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:4 }}>ค่าเฉลี่ยองค์กร</div>
                  <div style={{ fontSize:34, fontWeight:800, color:"#D97706" }}>{orgAvg}</div>
                  <div style={{ fontSize:12, color:"#D97706" }}>/ 60 คะแนน</div>
                  <div style={{ fontSize:11, color:getLevel(orgAvg).color, fontWeight:700, marginTop:6 }}>
                    → {getLevel(orgAvg).label}
                  </div>
                </div>
              </div>

              <div style={{ marginTop:24 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:12 }}>แยกตามหน่วยงาน</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={deptData} barSize={52} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill:"#6B7280", fontSize:13, fontFamily:"'Sarabun',sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"#9CA3AF", fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(0,0,0,0.02)" }} />
                    <Bar dataKey="ต่ำกว่าคนทั่วไป"  stackId="a" fill="#EF4444" />
                    <Bar dataKey="เท่ากับคนทั่วไป"  stackId="a" fill="#F59E0B" />
                    <Bar dataKey="ดีกว่าคนทั่วไป"  stackId="a" fill="#10B981" radius={[4,4,0,0]} />
                    <Legend wrapperStyle={{ fontFamily:"'Sarabun',sans-serif", fontSize:12 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SUPPLEMENTARY: 5 มิติเสริม */}
            <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <div style={{ width:4, height:20, background:"#9CA3AF", borderRadius:2 }} />
                <div style={{ fontSize:15, fontWeight:800, color:"#374151" }}>5 มิติเสริม — ใช้เพื่อออกแบบ IDP</div>
              </div>
              <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:20, marginLeft:14 }}>
                จัดกลุ่มตามเนื้อหาแบบสอบถาม ไม่ใช่ sub-scale มาตรฐาน · ใช้ดูว่า "องค์กรนี้อ่อนด้านไหน"
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>
                    Radar: โปรไฟล์ 5 มิติ — ต่ำกว่าคนทั่วไป vs ค่าเฉลี่ยองค์กร (%)
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={orgRadar}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="dim" tick={{ fill:"#6B7280", fontSize:11, fontFamily:"'Sarabun',sans-serif" }} />
                      <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                      <Radar name="กลุ่มต่ำกว่าคนทั่วไป" dataKey="ต่ำกว่าคนทั่วไป (≤43)" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} dot={{ fill:"#EF4444", r:4 }} />
                      <Radar name="ค่าเฉลี่ยองค์กร" dataKey="ค่าเฉลี่ยองค์กร" stroke="#D97706" fill="#D97706" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill:"#D97706", r:3 }} />
                      <Legend wrapperStyle={{ fontFamily:"'Sarabun',sans-serif", fontSize:12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {DIMS.map(d => {
                    const orgPct = avgDim(d.key);
                    const lowPct = lowGroup.length > 0
                      ? Math.round(lowGroup.reduce((s,e) => s + e.dimScores.find(x=>x.key===d.key).pct, 0) / lowGroup.length)
                      : 0;
                    const sev = orgPct <= 50 ? "ต่ำ" : orgPct <= 70 ? "ปานกลาง" : "สูง";
                    const sevColor = orgPct <= 50 ? "#EF4444" : orgPct <= 70 ? "#F59E0B" : "#10B981";
                    return (
                      <div key={d.key} style={{ background:"#F9FAFB", borderRadius:10, padding:"12px 14px", borderLeft:`4px solid ${d.color}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{d.icon} {d.label}</div>
                            <div style={{ fontSize:10, color:"#9CA3AF" }}>{d.desc}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:18, fontWeight:800, color:d.color }}>{orgPct}%</div>
                            <Tag label={sev} color={sevColor} small />
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:10, color:"#9CA3AF", width:60 }}>ทั้งองค์กร</span>
                          <MiniBar pct={orgPct} color={d.color} />
                          <span style={{ fontSize:10, color:"#9CA3AF", width:28 }}>{orgPct}%</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
                          <span style={{ fontSize:10, color:"#EF4444", width:60 }}>กลุ่มเสี่ยง</span>
                          <MiniBar pct={lowPct} color="#EF4444" />
                          <span style={{ fontSize:10, color:"#EF4444", width:28 }}>{lowPct}%</span>
                        </div>
                        <div style={{ fontSize:10, color:"#6B7280", marginTop:6 }}>
                          💡 {d.key==="happiness" ? "Gratitude Journal / Mindfulness" :
                              d.key==="stress"    ? "จัดการความเครียด / EAP / Resilience" :
                              d.key==="selfmgmt"  ? "EQ Training / Coaching" :
                              d.key==="empathy"   ? "กิจกรรมอาสา / Mentor Program" :
                              "Work-Life Balance / Family Day"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: RISK LIST ══ */}
        {tab === "risklist" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"#fff", borderRadius:14, padding:"14px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:13, color:"#6B7280", fontWeight:600 }}>กรองกลุ่ม:</span>
              {[["all","ทั้งหมด","#D97706"],["low","🔴 ต่ำกว่าคนทั่วไป","#EF4444"],["mid","🟡 เท่ากับ","#F59E0B"],["high","🟢 ดีกว่า","#10B981"]].map(([key,label,color]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:700,
                  fontFamily:"'Sarabun',sans-serif", cursor:"pointer", border:"none",
                  background: filter===key ? color : "#F3F4F6",
                  color: filter===key ? "#fff" : "#6B7280",
                }}>{label}</button>
              ))}
              <span style={{ marginLeft:"auto", fontSize:12, color:"#9CA3AF" }}>แสดง {listData.length} คน</span>
            </div>

            <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{
                display:"grid",
                gridTemplateColumns:"28px 1fr 100px 100px 56px 56px 56px 56px 56px 100px",
                padding:"10px 20px", background:"#F9FAFB", borderBottom:"1px solid #F3F4F6", gap:6
              }}>
                {["#","ชื่อ","หน่วยงาน","ระดับ","😊","💪","🎯","🤝","🏠","คะแนนรวม"].map((h,i) => (
                  <div key={i} style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5 }}>{h}</div>
                ))}
              </div>

              {listData.map((emp, idx) => (
                <div key={emp.id}
                  onClick={() => { setSelectedEmp(emp); setTab("individual"); }}
                  style={{
                    display:"grid",
                    gridTemplateColumns:"28px 1fr 100px 100px 56px 56px 56px 56px 56px 100px",
                    padding:"12px 20px", gap:6, cursor:"pointer",
                    borderBottom:"1px solid #F9FAFB",
                    background: idx%2===0 ? "#fff" : "#FAFAFA",
                    borderLeft:`3px solid ${emp.level.color}`,
                    transition:"background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="#FFF7ED"}
                  onMouseLeave={e => e.currentTarget.style.background=idx%2===0?"#fff":"#FAFAFA"}
                >
                  <div style={{ fontSize:11, color:"#9CA3AF", alignSelf:"center" }}>{idx+1}</div>
                  <div style={{ alignSelf:"center" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{emp.name}</div>
                    <div style={{ fontSize:10, color:"#9CA3AF" }}>{emp.dept}</div>
                  </div>
                  <div style={{ fontSize:12, color:"#6B7280", alignSelf:"center" }}>{emp.dept}</div>
                  <div style={{ alignSelf:"center" }}><Tag label={emp.level.label} color={emp.level.color} small /></div>
                  {DIMS.map(d => {
                    const ds = emp.dimScores.find(x => x.key===d.key);
                    return (
                      <div key={d.key} style={{ alignSelf:"center" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:d.color }}>{ds.pct}%</div>
                        <div style={{ width:36, height:4, background:"#F3F4F6", borderRadius:2, overflow:"hidden", marginTop:3 }}>
                          <div style={{ width:`${ds.pct}%`, height:"100%", background:d.color }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ alignSelf:"center", textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:emp.level.color }}>{emp.total}</div>
                    <div style={{ fontSize:10, color:"#9CA3AF" }}>/ 60</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:"#9CA3AF", textAlign:"center" }}>
              ไอคอน 😊💪🎯🤝🏠 = 5 มิติเสริม (%) · คะแนนรวม = เกณฑ์หลัก · คลิกชื่อเพื่อดู IDP
            </div>
          </div>
        )}

        {/* ══ TAB 3: IDP รายบุคคล ══ */}
        {tab === "individual" && (
          <div style={{ display:"flex", gap:20 }}>
            <div style={{ width:260, flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#6B7280", marginBottom:10 }}>เรียงจากคะแนนต่ำสุด (เสี่ยงสุด)</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:680, overflowY:"auto" }}>
                {[...employees].sort((a,b)=>a.total-b.total).map(emp => {
                  const isSelected = selectedEmp?.id===emp.id;
                  return (
                    <div key={emp.id} onClick={() => setSelectedEmp(emp)} style={{
                      background: isSelected?"#FFF7ED":"#fff",
                      borderRadius:10, padding:"10px 14px", cursor:"pointer",
                      border:`1px solid ${isSelected?"#D97706":"#E5E7EB"}`,
                      transition:"all 0.15s"
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{emp.name}</div>
                          <div style={{ fontSize:10, color:"#9CA3AF" }}>{emp.dept}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:18, fontWeight:800, color:emp.level.color }}>{emp.total}</div>
                          <Tag label={emp.level.label} color={emp.level.color} small />
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:4, marginTop:8 }}>
                        {DIMS.map(d => {
                          const ds = emp.dimScores.find(x=>x.key===d.key);
                          return (
                            <div key={d.key} style={{ flex:1 }}>
                              <div style={{ fontSize:9, color:d.color, textAlign:"center", marginBottom:2 }}>{d.icon}</div>
                              <div style={{ height:4, background:"#F3F4F6", borderRadius:2, overflow:"hidden" }}>
                                <div style={{ width:`${ds.pct}%`, height:"100%", background:d.color }} />
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

            <div style={{ flex:1 }}>
              {!selectedEmp ? (
                <div style={{ background:"#fff", borderRadius:16, padding:60, textAlign:"center", color:"#9CA3AF", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🧠</div>
                  <div>เลือกชื่อด้านซ้ายเพื่อดูรายละเอียด IDP</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {/* Profile + Gauge */}
                  <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", borderTop:`4px solid ${selectedEmp.level.color}` }}>
                    <div style={{ display:"flex", gap:28, alignItems:"center" }}>
                      <div style={{ textAlign:"center", flexShrink:0 }}>
                        <Gauge score={selectedEmp.total} size={200} />
                        <div style={{ background:selectedEmp.level.bg, border:`1px solid ${selectedEmp.level.color}55`, borderRadius:10, padding:"6px 16px", marginTop:6, display:"inline-block" }}>
                          <div style={{ fontSize:13, fontWeight:800, color:selectedEmp.level.color }}>{selectedEmp.level.label}</div>
                          <div style={{ fontSize:10, color:"#9CA3AF" }}>{selectedEmp.level.range} คะแนน</div>
                        </div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{selectedEmp.name}</div>
                        <div style={{ fontSize:13, color:"#6B7280", marginBottom:20 }}>{selectedEmp.dept}</div>
                        <div style={{ marginBottom:16 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:12, color:"#6B7280" }}>คะแนนรวม TMHI-15</span>
                            <span style={{ fontSize:14, fontWeight:800, color:selectedEmp.level.color }}>{selectedEmp.total} / 60</span>
                          </div>
                          <div style={{ height:12, background:"#F3F4F6", borderRadius:6, overflow:"hidden", position:"relative" }}>
                            <div style={{ position:"absolute", left:`${(43/60)*100}%`, top:0, width:2, height:"100%", background:"#9CA3AF" }} />
                            <div style={{ position:"absolute", left:`${(50/60)*100}%`, top:0, width:2, height:"100%", background:"#9CA3AF" }} />
                            <div style={{ width:`${(selectedEmp.total/60)*100}%`, height:"100%", background:selectedEmp.level.color, borderRadius:6 }} />
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#9CA3AF", marginTop:3 }}>
                            <span>0 ต่ำกว่า</span><span>44 เท่ากัน</span><span>51 ดีกว่า</span><span>60</span>
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                          {DIMS.map(d => {
                            const ds = selectedEmp.dimScores.find(x=>x.key===d.key);
                            const lvl = ds.pct<=50?"ต่ำ":ds.pct<=70?"กลาง":"สูง";
                            const lvlColor = ds.pct<=50?"#EF4444":ds.pct<=70?"#F59E0B":"#10B981";
                            return (
                              <div key={d.key} style={{ background:"#F9FAFB", borderRadius:8, padding:"8px 6px", textAlign:"center", borderTop:`3px solid ${d.color}` }}>
                                <div style={{ fontSize:16 }}>{d.icon}</div>
                                <div style={{ fontSize:9, color:"#6B7280", margin:"3px 0" }}>{d.short}</div>
                                <div style={{ fontSize:16, fontWeight:800, color:d.color }}>{ds.pct}%</div>
                                <Tag label={lvl} color={lvlColor} small />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IDP รายข้อ */}
                  <div style={{ background:"#fff", borderRadius:14, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#92400E", marginBottom:6 }}>
                      📝 วิเคราะห์รายข้อ — เพื่อออกแบบ IDP
                    </div>
                    <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:16 }}>
                      แสดงเฉพาะข้อที่คะแนนต่ำ (≤2 จาก 4) · จัดกลุ่มตาม 5 มิติเสริม · (R) = ข้อ Reverse แปลงคะแนนแล้ว
                    </div>

                    {DIMS.map(d => {
                      const lowItems = d.items
                        .map(i => ({
                          idx: i,
                          label: ITEM_LABELS[i],
                          score: selectedEmp.scored[i],
                          isReverse: i>=3 && i<=5,
                        }))
                        .filter(item => item.score <= 2);

                      if (lowItems.length === 0) return (
                        <div key={d.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #F3F4F6" }}>
                          <span style={{ fontSize:16 }}>{d.icon}</span>
                          <span style={{ fontSize:12, color:"#6B7280" }}>{d.label}</span>
                          <Tag label="✓ ไม่มีข้อที่น่ากังวล" color="#10B981" small />
                        </div>
                      );

                      return (
                        <div key={d.key} style={{ marginBottom:16, borderBottom:"1px solid #F3F4F6", paddingBottom:16 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                            <span style={{ fontSize:18 }}>{d.icon}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:d.color }}>{d.label}</span>
                            <Tag label={`${lowItems.length} ข้อน่ากังวล`} color={d.color} small />
                          </div>
                          {lowItems.map(item => (
                            <div key={item.idx} style={{
                              background: item.score===1?"#FEF2F2":"#FFFBEB",
                              borderRadius:8, padding:"10px 12px", marginBottom:8,
                              borderLeft:`3px solid ${item.score===1?"#EF4444":"#F59E0B"}`
                            }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                                <span style={{ fontSize:12, color:"#374151", fontWeight:600 }}>
                                  {item.label}
                                  {item.isReverse && <span style={{ fontSize:10, color:"#6366F1", marginLeft:6 }}>(R)</span>}
                                </span>
                                <span style={{
                                  background: item.score===1?"#EF4444":"#F59E0B", color:"#fff",
                                  padding:"1px 8px", borderRadius:999, fontSize:10, fontWeight:700, flexShrink:0, marginLeft:8
                                }}>{item.score}/4</span>
                              </div>
                              <div style={{ fontSize:11, color:"#6B7280" }}>
                                💡 {IDP_MAP[item.idx]}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* IDP Priority */}
                  <div style={{ background:"#FFF7ED", borderRadius:12, padding:"16px 20px", border:"1px solid #FDE68A" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#92400E", marginBottom:12 }}>
                      🎯 ลำดับความสำคัญ IDP มิติสุขภาพจิต — {selectedEmp.name}
                    </div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {selectedEmp.level.key==="low" && (
                        <div style={{ flex:1, minWidth:160, background:"#FEF2F2", borderRadius:10, padding:"12px 14px", borderLeft:"3px solid #EF4444" }}>
                          <div style={{ fontSize:10, fontWeight:700, color:"#EF4444" }}>ด่วน 🔴</div>
                          <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginTop:4 }}>พบนักจิตวิทยา / EAP</div>
                          <div style={{ fontSize:11, color:"#6B7280", marginTop:4 }}>คะแนนต่ำกว่าคนทั่วไป ควรประเมินเพิ่มเติม</div>
                        </div>
                      )}
                      {DIMS.map(d => {
                        const ds = selectedEmp.dimScores.find(x=>x.key===d.key);
                        if (ds.pct > 50) return null;
                        return (
                          <div key={d.key} style={{ flex:1, minWidth:140, background:"#fff", borderRadius:10, padding:"12px 14px", borderLeft:`3px solid ${d.color}`, border:`1px solid ${d.color}33`, borderLeftWidth:3 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:d.color }}>{d.icon} {d.short}</div>
                            <div style={{ fontSize:11, color:"#374151", marginTop:4 }}>
                              {d.key==="happiness"?"Gratitude / Mindfulness":
                               d.key==="stress"   ?"จัดการความเครียด / EAP":
                               d.key==="selfmgmt" ?"EQ Training / Coaching":
                               d.key==="empathy"  ?"กิจกรรมอาสา / Mentor":
                               "Work-Life Balance"}
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ flex:1, minWidth:140, background:"#F0FDF4", borderRadius:10, padding:"12px 14px", borderLeft:"3px solid #10B981" }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#10B981" }}>ติดตาม 🟢</div>
                        <div style={{ fontSize:11, color:"#374151", marginTop:4 }}>ประเมินซ้ำทุก 3 เดือน</div>
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
