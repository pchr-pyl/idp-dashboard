import { useState } from "react";
import {
BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
ResponsiveContainer, RadarChart, Radar, PolarGrid,
PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";

// ─── Constants ──────────────────────────────────────────────────────────────
const DEPTS = ["นโยบาย", "ปฏิบัติการ", "สนับสนุน"];
const NAMES = [
"นายสมชาย ใจดี","นางสาวมาลี รักสุข","นายประสิทธิ์ ทำงาน","นางวิภา สดใส",
"นายกิตติ เก่งมาก","นางสาวอัญชลี ร่าเริง","นายวีระ ขยันดี","นางรัตนา มีสุข",
"นายพิทักษ์ ตั้งใจ","นางสาวสุภา สวยงาม","นายอนุชา ดีเลิศ","นางเพ็ญศรี แจ่มใส",
"นายชัยวัฒน์ รุ่งเรือง","นางสาวนิภา ยิ้มแย้ม","นายสุรศักดิ์ มั่นคง",
"นางกัลยา ใสสะอาด","นายธนพล ฉลาดดี","นางสาวลัดดา สะอาด",
"นายปิยะ เฉลียวฉลาด","นางวรรณา สุขสบาย",
];

// อันตรายในที่ทำงาน 6 ข้อ (ข้อ 85-90)
const HAZARDS = [
{ key: "sunlight",  label: "แสงแดด/แสงจ้า",         icon: "☀️", q: "ข้อ 85", idp: "สวมแว่นกันแดด / หมวก / ครีมกันแดด / จัดตารางหลีกเลี่ยงแดดจัด" },
{ key: "noise",     label: "เสียงดัง/สั่นสะเทือน",  icon: "🔊", q: "ข้อ 86", idp: "สวมที่อุดหู (Ear Plug) / จัดเวลาพักในพื้นที่เงียบ" },
{ key: "chemical",  label: "กลิ่นสารเคมี",           icon: "🧪", q: "ข้อ 87", idp: "สวมหน้ากาก N95 / ตรวจสอบอุปกรณ์ป้องกัน / แจ้งผู้ดูแลความปลอดภัย" },
{ key: "fume",      label: "ควัน/ไอระเหย",           icon: "💨", q: "ข้อ 88", idp: "สวม PPE / ระบายอากาศพื้นที่ทำงาน / พักในที่อากาศถ่ายเท" },
{ key: "posture",   label: "นั่ง/ยืนท่าเดิมนาน",    icon: "🪑", q: "ข้อ 89", idp: "ลุกเดินทุก 30 นาที / ปรับโต๊ะ-เก้าอี้ Ergonomic / ยืดเหยียดกล้ามเนื้อ" },
{ key: "awkward",   label: "ท่าทางฝืนธรรมชาติ",     icon: "🏋️", q: "ข้อ 90", idp: "ฝึก Body Mechanics / ปรับวิธีทำงาน / พบนักกายภาพบำบัด" },
];

// PM2.5 อาการ (ข้อ 92)
const PM_SYMPTOMS = [
{ key: "cough",    label: "ไอ คัดจมูก น้ำมูก แสบคอ" },
{ key: "breath",   label: "หายใจไม่เต็มอิ่ม" },
{ key: "eye",      label: "แสบตา" },
{ key: "headache", label: "ปวดศีรษะ" },
];

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];

// ─── Generate Mock Data ──────────────────────────────────────────────────────
const genEmployee = (name, idx) => {
// ข้อ 84: ความพึงพอใจสิ่งแวดล้อม 0-4
const envSatisfaction = rand(0, 4);

// ข้อ 85-90: อันตราย (0=ไม่ใช่, 1=ใช่ไม่มีผล, 2=ใช่มีผลต่อสุขภาพ)
const hazards = {
sunlight: pick([0,0,0,1,2]),
noise:    pick([0,0,1,1,2]),
chemical: pick([0,0,0,0,2]),
fume:     pick([0,0,0,1,2]),
posture:  pick([0,1,1,2,2]),
awkward:  pick([0,0,1,2,2]),
};

// นับข้อที่ "มีผลต่อสุขภาพ" (=2)
const hazardCount = Object.values(hazards).filter(v => v === 2).length;

// ข้อ 91: PM2.5 (0=ไม่มี, 1=น้อย, 2=ปานกลาง, 3=มาก, 4=รุนแรงมาก)
const pm25Level = pick([0,0,1,1,2,2,3,4]);

// ข้อ 92: อาการจาก PM2.5
const symptoms = {
none:     pm25Level === 0,
cough:    pm25Level >= 2 && rand(0,1) === 1,
breath:   pm25Level >= 3 && rand(0,1) === 1,
eye:      pm25Level >= 2 && rand(0,1) === 1,
headache: pm25Level >= 2 && rand(0,1) === 1,
};
const symptomCount = Object.entries(symptoms).filter(([k,v]) => k !== "none" && v).length;

// ข้อ 93: คุณภาพชีวิตโดยรวม 0-4
const qualityOfLife = rand(0, 4);

// กลุ่มเสี่ยง
// เสี่ยงสูง = มีอันตรายงาน ≥2 ข้อ (มีผลต่อสุขภาพ)
// เฝ้าระวัง = มีอันตราย 1 ข้อ หรือ PM2.5 มาก+มีอาการ
// ปกติ = ไม่มีเลย
const pmRisk = pm25Level >= 3 && symptomCount > 0;
const envRiskScore = hazardCount + (pmRisk ? 1 : 0);
const envGroup = envRiskScore >= 2 ? "high" : envRiskScore >= 1 ? "medium" : "low";

return {
id: idx + 1, name,
dept: DEPTS[idx % 3],
envSatisfaction,
hazards, hazardCount,
pm25Level, symptoms, symptomCount, pmRisk,
qualityOfLife,
envRiskScore, envGroup,
};
};

const employees = NAMES.map((n, i) => genEmployee(n, i));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GROUP_CFG = {
high:   { label: "เสี่ยงสูง",   color: "#EF4444", bg: "#FEF2F2", dot: "🔴" },
medium: { label: "เฝ้าระวัง", color: "#F59E0B", bg: "#FFFBEB", dot: "🟠" },
low:    { label: "ปกติ",        color: "#10B981", bg: "#F0FDF4", dot: "🟢" },
};

const SAT_LABELS = ["แย่มาก","แย่","ปานกลาง","ดี","ดีมาก"];
const SAT_COLORS = ["#EF4444","#F97316","#F59E0B","#22C55E","#10B981"];
const PM_LABELS  = ["ไม่มี","น้อย","ปานกลาง","มาก","รุนแรงมาก"];
const PM_COLORS  = ["#10B981","#84CC16","#F59E0B","#F97316","#EF4444"];
const HAZARD_LABELS = ["ไม่มี","มี ไม่กระทบ","มี กระทบสุขภาพ"];

const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0;

const Tag = ({ label, color, small }) => (
<span style={{
background: color + "22", color, border: `1px solid ${color}44`,
padding: small ? "1px 7px" : "3px 10px",
borderRadius: 999, fontSize: small ? 10 : 11, fontWeight: 700,
fontFamily: "'Sarabun',sans-serif",
}}>{label}</span>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
if (!active || !payload?.length) return null;
return (
<div style={{ background:"#1E293B", borderRadius:10, padding:"12px 16px", fontFamily:"'Sarabun',sans-serif" }}>
<div style={{ color:"#94A3B8", fontSize:11, marginBottom:8 }}>{label}</div>
{payload.map((p, i) => (
<div key={i} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:4 }}>
<div style={{ width:8, height:8, borderRadius:"50%", background:p.fill || p.color }} />
<span style={{ fontSize:12, color:"#E2E8F0" }}>{p.name}:</span>
<span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{p.value} คน</span>
</div>
))}
</div>
);
};

// ─── Main ────────────────────────────────────────────────────────────────────
export default function EnvDashboard() {
const [tab, setTab] = useState("overview");
const [filter, setFilter] = useState("all");
const [selectedEmp, setSelectedEmp] = useState(null);

const listData = [...employees]
.sort((a, b) => b.envRiskScore - a.envRiskScore)
.filter(e => filter === "all" || e.envGroup === filter);

const highRisk   = employees.filter(e => e.envGroup === "high");
const medRisk    = employees.filter(e => e.envGroup === "medium");
const lowRisk    = employees.filter(e => e.envGroup === "low");

// Hazard summary
const hazardSummary = HAZARDS.map(h => ({
...h,
affected: employees.filter(e => e.hazards[h.key] === 2).length,
watch:    employees.filter(e => e.hazards[h.key] === 1).length,
none:     employees.filter(e => e.hazards[h.key] === 0).length,
})).sort((a, b) => b.affected - a.affected);

// PM2.5 summary
const pmSummary = [0,1,2,3,4].map(l => ({
label: PM_LABELS[l], value: employees.filter(e => e.pm25Level === l).length, color: PM_COLORS[l],
}));

// Satisfaction dist
const satDist = [0,1,2,3,4].map(s => ({
label: SAT_LABELS[s], value: employees.filter(e => e.envSatisfaction === s).length, color: SAT_COLORS[s],
}));

// Dept bar data
const deptData = DEPTS.map(d => {
const grp = employees.filter(e => e.dept === d);
return {
name: d,
"เสี่ยงสูง":   grp.filter(e => e.envGroup === "high").length,
"เฝ้าระวัง": grp.filter(e => e.envGroup === "medium").length,
"ปกติ":        grp.filter(e => e.envGroup === "low").length,
};
});

// Radar: hazard profile org
const radarData = HAZARDS.map(h => ({
dim: h.icon + " " + h.label.substring(0, 6),
fullLabel: h.label,
"กระทบสุขภาพ": Math.round((employees.filter(e => e.hazards[h.key] === 2).length / employees.length) * 100),
"มีแต่ไม่กระทบ": Math.round((employees.filter(e => e.hazards[h.key] === 1).length / employees.length) * 100),
}));

const avgSat = (employees.reduce((s,e) => s + e.envSatisfaction, 0) / employees.length).toFixed(1);
const avgQol = (employees.reduce((s,e) => s + e.qualityOfLife, 0) / employees.length).toFixed(1);

return (
<div style={{ fontFamily:"'Sarabun',sans-serif", background:"#F1F5F9", minHeight:"100vh" }}>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  {/* ── Header ── */}
  <div style={{
    background:"linear-gradient(135deg,#1E3A5F 0%,#1D4ED8 60%,#2563EB 100%)",
    padding:"24px 32px 0", color:"#fff"
  }}>
    <div style={{ maxWidth:1140, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:3, color:"#93C5FD", textTransform:"uppercase", marginBottom:6 }}>
            มิติสภาพแวดล้อม · Environment Well-being
          </div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>🌿 รายงานสภาพแวดล้อมบุคลากร</h1>
          <div style={{ fontSize:12, color:"#BFDBFE", marginTop:4 }}>
            NIDA · {employees.length} คน · ข้อ 84-93 เฉพาะที่นำไปใช้ IDP ได้
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {[
            { label:"เสี่ยงสูง",   value:highRisk.length, color:"#FCA5A5" },
            { label:"เฝ้าระวัง", value:medRisk.length,  color:"#FCD34D" },
            { label:"คุณภาพชีวิต", value:`${avgQol}/4`,  color:"#6EE7B7" },
          ].map((s,i) => (
            <div key={i} style={{
              background:"rgba(255,255,255,0.12)", borderRadius:12,
              padding:"10px 16px", textAlign:"center",
              border:"1px solid rgba(255,255,255,0.15)"
            }}>
              <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#BFDBFE" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* note */}
      <div style={{
        background:"rgba(0,0,0,0.2)", borderRadius:"10px 10px 0 0",
        padding:"10px 20px", fontSize:12, color:"#BFDBFE", marginBottom:0
      }}>
        📌 <strong>หมายเหตุ:</strong> รายงานนี้แสดงผลเฉพาะข้อ 84-93 ที่เชื่อมกับการออกแบบ IDP ·
        ข้อ 94-97 (โรคอุบัติใหม่ / ภูมิอากาศ) เก็บข้อมูลครบแต่ไม่นำมาแสดงเนื่องจากไม่ส่งผลต่อ IDP รายบุคคล
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginTop:4 }}>
        {[
          { key:"overview",   label:"🏢 ภาพรวมองค์กร" },
          { key:"risklist",   label:"📋 Risk List" },
          { key:"individual", label:"👤 IDP รายบุคคล" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:"10px 20px", borderRadius:"8px 8px 0 0", border:"none",
            cursor:"pointer", fontSize:13, fontWeight:700,
            fontFamily:"'Sarabun',sans-serif",
            background: tab === t.key ? "#F1F5F9" : "transparent",
            color: tab === t.key ? "#1E3A5F" : "rgba(255,255,255,0.65)",
          }}>{t.label}</button>
        ))}
      </div>
    </div>
  </div>

  <div style={{ maxWidth:1140, margin:"0 auto", padding:"24px 32px" }}>

    {/* ══════ TAB 1: OVERVIEW ══════ */}
    {tab === "overview" && (
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

        {/* กลุ่มเสี่ยง + ความพอใจ + QoL */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>

          {/* Risk groups */}
          <div style={{ background:"#fff", borderRadius:16, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#1E3A5F", marginBottom:16 }}>
              กลุ่มเสี่ยงสภาพแวดล้อม
            </div>
            {Object.entries(GROUP_CFG).map(([key,cfg]) => {
              const count = employees.filter(e => e.envGroup === key).length;
              return (
                <div key={key} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{
                    width:48, height:48, borderRadius:12, background:cfg.bg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:20, flexShrink:0
                  }}>{cfg.dot}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.label}</span>
                      <span style={{ fontSize:18, fontWeight:800, color:cfg.color }}>{count}</span>
                    </div>
                    <div style={{ height:6, background:"#F3F4F6", borderRadius:3, marginTop:4, overflow:"hidden" }}>
                      <div style={{ width:`${pct(count,employees.length)}%`, height:"100%", background:cfg.color, borderRadius:3 }} />
                    </div>
                    <div style={{ fontSize:10, color:"#9CA3AF", marginTop:2 }}>{pct(count,employees.length)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Satisfaction ข้อ 84 */}
          <div style={{ background:"#fff", borderRadius:16, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#1E3A5F", marginBottom:4 }}>
              ความพึงพอใจสิ่งแวดล้อมงาน
            </div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:14 }}>ข้อ 84 · คะแนน 0-4</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:16 }}>
              <span style={{ fontSize:36, fontWeight:800, color: Number(avgSat) >= 3 ? "#10B981" : Number(avgSat) >= 2 ? "#F59E0B" : "#EF4444" }}>{avgSat}</span>
              <span style={{ fontSize:13, color:"#9CA3AF" }}>/ 4 ค่าเฉลี่ย</span>
            </div>
            {satDist.map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0 }} />
                <span style={{ fontSize:11, color:"#6B7280", flex:1 }}>{s.label}</span>
                <div style={{ width:80, height:6, background:"#F3F4F6", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct(s.value,employees.length)}%`, height:"100%", background:s.color }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:s.color, minWidth:20 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Quality of Life ข้อ 93 */}
          <div style={{ background:"#fff", borderRadius:16, padding:22, boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#1E3A5F", marginBottom:4 }}>
              คุณภาพชีวิตโดยรวม
            </div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:14 }}>ข้อ 93 · คะแนน 0-4</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:16 }}>
              <span style={{ fontSize:36, fontWeight:800, color: Number(avgQol) >= 3 ? "#10B981" : Number(avgQol) >= 2 ? "#F59E0B" : "#EF4444" }}>{avgQol}</span>
              <span style={{ fontSize:13, color:"#9CA3AF" }}>/ 4 ค่าเฉลี่ย</span>
            </div>
            {/* QoL distribution */}
            {[0,1,2,3,4].map(v => {
              const count = employees.filter(e => e.qualityOfLife === v).length;
              return (
                <div key={v} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:SAT_COLORS[v], flexShrink:0 }} />
                  <span style={{ fontSize:11, color:"#6B7280", flex:1 }}>{SAT_LABELS[v]}</span>
                  <div style={{ width:80, height:6, background:"#F3F4F6", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${pct(count,employees.length)}%`, height:"100%", background:SAT_COLORS[v] }} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:SAT_COLORS[v], minWidth:20 }}>{count}</span>
                </div>
              );
            })}
            <div style={{ background:"#EFF6FF", borderRadius:8, padding:"8px 10px", marginTop:8, fontSize:11, color:"#1D4ED8" }}>
              💡 คุณภาพชีวิตต่ำ (0-1) = {employees.filter(e=>e.qualityOfLife<=1).length} คน → ควรรวมใน IDP ด้านแวดล้อม
            </div>
          </div>
        </div>

        {/* อันตรายในที่ทำงาน */}
        <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:4, height:20, background:"#1D4ED8", borderRadius:2 }} />
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:"#1E3A5F" }}>อันตรายในสภาพแวดล้อมทำงาน (ข้อ 85-90)</div>
              <div style={{ fontSize:11, color:"#9CA3AF" }}>เรียงจากกระทบสุขภาพมากที่สุด · แดง = กระทบสุขภาพ · เหลือง = มีแต่ไม่กระทบ</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:20 }}>
            {/* Bar chart */}
            <div style={{ flex:1 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hazardSummary} layout="vertical" margin={{ top:0, right:20, left:10, bottom:0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fill:"#9CA3AF", fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="icon" tick={{ fill:"#374151", fontSize:16 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="affected" name="กระทบสุขภาพ" stackId="a" fill="#EF4444" radius={[0,0,0,0]} />
                  <Bar dataKey="watch"    name="มีแต่ไม่กระทบ" stackId="a" fill="#FCD34D" radius={[0,0,0,0]} />
                  <Bar dataKey="none"     name="ไม่มี" stackId="a" fill="#D1FAE5" radius={[0,4,4,0]} />
                  <Legend wrapperStyle={{ fontFamily:"'Sarabun',sans-serif", fontSize:12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hazard list */}
            <div style={{ width:320, flexShrink:0 }}>
              {hazardSummary.map((h,i) => (
                <div key={h.key} style={{
                  display:"flex", alignItems:"center", gap:10, marginBottom:10,
                  padding:"10px 12px", borderRadius:10,
                  background: h.affected > 0 ? "#FEF2F2" : h.watch > 0 ? "#FFFBEB" : "#F9FAFB",
                  border: `1px solid ${h.affected > 0 ? "#FECACA" : h.watch > 0 ? "#FDE68A" : "#F3F4F6"}`
                }}>
                  <span style={{ fontSize:20 }}>{h.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{h.label}</div>
                    <div style={{ fontSize:10, color:"#9CA3AF" }}>{h.q}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {h.affected > 0 && <div style={{ fontSize:13, fontWeight:800, color:"#EF4444" }}>{h.affected} คน</div>}
                    {h.watch > 0    && <div style={{ fontSize:11, color:"#F59E0B" }}>เฝ้าระวัง {h.watch}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PM2.5 + อาการ + Dept */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* PM2.5 */}
          <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:4, height:20, background:"#F97316", borderRadius:2 }} />
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"#1E3A5F" }}>มลพิษ PM2.5 (ข้อ 91-92)</div>
                <div style={{ fontSize:11, color:"#9CA3AF" }}>ระดับในพื้นที่อยู่อาศัย + อาการที่เกิดขึ้น</div>
              </div>
            </div>

            {/* PM level bars */}
            <div style={{ marginBottom:16 }}>
              {pmSummary.map((p,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                  <span style={{ fontSize:12, color:"#6B7280", width:90 }}>{p.label}</span>
                  <div style={{ flex:1, height:8, background:"#F3F4F6", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${pct(p.value,employees.length)}%`, height:"100%", background:p.color, borderRadius:4 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:p.color, minWidth:30 }}>{p.value} คน</span>
                </div>
              ))}
            </div>

            {/* อาการ */}
            <div style={{ background:"#FFF7ED", borderRadius:10, padding:"12px 14px", border:"1px solid #FED7AA" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#92400E", marginBottom:10 }}>
                อาการที่เกิดจาก PM2.5 (ข้อ 92)
              </div>
              {PM_SYMPTOMS.map(s => {
                const count = employees.filter(e => e.symptoms[s.key]).length;
                return (
                  <div key={s.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:12, color:"#6B7280" }}>{s.label}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:60, height:5, background:"#F3F4F6", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ width:`${pct(count,employees.length)}%`, height:"100%", background:"#F97316" }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:"#EA580C", minWidth:30 }}>{count} คน</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize:10, color:"#9A3412", marginTop:8, borderTop:"1px solid #FED7AA", paddingTop:8 }}>
                💡 IDP: แจก N95 / แนะนำติดตาม AQI / พักในอาคารช่วง PM สูง
              </div>
            </div>
          </div>

          {/* Dept breakdown */}
          <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#1E3A5F", marginBottom:4 }}>กลุ่มเสี่ยงแยกหน่วยงาน</div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:16 }}>แดง=เสี่ยงสูง เหลือง=เฝ้าระวัง เขียว=ปกติ</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} barSize={44} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:"#6B7280", fontSize:13, fontFamily:"'Sarabun',sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#9CA3AF", fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(0,0,0,0.03)" }} />
                <Bar dataKey="เสี่ยงสูง"   stackId="a" fill="#EF4444" />
                <Bar dataKey="เฝ้าระวัง" stackId="a" fill="#F59E0B" />
                <Bar dataKey="ปกติ"        stackId="a" fill="#10B981" radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontFamily:"'Sarabun',sans-serif", fontSize:12 }} />
              </BarChart>
            </ResponsiveContainer>

            {/* Radar hazard profile */}
            <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginTop:16, marginBottom:4 }}>
              Radar: โปรไฟล์อันตรายองค์กร
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="dim" tick={{ fill:"#6B7280", fontSize:10, fontFamily:"'Sarabun',sans-serif" }} />
                <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                <Radar name="กระทบสุขภาพ (%)" dataKey="กระทบสุขภาพ" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="มีแต่ไม่กระทบ (%)" dataKey="มีแต่ไม่กระทบ" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 3" />
                <Legend wrapperStyle={{ fontFamily:"'Sarabun',sans-serif", fontSize:11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )}

    {/* ══════ TAB 2: RISK LIST ══════ */}
    {tab === "risklist" && (
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        <div style={{ background:"#fff", borderRadius:14, padding:"14px 20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:13, color:"#6B7280", fontWeight:600 }}>กรองกลุ่ม:</span>
          {[["all","ทั้งหมด","#6366F1"],["high","🔴 เสี่ยงสูง","#EF4444"],["medium","🟠 เฝ้าระวัง","#F59E0B"],["low","🟢 ปกติ","#10B981"]].map(([key,label,color]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:700,
              fontFamily:"'Sarabun',sans-serif", cursor:"pointer", border:"none",
              background: filter === key ? color : "#F3F4F6",
              color: filter === key ? "#fff" : "#6B7280",
            }}>{label}</button>
          ))}
          <span style={{ marginLeft:"auto", fontSize:12, color:"#9CA3AF" }}>แสดง {listData.length} คน</span>
        </div>

        <div style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          {/* Header */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"32px 1fr 100px 80px 160px 140px 80px 90px",
            padding:"10px 20px", background:"#F9FAFB",
            borderBottom:"1px solid #F3F4F6", gap:8
          }}>
            {["#","ชื่อ","หน่วยงาน","ความพอใจ","อันตรายงาน","PM2.5","คุณภาพชีวิต","กลุ่ม"].map((h,i) => (
              <div key={i} style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.5 }}>{h}</div>
            ))}
          </div>

          {listData.map((emp, idx) => {
            const cfg = GROUP_CFG[emp.envGroup];
            return (
              <div key={emp.id}
                onClick={() => { setSelectedEmp(emp); setTab("individual"); }}
                style={{
                  display:"grid",
                  gridTemplateColumns:"32px 1fr 100px 80px 160px 140px 80px 90px",
                  padding:"12px 20px", gap:8, cursor:"pointer",
                  borderBottom:"1px solid #F9FAFB",
                  background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                  borderLeft:`3px solid ${emp.envGroup === "high" ? "#EF4444" : emp.envGroup === "medium" ? "#F59E0B" : "transparent"}`,
                  transition:"background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#F0F9FF"}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#FAFAFA"}
              >
                <div style={{ fontSize:11, color:"#9CA3AF", alignSelf:"center" }}>{idx+1}</div>
                <div style={{ alignSelf:"center" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{emp.name}</div>
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>{emp.dept}</div>
                </div>
                <div style={{ fontSize:12, color:"#6B7280", alignSelf:"center" }}>{emp.dept}</div>
                {/* ความพอใจ */}
                <div style={{ alignSelf:"center" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:SAT_COLORS[emp.envSatisfaction] }}>{emp.envSatisfaction}/4</div>
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>{SAT_LABELS[emp.envSatisfaction]}</div>
                </div>
                {/* อันตราย */}
                <div style={{ alignSelf:"center" }}>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {HAZARDS.map(h => emp.hazards[h.key] === 2 && (
                      <span key={h.key} title={h.label} style={{ fontSize:14 }}>{h.icon}</span>
                    ))}
                    {emp.hazardCount === 0 && <span style={{ fontSize:11, color:"#10B981" }}>ไม่มี</span>}
                  </div>
                  {emp.hazardCount > 0 && <div style={{ fontSize:10, color:"#EF4444" }}>{emp.hazardCount} ข้อที่กระทบสุขภาพ</div>}
                </div>
                {/* PM2.5 */}
                <div style={{ alignSelf:"center" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:PM_COLORS[emp.pm25Level] }}>{PM_LABELS[emp.pm25Level]}</div>
                  {emp.symptomCount > 0 && <div style={{ fontSize:10, color:"#F97316" }}>มีอาการ {emp.symptomCount} อย่าง</div>}
                </div>
                {/* QoL */}
                <div style={{ alignSelf:"center" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:SAT_COLORS[emp.qualityOfLife] }}>{emp.qualityOfLife}/4</div>
                </div>
                {/* Group */}
                <div style={{ alignSelf:"center" }}>
                  <Tag label={`${cfg.dot} ${cfg.label}`} color={cfg.color} small />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* ══════ TAB 3: INDIVIDUAL IDP ══════ */}
    {tab === "individual" && (
      <div style={{ display:"flex", gap:20 }}>

        {/* Left list */}
        <div style={{ width:260, flexShrink:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#6B7280", marginBottom:10 }}>เรียงจากเสี่ยงสูงสุด</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:680, overflowY:"auto" }}>
            {[...employees].sort((a,b) => b.envRiskScore - a.envRiskScore).map(emp => {
              const cfg = GROUP_CFG[emp.envGroup];
              const isSelected = selectedEmp?.id === emp.id;
              return (
                <div key={emp.id} onClick={() => setSelectedEmp(emp)} style={{
                  background: isSelected ? "#EFF6FF" : "#fff",
                  borderRadius:10, padding:"10px 14px", cursor:"pointer",
                  border:`1px solid ${isSelected ? "#1D4ED8" : "#E5E7EB"}`,
                  transition:"all 0.15s"
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{emp.name}</div>
                      <div style={{ fontSize:10, color:"#9CA3AF" }}>{emp.dept}</div>
                    </div>
                    <Tag label={`${cfg.dot} ${cfg.label}`} color={cfg.color} small />
                  </div>
                  <div style={{ display:"flex", gap:4, marginTop:8 }}>
                    {HAZARDS.map(h => emp.hazards[h.key] === 2 && <span key={h.key} style={{ fontSize:12 }}>{h.icon}</span>)}
                    {emp.pmRisk && <span style={{ fontSize:12 }}>🌫️</span>}
                    {emp.qualityOfLife <= 1 && <span style={{ fontSize:12 }}>😟</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right IDP */}
        <div style={{ flex:1 }}>
          {!selectedEmp ? (
            <div style={{ background:"#fff", borderRadius:16, padding:60, textAlign:"center", color:"#9CA3AF", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🌿</div>
              <div>เลือกชื่อด้านซ้ายเพื่อดูรายละเอียด IDP</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Header */}
              <div style={{
                background:"#fff", borderRadius:16, padding:24,
                boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
                borderTop:`4px solid ${GROUP_CFG[selectedEmp.envGroup].color}`
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{selectedEmp.name}</div>
                    <div style={{ fontSize:13, color:"#6B7280" }}>{selectedEmp.dept}</div>
                  </div>
                  <Tag label={`${GROUP_CFG[selectedEmp.envGroup].dot} ${GROUP_CFG[selectedEmp.envGroup].label}`} color={GROUP_CFG[selectedEmp.envGroup].color} />
                </div>

                {/* summary metrics */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:20 }}>
                  {[
                    { label:"ความพึงพอใจสิ่งแวดล้อม", value:`${selectedEmp.envSatisfaction}/4`, sub:SAT_LABELS[selectedEmp.envSatisfaction], color:SAT_COLORS[selectedEmp.envSatisfaction] },
                    { label:"อันตรายที่กระทบสุขภาพ",  value:`${selectedEmp.hazardCount} ข้อ`, sub:selectedEmp.hazardCount >= 2 ? "เสี่ยงสูง" : selectedEmp.hazardCount === 1 ? "เฝ้าระวัง" : "ปลอดภัย", color:selectedEmp.hazardCount >= 2 ? "#EF4444" : selectedEmp.hazardCount === 1 ? "#F59E0B" : "#10B981" },
                    { label:"คุณภาพชีวิตโดยรวม",      value:`${selectedEmp.qualityOfLife}/4`, sub:SAT_LABELS[selectedEmp.qualityOfLife], color:SAT_COLORS[selectedEmp.qualityOfLife] },
                  ].map((m,i) => (
                    <div key={i} style={{ background:"#F9FAFB", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:4 }}>{m.label}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:m.color }}>{m.value}</div>
                      <div style={{ fontSize:10, color:m.color, fontWeight:600 }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* อันตรายงาน IDP */}
              <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:13, fontWeight:800, color:"#1E3A5F", marginBottom:4 }}>⚠️ อันตรายในสภาพแวดล้อมงาน -- แนวทาง IDP</div>
                <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:14 }}>
                  ข้อที่กระทบสุขภาพ = บุคคลป้องกันตนเองได้ · ข้อสีเหลือง = องค์กรต้องแก้ไขเพิ่มเติม
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {HAZARDS.map(h => {
                    const level = selectedEmp.hazards[h.key];
                    if (level === 0) return null;
                    const bgColor = level === 2 ? "#FEF2F2" : "#FFFBEB";
                    const borderColor = level === 2 ? "#FECACA" : "#FDE68A";
                    const textColor = level === 2 ? "#991B1B" : "#92400E";
                    return (
                      <div key={h.key} style={{ background:bgColor, borderRadius:10, padding:"12px 14px", border:`1px solid ${borderColor}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:18 }}>{h.icon}</span>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:textColor }}>{h.label}</div>
                              <div style={{ fontSize:10, color:textColor === "#991B1B" ? "#EF4444" : "#F59E0B" }}>
                                {level === 2 ? "มีผลต่อสุขภาพ" : "มีแต่ไม่มีผล"}
                              </div>
                            </div>
                          </div>
                          <span style={{
                            background: level === 2 ? "#EF4444" : "#F59E0B", color:"#fff",
                            padding:"2px 10px", borderRadius:999, fontSize:10, fontWeight:700
                          }}>{level === 2 ? "🔴 กระทบ" : "🟡 เฝ้าระวัง"}</span>
                        </div>
                        {level === 2 && (
                          <div style={{ background:"#fff", borderRadius:8, padding:"8px 10px", fontSize:11, color:"#374151" }}>
                            💡 <strong>IDP รายบุคคล:</strong> {h.idp}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {selectedEmp.hazardCount === 0 && (
                    <div style={{ textAlign:"center", padding:20, color:"#10B981" }}>
                      <div style={{ fontSize:24 }}>✓</div>
                      <div style={{ fontSize:13, fontWeight:700 }}>ไม่มีอันตรายในที่ทำงาน</div>
                    </div>
                  )}
                </div>
              </div>

              {/* PM2.5 IDP */}
              {(selectedEmp.pm25Level >= 2 || selectedEmp.symptomCount > 0) && (
                <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#1E3A5F", marginBottom:14 }}>🌫️ PM2.5 -- แนวทาง IDP</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div style={{ background:"#FFF7ED", borderRadius:10, padding:"12px 14px", border:"1px solid #FED7AA" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#92400E", marginBottom:6 }}>ระดับ PM2.5 ในพื้นที่</div>
                      <div style={{ fontSize:20, fontWeight:800, color:PM_COLORS[selectedEmp.pm25Level] }}>
                        {PM_LABELS[selectedEmp.pm25Level]}
                      </div>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>ข้อ 91</div>
                    </div>
                    <div style={{ background:"#FFF7ED", borderRadius:10, padding:"12px 14px", border:"1px solid #FED7AA" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#92400E", marginBottom:6 }}>อาการที่มี</div>
                      {PM_SYMPTOMS.map(s => selectedEmp.symptoms[s.key] && (
                        <div key={s.key} style={{ fontSize:11, color:"#EA580C" }}>• {s.label}</div>
                      ))}
                      {selectedEmp.symptomCount === 0 && <div style={{ fontSize:11, color:"#10B981" }}>ไม่มีอาการ</div>}
                    </div>
                  </div>
                  <div style={{ background:"#FEF3C7", borderRadius:10, padding:"10px 14px", marginTop:12, border:"1px solid #FDE68A" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#92400E", marginBottom:6 }}>💡 แนวทาง IDP ด้าน PM2.5</div>
                    <div style={{ fontSize:11, color:"#78350F", display:"flex", flexDirection:"column", gap:4 }}>
                      <div>• ติดตามค่า AQI รายวัน ผ่านแอป AirVisual / IQAir</div>
                      <div>• สวมหน้ากาก N95 เมื่อ PM2.5 &gt; 37.5 μg/m³</div>
                      {selectedEmp.symptoms.breath && <div>• หากหายใจไม่สะดวก ควรพบแพทย์เพื่อตรวจสมรรถภาพปอด</div>}
                      {selectedEmp.symptoms.eye    && <div>• ใช้น้ำตาเทียม / แว่นตากันลม เมื่ออยู่กลางแจ้ง</div>}
                      <div>• หลีกเลี่ยงออกกำลังกายกลางแจ้งช่วง PM สูง</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ระดับบุคคล vs องค์กร note */}
              <div style={{ background:"#EFF6FF", borderRadius:12, padding:"14px 18px", border:"1px solid #BFDBFE" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#1D4ED8", marginBottom:8 }}>
                  📋 หมายเหตุสำหรับ HR -- แยก IDP รายบุคคล vs การแก้ไขระดับองค์กร
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:11, color:"#374151" }}>
                  <div>
                    <div style={{ fontWeight:700, color:"#1D4ED8", marginBottom:4 }}>👤 บุคคลทำได้เอง</div>
                    <div>• ใส่ PPE / หน้ากาก / หมวก</div>
                    <div>• ยืดเหยียด / ลุกเดินทุก 30 นาที</div>
                    <div>• ติดตาม AQI / หลีกเลี่ยงแดดจัด</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, color:"#DC2626", marginBottom:4 }}>🏢 องค์กรต้องแก้ไข</div>
                    <div>• ปรับปรุงระบบระบายอากาศ</div>
                    <div>• จัดโต๊ะ-เก้าอี้ Ergonomic</div>
                    <div>• ลดการสัมผัสสารเคมี/เสียงดัง</div>
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