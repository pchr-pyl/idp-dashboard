import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

// ─── Constants ─────────────────────────────────────────────────────────────
const DEPTS = ["นโยบาย", "ปฏิบัติการ", "สนับสนุน"];
const NAMES = [
  "นายสมชาย ใจดี","นางสาวมาลี รักสุข","นายประสิทธิ์ ทำงาน","นางวิภา สดใส",
  "นายกิตติ เก่งมาก","นางสาวอัญชลี ร่าเริง","นายวีระ ขยันดี","นางรัตนา มีสุข",
  "นายพิทักษ์ ตั้งใจ","นางสาวสุภา สวยงาม","นายอนุชา ดีเลิศ","นางเพ็ญศรี แจ่มใส",
  "นายชัยวัฒน์ รุ่งเรือง","นางสาวนิภา ยิ้มแย้ม","นายสุรศักดิ์ มั่นคง",
  "นางกัลยา ใสสะอาด","นายธนพล ฉลาดดี","นางสาวลัดดา สะอาด",
  "นายปิยะ เฉลียวฉลาด","นางวรรณา สุขสบาย",
];

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];

// ─── BMI Helpers ────────────────────────────────────────────────────────────
const getBMILevel = (bmi) => {
  if (bmi < 18.5) return { label: "น้ำหนักน้อย", color: "#60A5FA", risk: false };
  if (bmi < 23)   return { label: "ปกติ",         color: "#10B981", risk: false };
  if (bmi < 25)   return { label: "น้ำหนักเกิน",  color: "#F59E0B", risk: true  };
  if (bmi < 30)   return { label: "อ้วน",          color: "#F97316", risk: true  };
  return               { label: "อ้วนมาก",        color: "#EF4444", risk: true  };
};

const getWaistRisk = (waist, gender) =>
  gender === "ชาย" ? waist > 90 : waist > 80;

// ─── Generate Mock Data ─────────────────────────────────────────────────────
const generateEmployee = (name, idx) => {
  const gender = name.startsWith("นาย") ? "ชาย" : "หญิง";
  const height = gender === "ชาย" ? rand(162, 180) : rand(152, 168);
  const weight = rand(50, 110);
  const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
  const waist = gender === "ชาย" ? rand(72, 102) : rand(66, 92);

  // Diet score: 0-5 (ยิ่งสูง = กินแย่)
  const dietScore = rand(0, 5);
  // Exercise: days/week
  const exerciseDays = rand(0, 6);
  // Sedentary hours/day
  const sedentaryHours = rand(4, 12);

  // Risk factors
  const bmiRisk = getBMILevel(bmi).risk;
  const waistRisk = getWaistRisk(waist, gender);
  const dietRisk = dietScore >= 3;
  const exerciseRisk = exerciseDays < 3;
  const sedentaryRisk = sedentaryHours >= 8;

  const riskCount = [bmiRisk, dietRisk, exerciseRisk].filter(Boolean).length;
  const physicalGroup = riskCount >= 3 ? "high" : riskCount >= 1 ? "medium" : "low";

  // Risky behaviors
  const smokeCig  = pick(["none","none","none","daily","occasional"]);
  const smokeVape = pick(["none","none","none","none","daily","occasional"]);
  const alcohol   = pick(["none","none","daily","weekly","occasional"]);
  const substance = pick(["none","none","none","none","occasional"]);
  const hasRiskyBehavior = smokeCig !== "none" || smokeVape !== "none" || alcohol !== "none" || substance !== "none";

  // NCD
  const ncdList = [];
  if (rand(0,4) === 0) ncdList.push("เบาหวาน");
  if (rand(0,3) === 0) ncdList.push("ความดันโลหิตสูง");
  if (rand(0,6) === 0) ncdList.push("โรคหัวใจ");
  if (rand(0,8) === 0) ncdList.push("โรคไต");
  if (rand(0,9) === 0) ncdList.push("โรคตับ");
  if (rand(0,12) === 0) ncdList.push("มะเร็ง");

  return {
    id: idx + 1, name, gender,
    dept: DEPTS[idx % 3],
    height, weight, bmi,
    bmiLevel: getBMILevel(bmi),
    waist, waistRisk,
    dietScore, exerciseDays, sedentaryHours,
    bmiRisk, dietRisk, exerciseRisk, sedentaryRisk,
    riskCount, physicalGroup,
    smokeCig, smokeVape, alcohol, substance, hasRiskyBehavior,
    ncdList, hasNCD: ncdList.length > 0,
  };
};

const employees = NAMES.map((n, i) => generateEmployee(n, i));

// ─── Helpers ────────────────────────────────────────────────────────────────
const GROUP_CFG = {
  high:   { label: "เสี่ยงสูง",   color: "#EF4444", bg: "#FEF2F2", dot: "🔴", desc: "มี 3 ปัจจัยขึ้นไป" },
  medium: { label: "เฝ้าระวัง", color: "#F59E0B", bg: "#FFFBEB", dot: "🟠", desc: "มี 1-2 ปัจจัย" },
  low:    { label: "ปกติ",        color: "#10B981", bg: "#F0FDF4", dot: "🟢", desc: "ไม่มีปัจจัยเสี่ยง" },
};

const BEHAVIOR_CFG = {
  daily:      { label: "ประจำทุกวัน",  color: "#EF4444", level: 2 },
  weekly:     { label: "2-3ครั้ง/สัปดาห์", color: "#F97316", level: 2 },
  occasional: { label: "บางโอกาส",    color: "#F59E0B", level: 1 },
  none:       { label: "ไม่มี",        color: "#10B981", level: 0 },
};

const NCD_COLORS = {
  "เบาหวาน": "#F97316",
  "ความดันโลหิตสูง": "#EF4444",
  "โรคหัวใจ": "#DC2626",
  "โรคไต": "#7C3AED",
  "โรคตับ": "#92400E",
  "มะเร็ง": "#1E3A5F",
};

const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0;

// ─── Sub-components ─────────────────────────────────────────────────────────
const Tag = ({ label, color, small }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    padding: small ? "1px 7px" : "3px 10px",
    borderRadius: 999, fontSize: small ? 10 : 11, fontWeight: 700,
    fontFamily: "'Sarabun',sans-serif", display: "inline-flex", alignItems: "center", gap: 3
  }}>{label}</span>
);

const MiniBar = ({ value, max, color, height = 6 }) => (
  <div style={{ height, background: "#1E293B", borderRadius: 3, overflow: "hidden" }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
  </div>
);

const RiskDot = ({ active }) => (
  <span style={{
    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
    background: active ? "#EF4444" : "#1E293B",
    border: `1px solid ${active ? "#EF4444" : "#334155"}`
  }} />
);

// ─── Overview Stats ──────────────────────────────────────────────────────────
const highRisk   = employees.filter(e => e.physicalGroup === "high");
const medRisk    = employees.filter(e => e.physicalGroup === "medium");
const lowRisk    = employees.filter(e => e.physicalGroup === "low");
const riskyBeh   = employees.filter(e => e.hasRiskyBehavior);
const ncdGroup   = employees.filter(e => e.hasNCD);
const highAndNCD = employees.filter(e => e.physicalGroup === "high" && e.hasNCD);
const highAndBeh = employees.filter(e => e.physicalGroup === "high" && e.hasRiskyBehavior);

const ncdCounts = ["เบาหวาน","ความดันโลหิตสูง","โรคหัวใจ","โรคไต","โรคตับ","มะเร็ง"].map(d => ({
  name: d, value: employees.filter(e => e.ncdList.includes(d)).length, color: NCD_COLORS[d],
})).filter(d => d.value > 0);

const deptData = DEPTS.map(dept => {
  const grp = employees.filter(e => e.dept === dept);
  return {
    name: dept,
    "เสี่ยงสูง":   grp.filter(e => e.physicalGroup === "high").length,
    "เฝ้าระวัง": grp.filter(e => e.physicalGroup === "medium").length,
    "ปกติ":        grp.filter(e => e.physicalGroup === "low").length,
  };
});

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PhysicalDashboard() {
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState(null);

  const tabs = [
    { key: "overview",  label: "🏢 ภาพรวมองค์กร" },
    { key: "risklist",  label: "📋 Risk List" },
    { key: "individual",label: "👤 IDP รายบุคคล" },
  ];

  const listData = [...employees].sort((a, b) => b.riskCount - a.riskCount)
    .filter(e => filter === "all" || e.physicalGroup === filter);

  return (
    <div style={{ fontFamily: "'Sarabun',sans-serif", background: "#F0F4F8", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #134E4A 0%, #0F766E 50%, #059669 100%)",
        padding: "24px 32px 0", color: "#fff"
      }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#6EE7B7", textTransform: "uppercase", marginBottom: 6 }}>
                มิติสุขภาพกาย · Physical Well-being
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>🏃 รายงานสุขภาพกายบุคลากร</h1>
              <div style={{ fontSize: 12, color: "#A7F3D0", marginTop: 4 }}>
                NIDA · {employees.length} คน · แบ่ง 3 ชั้น: ปัจจัยเสี่ยง · พฤติกรรมเสี่ยง · NCD
              </div>
            </div>
            {/* Quick stats */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "เสี่ยงสูง ≥3 ปัจจัย", value: highRisk.length, color: "#FCA5A5" },
                { label: "มีพฤติกรรมเสี่ยง",    value: riskyBeh.length,  color: "#FCD34D" },
                { label: "มีโรค NCD",            value: ncdGroup.length,  color: "#6EE7B7" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.12)", borderRadius: 12,
                  padding: "10px 16px", textAlign: "center", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#A7F3D0" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Layer legend */}
          <div style={{
            background: "rgba(0,0,0,0.2)", borderRadius: "10px 10px 0 0",
            padding: "10px 20px", display: "flex", gap: 24, fontSize: 12, color: "#D1FAE5"
          }}>
            <span>📐 <strong>ชั้น 1 -- ปัจจัยเสี่ยงกาย:</strong> BMI + การกิน + ออกกำลังกาย</span>
            <span>🚬 <strong>ชั้น 2 -- พฤติกรรมเสี่ยง:</strong> สูบ / ดื่ม / เสพ</span>
            <span>🏥 <strong>ชั้น 3 -- NCD:</strong> โรคที่เป็นอยู่แล้ว (ข้อมูลอ่อนไหว)</span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "10px 20px", borderRadius: "8px 8px 0 0",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "'Sarabun',sans-serif",
                background: tab === t.key ? "#F0F4F8" : "transparent",
                color: tab === t.key ? "#134E4A" : "rgba(255,255,255,0.65)",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 32px" }}>

        {/* ══════════════════════════════════════════════
            TAB 1: OVERVIEW
        ══════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── ชั้น 1: ปัจจัยเสี่ยงกาย ── */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 4, height: 20, background: "#0F766E", borderRadius: 2 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: "#134E4A" }}>ชั้น 1 -- ปัจจัยเสี่ยงกาย</div>
                <span style={{ fontSize: 12, color: "#6B7280" }}>กลุ่มเสี่ยง = มี 3 ปัจจัยขึ้นไป</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr) 1.2fr", gap: 16, marginBottom: 24 }}>
                {Object.entries(GROUP_CFG).map(([key, cfg]) => {
                  const grp = employees.filter(e => e.physicalGroup === key);
                  return (
                    <div key={key} style={{
                      background: cfg.bg, borderRadius: 12, padding: "16px 20px",
                      border: `1px solid ${cfg.color}33`
                    }}>
                      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{cfg.desc}</div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: cfg.color }}>{grp.length}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.dot} {cfg.label}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{pct(grp.length, employees.length)}% ของทั้งหมด</div>
                    </div>
                  );
                })}
                {/* Factor breakdown */}
                <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "16px 20px", border: "1px solid #E5E7EB" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>ปัจจัยแต่ละตัว</div>
                  {[
                    { label: "BMI เกินเกณฑ์",     count: employees.filter(e => e.bmiRisk).length, color: "#F97316" },
                    { label: "พฤติกรรมกินไม่ดี",  count: employees.filter(e => e.dietRisk).length, color: "#EAB308" },
                    { label: "ออกกำลังกายน้อย",   count: employees.filter(e => e.exerciseRisk).length, color: "#6366F1" },
                  ].map((f, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>{f.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.color }}>{f.count} คน</span>
                      </div>
                      <MiniBar value={f.count} max={employees.length} color={f.color} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dept bar */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>กลุ่มเสี่ยงแยกหน่วยงาน</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deptData} barSize={40} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 13, fontFamily: "'Sarabun',sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontFamily: "'Sarabun',sans-serif", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="เสี่ยงสูง"   stackId="a" fill="#EF4444" radius={[0,0,0,0]} />
                  <Bar dataKey="เฝ้าระวัง" stackId="a" fill="#F59E0B" radius={[0,0,0,0]} />
                  <Bar dataKey="ปกติ"        stackId="a" fill="#10B981" radius={[4,4,0,0]} />
                  <Legend wrapperStyle={{ fontFamily: "'Sarabun',sans-serif", fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── ชั้น 2 + ชั้น 3 ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* ชั้น 2: พฤติกรรมเสี่ยง */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 4, height: 20, background: "#D97706", borderRadius: 2 }} />
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#92400E" }}>ชั้น 2 -- พฤติกรรมเสี่ยง</div>
                </div>
                {[
                  { label: "🚬 สูบบุหรี่ (มวน)",      key: "smokeCig",  icon: "🚬" },
                  { label: "💨 สูบบุหรี่ไฟฟ้า",        key: "smokeVape", icon: "💨" },
                  { label: "🍺 ดื่มแอลกอฮอล์",         key: "alcohol",   icon: "🍺" },
                  { label: "💊 สารเสพติดอื่นๆ",        key: "substance", icon: "💊" },
                ].map(b => {
                  const daily = employees.filter(e => e[b.key] === "daily").length;
                  const occ   = employees.filter(e => e[b.key] === "occasional" || e[b.key] === "weekly").length;
                  const none  = employees.length - daily - occ;
                  return (
                    <div key={b.key} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{b.label}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {daily > 0 && <Tag label={`ประจำ ${daily} คน`} color="#EF4444" small />}
                          {occ > 0   && <Tag label={`บางครั้ง ${occ} คน`} color="#F59E0B" small />}
                        </div>
                      </div>
                      <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, display: "flex", overflow: "hidden" }}>
                        <div style={{ width: `${pct(daily, employees.length)}%`, background: "#EF4444" }} />
                        <div style={{ width: `${pct(occ,   employees.length)}%`, background: "#FCD34D" }} />
                        <div style={{ width: `${pct(none,  employees.length)}%`, background: "#D1FAE5" }} />
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 10, color: "#9CA3AF" }}>
                        <span>🔴 ประจำ: {pct(daily, employees.length)}%</span>
                        <span>🟡 บางครั้ง: {pct(occ, employees.length)}%</span>
                        <span>🟢 ไม่มี: {pct(none, employees.length)}%</span>
                      </div>
                    </div>
                  );
                })}

                {/* เสี่ยงกาย + พฤติกรรมเสี่ยง */}
                <div style={{
                  background: "#FFF7ED", borderRadius: 10, padding: "12px 14px",
                  border: "1px solid #FED7AA", marginTop: 8
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>⚠️ เสี่ยงกาย + มีพฤติกรรมเสี่ยง</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#EA580C", marginTop: 4 }}>{highAndBeh.length} คน</div>
                  <div style={{ fontSize: 11, color: "#9A3412" }}>ต้องการ IDP เข้มข้นเป็นพิเศษ</div>
                </div>
              </div>

              {/* ชั้น 3: NCD */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 4, height: 20, background: "#7C3AED", borderRadius: 2 }} />
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#4C1D95" }}>ชั้น 3 -- NCD (โรคที่เป็นอยู่)</div>
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>
                  🔒 ข้อมูลอ่อนไหว · แสดงรายชื่อเฉพาะ HR ผู้รับผิดชอบ
                </div>

                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={ncdCounts} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={2}>
                        {ncdCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} คน`, n]} contentStyle={{ fontFamily: "'Sarabun',sans-serif", fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {ncdCounts.map((d, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                          <span style={{ fontSize: 12, color: "#374151" }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value} คน</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* เสี่ยงกาย + NCD */}
                <div style={{
                  background: "#F5F3FF", borderRadius: 10, padding: "12px 14px",
                  border: "1px solid #DDD6FE"
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4C1D95" }}>🏥 เสี่ยงกาย + มีโรค NCD</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#7C3AED", marginTop: 4 }}>{highAndNCD.length} คน</div>
                  <div style={{ fontSize: 11, color: "#5B21B6" }}>กลุ่มเปราะบาง -- ต้องดูแลเร่งด่วนที่สุด</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2: RISK LIST
        ══════════════════════════════════════════════ */}
        {tab === "risklist" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Filter */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>กรองกลุ่ม:</span>
              {[["all","ทั้งหมด","#6366F1"],["high","🔴 เสี่ยงสูง","#EF4444"],["medium","🟠 เฝ้าระวัง","#F59E0B"],["low","🟢 ปกติ","#10B981"]].map(([key, label, color]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                  fontFamily: "'Sarabun',sans-serif", cursor: "pointer", border: "none",
                  background: filter === key ? color : "#F3F4F6",
                  color: filter === key ? "#fff" : "#6B7280",
                }}>{label}</button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9CA3AF" }}>แสดง {listData.length} คน</span>
            </div>

            {/* Table header */}
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 100px 80px 80px 80px 120px 120px 100px",
                padding: "10px 20px", background: "#F9FAFB",
                borderBottom: "1px solid #F3F4F6", gap: 8
              }}>
                {["#","ชื่อ","หน่วยงาน","BMI","การกิน","ออกกำลัง","พฤติกรรมเสี่ยง","NCD","กลุ่ม"].map((h,i) => (
                  <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                ))}
              </div>

              {listData.map((emp, idx) => {
                const cfg = GROUP_CFG[emp.physicalGroup];
                const isSelected = selectedEmp?.id === emp.id;
                return (
                  <div key={emp.id}
                    onClick={() => { setSelectedEmp(emp); setTab("individual"); }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr 100px 80px 80px 80px 120px 120px 100px",
                      padding: "12px 20px", gap: 8, cursor: "pointer",
                      borderBottom: "1px solid #F9FAFB",
                      background: isSelected ? "#F0FDF4" : idx % 2 === 0 ? "#fff" : "#FAFAFA",
                      transition: "background 0.15s",
                      borderLeft: `3px solid ${emp.physicalGroup === "high" ? "#EF4444" : emp.physicalGroup === "medium" ? "#F59E0B" : "transparent"}`,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#9CA3AF", alignSelf: "center" }}>{idx+1}</div>
                    <div style={{ alignSelf: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>{emp.gender} · {emp.dept}</div>
                    </div>
                    <div style={{ alignSelf: "center", fontSize: 11, color: "#6B7280" }}>{emp.dept}</div>
                    {/* BMI */}
                    <div style={{ alignSelf: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: emp.bmiLevel.color }}>{emp.bmi}</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF" }}>{emp.bmiLevel.label}</div>
                    </div>
                    {/* Diet */}
                    <div style={{ alignSelf: "center" }}>
                      <RiskDot active={emp.dietRisk} />
                      <span style={{ fontSize: 11, color: emp.dietRisk ? "#EF4444" : "#10B981", marginLeft: 4 }}>
                        {emp.dietRisk ? "เสี่ยง" : "ปกติ"}
                      </span>
                    </div>
                    {/* Exercise */}
                    <div style={{ alignSelf: "center" }}>
                      <div style={{ fontSize: 11, color: emp.exerciseRisk ? "#EF4444" : "#10B981" }}>
                        {emp.exerciseDays} วัน/สัปดาห์
                      </div>
                    </div>
                    {/* Behaviors */}
                    <div style={{ alignSelf: "center", display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {emp.smokeCig !== "none"  && <span title="สูบบุหรี่" style={{ fontSize: 14 }}>🚬</span>}
                      {emp.smokeVape !== "none" && <span title="บุหรี่ไฟฟ้า" style={{ fontSize: 14 }}>💨</span>}
                      {emp.alcohol !== "none"   && <span title="ดื่มแอลกอฮอล์" style={{ fontSize: 14 }}>🍺</span>}
                      {emp.substance !== "none" && <span title="สารเสพติด" style={{ fontSize: 14 }}>💊</span>}
                      {!emp.hasRiskyBehavior && <span style={{ fontSize: 11, color: "#10B981" }}>ไม่มี</span>}
                    </div>
                    {/* NCD */}
                    <div style={{ alignSelf: "center" }}>
                      {emp.hasNCD
                        ? <Tag label={`${emp.ncdList.length} โรค`} color="#7C3AED" small />
                        : <span style={{ fontSize: 11, color: "#10B981" }}>ไม่มี</span>}
                    </div>
                    {/* Group */}
                    <div style={{ alignSelf: "center" }}>
                      <Tag label={cfg.dot + " " + cfg.label} color={cfg.color} small />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 3: INDIVIDUAL IDP
        ══════════════════════════════════════════════ */}
        {tab === "individual" && (
          <div style={{ display: "flex", gap: 20 }}>

            {/* Left: sorted list */}
            <div style={{ width: 260, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10 }}>
                เรียงจากเสี่ยงสูงสุด
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 680, overflowY: "auto" }}>
                {[...employees].sort((a,b) => b.riskCount - a.riskCount).map(emp => {
                  const cfg = GROUP_CFG[emp.physicalGroup];
                  const isSelected = selectedEmp?.id === emp.id;
                  return (
                    <div key={emp.id} onClick={() => setSelectedEmp(emp)}
                      style={{
                        background: isSelected ? "#F0FDF4" : "#fff",
                        borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                        border: `1px solid ${isSelected ? cfg.color : "#E5E7EB"}`,
                        transition: "all 0.15s", boxShadow: isSelected ? `0 0 0 2px ${cfg.color}33` : "none"
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{emp.name}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{emp.dept}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.dot} {cfg.label}</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{emp.riskCount}/3 ปัจจัย</div>
                        </div>
                      </div>
                      {/* mini factor dots */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                        {[
                          { active: emp.bmiRisk, label: "BMI" },
                          { active: emp.dietRisk, label: "กิน" },
                          { active: emp.exerciseRisk, label: "ออกกำลัง" },
                        ].map((f, i) => (
                          <span key={i} style={{
                            fontSize: 9, padding: "1px 5px", borderRadius: 999,
                            background: f.active ? "#FEE2E2" : "#F3F4F6",
                            color: f.active ? "#EF4444" : "#9CA3AF", fontWeight: 600
                          }}>{f.label}</span>
                        ))}
                        {emp.hasRiskyBehavior && <span style={{ fontSize: 12 }}>🚬</span>}
                        {emp.hasNCD && <span style={{ fontSize: 12 }}>🏥</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: IDP detail */}
            <div style={{ flex: 1 }}>
              {!selectedEmp ? (
                <div style={{ background: "#fff", borderRadius: 16, padding: 60, textAlign: "center", color: "#9CA3AF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🏃</div>
                  <div>เลือกชื่อด้านซ้ายเพื่อดูรายละเอียด IDP</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Profile header */}
                  <div style={{
                    background: "#fff", borderRadius: 16, padding: 24,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    borderTop: `4px solid ${GROUP_CFG[selectedEmp.physicalGroup].color}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{selectedEmp.name}</div>
                        <div style={{ fontSize: 13, color: "#6B7280" }}>{selectedEmp.gender} · {selectedEmp.dept}</div>
                      </div>
                      <Tag label={`${GROUP_CFG[selectedEmp.physicalGroup].dot} ${GROUP_CFG[selectedEmp.physicalGroup].label}`} color={GROUP_CFG[selectedEmp.physicalGroup].color} />
                    </div>

                    {/* Body metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 20 }}>
                      {[
                        { label: "ส่วนสูง", value: `${selectedEmp.height} ซม.`, color: "#6B7280" },
                        { label: "น้ำหนัก", value: `${selectedEmp.weight} กก.`, color: "#6B7280" },
                        { label: "BMI", value: selectedEmp.bmi, color: selectedEmp.bmiLevel.color, sub: selectedEmp.bmiLevel.label },
                        { label: "เส้นรอบเอว", value: `${selectedEmp.waist} ซม.`, color: selectedEmp.waistRisk ? "#EF4444" : "#10B981", sub: selectedEmp.waistRisk ? "เกินเกณฑ์" : "ปกติ" },
                      ].map((m, i) => (
                        <div key={i} style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{m.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
                          {m.sub && <div style={{ fontSize: 10, color: m.color, fontWeight: 600 }}>{m.sub}</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 layers side by side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

                    {/* Layer 1 */}
                    <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: "3px solid #0F766E" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#134E4A", marginBottom: 14 }}>📐 ปัจจัยเสี่ยงกาย</div>
                      {[
                        { label: "BMI", value: `${selectedEmp.bmi}`, risk: selectedEmp.bmiRisk, detail: selectedEmp.bmiLevel.label, idp: "ปรับพฤติกรรมการกิน + ควบคุมน้ำหนัก" },
                        { label: "การกิน", value: `${selectedEmp.dietScore}/5`, risk: selectedEmp.dietRisk, detail: selectedEmp.dietRisk ? "กินไม่ดี" : "ดี", idp: "โปรแกรมโภชนาการ / ลดหวาน มัน เค็ม" },
                        { label: "ออกกำลังกาย", value: `${selectedEmp.exerciseDays} วัน/สัปดาห์`, risk: selectedEmp.exerciseRisk, detail: selectedEmp.exerciseRisk ? "ไม่ผ่านเกณฑ์" : "ผ่านเกณฑ์", idp: "กิจกรรมออกกำลังกาย 150 นาที/สัปดาห์" },
                        { label: "เวลานั่งนิ่ง", value: `${selectedEmp.sedentaryHours} ชม./วัน`, risk: selectedEmp.sedentaryRisk, detail: selectedEmp.sedentaryRisk ? "มากเกินไป" : "ปกติ", idp: "ลุกเดินทุก 30-60 นาที" },
                      ].map((f, i) => (
                        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < 3 ? "1px solid #F3F4F6" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{f.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: f.risk ? "#EF4444" : "#10B981" }}>{f.value}</span>
                          </div>
                          <div style={{ fontSize: 10, color: f.risk ? "#EF4444" : "#10B981", marginBottom: 4 }}>
                            {f.risk ? "⚠ " : "✓ "}{f.detail}
                          </div>
                          {f.risk && <div style={{ fontSize: 10, color: "#6B7280", background: "#FEF2F2", padding: "4px 8px", borderRadius: 6 }}>💡 {f.idp}</div>}
                        </div>
                      ))}
                    </div>

                    {/* Layer 2 */}
                    <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: "3px solid #D97706" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#92400E", marginBottom: 14 }}>🚬 พฤติกรรมเสี่ยง</div>
                      {[
                        { label: "สูบบุหรี่ (มวน)", val: selectedEmp.smokeCig, idp: "โปรแกรมเลิกสูบบุหรี่ / นิโคตินบำบัด" },
                        { label: "บุหรี่ไฟฟ้า", val: selectedEmp.smokeVape, idp: "ให้ความรู้อันตรายบุหรี่ไฟฟ้า" },
                        { label: "แอลกอฮอล์", val: selectedEmp.alcohol, idp: "โปรแกรมลดการดื่ม / EAP" },
                        { label: "สารเสพติดอื่น", val: selectedEmp.substance, idp: "ส่งต่อผู้เชี่ยวชาญ / การบำบัด" },
                      ].map((b, i) => {
                        const bcfg = BEHAVIOR_CFG[b.val];
                        const hasRisk = b.val !== "none";
                        return (
                          <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < 3 ? "1px solid #F3F4F6" : "none" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{b.label}</span>
                              <Tag label={bcfg.label} color={bcfg.color} small />
                            </div>
                            {hasRisk && <div style={{ fontSize: 10, color: "#6B7280", background: "#FFF7ED", padding: "4px 8px", borderRadius: 6 }}>💡 {b.idp}</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Layer 3: NCD */}
                    <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderTop: "3px solid #7C3AED" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#4C1D95", marginBottom: 6 }}>🏥 NCD (โรคที่มีอยู่)</div>
                      <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 14 }}>🔒 ข้อมูลอ่อนไหว -- เฉพาะ HR</div>
                      {selectedEmp.hasNCD ? (
                        <>
                          {selectedEmp.ncdList.map((ncd, i) => (
                            <div key={i} style={{
                              background: "#F5F3FF", borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                              borderLeft: `3px solid ${NCD_COLORS[ncd] || "#7C3AED"}`
                            }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: NCD_COLORS[ncd] || "#7C3AED" }}>🔴 {ncd}</div>
                              <div style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}>
                                💡 {
                                  ncd === "เบาหวาน" ? "ติดตามระดับน้ำตาล / ควบคุมอาหาร / ออกกำลังกายสม่ำเสมอ" :
                                  ncd === "ความดันโลหิตสูง" ? "ติดตามความดัน / ลดเค็ม / ลดความเครียด" :
                                  ncd === "โรคหัวใจ" ? "ปรึกษาแพทย์ก่อนออกกำลังกาย / หลีกเลี่ยงความเครียด" :
                                  ncd === "โรคไต" ? "ควบคุมโปรตีน / ดื่มน้ำพอเพียง / ติดตามค่าไต" :
                                  ncd === "โรคตับ" ? "หลีกเลี่ยงแอลกอฮอล์ / อาหารไขมันต่ำ" :
                                  "ติดตามการรักษาอย่างต่อเนื่อง / ดูแลสุขภาพจิต"
                                }
                              </div>
                            </div>
                          ))}
                          <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "10px 12px", border: "1px solid #FECACA", marginTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B" }}>⚠️ ข้อควรระวัง IDP</div>
                            <div style={{ fontSize: 10, color: "#B91C1C", marginTop: 4 }}>
                              การออกแบบกิจกรรมต้องได้รับการอนุมัติจากแพทย์ก่อน ห้ามกำหนดเป้าหมายกิจกรรมทางกายที่หนักเกินไป
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: "center", padding: "24px 0", color: "#10B981" }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>ไม่มีโรค NCD</div>
                          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>สามารถออกแบบ IDP กายได้เต็มที่</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* IDP Priority */}
                  <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14 }}>
                      🎯 ลำดับความสำคัญ IDP มิติกาย -- {selectedEmp.name}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {[
                        { show: selectedEmp.hasNCD, priority: "ด่วนที่สุด 🔴", label: "จัดการ NCD ก่อน", desc: "ปรึกษาแพทย์ วางแผนดูแลโรคที่มีอยู่", color: "#EF4444" },
                        { show: selectedEmp.hasRiskyBehavior, priority: "ด่วน 🟠", label: "แก้พฤติกรรมเสี่ยง", desc: "โปรแกรมเลิกสูบ/ลดดื่ม ก่อนเพิ่มกิจกรรม", color: "#F97316" },
                        { show: selectedEmp.physicalGroup !== "low", priority: "สำคัญ 🟡", label: "ปรับปัจจัยเสี่ยง", desc: "BMI + โภชนาการ + ออกกำลังกาย", color: "#F59E0B" },
                        { show: true, priority: "รักษาระดับ 🟢", label: "ติดตามต่อเนื่อง", desc: "ประเมินซ้ำทุก 3-6 เดือน", color: "#10B981" },
                      ].filter(p => p.show).map((p, i) => (
                        <div key={i} style={{ flex: 1, background: p.color + "11", borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${p.color}` }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.priority}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginTop: 4 }}>{p.label}</div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{p.desc}</div>
                        </div>
                      ))}
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
