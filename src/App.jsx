import { useState, useEffect, useCallback } from "react";

const DEFAULT_DB = {
  users: [
    { id: "U001", name: "أحمد الراشدي", age: 28, phone: "07701234567", national_id: "19961234567890", blood_type: "A+", diseases: [], lat: 32.5362, lng: 44.4209 },
    { id: "U002", name: "فاطمة الزهراء", age: 34, phone: "07809876543", national_id: "19909876543210", blood_type: "O-", diseases: ["ضغط خفيف"], lat: 32.5400, lng: 44.4150 },
    { id: "U003", name: "عمر خالد", age: 22, phone: "07712345678", national_id: "20031234567891", blood_type: "B+", diseases: [], lat: 32.5310, lng: 44.4300 },
  ],
  drivers: [
    { id: "DRV001", name: "حسين علي", phone: "07701111222", national_id: "19901111222333", age: 35, status: "متاح", current_task: null },
    { id: "DRV002", name: "كريم محمد", phone: "07703333444", national_id: "19923333444555", age: 40, status: "في مهمة", current_task: "AMB001" },
    { id: "DRV003", name: "علي حسن", phone: "07705555666", national_id: "19955556667770", age: 29, status: "متاح", current_task: null },
  ],
  blood_bookings: [
    { id: "BB001", user_id: "U001", user_name: "أحمد الراشدي", user_phone: "07701234567", blood_type: "A+", day: "الأحد", date: "2026-03-16", time: "10:00", needs_ambulance: true, status: "مؤكد", driver_id: "DRV001", created_at: "9:00 ص" },
  ],
  ambulance_requests: [
    { id: "AMB001", user_id: "U003", user_name: "عمر خالد", user_phone: "07712345678", reason: "حادث سير", location: "شارع النضال، الحلة", lat: 32.5310, lng: 44.4300, status: "في الطريق", driver_id: "DRV002", created_at: "8:45 ص" },
  ],
  hospital: { name: "مستشفى الحلة التعليمي", lat: 32.4729, lng: 44.3841 },
};

const getDB = () => { if (typeof window !== "undefined") { if (!window.__bloodLinkDB) window.__bloodLinkDB = JSON.parse(JSON.stringify(DEFAULT_DB)); return window.__bloodLinkDB; } return DEFAULT_DB; };
const saveDB = (db) => { if (typeof window !== "undefined") window.__bloodLinkDB = db; };
const broadcast = (event, data) => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("bloodLink", { detail: { event, data } })); };

const STEP_LABELS_BLOOD = ["تم التعيين","في الطريق للمتبرع","وصل المنزل","التحقق من الهوية","في الطريق للمستشفى","تم التسليم"];
const STEP_LABELS_AMB = ["تم التعيين","في الطريق للحالة","وصل الموقع","نقل المريض","وصل المستشفى"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#080C14;--surface:#0F1520;--surface2:#16202E;--border:#1E2D3D;--text:#E0EEFF;--muted:#5A7A99;--blue:#2196F3;--blue2:#0D47A1;--blue-g:rgba(33,150,243,0.12);--red:#F44336;--red-g:rgba(244,67,54,0.12);--success:#00BFA5;--success-g:rgba(0,191,165,0.12);--warn:#FF9800;--warn-g:rgba(255,152,0,0.12);--font:'Tajawal',sans-serif}
body{font-family:var(--font);background:var(--bg);color:var(--text);direction:rtl;max-width:430px;margin:0 auto;min-height:100vh}
.login-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at 50% 0%,rgba(33,150,243,0.15) 0%,transparent 70%)}
.login-logo{width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,var(--blue2),var(--blue));display:flex;align-items:center;justify-content:center;font-size:38px;margin-bottom:20px;box-shadow:0 8px 32px rgba(33,150,243,0.3)}
.login-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%}
.header{background:var(--surface);border-bottom:1px solid var(--border);padding:14px 20px;position:sticky;top:0;z-index:100;display:flex;justify-content:space-between;align-items:center}
.header-logo{font-size:18px;font-weight:900;display:flex;align-items:center;gap:8px;color:var(--blue)}
.status-bubble{padding:5px 12px;border-radius:20px;font-size:11px;font-weight:800}
.avail{background:var(--success-g);color:var(--success);border:1px solid rgba(0,191,165,0.3)}
.busy{background:var(--warn-g);color:var(--warn);border:1px solid rgba(255,152,0,0.3)}
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--surface);border-top:1px solid var(--border);display:flex;padding:8px 10px 22px;z-index:100}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;border:none;background:transparent;font-family:var(--font);font-size:10px;font-weight:700;color:var(--muted);cursor:pointer;border-radius:10px;transition:all 0.15s}
.nav-btn span{font-size:22px}
.nav-btn.on{color:var(--blue);background:var(--blue-g)}
.content{padding:20px;padding-bottom:100px}
.page-title{font-size:20px;font-weight:900;margin-bottom:4px}
.page-sub{font-size:12px;color:var(--muted);margin-bottom:20px;line-height:1.6}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px}
.task-card{border:1.5px solid var(--blue);border-radius:18px;padding:20px;background:var(--blue-g);margin-bottom:14px;animation:pulseBlue 2.5s infinite}
.task-card.emergency{border-color:var(--red);background:var(--red-g);animation:pulseRed 2s infinite}
@keyframes pulseBlue{0%,100%{box-shadow:0 0 0 0 rgba(33,150,243,0.15)}50%{box-shadow:0 0 0 10px rgba(33,150,243,0)}}
@keyframes pulseRed{0%,100%{box-shadow:0 0 0 0 rgba(244,67,54,0.2)}50%{box-shadow:0 0 0 10px rgba(244,67,54,0)}}
.section-title{font-size:14px;font-weight:800;margin-bottom:12px;color:var(--text)}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 18px;border:none;border-radius:12px;cursor:pointer;font-family:var(--font);font-size:14px;font-weight:700;transition:all 0.18s;width:100%;margin-bottom:8px}
.btn-blue{background:var(--blue);color:white;box-shadow:0 4px 16px rgba(33,150,243,0.3)}
.btn-blue:hover{background:var(--blue2);transform:translateY(-1px)}
.btn-green{background:var(--success-g);color:var(--success);border:1px solid rgba(0,191,165,0.3)}
.btn-outline{background:transparent;color:var(--muted);border:1px solid var(--border)}
.btn-outline:hover{border-color:var(--blue);color:var(--blue)}
.btn-sm{padding:7px 12px;font-size:12px;width:auto;border-radius:8px;margin-bottom:0}
.input{width:100%;padding:12px 14px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;color:var(--text);font-family:var(--font);font-size:14px;outline:none;transition:border-color 0.2s}
.input:focus{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-g)}
.input::placeholder{color:var(--muted)}
.blood-circle{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7F1D1D,var(--red));display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:900;flex-shrink:0;box-shadow:0 4px 12px rgba(244,67,54,0.3)}
.status-tag{display:inline-flex;padding:2px 9px;border-radius:6px;font-size:11px;font-weight:700}
.s-ok{background:var(--success-g);color:var(--success)}.s-wait{background:var(--warn-g);color:var(--warn)}.s-blue{background:var(--blue-g);color:var(--blue)}
.map-mock{width:100%;height:150px;background:linear-gradient(135deg,#0A1628,#0D2040);border-radius:12px;border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;position:relative;overflow:hidden;cursor:pointer;transition:all 0.2s;margin-bottom:12px}
.map-mock:hover{transform:scale(1.01);border-color:var(--blue)}
.map-mock::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(33,150,243,0.04) 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(33,150,243,0.04) 21px)}
.map-pin{font-size:28px;animation:bounce 1.5s infinite;position:relative;z-index:1}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.steps-list{display:flex;flex-direction:column}
.step-row{display:flex;gap:12px}
.step-circle{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;transition:all 0.3s}
.sc-done{background:var(--success);color:white}.sc-on{background:var(--blue);color:white;box-shadow:0 0 0 3px var(--blue-g)}.sc-off{background:var(--surface2);color:var(--muted)}
.step-vline{width:2px;flex:1;min-height:20px;background:var(--border);margin:2px 0 2px 15px;transition:background 0.3s}
.step-vline.done{background:var(--success)}
.step-body{padding:4px 0 20px;flex:1}
.step-name{font-size:14px;font-weight:700;color:var(--muted)}
.step-name.done{color:var(--success)}.step-name.on{color:var(--text)}
.verify-ok{border:1.5px solid var(--success);border-radius:14px;padding:16px;background:var(--success-g)}
.verify-fail{border:1.5px solid var(--red);border-radius:14px;padding:20px;background:var(--red-g);text-align:center}
.toast{position:fixed;top:70px;left:50%;transform:translateX(-50%);background:var(--surface);border:1.5px solid var(--blue);border-radius:12px;padding:10px 18px;z-index:999;font-size:13px;font-weight:700;color:var(--blue);box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:fadeUp 0.3s ease;white-space:nowrap}
.toast.red{border-color:var(--red);color:var(--red)}
table{width:100%;border-collapse:collapse}
th{padding:7px 10px;text-align:right;font-size:10px;color:var(--muted);font-weight:700;border-bottom:1px solid var(--border)}
td{padding:10px;font-size:12px;border-bottom:1px solid rgba(30,45,61,0.8)}
tr:hover td{background:var(--surface2)}
.fade{animation:fadeUp 0.3s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.empty{text-align:center;padding:28px;color:var(--muted);font-size:13px}
`;

export default function DriverApp() {
  const [db, setDb] = useState(() => getDB());
  const [screen, setScreen] = useState("login");
  const [activeDriverId, setActiveDriverId] = useState(null);
  const [tab, setTab] = useState("tasks");
  const [taskStep, setTaskStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [completedToday, setCompletedToday] = useState([
    { name: "زينب ك.", type: "تبرع", blood: "AB+", time: "8:30 ص" },
    { name: "نور أ.", type: "إسعاف", blood: "—", time: "9:45 ص" },
  ]);

  const showToast = (msg, type = "blue") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const refreshDB = useCallback(() => { setDb({ ...getDB() }); }, []);
  useEffect(() => { window.addEventListener("bloodLink", refreshDB); return () => window.removeEventListener("bloodLink", refreshDB); }, [refreshDB]);

  useEffect(() => {
    const handler = (e) => {
      const { event, data } = e.detail;
      refreshDB();
      if (event === "driver_assigned" && data.driver_id === activeDriverId) {
        showToast("🚑 مهمة جديدة وصلتك!", "red");
        setTaskStep(0);
      }
    };
    window.addEventListener("bloodLink", handler);
    return () => window.removeEventListener("bloodLink", handler);
  }, [activeDriverId, refreshDB]);

  const driver = activeDriverId ? db.drivers.find(d => d.id === activeDriverId) : null;
  const currentBloodTask = driver ? db.blood_bookings.find(b => b.driver_id === driver.id && b.status === "مؤكد") : null;
  const currentAmbTask = driver ? db.ambulance_requests.find(a => a.driver_id === driver.id && a.status !== "مكتمل") : null;
  const currentTask = currentAmbTask || currentBloodTask;
  const taskType = currentAmbTask ? "ambulance" : "blood";
  const taskUser = currentTask ? db.users.find(u => u.phone === currentTask.user_phone) : null;
  const stepLabels = taskType === "ambulance" ? STEP_LABELS_AMB : STEP_LABELS_BLOOD;

  const doVerify = () => { const u = db.users.find(x => x.phone === verifyPhone.trim()); setVerifyResult(u || false); };

  const completeTask = () => {
    if (!currentTask || !driver) return;
    const newDB = { ...getDB() };
    const di = newDB.drivers.findIndex(d => d.id === driver.id);
    if (taskType === "ambulance") { const ai = newDB.ambulance_requests.findIndex(a => a.id === currentTask.id); if (ai >= 0) newDB.ambulance_requests[ai].status = "مكتمل"; }
    else { const bi = newDB.blood_bookings.findIndex(b => b.id === currentTask.id); if (bi >= 0) newDB.blood_bookings[bi].status = "مكتمل"; }
    if (di >= 0) { newDB.drivers[di].status = "متاح"; newDB.drivers[di].current_task = null; }
    saveDB(newDB); setDb({ ...newDB });
    broadcast("task_completed", { driver_id: driver.id, task_id: currentTask.id });
    if (taskUser) setCompletedToday(p => [{ name: taskUser.name, type: taskType === "ambulance" ? "إسعاف" : "تبرع", blood: taskUser.blood_type, time: new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" }) }, ...p]);
    setTaskStep(0); setVerifyPhone(""); setVerifyResult(null);
    showToast("✓ تم إنهاء المهمة");
    setTab("tasks");
  };

  if (screen === "login") return (
    <>
      <style>{CSS}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      <div className="login-screen">
        <div className="login-logo">🚑</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "var(--blue)", marginBottom: 6, textAlign: "center" }}>تطبيق السائق</div>
        <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>خاص بسائقي سيارات الإسعاف</div>
        <div className="login-card">
          <div className="section-title" style={{ textAlign: "center", marginBottom: 14 }}>اختر حسابك</div>
          {DEFAULT_DB.drivers.map(drv => (
            <div key={drv.id} onClick={() => { setActiveDriverId(drv.id); setScreen("main"); showToast(`أهلاً ${drv.name}! 👋`); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "var(--surface2)", borderRadius: 12, border: "1.5px solid var(--border)", cursor: "pointer", marginBottom: 8, transition: "all 0.15s" }}
              onMouseOver={e => e.currentTarget.style.borderColor = "var(--blue)"}
              onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,var(--blue2),var(--blue))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🚑</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{drv.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", direction: "ltr" }}>{drv.phone}</div>
              </div>
              <span className={`status-bubble ${drv.status === "متاح" ? "avail" : "busy"}`}>{drv.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      <header className="header">
        <div className="header-logo">🚑 سائق</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{driver?.name}</div>
          <span className={`status-bubble ${driver?.status === "متاح" ? "avail" : "busy"}`}>{driver?.status}</span>
        </div>
      </header>

      <div className="content">
        {tab === "tasks" && (
          <div className="fade">
            <div className="page-title">📋 مهامي</div>
            {currentTask ? (
              <div className={`task-card ${taskType === "ambulance" ? "emergency" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: taskType === "ambulance" ? "var(--red)" : "var(--blue)", fontWeight: 800, marginBottom: 4 }}>{taskType === "ambulance" ? "🚨 حالة طارئة" : "🩸 نقل متبرع"}</div>
                    <div style={{ fontSize: 19, fontWeight: 900 }}>{currentTask.user_name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12, direction: "ltr" }}>{currentTask.user_phone}</div>
                  </div>
                  {taskUser && <div className="blood-circle">{taskUser.blood_type}</div>}
                </div>
                {taskType === "ambulance" && (
                  <div style={{ background: "rgba(244,67,54,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--red)" }}>السبب: {currentTask.reason}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>📍 {currentTask.location}</div>
                  </div>
                )}
                {taskType === "blood" && taskUser && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 12 }}>
                    {[["العمر", taskUser.age+" سنة"], ["الموعد", currentTask.time], ["اليوم", currentTask.day], ["الأمراض", taskUser.diseases.length ? taskUser.diseases[0] : "لا يوجد"]].map(([k,v]) => (
                      <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>{k}</div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="map-mock" onClick={() => showToast("🗺 فتح Google Maps")}>
                  <span className="map-pin">{taskType === "ambulance" ? "🚨" : "🏠"}</span>
                  <span style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: 700 }}>{taskType === "ambulance" ? currentTask.location : `منزل ${currentTask.user_name}`}</span>
                  <span style={{ fontSize: 11, color: "var(--blue)", position: "relative", zIndex: 1 }}>اضغط لفتح Google Maps</span>
                </div>
                <button className="btn btn-blue">🗺 فتح Google Maps</button>
              </div>
            ) : (
              <div className="card" style={{ textAlign: "center", padding: 36, border: "1px solid var(--success)" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ fontWeight: 800, color: "var(--success)", fontSize: 16 }}>لا توجد مهمة نشطة</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>ستصلك مهمة من المستشفى</div>
              </div>
            )}
            <div className="card">
              <div className="section-title">مكتملة اليوم ({completedToday.length})</div>
              {completedToday.length === 0 ? <div className="empty">لا توجد</div> : (
                <table>
                  <thead><tr><th>الاسم</th><th>النوع</th><th>الفصيلة</th><th>الوقت</th></tr></thead>
                  <tbody>
                    {completedToday.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{c.name}</td>
                        <td><span className={`status-tag ${c.type === "إسعاف" ? "s-wait" : "s-ok"}`}>{c.type}</span></td>
                        <td><span style={{ background: "var(--red-g)", color: "var(--red)", padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 800 }}>{c.blood}</span></td>
                        <td style={{ color: "var(--muted)", direction: "ltr" }}>{c.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "track" && (
          <div className="fade">
            <div className="page-title">🗺 تتبع المهمة</div>
            {!currentTask ? <div className="empty card">لا توجد مهمة نشطة</div> : (
              <div className="card">
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                  {taskUser && <div className="blood-circle">{taskUser.blood_type}</div>}
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{currentTask.user_name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11 }}>{taskType === "ambulance" ? currentTask.reason : currentTask.time}</div>
                  </div>
                </div>
                <div className="steps-list">
                  {stepLabels.map((lbl, i) => (
                    <div key={lbl} className="step-row">
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div className={`step-circle ${i < taskStep ? "sc-done" : i === taskStep ? "sc-on" : "sc-off"}`}>{i < taskStep ? "✓" : i+1}</div>
                        {i < stepLabels.length-1 && <div className={`step-vline ${i < taskStep ? "done" : ""}`} />}
                      </div>
                      <div className="step-body">
                        <div className={`step-name ${i < taskStep ? "done" : i === taskStep ? "on" : ""}`}>{lbl}</div>
                        {i === taskStep && (
                          <div style={{ marginTop: 8 }}>
                            {i < stepLabels.length-1
                              ? <button className="btn btn-blue btn-sm" onClick={() => setTaskStep(s => s+1)}>التالي ←</button>
                              : <button className="btn btn-green btn-sm" onClick={completeTask}>✓ إنهاء المهمة</button>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "verify" && (
          <div className="fade">
            <div className="page-title">🔍 التحقق من الهوية</div>
            <p className="page-sub">أدخل رقم الهاتف للتحقق من هوية الشخص وبياناته الطبية</p>
            <div className="card">
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="input" placeholder="07XXXXXXXX" value={verifyPhone} maxLength={11} onChange={e => { setVerifyPhone(e.target.value); setVerifyResult(null); }} style={{ fontSize: 17, textAlign: "center", letterSpacing: 3, direction: "ltr" }} />
                <button className="btn btn-blue btn-sm" onClick={doVerify} style={{ whiteSpace: "nowrap" }}>تحقق</button>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>وصول سريع:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {db.users.map(u => <button key={u.id} className="btn btn-outline btn-sm" onClick={() => { setVerifyPhone(u.phone); setVerifyResult(null); }}>{u.name.split(" ")[0]}</button>)}
              </div>
            </div>
            {verifyResult === false && (
              <div className="verify-fail fade">
                <div style={{ fontSize: 36, marginBottom: 8 }}>❌</div>
                <div style={{ color: "var(--red)", fontWeight: 800 }}>لم يُعثر</div>
              </div>
            )}
            {verifyResult && (
              <div className="verify-ok fade">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ color: "var(--success)", fontWeight: 900 }}>✅ هوية مؤكدة</div>
                  <div className="blood-circle" style={{ background: "linear-gradient(135deg,#004D40,var(--success))", fontSize: 13, width: 42, height: 42 }}>{verifyResult.blood_type}</div>
                </div>
                <div style={{ background: "var(--surface)", borderRadius: 10, padding: 12 }}>
                  {[["الاسم", verifyResult.name], ["العمر", verifyResult.age+" سنة"], ["فصيلة الدم", verifyResult.blood_type], ["رقم الهوية", verifyResult.national_id], ["الأمراض", verifyResult.diseases.length ? verifyResult.diseases.join("، ") : "✓ لا يوجد"]].map(([k,v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700 }}>{k}</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: k === "الأمراض" && verifyResult.diseases.length === 0 ? "var(--success)" : "var(--text)" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-green" style={{ marginTop: 12 }} onClick={() => { setTaskStep(3); setTab("track"); showToast("✓ تم التحقق — انطلق للمستشفى"); }}>✓ تأكيد — انطلق للمستشفى</button>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        {[["tasks","📋","مهامي"],["track","🗺","التتبع"],["verify","🔍","التحقق"]].map(([id,ic,lb]) => (
          <button key={id} className={`nav-btn ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>
            <span>{ic}</span>{lb}
          </button>
        ))}
      </nav>
    </>
  );
}
