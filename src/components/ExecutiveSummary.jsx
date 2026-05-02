import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

// ─── Shared Config ────────────────────────────────────────────────────────────
const DIMS_4 = [
  { key: "physical", label: "กาย",       icon: "🏃", color: "#10B981", light: "#D1FAE5" },
  { key: "mental",   label: "ใจ",         icon: "🧠", color: "#F59E0B", light: "#FEF3C7" },
  { key: "social",   label: "สังคม",     icon: "👥", color: "#8B5CF6", light: "#EDE9FE" },
  { key: "environ",  label: "แวดล้อม",  icon: "🌿", color: "#0EA5E9", light: "#E0F2FE" },
];

const DEPTS = ["นโยบาย","ปฏิบัติการ","สนับสนุน"];
const NAMES = [
  "นายสมชาย ใจดี","นางสาวมาลี รักสุข","นายประสิทธิ์ ทำงาน","นางวิภา สดใส",
  "นายกิตติ เก่งมาก","นางสาวอัญชลี ร่าเริง","นายวีระ ขยันดี","นางรัตนา มีสุข",
  "นายพิทักษ์ ตั้งใจ","นางสาวสุภา สวยงาม","นายอนุชา ดีเลิศ","นางเพ็ญศรี แจ่มใส",
  "นายชัยวัฒน์ รุ่งเรือง","นางสาวนิภา ยิ้มแย้ม","นายสุรศักดิ์ มั่นคง",
  "นางกัลยา ใสสะอาด","นายธนพล ฉลาดดี","นางสาวลัดดา สะอาด",
  "นายปิยะ เฉลียวฉลาด","นางวรรณา สุขสบาย",
];

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// ─── Risk levels per dimension ────────────────────────────────────────────────
// Physical: เสี่ยงสูง/เฝ้าระวัง/ปกติ → score 0/1/2
// Mental (TMHI-15): ต่ำกว่า/เท่า/ดีกว่า → 0/1/2
// Social (UCLA): เหงามาก/ปานกลาง/น้อย → 0/1/2
// Environment: เสี่ยงสูง/เฝ้าระวัง/ปกติ → 0/1/2

const RISK_LABEL = [
  ["เสี่ยงสูง","เฝ้าระวัง","ปกติ"],          // physical
  ["ต่ำกว่าคนทั่วไป","เท่ากับ","ดีกว่า"],    // mental
  ["เหงามาก","ปานกลาง","เหงาน้อย"],           // social
  ["เสี่ยงสูง","เฝ้าระวัง","ปกติ"],          // environ
];
const RISK_COLOR = ["#EF4444","#F59E0B","#10B981"];

const genEmployee = (name, idx) => {
  const scores = DIMS_4.map(() => rand(0,2));
  const highCount = scores.filter(s => s === 0).length;
  // 4 groups: A=3-4มิติ B=2มิติ C=1มิติ D=ไม่มี
  const overallGroup = highCount >= 3 ? "A" : highCount === 2 ? "B" : highCount === 1 ? "C" : "D";
  return { id:idx+1, name, dept: DEPTS[idx%3], scores, highCount, overallGroup };
};

const employees = NAMES.map((n,i) => genEmployee(n,i));

// ─── Aggregates ───────────────────────────────────────────────────────────────
const GROUP_A = employees.filter(e => e.overallGroup==="A");
const GROUP_B = employees.filter(e => e.overallGroup==="B");
const GROUP_C = employees.filter(e => e.overallGroup==="C");
const GROUP_D = employees.filter(e => e.overallGroup==="D");

const dimStats = DIMS_4.map((d,di) => ({
  ...d,
  high:   employees.filter(e => e.scores[di]===0).length,
  medium: employees.filter(e => e.scores[di]===1).length,
  low:    employees.filter(e => e.scores[di]===2).length,
  highPct: Math.round((employees.filter(e=>e.scores[di]===0).length/employees.length)*100),
}));

const deptData = DEPTS.map(dept => {
  const g = employees.filter(e => e.dept===dept);
  return {
    name: dept,
    "กลุ่ม A": g.filter(e=>e.overallGroup==="A").length,
    "กลุ่ม B": g.filter(e=>e.overallGroup==="B").length,
    "กลุ่ม C": g.filter(e=>e.overallGroup==="C").length,
    "กลุ่ม D": g.filter(e=>e.overallGroup==="D").length,
  };
});

const radarData = DIMS_4.map((d,di) => ({
  dim: d.icon+" "+d.label,
  "กลุ่ม A (%)": Math.round((GROUP_A.filter(e=>e.scores[di]===0).length/Math.max(GROUP_A.length,1))*100),
  "ทั้งองค์กร (%)": Math.round((employees.filter(e=>e.scores[di]===0).length/employees.length)*100),
}));

// cross-dim: คนที่เสี่ยงทั้ง กาย+ใจ
const crossRisk = [
  { label:"กาย + ใจ",         count: employees.filter(e=>e.scores[0]===0&&e.scores[1]===0).length, color:"#EF4444" },
  { label:"ใจ + สังคม",       count: employees.filter(e=>e.scores[1]===0&&e.scores[2]===0).length, color:"#F97316" },
  { label:"กาย + แวดล้อม",    count: employees.filter(e=>e.scores[0]===0&&e.scores[3]===0).length, color:"#F59E0B" },
  { label:"ใจ + สังคม + กาย", count: employees.filter(e=>e.scores[0]===0&&e.scores[1]===0&&e.scores[2]===0).length, color:"#DC2626" },
];

// ─── Components ───────────────────────────────────────────────────────────────
const Tag = ({ label, color, small }) => (
  <span style={{
    background:color+"22", color, border:`1px solid ${color}44`,
    padding: small?"1px 8px":"3px 12px", borderRadius:999,
    fontSize: small?10:12, fontWeight:700, fontFamily:"'Sarabun',sans-serif",
  }}>{label}</span>
);

const ScoreBar = ({ value, max, color, height=8 }) => (
  <div style={{ height, background:"#F3F4F6", borderRadius:4, overflow:"hidden" }}>
    <div style={{ width:`${(value/max)*100}%`, height:"100%", background:color, borderRadius:4 }} />
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#1E293B", borderRadius:10, padding:"12px 16px", fontFamily:"'Sarabun',sans-serif" }}>
      <div style={{ color:"#94A3B8", fontSize:11, marginBottom:8 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:"flex", gap:10, marginBottom:4, alignItems:"center" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:p.fill||p.color }} />
          <span style={{ fontSize:12, color:"#E2E8F0" }}>{p.name}:</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// Overall risk badge — 4 groups
const GROUP_CFG = {
  A:{ label:"กลุ่ม A — เร่งด่วน",  color:"#EF4444", bg:"#FEF2F2", emoji:"🔴", desc:"เสี่ยงสูง 3-4 มิติ" },
  B:{ label:"กลุ่ม B — ดูแลใกล้ชิด", color:"#F97316", bg:"#FFF7ED", emoji:"🟠", desc:"เสี่ยงสูง 2 มิติ" },
  C:{ label:"กลุ่ม C — ติดตาม",    color:"#F59E0B", bg:"#FFFBEB", emoji:"🟡", desc:"เสี่ยงสูง 1 มิติ" },
  D:{ label:"กลุ่ม D — ส่งเสริม",  color:"#10B981", bg:"#F0FDF4", emoji:"🟢", desc:"ไม่มีความเสี่ยง" },
};

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ExecutiveSummary() {
  const [tab, setTab]= useState("summary");
  const [filter, setFilter] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState(null);

  const listData = [...employees]
    .sort((a,b) => b.highCount-a.highCount)
    .filter(e => filter==="all" || e.overallGroup===filter);

  return (
    <div style={{ fontFamily:"'Sarabun',sans-serif", background:"#F8FAFC", minHeight:"100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E3A5F 50%,#1E40AF 100%)", padding:"28px 32px 0", color:"#fff" }}>
        <div style={{ maxWidth:1140, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:4, color:"#93C5FD", textTransform:"uppercase", marginBottom:8 }}>
                Executive Summary · สุขภาวะบุคลากร 4 มิติ
              </div>
              <h1 style={{ margin:0, fontSize:24, fontWeight:800, lineHeight:1.2 }}>
                🌿 รายงานภาพรวมสุขภาวะบุคลากร
              </h1>
              <div style={{ fontSize:13, color:"#93C5FD", marginTop:6 }}>
                สถาบันบัณฑิตพัฒนบริหารศาสตร์ (NIDA) · {employees.length} คน · ครอบคลุม 4 มิติ
              </div>
            </div>
            {/* 4 dim quick score */}
            <div style={{ display:"flex", gap:8 }}>
              {dimStats.map(d => (
                <div key={d.key} style={{
                  background:"rgba(255,255,255,0.1)", borderRadius:12,
                  padding:"10px 14px", textAlign:"center",
                  border:"1px solid rgba(255,255,255,0.15)",
                  backdropFilter:"blur(8px)"
                }}>
                  <div style={{ fontSize:20 }}>{d.icon}</div>
                  <div style={{ fontSize:18, fontWeight:800, color: d.highPct>=40?"#FCA5A5":d.highPct>=20?"#FCD34D":"#6EE7B7" }}>
                    {d.highPct}%
                  </div>
                  <div style={{ fontSize:9, color:"#93C5FD" }}>เสี่ยง</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:4 }}>
            {[
              { key:"summary",  label:"📊 Executive Summary" },
              { key:"risklist", label:"📋 Risk List รวม 4 มิติ" },
              { key:"profile",  label:"👤 Risk Profile รายบุคคล" },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding:"10px 20px", borderRadius:"8px 8px 0 0", border:"none",
                cursor:"pointer", fontSize:13, fontWeight:700,
                fontFamily:"'Sarabun',sans-serif",
                background: tab===t.key?"#F8FAFC":"transparent",
                color: tab===t.key?"#0F172A":"rgba(255,255,255,0.65)",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1140, margin:"0 auto", padding:"24px 32px" }}>

        {/* ══ TAB 1: EXECUTIVE SUMMARY ══ */}
        {tab==="summary" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Overall group A/B/C */}
            <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:4, height:20, background:"#1E40AF", borderRadius:2 }} />
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>กลุ่มความเสี่ยงรวม 4 มิติ</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>A = เสี่ยงสูง 3-4 มิติ · B = 1-2 มิติ · C = ไม่มีความเสี่ยง</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1.2fr", gap:14 }}>
                {["A","B","C","D"].map(g => {
                  const cfg = GROUP_CFG[g];
                  const grp = employees.filter(e=>e.overallGroup===g);
                  const p = Math.round((grp.length/employees.length)*100);
                  return (
                    <div key={g} style={{ background:cfg.bg, borderRadius:14, padding:"18px 20px", border:`1px solid ${cfg.color}33` }}>
                      <div style={{ fontSize:26 }}>{cfg.emoji}</div>
                      <div style={{ fontSize:30, fontWeight:800, color:cfg.color, marginTop:4 }}>{grp.length}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize:10, color:"#9CA3AF", marginTop:2 }}>{cfg.desc}</div>
                      <div style={{ height:5, background:cfg.color+"22", borderRadius:3, marginTop:8, overflow:"hidden" }}>
                        <div style={{ width:`${p}%`, height:"100%", background:cfg.color }} />
                      </div>
                      <div style={{ fontSize:10, color:"#9CA3AF", marginTop:4 }}>{p}% ของทั้งหมด</div>
                    </div>
                  );
                })}

                {/* Dept breakdown mini */}
                <div style={{ background:"#F9FAFB", borderRadius:14, padding:"16px 18px", border:"1px solid #E5E7EB" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:12 }}>แยกหน่วยงาน</div>
                  {DEPTS.map(dept => {
                    const g = employees.filter(e=>e.dept===dept);
                    const a = g.filter(e=>e.overallGroup==="A").length;
                    const b = g.filter(e=>e.overallGroup==="B").length;
                    const c = g.filter(e=>e.overallGroup==="C").length;
                    const d = g.filter(e=>e.overallGroup==="D").length;
                    return (
                      <div key={dept} style={{ marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:4 }}>🏢 {dept}</div>
                        <div style={{ display:"flex", gap:1, height:14, borderRadius:3, overflow:"hidden" }}>
                          {[{v:a,c:"#EF4444"},{v:b,c:"#F97316"},{v:c,c:"#F59E0B"},{v:d,c:"#10B981"}].map((s,i)=>(
                            s.v>0 && <div key={i} style={{ flex:s.v, background:s.c, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:9, color:"#fff", fontWeight:700 }}>{s.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                    {[["A","#EF4444"],["B","#F97316"],["C","#F59E0B"],["D","#10B981"]].map(([g,c])=>(
                      <div key={g} style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <div style={{ width:8, height:8, background:c, borderRadius:2 }} />
                        <span style={{ fontSize:10, color:"#9CA3AF" }}>กลุ่ม {g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Dim summary + Radar */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

              {/* Dim cards */}
              <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:20 }}>ความเสี่ยงแยกรายมิติ</div>
                {dimStats.map(d => {
                  const alarm = d.highPct>=40 ? "สูง" : d.highPct>=20 ? "ปานกลาง" : "ต่ำ";
                  const alarmColor = d.highPct>=40?"#EF4444":d.highPct>=20?"#F59E0B":"#10B981";
                  return (
                    <div key={d.key} style={{
                      background:d.light, borderRadius:12, padding:"16px 18px",
                      marginBottom:12, borderLeft:`4px solid ${d.color}`
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:22 }}>{d.icon}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:800, color:"#1F2937" }}>มิติ{d.label}</div>
                            <div style={{ fontSize:10, color:"#6B7280" }}>เสี่ยงสูง: {d.high} คน · เฝ้าระวัง: {d.medium} คน · ปกติ: {d.low} คน</div>
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:26, fontWeight:800, color:d.color }}>{d.highPct}%</div>
                          <Tag label={`ระดับ${alarm}`} color={alarmColor} small />
                        </div>
                      </div>
                      <div style={{ display:"flex", height:10, borderRadius:5, overflow:"hidden", gap:1 }}>
                        {[{v:d.high,c:RISK_COLOR[0]},{v:d.medium,c:RISK_COLOR[1]},{v:d.low,c:RISK_COLOR[2]}].map((s,i)=>(
                          <div key={i} style={{ flex:s.v, background:s.c, minWidth:s.v>0?4:0 }} />
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:12, marginTop:6, fontSize:10, color:"#9CA3AF" }}>
                        <span>🔴 เสี่ยง {d.highPct}%</span>
                        <span>🟡 เฝ้าระวัง {Math.round((d.medium/employees.length)*100)}%</span>
                        <span>🟢 ปกติ {Math.round((d.low/employees.length)*100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Radar + Cross-risk */}
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                {/* Radar */}
                <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#0F172A", marginBottom:4 }}>
                    Radar: % เสี่ยงสูงรายมิติ — กลุ่ม A vs ทั้งองค์กร
                  </div>
                  <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:8 }}>มิติที่กลุ่ม A สูงกว่าเฉลี่ยมาก = จุดเน้น IDP</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="dim" tick={{ fill:"#6B7280", fontSize:12, fontFamily:"'Sarabun',sans-serif" }} />
                      <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                      <Radar name="กลุ่ม A" dataKey="กลุ่ม A (%)" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} dot={{ fill:"#EF4444", r:4 }} />
                      <Radar name="ทั้งองค์กร" dataKey="ทั้งองค์กร (%)" stroke="#1E40AF" fill="#1E40AF" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill:"#1E40AF", r:3 }} />
                      <Legend wrapperStyle={{ fontFamily:"'Sarabun',sans-serif", fontSize:12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Cross-risk */}
                <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#0F172A", marginBottom:4 }}>ความเสี่ยงข้ามมิติ</div>
                  <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:14 }}>คนที่เสี่ยงสูงในหลายมิติพร้อมกัน</div>
                  {crossRisk.map((cr,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10, background:cr.color+"22",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:18, fontWeight:800, color:cr.color, flexShrink:0
                      }}>{cr.count}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{cr.label}</div>
                        <div style={{ height:5, background:"#F3F4F6", borderRadius:3, marginTop:4, overflow:"hidden" }}>
                          <div style={{ width:`${(cr.count/employees.length)*100}%`, height:"100%", background:cr.color }} />
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:cr.color, fontWeight:700 }}>
                        {Math.round((cr.count/employees.length)*100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Group A spotlight */}
            <div style={{
              background:"linear-gradient(135deg,#FEF2F2,#FFF5F5)",
              borderRadius:16, padding:24, border:"1px solid #FECACA"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#991B1B" }}>
                    🚨 กลุ่ม A — ต้องดูแลเร่งด่วน ({GROUP_A.length} คน)
                  </div>
                  <div style={{ fontSize:12, color:"#B91C1C", marginTop:4 }}>
                    เสี่ยงสูงตั้งแต่ 3 มิติขึ้นไป · ควรจัดทำ IDP ภายใน 2 สัปดาห์
                  </div>
                </div>
                <Tag label={`${GROUP_A.length} คน`} color="#EF4444" />
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {GROUP_A.map(emp => (
                  <div key={emp.id}
                    onClick={() => { setSelectedEmp(emp); setTab("profile"); }}
                    style={{
                      background:"#fff", borderRadius:12, padding:"12px 16px",
                      border:"1px solid #FECACA", cursor:"pointer",
                      transition:"all 0.15s", minWidth:180
                    }}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(239,68,68,0.2)"}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
                  >
                    <div style={{ fontSize:13, fontWeight:700, color:"#991B1B" }}>{emp.name}</div>
                    <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:8 }}>{emp.dept}</div>
                    <div style={{ display:"flex", gap:4 }}>
                      {DIMS_4.map((d,di) => (
                        <div key={d.key} title={d.label} style={{
                          width:20, height:20, borderRadius:5,
                          background: emp.scores[di]===0?d.color:emp.scores[di]===1?d.color+"66":"#E5E7EB",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:10
                        }}>{d.icon}</div>
                      ))}
                    </div>
                    <div style={{ fontSize:10, color:"#EF4444", marginTop:6, fontWeight:600 }}>
                      เสี่ยงสูง {emp.highCount} มิติ · คลิกดู Profile
                    </div>
                  </div>
                ))}
                {GROUP_A.length === 0 && (
                  <div style={{ fontSize:13, color:"#10B981", fontWeight:600 }}>✓ ไม่มีบุคลากรในกลุ่ม A</div>
                )}
              </div>
            </div>

            {/* IDP Recommendations — 4 groups */}
            <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:20 }}>
                💡 แนวทาง IDP แนะนำ แยกตาม 4 กลุ่ม
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                {["A","B","C","D"].map(g => {
                  const cfg = GROUP_CFG[g];
                  const count = employees.filter(e=>e.overallGroup===g).length;
                  const idpItems = {
                    A:[
                      "พบนักจิตวิทยา / EAP ภายใน 2 สัปดาห์",
                      "ออกแบบ IDP เฉพาะบุคคลทุกมิติที่เสี่ยง",
                      "ติดตามรายเดือน",
                      "Buddy System / Peer Support",
                    ],
                    B:[
                      "IDP ใน 2 มิติที่เสี่ยงสูง",
                      "กิจกรรมกลุ่มเฉพาะมิติที่เสี่ยง",
                      "ติดตามทุก 6 สัปดาห์",
                      "Workshop เฉพาะด้าน",
                    ],
                    C:[
                      "IDP ใน 1 มิติที่เสี่ยง",
                      "กิจกรรม Wellness ตามมิติ",
                      "ติดตามทุก 3 เดือน",
                      "กิจกรรมเสริมสุขภาวะ",
                    ],
                    D:[
                      "กิจกรรม Wellness ทั่วไป",
                      "รักษาระดับสุขภาวะที่ดี",
                      "ประเมินซ้ำทุก 6 เดือน",
                      "Wellness Champion / Mentor",
                    ],
                  };
                  return (
                    <div key={g} style={{ background:cfg.bg, borderRadius:14, padding:"18px 18px", border:`1px solid ${cfg.color}33` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                        <div style={{ fontSize:24 }}>{cfg.emoji}</div>
                        <div style={{ fontSize:11, color:cfg.color, fontWeight:700 }}>{count} คน</div>
                      </div>
                      <div style={{ fontSize:12, fontWeight:800, color:cfg.color, marginBottom:4 }}>{cfg.label}</div>
                      <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:12 }}>{cfg.desc}</div>
                      {idpItems[g].map((item,i) => (
                        <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                          <div style={{ width:16, height:16, borderRadius:"50%", background:cfg.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                            <span style={{ fontSize:9, fontWeight:800, color:cfg.color }}>{i+1}</span>
                          </div>
                          <span style={{ fontSize:11, color:"#374151", lineHeight:1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: RISK LIST ══ */}
        {tab==="risklist" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            <div style={{ background:"#fff", borderRadius:14, padding:"14px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:13, color:"#6B7280", fontWeight:600 }}>กรองกลุ่ม:</span>
              {[
                ["all","ทั้งหมด","#1E40AF"],
                ["A","🔴 กลุ่ม A","#EF4444"],
                ["B","🟠 กลุ่ม B","#F97316"],
                ["C","🟡 กลุ่ม C","#F59E0B"],
                ["D","🟢 กลุ่ม D","#10B981"],
              ].map(([key,label,color]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:700,
                  fontFamily:"'Sarabun',sans-serif", cursor:"pointer", border:"none",
                  background: filter===key?color:"#F3F4F6",
                  color: filter===key?"#fff":"#6B7280",
                }}>{label}</button>
              ))}
              <span style={{ marginLeft:"auto", fontSize:12, color:"#9CA3AF" }}>แสดง {listData.length} คน</span>
            </div>

            <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{
                display:"grid", gridTemplateColumns:"28px 1fr 100px 100px 100px 100px 100px 80px",
                padding:"10px 20px", background:"#F9FAFB", borderBottom:"1px solid #F3F4F6", gap:8
              }}>
                {["#","ชื่อ","หน่วยงาน","🏃 กาย","🧠 ใจ","👥 สังคม","🌿 แวดล้อม","กลุ่ม"].map((h,i) => (
                  <div key={i} style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5 }}>{h}</div>
                ))}
              </div>

              {listData.map((emp, idx) => {
                const cfg = GROUP_CFG[emp.overallGroup];
                return (
                  <div key={emp.id}
                    onClick={() => { setSelectedEmp(emp); setTab("profile"); }}
                    style={{
                      display:"grid", gridTemplateColumns:"28px 1fr 100px 100px 100px 100px 100px 80px",
                      padding:"12px 20px", gap:8, cursor:"pointer",
                      borderBottom:"1px solid #F9FAFB",
                      background: idx%2===0?"#fff":"#FAFAFA",
                      borderLeft:`3px solid ${cfg.color}`,
                      transition:"background 0.15s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background="#EFF6FF"}
                    onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#FAFAFA"}
                  >
                    <div style={{ fontSize:11, color:"#9CA3AF", alignSelf:"center" }}>{idx+1}</div>
                    <div style={{ alignSelf:"center" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{emp.name}</div>
                      <div style={{ fontSize:10, color:"#9CA3AF" }}>{emp.dept}</div>
                    </div>
                    <div style={{ fontSize:12, color:"#6B7280", alignSelf:"center" }}>{emp.dept}</div>
                    {DIMS_4.map((d,di) => {
                      const score = emp.scores[di];
                      const rColor = RISK_COLOR[score];
                      return (
                        <div key={d.key} style={{ alignSelf:"center" }}>
                          <span style={{
                            background:rColor+"22", color:rColor,
                            border:`1px solid ${rColor}44`,
                            padding:"2px 8px", borderRadius:999,
                            fontSize:10, fontWeight:700
                          }}>{RISK_LABEL[di][score]}</span>
                        </div>
                      );
                    })}
                    <div style={{ alignSelf:"center" }}>
                      <span style={{
                        background:cfg.color, color:"#fff",
                        padding:"3px 10px", borderRadius:999,
                        fontSize:11, fontWeight:800
                      }}>{emp.overallGroup}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ TAB 3: RISK PROFILE ══ */}
        {tab==="profile" && (
          <div style={{ display:"flex", gap:20 }}>

            {/* Left list */}
            <div style={{ width:260, flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#6B7280", marginBottom:10 }}>เรียงจากเสี่ยงสูงสุด</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:680, overflowY:"auto" }}>
                {[...employees].sort((a,b)=>b.highCount-a.highCount).map(emp => {
                  const cfg = GROUP_CFG[emp.overallGroup];
                  const isSelected = selectedEmp?.id===emp.id;
                  return (
                    <div key={emp.id} onClick={() => setSelectedEmp(emp)} style={{
                      background:isSelected?cfg.bg:"#fff",
                      borderRadius:10, padding:"10px 14px", cursor:"pointer",
                      border:`1px solid ${isSelected?cfg.color:"#E5E7EB"}`,
                      transition:"all 0.15s"
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{emp.name}</div>
                          <div style={{ fontSize:10, color:"#9CA3AF" }}>{emp.dept}</div>
                        </div>
                        <span style={{
                          background:cfg.color, color:"#fff",
                          padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:800
                        }}>{emp.overallGroup}</span>
                      </div>
                      <div style={{ display:"flex", gap:4, marginTop:8 }}>
                        {DIMS_4.map((d,di) => (
                          <div key={d.key} style={{
                            flex:1, height:6, borderRadius:3,
                            background: emp.scores[di]===0?d.color:emp.scores[di]===1?d.color+"66":"#E5E7EB"
                          }} title={d.label} />
                        ))}
                      </div>
                      <div style={{ fontSize:10, color:cfg.color, marginTop:4, fontWeight:600 }}>
                        เสี่ยงสูง {emp.highCount} มิติ
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Profile */}
            <div style={{ flex:1 }}>
              {!selectedEmp ? (
                <div style={{ background:"#fff", borderRadius:16, padding:60, textAlign:"center", color:"#9CA3AF", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🌿</div>
                  <div>เลือกชื่อด้านซ้ายเพื่อดู Risk Profile รายบุคคล</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {/* Header */}
                  <div style={{
                    background:"#fff", borderRadius:16, padding:24,
                    boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
                    borderTop:`4px solid ${GROUP_CFG[selectedEmp.overallGroup].color}`
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                      <div>
                        <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{selectedEmp.name}</div>
                        <div style={{ fontSize:13, color:"#6B7280" }}>{selectedEmp.dept}</div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:42, fontWeight:900, color:GROUP_CFG[selectedEmp.overallGroup].color }}>
                          {GROUP_CFG[selectedEmp.overallGroup].emoji}
                        </div>
                        <div style={{ fontSize:13, fontWeight:800, color:GROUP_CFG[selectedEmp.overallGroup].color }}>
                          {GROUP_CFG[selectedEmp.overallGroup].label}
                        </div>
                        <div style={{ fontSize:11, color:"#9CA3AF" }}>เสี่ยงสูง {selectedEmp.highCount}/4 มิติ</div>
                      </div>
                    </div>

                    {/* 4 dim detail */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                      {DIMS_4.map((d,di) => {
                        const score = selectedEmp.scores[di];
                        const rColor = RISK_COLOR[score];
                        const idpMap = {
                          physical: {
                            0:"ตรวจสุขภาพเชิงลึก · โปรแกรมโภชนาการ · ออกกำลังกาย 150 นาที/สัปดาห์",
                            1:"ติดตามน้ำหนัก BMI · กระตุ้นกิจกรรมทางกาย",
                            2:"รักษาพฤติกรรมสุขภาพที่ดี"
                          },
                          mental: {
                            0:"พบนักจิตวิทยา / EAP · ประเมินซ้ำรายเดือน · Resilience Training",
                            1:"Mindfulness · จัดการความเครียด · ติดตามรายไตรมาส",
                            2:"กิจกรรม Wellness ทั่วไป"
                          },
                          social: {
                            0:"Buddy System · Peer Support · กลุ่มแบ่งปัน",
                            1:"กิจกรรมทีม · Workshop ทักษะสังคม",
                            2:"รักษาเครือข่ายสังคมที่มีอยู่"
                          },
                          environ: {
                            0:"ประเมินสภาพแวดล้อม · PPE · ปรับสภาพงาน",
                            1:"ติดตามอาการ · ปรับปรุงสภาพแวดล้อม",
                            2:"ดูแลสภาพแวดล้อมต่อเนื่อง"
                          },
                        };
                        return (
                          <div key={d.key} style={{
                            background: score===0?d.light:score===1?d.light+"88":"#F9FAFB",
                            borderRadius:12, padding:"14px 16px",
                            border:`1px solid ${score===0?d.color+"55":"#E5E7EB"}`,
                            borderLeft:`4px solid ${rColor}`
                          }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <div style={{ fontSize:20 }}>{d.icon}</div>
                              <span style={{
                                background:rColor+"22", color:rColor,
                                border:`1px solid ${rColor}44`,
                                padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:700
                              }}>{RISK_LABEL[di][score]}</span>
                            </div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#1F2937", marginBottom:6 }}>มิติ{d.label}</div>
                            <div style={{ fontSize:11, color:"#6B7280", lineHeight:1.5 }}>
                              💡 {idpMap[d.key][score]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* IDP Action Plan */}
                  <div style={{ background:"#fff", borderRadius:14, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", marginBottom:16 }}>
                      📋 แผน IDP รวม — {selectedEmp.name}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

                      <div style={{ background:"#EFF6FF", borderRadius:10, padding:"14px 16px", border:"1px solid #BFDBFE" }}>
                        <div style={{ fontSize:12, fontWeight:800, color:"#1D4ED8", marginBottom:10 }}>🎯 กิจกรรมที่ควรทำก่อน</div>
                        {selectedEmp.scores.map((s,di) => s===0 && (
                          <div key={di} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                            <span style={{ fontSize:14, flexShrink:0 }}>{DIMS_4[di].icon}</span>
                            <div>
                              <div style={{ fontSize:11, fontWeight:700, color:"#1D4ED8" }}>มิติ{DIMS_4[di].label}</div>
                              <div style={{ fontSize:11, color:"#374151" }}>
                                {di===0?"ปรับพฤติกรรมสุขภาพ + ตรวจร่างกาย":
                                 di===1?"พบนักจิตวิทยา + EAP":
                                 di===2?"Buddy System + กลุ่ม Peer Support":
                                 "ประเมินสภาพแวดล้อม + PPE"}
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedEmp.highCount===0 && <div style={{ fontSize:12, color:"#10B981" }}>✓ ไม่มีมิติที่เสี่ยงสูง</div>}
                      </div>

                      <div style={{ background:"#F0FDF4", borderRadius:10, padding:"14px 16px", border:"1px solid #BBF7D0" }}>
                        <div style={{ fontSize:12, fontWeight:800, color:"#15803D", marginBottom:10 }}>📅 ตารางติดตาม</div>
                        {[
                          {
                            period:"2 สัปดาห์แรก",
                            action: selectedEmp.overallGroup==="A" ? "นัดพบ HR + ผู้เชี่ยวชาญ / EAP ทันที" :
                                    selectedEmp.overallGroup==="B" ? "นัดพบ HR + ส่ง IDP แผนเบื้องต้น" :
                                    selectedEmp.overallGroup==="C" ? "รับทราบ IDP + เลือกกิจกรรม" :
                                    "รับข้อมูล Wellness ทั่วไป",
                            color:"#EF4444"
                          },
                          {
                            period:"เดือนที่ 1",
                            action: selectedEmp.overallGroup==="D" ? "ไม่จำเป็นต้องติดตาม" : "ประเมินความคืบหน้าครั้งแรก",
                            color:"#F59E0B"
                          },
                          {
                            period:"ไตรมาสที่ 1",
                            action: selectedEmp.overallGroup==="D" ? "ไม่จำเป็นต้องติดตาม" : "ทบทวน IDP + ปรับแผน",
                            color:"#6366F1"
                          },
                          { period:"6 เดือน", action:"ประเมินซ้ำด้วยแบบสำรวจ (ทุกกลุ่ม)", color:"#10B981" },
                        ].map((t,i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"center" }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:t.color, flexShrink:0 }} />
                            <div>
                              <span style={{ fontSize:10, fontWeight:700, color:t.color }}>{t.period}: </span>
                              <span style={{ fontSize:11, color:"#374151" }}>{t.action}</span>
                            </div>
                          </div>
                        ))}
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
