const STORAGE_KEY = "freedom_users_v1";
const VIEW_MODE_KEY = "freedom_view_mode_v1";
const API_BASE = location.protocol === "file:" ? "http://127.0.0.1:4176" : "";

const onboardingQuestions = [
  {
    key: "financialType",
    title: "ตอนนี้อยากให้ Freedom ช่วยเรื่องการเงินด้านไหน",
    helper: "เลือกเรื่องหลักก่อน เพื่อให้ฉันวาง flow ให้ตรงกับชีวิตจริงของคุณ",
    placeholder: "เช่น มีหนี้",
    options: ["มีหนี้", "อยากลงทุน", "คุมรายจ่าย", "สร้างเงินสำรอง"],
  },
  {
    key: "moneyProblem",
    title: "ปัญหาการเงินที่กวนใจที่สุดคืออะไร",
    helper: "ตอบสั้น ๆ ได้เลย ฉันจะไม่ตัดสิน แต่จะช่วยจัดลำดับสิ่งที่ควรทำ",
    placeholder: "เช่น จ่ายบัตรเครดิตขั้นต่ำทุกเดือน",
    options: ["หนี้หลายก้อน", "เงินไม่พอปลายเดือน", "ยังไม่กล้าลงทุน"],
  },
  {
    key: "income",
    title: "รายได้ต่อเดือนประมาณเท่าไร",
    helper: "ใส่เป็นตัวเลขคร่าว ๆ ได้ ไม่ต้องเป๊ะตั้งแต่ครั้งแรก",
    placeholder: "เช่น 45000",
    options: ["25000", "45000", "80000"],
  },
  {
    key: "goal",
    title: "เป้าหมายการเงินที่อยากไปให้ถึงคืออะไร",
    helper: "ถ้าคุณมีหนี้ Freedom จะพาเข้า flow ปลดหนี้ก่อน แล้วค่อยต่อยอดเรื่องลงทุน",
    placeholder: "เช่น ปลดหนี้ให้หมด แล้วเริ่มลงทุนเดือนละ 5000",
    options: ["ปลดหนี้ให้หมด", "เริ่มลงทุน", "มีเงินสำรอง 6 เดือน"],
  },
];

const checkpointRules = {
  survival: [
    ["จ่ายขั้นต่ำครบ", "จ่ายขั้นต่ำได้ครบ", "จ่ายขั้นต่ำแล้ว", "ขั้นต่ำครบ"],
    ["ไม่มี missed", "ไม่ missed", "ไม่มีค้างจ่าย", "ไม่ค้างจ่าย", "ไม่พลาดจ่าย", "จ่ายตรงเวลา"],
    ["พอใช้ถึงสิ้นเดือน", "เงินพอถึงสิ้นเดือน", "ไม่ติดลบปลายเดือน", "ใช้ถึงสิ้นเดือน"],
    ["คุมรายจ่าย", "ควบคุมรายจ่าย", "ลดรายจ่าย", "ทำงบรายจ่าย", "บันทึกรายจ่าย"],
  ],
  recovery: [
    ["จ่ายมากกว่าขั้นต่ำ", "โปะเพิ่ม", "จ่ายเกินขั้นต่ำ", "จ่ายหนี้เพิ่ม"],
    ["เริ่มออม", "มีเงินออม", "ออมเงิน", "เก็บเงิน"],
    ["มีเงินเหลือปลายเดือน", "เงินเหลือปลายเดือน", "มี surplus", "เหลือเงิน"],
    ["ไม่สร้างหนี้เพิ่ม", "ไม่ก่อหนี้เพิ่ม", "หนี้ไม่เพิ่ม", "หยุดใช้บัตร"],
  ],
  balance: [
    ["emergency fund", "เงินสำรอง 3 เดือน", "เงินสำรอง 6 เดือน", "เงินสำรองฉุกเฉิน"],
    ["หนี้ดอกสูงลดลง", "หนี้ลดลง", "ยอดหนี้ลด", "ปิดหนี้ดอกสูง"],
    ["passive income", "รายได้เสริม", "รายได้ทางอื่น", "รายได้เพิ่ม"],
    ["monthly surplus", "เงินเหลือต่อเนื่อง", "มีเงินเหลือทุกเดือน", "เหลือเงินทุกเดือน"],
  ],
  growth: [
    ["passive income ช่วย", "รายได้เสริมช่วย", "รายได้เสริมจ่าย", "รายได้เสริมครอบคลุมบางส่วน"],
    ["หนี้ดอกสูงเกือบหมด", "หนี้เกือบหมด", "ใกล้ปิดหนี้", "ปิดหนี้เกือบหมด"],
    ["ลงทุนต่อเนื่อง", "investment habit", "ลงทุนทุกเดือน", "เริ่มลงทุนสม่ำเสมอ"],
    ["เงินสำรองแข็งแรง", "เงินสำรองครบ", "เงินสำรอง 6 เดือน", "สำรองมั่นคง"],
  ],
  freedom: [
    ["passive income ครอบคลุม", "รายได้เสริมครอบคลุมค่าใช้จ่าย", "รายได้ลงทุนครอบคลุม"],
    ["wealth system", "ระบบทรัพย์สิน", "ระบบลงทุน", "ระบบการเงินระยะยาว"],
    ["financial flexibility", "ยืดหยุ่นทางการเงิน", "เลือกงานได้", "มีทางเลือก"],
    ["ทบทวนระบบเงิน", "ทบทวนการลงทุน", "ทบทวนความเสี่ยง", "รีวิวพอร์ต"],
  ],
  legacy: [
    ["passive income ครอบคลุม", "รายได้ลงทุนครอบคลุม", "เงินทำงานแทนเวลา"],
    ["ดูแลทรัพย์สิน", "จัดการความเสี่ยง", "แผนระยะยาว", "แผนทรัพย์สิน"],
    ["legacy goal", "เป้าหมายส่งต่อ", "ส่งต่อทรัพย์สิน", "สร้าง impact"],
    ["ส่งต่อความรู้", "ช่วยครอบครัว", "ส่งต่อความมั่นคง", "แบ่งปันความรู้"],
  ],
};

let users = loadUsers();
let currentUser = null;
let profile = null;
let view = "login";
let flowMode = "normal";
let authStep = "username";
let pendingUsername = "";
let pendingUserExists = false;
let pinEntry = "";
let onboardingStep = 0;
let conversation = initialAuthConversation();
let aiStatus = "กำลังตรวจสอบการเชื่อมต่อ";
let isThinking = false;
let authToast = "";
let viewMode = loadViewMode();
let isHealthOpen = false;
let whaleIntroTarget = "chat";
let whaleIntroTimer = null;
let checkpointWhaleTimer = null;
let showCheckpointWhale = false;
let supabaseClient = null;
let supabaseTable = "freedom_profiles";
let storageStatus = "local";
let profileTab = "health";
let walletTab = "overview";
let showDebtForm = false;
let editingDebtIndex = null;
let showExpenseForm = false;
let editingExpenseIndex = null;
let showAssetForm = false;
let editingAssetIndex = null;

function render() {
  updateChrome();
  document.querySelector("#appContent").innerHTML = getViewMarkup();
  document.querySelector("#overlayLayer").innerHTML = getOverlayMarkup();
  const chatDock = document.querySelector("#chatDock");
  const canType = view === "chat" || (view === "login" && authStep === "username");
  document.body.dataset.chat = canType ? "visible" : "hidden";
  chatDock.hidden = !canType;
  chatDock.innerHTML = canType ? getComposerMarkup() : "";
  wire();
  keepChatAtBottom();
}

function getOverlayMarkup() {
  return `${isHealthOpen ? financialHealthModalMarkup() : ""}${showCheckpointWhale ? checkpointWhaleMarkup() : ""}`;
}

function updateChrome() {
  document.body.dataset.mode = viewMode;
  document.querySelector("#screenTitle").textContent = getScreenTitle();
  const modeToggle = document.querySelector("#modeToggle");
  if (modeToggle) {
    modeToggle.innerHTML = `
      <span class="mode-tab ${viewMode === "mobile" ? "active" : ""}">${iconMarkup("phone")}</span>
      <span class="mode-tab ${viewMode === "desktop" ? "active" : ""}">${iconMarkup("monitor")}</span>
    `;
    modeToggle.setAttribute("aria-label", viewMode === "mobile" ? "สลับเป็น desktop mode" : "สลับเป็น mobile mode");
  }
  const health = getFinancialHealth();
  const profileButton = document.querySelector("#profileButton");
  if (profileButton) {
    profileButton.hidden = !(profile && profile.known);
    profileButton.dataset.level = health.slug;
    profileButton.style.setProperty("--profile-progress", `${health.progress}%`);
    profileButton.innerHTML = iconMarkup(health.icon);
    profileButton.setAttribute("aria-label", `ระดับสุขภาพการเงิน ${health.level}`);
  }
}

function getScreenTitle() {
  if (view === "login") return authStep === "pin" ? "ใส่ PIN 6 หลัก" : "เข้าสู่ Freedom";
  if (view === "whale") return "Freedom กำลังเชื่อมต่อ";
  if (view === "debt") return "เพิ่มหนี้ใหม่";
  if (view === "wallet") return "กระเป๋าการเงินของฉัน";
  if (flowMode === "onboarding") return "Freedom กำลังรู้จักคุณ";
  return `สวัสดี ${currentUser}`;
}

function getViewMarkup() {
  const toast = authToast ? authToastMarkup() : "";
  if (view === "login") return `${toast}${loginMarkup()}`;
  if (view === "whale") return `${toast}${whaleIntroMarkup()}`;
  if (view === "debt") return `${toast}${debtMarkup()}`;
  if (view === "wallet") return `${toast}${walletMarkup()}`;
  return `${toast}${chatMarkup()}`;
}

function whaleIntroMarkup() {
  return `
    <article class="screen active whale-intro" aria-label="Freedom AI กำลังปรากฏ">
      <div class="whale-glow"></div>
      <div class="whale-media" aria-label="Freedom AI guardian whale"></div>
      <div class="whale-copy">
        <p class="eyebrow">Authentication success</p>
        <h2>Freedom กำลังปรับโหมดให้เข้ากับคุณ</h2>
        <p class="muted">${whaleIntroTarget === "onboarding" ? "อีกสักครู่จะเริ่มถามคำถามแรกในแชท" : "อีกสักครู่จะพาคุณกลับเข้าสู่แชทการเงินส่วนตัว"}</p>
      </div>
    </article>
  `;
}

function checkpointWhaleMarkup() {
  return `
    <div class="checkpoint-whale" aria-hidden="true">
      <div class="checkpoint-whale-glow"></div>
      <div class="checkpoint-whale-media"></div>
    </div>
  `;
}

function financialHealthModalMarkup() {
  const health = getFinancialHealth();
  const profileLines = getFinancialProfileLines();
  return `
    <section class="health-sheet" role="dialog" aria-modal="true" aria-label="รายละเอียดสุขภาพการเงิน">
      <div class="health-scrim" data-action="closeHealth"></div>
      <article class="health-card glass">
        <button class="health-close" type="button" data-action="closeHealth" aria-label="ปิด">${iconMarkup("x")}</button>
        <div class="profile-tabs" role="tablist" aria-label="เมนูโปรไฟล์">
        <button class="${profileTab === "health" ? "active" : ""}" type="button" data-profile-tab="health">${iconMarkup("heartPulse")}<span>ข้อมูลสุขภาพการเงิน</span></button>
          <button class="${profileTab === "debt" ? "active" : ""}" type="button" data-profile-tab="debt">${iconMarkup("card")}<span>หนี้ของฉัน</span></button>
        </div>
        <div class="health-scroll">
          ${profileTab === "debt" ? profileDebtTabMarkup() : profileHealthTabMarkup(health, profileLines)}
        </div>
      </article>
    </section>
  `;
}

function profileHealthTabMarkup(health, profileLines) {
  return `
    <div class="health-head" style="--level-color: ${health.color}">
      <div class="health-orb ${health.slug}">${iconMarkup(health.icon)}</div>
      <div>
        <p class="eyebrow">Ocean Journey</p>
        <h2>${health.level}</h2>
        <p class="health-status-copy">${escapeHtml(health.statusIntro)}</p>
      </div>
    </div>
    <div class="health-meter-wrap" style="--level-color: ${health.color}">
      <div class="health-meter" aria-label="คะแนนสุขภาพการเงิน ${health.progress} เปอร์เซ็นต์">
      <span style="--width: ${health.progress}%"></span>
      </div>
      <span class="next-status">${escapeHtml(health.nextLevel)}</span>
    </div>
    <section class="health-block next-level">
      <p class="label">ก้าวสู่ระดับถัดไป</p>
      <strong>${escapeHtml(health.nextLevel)}</strong>
      <ul>
        ${health.conditions.map((condition, index) => `
          <li class="${health.completedConditions[index] ? "done" : ""}">
            <span class="checkmark">${health.completedConditions[index] ? "✓" : ""}</span>
            <span>${escapeHtml(condition)}</span>
          </li>
        `).join("")}
      </ul>
    </section>
    <section class="health-block">
      <p class="label">โปรไฟล์ตอนนี้</p>
      ${profileLines.map((line) => `<div class="health-row"><span>${escapeHtml(line.label)}</span><strong>${escapeHtml(line.value)}</strong></div>`).join("")}
    </section>
    <section class="health-block ocean-journey-block">
      <p class="label">ความหมายของระดับนี้</p>
      <p>${escapeHtml(health.meaning)}</p>
    </section>
    <section class="health-block ocean-journey-block">
      <p class="label">AI adviser focus</p>
      <p>${escapeHtml(health.adviserFocus)}</p>
    </section>
    <button class="primary icon-label" type="button" data-action="restartAssessment">${iconMarkup("target")}<span>เริ่มทำแบบประเมินใหม่</span></button>
  `;
}

function profileDebtTabMarkup() {
  const total = profile.debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  const minimum = profile.debts.reduce((sum, debt) => sum + Number(debt.min || 0), 0);
  const averageRate = profile.debts.length
    ? profile.debts.reduce((sum, debt) => sum + Number(debt.rate || 0), 0) / profile.debts.length
    : 0;
  return `
    <section class="debt-dashboard">
      <div class="debt-stat primary-stat">
        <p class="label">ยอดหนี้รวม</p>
        <strong>฿${total.toLocaleString("th-TH")}</strong>
      </div>
      <div class="debt-stat">
        <p class="label">ยอดขั้นต่ำ/เดือน</p>
        <strong>฿${minimum.toLocaleString("th-TH")}</strong>
      </div>
      <div class="debt-stat">
        <p class="label">ดอกเบี้ยเฉลี่ย</p>
        <strong>${averageRate.toFixed(1)}%</strong>
      </div>
    </section>
    <section class="health-block">
      <p class="label">รายการหนี้</p>
      ${profile.debts.length ? profile.debts.map((debt) => `
        <div class="debt-list-row">
          <div>
            <strong>${escapeHtml(debt.name || "หนี้ไม่มีชื่อ")}</strong>
            <span>ดอก ${Number(debt.rate || 0)}% · ขั้นต่ำ ฿${Number(debt.min || 0).toLocaleString("th-TH")}</span>
          </div>
          <b>฿${Number(debt.amount || 0).toLocaleString("th-TH")}</b>
        </div>
      `).join("") : `<p class="muted">ยังไม่มีรายการหนี้ เพิ่มหนี้แรกเพื่อให้ Freedom วิเคราะห์ภาระรายเดือนและลำดับการจ่าย</p>`}
    </section>
    <button class="primary icon-label" type="button" data-action="addDebtFromProfile">${iconMarkup("plus")}<span>เพิ่มหนี้</span></button>
  `;
}

function authToastMarkup() {
  return `
    <div class="auth-toast glass" role="status" aria-live="polite">
      <span class="auth-check">✓</span>
      <div>
        <p class="label">Authentication success</p>
        <p>${escapeHtml(authToast)}</p>
      </div>
    </div>
  `;
}

function loginMarkup() {
  return `
    <article class="screen active chat-only">
      <section class="chat-panel" aria-label="บทสนทนาเข้าสู่ระบบกับ Freedom">
        ${conversation.map((message) => `<div class="bubble ${message.role}">${escapeHtml(message.text)}</div>`).join("")}
      </section>

      ${authStep === "pin" ? pinPadMarkup() : ""}
    </article>
  `;
}

function initialAuthConversation() {
  return [
    {
      role: "ai",
      text: "สวัสดีครับ ฉันคือ Freedom ก่อนเริ่มใช้งาน พิมพ์ username ของคุณในช่องแชทด้านล่างได้เลย",
    },
  ];
}

function chatMarkup() {
  return `
    <article class="screen active chat-only">
      ${appTabsMarkup()}
      <section class="chat-panel" aria-label="บทสนทนากับ Freedom">
        ${conversation.map((message) => `<div class="bubble ${message.role}">${escapeHtml(message.text)}</div>`).join("")}
        <div class="bubble ai thinking-bubble" ${isThinking ? "" : "hidden"}>
          <span class="thinking"><span></span><span></span><span></span></span>
        </div>
      </section>
    </article>
  `;
}

function appTabsMarkup() {
  if (!(profile && profile.known)) return "";
  return `
    <nav class="app-tabs" aria-label="เมนูหลัก">
      <button class="${view === "chat" ? "active" : ""}" type="button" data-main-view="chat">${iconMarkup("sparkles")}<span>แชท</span></button>
      <button class="${view === "wallet" ? "active" : ""}" type="button" data-main-view="wallet">${iconMarkup("wallet")}<span>กระเป๋าการเงิน</span></button>
    </nav>
  `;
}

function walletMarkup() {
  const health = getFinancialHealth();
  return `
    <article class="screen active wallet-screen">
      ${appTabsMarkup()}
      <section class="wallet-hero glass" style="--level-color: ${health.color}">
        <div class="health-orb ${health.slug}">${iconMarkup(health.icon)}</div>
        <div>
          <p class="eyebrow">Financial Wallet</p>
          <h2>${health.level}</h2>
          <p class="muted">${escapeHtml(health.statusIntro)}</p>
        </div>
      </section>
      <nav class="wallet-tabs" aria-label="เมนูกระเป๋าการเงิน">
        ${walletTabButton("overview", "ภาพรวม", "trend")}
        ${walletTabButton("debt", "หนี้", "card")}
        ${walletTabButton("expenses", "ภาระ/เดือน", "wallet")}
        ${walletTabButton("assets", "Asset", "coins")}
        ${walletTabButton("health", "สุขภาพ", "heartPulse")}
      </nav>
      <section class="wallet-content">
        ${walletTab === "debt" ? walletDebtTabMarkup() : ""}
        ${walletTab === "expenses" ? walletExpensesTabMarkup() : ""}
        ${walletTab === "assets" ? walletAssetsTabMarkup() : ""}
        ${walletTab === "health" ? profileHealthTabMarkup(health, getFinancialProfileLines()) : ""}
        ${walletTab === "overview" ? walletOverviewMarkup(health) : ""}
      </section>
    </article>
  `;
}

function walletTabButton(tab, label, icon) {
  return `<button class="${walletTab === tab ? "active" : ""}" type="button" data-wallet-tab="${tab}">${iconMarkup(icon)}<span>${label}</span></button>`;
}

function walletOverviewMarkup(health) {
  const stats = getWalletStats();
  return `
    <section class="wallet-grid">
      ${walletStatMarkup("ยอดหนี้รวม", `฿${stats.totalDebt.toLocaleString("th-TH")}`, "card")}
      ${walletStatMarkup("ภาระต่อเดือน", `฿${stats.monthlyOutflow.toLocaleString("th-TH")}`, "wallet")}
      ${walletStatMarkup("Asset รวม", `฿${stats.totalAssets.toLocaleString("th-TH")}`, "coins")}
      ${walletStatMarkup("Net worth", `฿${stats.netWorth.toLocaleString("th-TH")}`, "trend")}
    </section>
    <section class="health-block dashboard-block" style="--level-color: ${health.color}">
      <div class="dashboard-head">
        <div>
          <p class="label">สุขภาพการเงิน</p>
          <strong>${health.level}</strong>
        </div>
        <span class="dashboard-score">${health.progress}%</span>
      </div>
      <div class="health-meter" aria-label="คะแนนสุขภาพการเงิน ${health.progress} เปอร์เซ็นต์">
        <span style="--width: ${health.progress}%"></span>
      </div>
      <p class="muted">${escapeHtml(health.meaning)}</p>
    </section>
    <section class="health-block next-level">
      <p class="label">ก้าวสู่ระดับถัดไป</p>
      <strong>${escapeHtml(health.nextLevel)}</strong>
      <ul>
        ${health.conditions.map((condition, index) => `
          <li class="${health.completedConditions[index] ? "done" : ""}">
            <span class="checkmark">${health.completedConditions[index] ? "✓" : ""}</span>
            <span>${escapeHtml(condition)}</span>
          </li>
        `).join("")}
      </ul>
    </section>
  `;
}

function walletStatMarkup(label, value, icon) {
  return `
    <div class="wallet-stat glass">
      <span class="stat-icon">${iconMarkup(icon)}</span>
      <p class="label">${label}</p>
      <strong>${value}</strong>
    </div>
  `;
}

function walletDebtTabMarkup() {
  const total = profile.debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  const minimum = profile.debts.reduce((sum, debt) => sum + Number(debt.min || 0), 0);
  const averageRate = profile.debts.length
    ? profile.debts.reduce((sum, debt) => sum + Number(debt.rate || 0), 0) / profile.debts.length
    : 0;
  return `
    <section class="debt-dashboard">
      <div class="debt-stat primary-stat">
        <p class="label">ยอดหนี้รวม</p>
        <strong>฿${total.toLocaleString("th-TH")}</strong>
      </div>
      <div class="debt-stat">
        <p class="label">ขั้นต่ำ/เดือน</p>
        <strong>฿${minimum.toLocaleString("th-TH")}</strong>
      </div>
      <div class="debt-stat">
        <p class="label">ดอกเฉลี่ย</p>
        <strong>${averageRate.toFixed(1)}%</strong>
      </div>
    </section>
    <section class="health-block">
      <div class="wallet-section-head">
        <p class="label">รายการหนี้</p>
        <button class="secondary compact icon-label" type="button" data-action="showDebtForm">${iconMarkup("plus")}<span>เพิ่มหนี้</span></button>
      </div>
      ${profile.debts.length ? profile.debts.map((debt, index) => walletDebtRowMarkup(debt, index)).join("") : `<p class="muted">ยังไม่มีรายการหนี้ เพิ่มรายการแรกเพื่อให้ Freedom วิเคราะห์ภาระรายเดือนและลำดับการจ่าย</p>`}
    </section>
    ${showDebtForm ? walletDebtFormMarkup() : ""}
  `;
}

function walletDebtRowMarkup(debt, index) {
  return `
    <div class="debt-list-row managed-row">
      <div>
        <strong>${escapeHtml(debt.name || "หนี้ไม่มีชื่อ")}</strong>
        <span>ดอก ${Number(debt.rate || 0)}% · ขั้นต่ำ ฿${Number(debt.min || 0).toLocaleString("th-TH")}</span>
      </div>
      <b>฿${Number(debt.amount || 0).toLocaleString("th-TH")}</b>
      <div class="row-actions">
        <button class="icon-mini" type="button" data-edit-debt="${index}" aria-label="แก้ไขหนี้">${iconMarkup("edit")}</button>
        <button class="icon-mini danger-action" type="button" data-delete-debt="${index}" aria-label="ลบหนี้">${iconMarkup("trash")}</button>
      </div>
    </div>
  `;
}

function walletDebtFormMarkup() {
  const debt = editingDebtIndex !== null ? profile.debts[editingDebtIndex] || {} : {};
  return `
    <section class="glass wallet-form-card">
      <p class="label">${editingDebtIndex !== null ? "แก้ไขหนี้" : "เพิ่มหนี้ใหม่"}</p>
      <form class="form" id="walletDebtForm">
        ${fieldMarkupWithValue("walletDebtName", "ชื่อหนี้", "เช่น บัตรเครดิต", "text", debt.name || "")}
        ${fieldMarkupWithValue("walletDebtAmount", "ยอดคงเหลือ", "เช่น 35000", "number", debt.amount || "")}
        ${fieldMarkupWithValue("walletDebtRate", "ดอกเบี้ยต่อปี (%)", "เช่น 18", "number", debt.rate || "")}
        ${fieldMarkupWithValue("walletDebtMin", "ยอดขั้นต่ำต่อเดือน", "เช่น 1500", "number", debt.min || "")}
        <div class="button-row tight-actions">
          <button class="secondary icon-label" type="button" data-action="cancelWalletDebt">${iconMarkup("x")}<span>ยกเลิก</span></button>
          <button class="primary icon-label" type="submit">${iconMarkup("check")}<span>บันทึก</span></button>
        </div>
      </form>
    </section>
  `;
}

function walletExpensesTabMarkup() {
  const total = profile.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return `
    <section class="health-block">
      <div class="wallet-section-head">
        <div>
          <p class="label">ภาระค่าใช้จ่ายต่อเดือน</p>
          <strong>฿${total.toLocaleString("th-TH")}</strong>
        </div>
        <button class="secondary compact icon-label" type="button" data-action="showExpenseForm">${iconMarkup("plus")}<span>เพิ่ม</span></button>
      </div>
      ${profile.expenses.length ? profile.expenses.map((item, index) => walletSimpleRowMarkup(item, index, "expense")).join("") : `<p class="muted">ยังไม่มีภาระค่าใช้จ่ายประจำ เพิ่มค่าเช่า ค่าน้ำไฟ ค่าเดินทาง หรือ subscription ที่ต้องจ่ายทุกเดือน</p>`}
    </section>
    ${showExpenseForm ? walletExpenseFormMarkup() : ""}
  `;
}

function walletExpenseFormMarkup() {
  const item = editingExpenseIndex !== null ? profile.expenses[editingExpenseIndex] || {} : {};
  return `
    <section class="glass wallet-form-card">
      <p class="label">${editingExpenseIndex !== null ? "แก้ไขภาระรายเดือน" : "เพิ่มภาระรายเดือน"}</p>
      <form class="form" id="walletExpenseForm">
        ${fieldMarkupWithValue("walletExpenseName", "ชื่อรายการ", "เช่น ค่าเช่า", "text", item.name || "")}
        ${fieldMarkupWithValue("walletExpenseAmount", "จำนวนต่อเดือน", "เช่น 9000", "number", item.amount || "")}
        <div class="button-row tight-actions">
          <button class="secondary icon-label" type="button" data-action="cancelWalletExpense">${iconMarkup("x")}<span>ยกเลิก</span></button>
          <button class="primary icon-label" type="submit">${iconMarkup("check")}<span>บันทึก</span></button>
        </div>
      </form>
    </section>
  `;
}

function walletAssetsTabMarkup() {
  const total = profile.assets.reduce((sum, item) => sum + Number(item.value || 0), 0);
  return `
    <section class="health-block">
      <div class="wallet-section-head">
        <div>
          <p class="label">Asset ที่มี</p>
          <strong>฿${total.toLocaleString("th-TH")}</strong>
        </div>
        <button class="secondary compact icon-label" type="button" data-action="showAssetForm">${iconMarkup("plus")}<span>เพิ่ม</span></button>
      </div>
      ${profile.assets.length ? profile.assets.map((item, index) => walletSimpleRowMarkup(item, index, "asset")).join("") : `<p class="muted">ยังไม่มี asset เพิ่มหุ้น ทอง กองทุน เงินสด หรือทรัพย์สินอื่น เพื่อให้ภาพรวมสุทธิชัดขึ้น</p>`}
    </section>
    ${showAssetForm ? walletAssetFormMarkup() : ""}
  `;
}

function walletAssetFormMarkup() {
  const item = editingAssetIndex !== null ? profile.assets[editingAssetIndex] || {} : {};
  return `
    <section class="glass wallet-form-card">
      <p class="label">${editingAssetIndex !== null ? "แก้ไข asset" : "เพิ่ม asset"}</p>
      <form class="form" id="walletAssetForm">
        ${fieldMarkupWithValue("walletAssetName", "ชื่อ asset", "เช่น หุ้น AOT", "text", item.name || "")}
        <div class="field">
          <label for="walletAssetType">ประเภท</label>
          <select id="walletAssetType" required>
            ${["หุ้น", "ทอง", "กองทุน", "เงินสด", "อื่น ๆ"].map((type) => `<option value="${type}" ${item.type === type ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </div>
        ${fieldMarkupWithValue("walletAssetValue", "มูลค่าปัจจุบัน", "เช่น 50000", "number", item.value || "")}
        <div class="button-row tight-actions">
          <button class="secondary icon-label" type="button" data-action="cancelWalletAsset">${iconMarkup("x")}<span>ยกเลิก</span></button>
          <button class="primary icon-label" type="submit">${iconMarkup("check")}<span>บันทึก</span></button>
        </div>
      </form>
    </section>
  `;
}

function walletSimpleRowMarkup(item, index, kind) {
  const value = kind === "asset" ? Number(item.value || 0) : Number(item.amount || 0);
  const label = kind === "asset" ? item.type || "Asset" : "รายเดือน";
  return `
    <div class="debt-list-row managed-row">
      <div>
        <strong>${escapeHtml(item.name || "ไม่มีชื่อ")}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
      <b>฿${value.toLocaleString("th-TH")}</b>
      <div class="row-actions">
        <button class="icon-mini" type="button" data-edit-${kind}="${index}" aria-label="แก้ไข">${iconMarkup("edit")}</button>
        <button class="icon-mini danger-action" type="button" data-delete-${kind}="${index}" aria-label="ลบ">${iconMarkup("trash")}</button>
      </div>
    </div>
  `;
}

function debtSummaryMarkup() {
  const total = profile.debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  if (!profile.debts.length) {
    return `<section class="glass mini-summary"><p class="label">ยังไม่มีรายการหนี้</p><button class="secondary compact icon-label" type="button" data-action="addDebt">${iconMarkup("plus")}<span>เพิ่มหนี้แรก</span></button></section>`;
  }

  return `
    <section class="glass mini-summary">
      <div>
        <p class="label">หนี้ที่บันทึกไว้</p>
        <p class="value small">${profile.debts.length} รายการ · ฿${total.toLocaleString("th-TH")}</p>
      </div>
      <button class="secondary compact icon-label" type="button" data-action="addDebt">${iconMarkup("plus")}<span>เพิ่มหนี้</span></button>
    </section>
  `;
}

function debtMarkup() {
  return `
    <article class="screen active auth-flow">
      <section class="glass auth-card">
        <p class="eyebrow">เพิ่มหนี้ใหม่</p>
        <h2>ใส่เท่าที่รู้ก่อนก็พอ</h2>
        <p class="muted">Freedom จะใช้ข้อมูลนี้ค่อย ๆ guide ว่าควรจ่ายอะไรก่อน โดยไม่โยนตัวเลขเยอะเกินไป</p>
        <form class="form" id="debtForm">
          ${fieldMarkup("debtName", "ชื่อหนี้", "เช่น บัตรเครดิต K", "text")}
          ${fieldMarkup("debtAmount", "ยอดคงเหลือ", "เช่น 35000", "number")}
          ${fieldMarkup("debtRate", "ดอกเบี้ยต่อปี (%)", "เช่น 18", "number")}
          ${fieldMarkup("debtMin", "ยอดขั้นต่ำต่อเดือน", "เช่น 1500", "number")}
          <div class="button-row">
            <button class="secondary icon-label" type="button" data-action="cancelDebt">${iconMarkup("x")}<span>ยกเลิก</span></button>
            <button class="primary icon-label" type="submit">${iconMarkup("check")}<span>บันทึกหนี้</span></button>
          </div>
        </form>
      </section>
    </article>
  `;
}

function fieldMarkup(id, label, placeholder, type) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}" required />
    </div>
  `;
}

function fieldMarkupWithValue(id, label, placeholder, type, value) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}" value="${escapeHtml(value)}" required />
    </div>
  `;
}

function getComposerMarkup() {
  const placeholder = view === "login" ? "พิมพ์ username..." : "พิมพ์สิ่งที่อยากเล่า...";
  return `
    <form class="composer" id="composer">
      <label class="sr-only" for="chatInput">พิมพ์ข้อความถึง Freedom</label>
      <input id="chatInput" name="chatInput" autocomplete="off" placeholder="${placeholder}" />
      <button class="send-button" type="submit" aria-label="ส่งข้อความ">${iconMarkup("send")}</button>
    </form>
  `;
}

function iconMarkup(name) {
  const icons = {
    phone: "hgi-smart-phone-01",
    monitor: "hgi-computer",
    send: "hgi-sent",
    sparkles: "hgi-sparkles",
    plus: "hgi-plus-sign",
    x: "hgi-cancel-01",
    check: "hgi-tick-02",
    card: "hgi-credit-card",
    trend: "hgi-chart-up",
    wallet: "hgi-wallet-01",
    coins: "hgi-coins-01",
    edit: "hgi-pencil-edit-02",
    trash: "hgi-delete-02",
    shield: "hgi-shield-01",
    heartPulse: "hgi-heart-check",
    legacy: "hgi-sparkles",
    list: "hgi-task-01",
    target: "hgi-target-02",
  };
  return `<i class="hgi-stroke ${icons[name] || icons.sparkles} ui-icon" aria-hidden="true"></i>`;
}

function getReplyIcon(reply) {
  if (reply.includes("หนี้")) return "card";
  if (reply.includes("ลงทุน")) return "trend";
  if (reply.includes("รายจ่าย") || reply.includes("คุม")) return "wallet";
  if (reply.includes("สำรอง")) return "shield";
  if (reply.includes("จัดลำดับ")) return "list";
  if (reply.includes("วางแผน")) return "target";
  return "sparkles";
}

function pinPadMarkup() {
  return `
    <section class="glass pin-panel" aria-label="ปุ่มตัวเลข PIN จาก Freedom">
      <p class="label">${pendingUserExists ? "ใส่ PIN เดิม" : "ตั้ง PIN ใหม่"} 6 หลัก</p>
      <div class="pin-dots" aria-label="กรอกแล้ว ${pinEntry.length} หลัก">
        ${Array.from({ length: 6 }, (_, index) => `<span class="${index < pinEntry.length ? "filled" : ""}"></span>`).join("")}
      </div>
      <div class="pin-grid">
        ${["1", "2", "3", "4", "5", "6", "7", "8", "9", "ลบ", "0", "ล้าง"].map((key) => `<button class="pin-key" type="button" data-pin="${key}">${key}</button>`).join("")}
      </div>
    </section>
  `;
}

function wire() {
  document.querySelector("#debtForm")?.addEventListener("submit", handleDebt);
  document.querySelector("#walletDebtForm")?.addEventListener("submit", handleWalletDebtSubmit);
  document.querySelector("#walletExpenseForm")?.addEventListener("submit", handleWalletExpenseSubmit);
  document.querySelector("#walletAssetForm")?.addEventListener("submit", handleWalletAssetSubmit);
  document.querySelectorAll("[data-main-view]").forEach((button) => {
    button.addEventListener("click", () => {
      view = button.dataset.mainView;
      isHealthOpen = false;
      render();
    });
  });
  document.querySelectorAll("[data-wallet-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      walletTab = button.dataset.walletTab;
      resetWalletForms();
      render();
    });
  });
  document.querySelector("[data-action='addDebt']")?.addEventListener("click", () => {
    view = "debt";
    render();
  });
  document.querySelector("[data-action='cancelDebt']")?.addEventListener("click", () => {
    view = "chat";
    render();
  });
  document.querySelectorAll("[data-action='closeHealth']").forEach((button) => {
    button.addEventListener("click", closeHealthSheet);
  });
  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      profileTab = button.dataset.profileTab;
      render();
    });
  });
  document.querySelector("[data-action='restartAssessment']")?.addEventListener("click", restartAssessment);
  document.querySelector("[data-action='addDebtFromProfile']")?.addEventListener("click", () => {
    isHealthOpen = false;
    view = "debt";
    render();
  });
  document.querySelector("[data-action='showDebtForm']")?.addEventListener("click", () => {
    showDebtForm = true;
    editingDebtIndex = null;
    render();
  });
  document.querySelector("[data-action='cancelWalletDebt']")?.addEventListener("click", () => {
    showDebtForm = false;
    editingDebtIndex = null;
    render();
  });
  document.querySelector("[data-action='showExpenseForm']")?.addEventListener("click", () => {
    showExpenseForm = true;
    editingExpenseIndex = null;
    render();
  });
  document.querySelector("[data-action='cancelWalletExpense']")?.addEventListener("click", () => {
    showExpenseForm = false;
    editingExpenseIndex = null;
    render();
  });
  document.querySelector("[data-action='showAssetForm']")?.addEventListener("click", () => {
    showAssetForm = true;
    editingAssetIndex = null;
    render();
  });
  document.querySelector("[data-action='cancelWalletAsset']")?.addEventListener("click", () => {
    showAssetForm = false;
    editingAssetIndex = null;
    render();
  });
  document.querySelectorAll("[data-edit-debt]").forEach((button) => {
    button.addEventListener("click", () => {
      editingDebtIndex = Number(button.dataset.editDebt);
      showDebtForm = true;
      render();
    });
  });
  document.querySelectorAll("[data-delete-debt]").forEach((button) => {
    button.addEventListener("click", () => deleteWalletItem("debts", Number(button.dataset.deleteDebt)));
  });
  document.querySelectorAll("[data-edit-expense]").forEach((button) => {
    button.addEventListener("click", () => {
      editingExpenseIndex = Number(button.dataset.editExpense);
      showExpenseForm = true;
      render();
    });
  });
  document.querySelectorAll("[data-delete-expense]").forEach((button) => {
    button.addEventListener("click", () => deleteWalletItem("expenses", Number(button.dataset.deleteExpense)));
  });
  document.querySelectorAll("[data-edit-asset]").forEach((button) => {
    button.addEventListener("click", () => {
      editingAssetIndex = Number(button.dataset.editAsset);
      showAssetForm = true;
      render();
    });
  });
  document.querySelectorAll("[data-delete-asset]").forEach((button) => {
    button.addEventListener("click", () => deleteWalletItem("assets", Number(button.dataset.deleteAsset)));
  });
  const modeToggle = document.querySelector("#modeToggle");
  if (modeToggle) modeToggle.onclick = toggleViewMode;
  document.querySelectorAll("[data-pin]").forEach((button) => {
    button.addEventListener("click", () => handlePinKey(button.dataset.pin));
  });
  document.querySelector("#composer")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#chatInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    handleUserMessage(text);
  });
}

function handleDebt(event) {
  event.preventDefault();
  const debt = {
    name: document.querySelector("#debtName").value.trim(),
    amount: Number(document.querySelector("#debtAmount").value),
    rate: Number(document.querySelector("#debtRate").value),
    min: Number(document.querySelector("#debtMin").value),
  };
  profile.debts.push(debt);
  saveUsers();
  view = "chat";
  conversation.push({
    role: "ai",
    text: `บันทึกหนี้ "${debt.name}" แล้วครับ ขั้นต่อไป Freedom จะช่วยดูว่าหนี้นี้ควรอยู่ตรงไหนในแผนการเงินของคุณ`,
  });
  render();
}

function handleWalletDebtSubmit(event) {
  event.preventDefault();
  const debt = {
    name: document.querySelector("#walletDebtName").value.trim(),
    amount: Number(document.querySelector("#walletDebtAmount").value),
    rate: Number(document.querySelector("#walletDebtRate").value),
    min: Number(document.querySelector("#walletDebtMin").value),
  };
  if (editingDebtIndex !== null) {
    profile.debts[editingDebtIndex] = debt;
  } else {
    profile.debts.push(debt);
  }
  showDebtForm = false;
  editingDebtIndex = null;
  saveUsers();
  render();
}

function handleWalletExpenseSubmit(event) {
  event.preventDefault();
  const item = {
    name: document.querySelector("#walletExpenseName").value.trim(),
    amount: Number(document.querySelector("#walletExpenseAmount").value),
  };
  if (editingExpenseIndex !== null) {
    profile.expenses[editingExpenseIndex] = item;
  } else {
    profile.expenses.push(item);
  }
  showExpenseForm = false;
  editingExpenseIndex = null;
  saveUsers();
  render();
}

function handleWalletAssetSubmit(event) {
  event.preventDefault();
  const item = {
    name: document.querySelector("#walletAssetName").value.trim(),
    type: document.querySelector("#walletAssetType").value,
    value: Number(document.querySelector("#walletAssetValue").value),
  };
  if (editingAssetIndex !== null) {
    profile.assets[editingAssetIndex] = item;
  } else {
    profile.assets.push(item);
  }
  showAssetForm = false;
  editingAssetIndex = null;
  saveUsers();
  render();
}

function deleteWalletItem(collection, index) {
  if (!profile?.[collection] || !Number.isInteger(index)) return;
  profile[collection].splice(index, 1);
  resetWalletForms();
  saveUsers();
  render();
}

function resetWalletForms() {
  showDebtForm = false;
  editingDebtIndex = null;
  showExpenseForm = false;
  editingExpenseIndex = null;
  showAssetForm = false;
  editingAssetIndex = null;
}

function enterChat(isNew = false) {
  view = "chat";
  flowMode = "normal";
  conversation = [
    {
      role: "ai",
      text: isNew
        ? `ยินดีที่ได้รู้จักครับ ${currentUser} ตอนนี้ฉันมีภาพรวมเบื้องต้นแล้ว คุณสามารถเพิ่มหนี้ วางแผนเงินสำรอง หรือเริ่มวางแผนลงทุนแบบค่อยเป็นค่อยไปได้`
        : `ยินดีต้อนรับกลับครับ ${currentUser} วันนี้อยากจัดการหนี้ วางแผนเงินสด หรือเริ่มคุยเรื่องลงทุนก่อนดีครับ`,
    },
  ];
}

function enterOnboardingChat() {
  view = "chat";
  flowMode = "onboarding";
  onboardingStep = 0;
  conversation = [
    {
      role: "ai",
      text: `ยินดีที่ได้รู้จักครับ ${currentUser} ก่อนเริ่มวางแผนการเงิน ฉันขอถามทำความรู้จักทีละข้อในแชทนี้นะครับ`,
    },
    {
      role: "ai",
      text: getOnboardingPrompt(),
    },
  ];
}

function handleUserMessage(text) {
  if (view === "login") {
    handleUsernameMessage(text);
    return;
  }
  if (flowMode === "onboarding") {
    handleOnboardingAnswer(text);
    return;
  }
  if (text.includes("เพิ่มหนี้")) {
    view = "wallet";
    walletTab = "debt";
    showDebtForm = true;
    editingDebtIndex = null;
    render();
    return;
  }
  submitMessage(text);
}

async function handleUsernameMessage(text) {
  const username = text.trim().replace(/\s+/g, "_").slice(0, 24);
  if (!username) return;
  pendingUsername = username;
  pinEntry = "";
  conversation.push({ role: "user", text: username });
  conversation.push({ role: "ai", text: `กำลังตรวจสอบ username "${username}" ผ่าน backend สักครู่ครับ` });
  render();

  try {
    const result = await authLookup(username);
    pendingUserExists = Boolean(result.exists);
    authStep = "pin";
    conversation.push({
      role: "ai",
      text: pendingUserExists
        ? `เจอสมาชิก "${username}" แล้วครับ ใส่ PIN 6 หลักที่เคยตั้งไว้เพื่อกลับเข้าใช้งาน`
        : `ยังไม่พบชื่อ "${username}" ครับ ถือว่าเป็นการสมัครใหม่ ตั้ง PIN 6 หลักจากปุ่มตัวเลขด้านล่างได้เลย`,
    });
  } catch (error) {
    pendingUsername = "";
    pendingUserExists = false;
    conversation.push({
      role: "ai",
      text: `ตอนนี้ backend auth ยังตรวจสอบ username ไม่สำเร็จครับ (${error.message})`,
    });
  }
  render();
}

async function handlePinKey(key) {
  if (key === "ล้าง") {
    pinEntry = "";
    updatePinDots();
    return;
  }
  if (key === "ลบ") {
    pinEntry = pinEntry.slice(0, -1);
    updatePinDots();
    return;
  }
  if (!/^\d$/.test(key) || pinEntry.length >= 6) return;

  pinEntry += key;
  updatePinDots();
  if (pinEntry.length === 6) {
    try {
      await completeLoginFromChat();
    } catch (error) {
      recoverAuthFlow(error);
    }
    return;
  }
}

function updatePinDots() {
  const dots = document.querySelectorAll(".pin-dots span");
  dots.forEach((dot, index) => {
    dot.classList.toggle("filled", index < pinEntry.length);
  });
  const pinDots = document.querySelector(".pin-dots");
  if (pinDots) {
    pinDots.setAttribute("aria-label", `กรอกแล้ว ${pinEntry.length} หลัก`);
  }
}

async function completeLoginFromChat() {
  try {
    const result = await authComplete(pendingUsername, pinEntry);
    currentUser = pendingUsername;
    const isNewUser = !result.exists;
    profile = normalizeProfile(result.profile || {
      known: false,
      onboarding: {},
      debts: [],
      checkpoints: {},
    });
    users[currentUser] = profile;
    persistUsers();

    authStep = "username";
    pendingUsername = "";
    pendingUserExists = false;
    pinEntry = "";
    authToast = isNewUser
      ? "สมัครสำเร็จแล้ว Freedom จะเริ่มถามข้อมูลพื้นฐานเพื่อวางแผนการเงิน"
      : "ยืนยันตัวตนสำเร็จ ยินดีต้อนรับกลับครับ";
    startWhaleIntro(profile.known ? "chat" : "onboarding");
  } catch (error) {
    conversation.push({
      role: "ai",
      text: error.status === 401
        ? "PIN ไม่ตรงกับ username นี้ครับ ลองใส่ PIN 6 หลักอีกครั้งได้เลย"
        : `backend auth ตรวจสอบ PIN ไม่สำเร็จครับ (${error.message})`,
    });
    pinEntry = "";
    render();
  }
}

function recoverAuthFlow(error) {
  console.error("Auth flow recovered", error);
  currentUser = pendingUsername || "qa_user";
  profile = normalizeProfile(users[currentUser] || {
    pin: pinEntry || "000000",
    known: false,
    onboarding: {},
    debts: [],
  }, pinEntry);
  users[currentUser] = profile;
  persistUsers();
  enterOnboardingChat();
  authStep = "username";
  pendingUsername = "";
  pendingUserExists = false;
  pinEntry = "";
  authToast = "ยืนยันตัวตนสำเร็จ และ Freedom เริ่ม onboarding ต่อให้แล้ว";
  startWhaleIntro("onboarding");
}

function startWhaleIntro(target) {
  whaleIntroTarget = target;
  view = "whale";
  flowMode = "normal";
  isThinking = false;
  if (whaleIntroTimer) clearTimeout(whaleIntroTimer);
  render();
  whaleIntroTimer = setTimeout(() => {
    whaleIntroTimer = null;
    authToast = "";
    if (whaleIntroTarget === "onboarding") {
      enterOnboardingChat();
    } else {
      enterChat();
    }
    render();
  }, 3800);
}

function handleOnboardingAnswer(text) {
  const item = onboardingQuestions[onboardingStep];
  conversation.push({ role: "user", text });
  profile.onboarding[item.key] = text;

  if (onboardingStep < onboardingQuestions.length - 1) {
    onboardingStep += 1;
    conversation.push({ role: "ai", text: getOnboardingPrompt() });
  } else {
    profile.known = true;
    flowMode = "normal";
    saveUsers();
    conversation.push({
      role: "ai",
      text: getOnboardingCompleteMessage(),
    });
  }
  saveUsers();
  render();
}

function getOnboardingPrompt() {
  const item = onboardingQuestions[onboardingStep];
  return `${item.title}\n${item.helper}\nตัวอย่าง: ${item.placeholder.replace("เช่น ", "")}`;
}

function getOnboardingCompleteMessage() {
  const type = `${profile.onboarding.financialType || ""} ${profile.onboarding.moneyProblem || ""}`;
  if (type.includes("หนี้")) {
    return `ขอบคุณครับ ${currentUser} ตอนนี้ Freedom รู้จักภาพรวมของคุณแล้ว เพราะคุณมีเรื่องหนี้เกี่ยวข้อง ขั้นต่อไปฉันจะช่วยเพิ่มหนี้และจัดลำดับแผนปลดหนี้ให้เป็นขั้น ๆ`;
  }
  if (type.includes("ลงทุน")) {
    return `ขอบคุณครับ ${currentUser} ตอนนี้ Freedom รู้จักภาพรวมของคุณแล้ว ขั้นต่อไปฉันจะช่วยดูเงินสำรอง ความเสี่ยง และวิธีเริ่มลงทุนแบบไม่กดดัน`;
  }
  return `ขอบคุณครับ ${currentUser} ตอนนี้ Freedom รู้จักภาพรวมของคุณแล้ว ขั้นต่อไปฉันจะช่วยจัดลำดับเงินสด รายจ่าย เงินสำรอง และเป้าหมายระยะยาวให้ชัดขึ้น`;
}

function submitMessage(text) {
  conversation.push({ role: "user", text });
  const checkpointUpdated = updateFinancialCheckpoints(text);
  if (checkpointUpdated) {
    saveUsers();
    triggerCheckpointWhale();
  }
  isThinking = true;
  render();
  keepChatAtBottom();

  Promise.allSettled([askBackend(), delay(1250)])
    .then(([aiReply]) => {
      const text = aiReply.status === "fulfilled" ? aiReply.value : aiReply.reason.message;
      conversation.push({ role: "ai", text });
    })
    .finally(() => {
      isThinking = false;
      render();
    });
}

function triggerCheckpointWhale() {
  showCheckpointWhale = true;
  if (checkpointWhaleTimer) clearTimeout(checkpointWhaleTimer);
  checkpointWhaleTimer = setTimeout(() => {
    showCheckpointWhale = false;
    checkpointWhaleTimer = null;
    render();
  }, 2800);
}

async function askBackend() {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "user", text: buildUserContext() },
        ...conversation,
      ],
    }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    throw new Error(`backend ส่งคำตอบกลับมาไม่ถูกต้อง (${response.status} ${response.statusText || "unknown"})`);
  }

  if (!response.ok) {
    throw new Error(data.error || "ยังเชื่อมต่อ AI หลังบ้านไม่ได้");
  }

  return data.reply || "ขอโทษครับ ตอนนี้ AI ยังไม่มีคำตอบ ลองส่งข้อความอีกครั้งได้ไหม";
}

async function authLookup(username) {
  return fetchJson("/api/auth/lookup", { action: "lookup", username });
}

async function authComplete(username, pin) {
  return fetchJson("/api/auth/complete", { action: "complete", username, pin });
}

async function saveProfileToBackend() {
  if (!currentUser || !profile) return;
  try {
    await fetchJson("/api/profile/save", {
      action: "save",
      username: currentUser,
      profile,
    });
  } catch (error) {
    console.error("Backend profile save failed", error);
  }
}

async function fetchJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    const error = new Error(`backend ส่งคำตอบกลับมาไม่ถูกต้อง (${response.status})`);
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(data.error || "backend ตอบกลับไม่สำเร็จ");
    error.status = response.status;
    throw error;
  }

  return data;
}

function buildUserContext() {
  if (!profile) return "ยังไม่มีข้อมูลผู้ใช้";
  const debts = profile.debts.length
    ? profile.debts.map((debt) => `${debt.name}: ยอด ${debt.amount}, ดอก ${debt.rate}%, ขั้นต่ำ ${debt.min}`).join("; ")
    : "ยังไม่มีรายการหนี้";
  const expenses = profile.expenses.length
    ? profile.expenses.map((item) => `${item.name}: ${item.amount}/เดือน`).join("; ")
    : "ยังไม่มีภาระรายเดือน";
  const assets = profile.assets.length
    ? profile.assets.map((item) => `${item.type || "asset"} ${item.name}: ${item.value}`).join("; ")
    : "ยังไม่มี asset";
  return `บริบทผู้ใช้ ${currentUser}: ประเภทเป้าหมาย/ปัญหา ${profile.onboarding.financialType || "-"}, ปัญหาที่กังวล ${profile.onboarding.moneyProblem || "-"}, รายได้ ${profile.onboarding.income || "-"}, เป้าหมาย ${profile.onboarding.goal || "-"}, หนี้: ${debts}. ภาระรายเดือน: ${expenses}. Asset: ${assets}. คุณคือผู้ช่วยการเงินส่วนตัวภาษาไทย ให้ถามทีละข้อแบบไม่ตัดสิน ถ้าผู้ใช้มีหนี้ให้ช่วยจัดลำดับแผนปลดหนี้ก่อน แล้วค่อยต่อยอดเงินสำรองและลงทุน`;
}

function getProfileSummary() {
  const totalDebt = profile.debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  const focus = profile.onboarding.financialType || "ยังไม่ระบุเรื่องหลัก";
  return `โฟกัส: ${focus} · เป้าหมาย: ${profile.onboarding.goal || "ยังไม่ระบุ"}${profile.debts.length ? ` · หนี้ ${profile.debts.length} รายการ รวม ฿${totalDebt.toLocaleString("th-TH")}` : ""}`;
}

function getKnowingPercent() {
  if (!profile) return 0;
  const answered = onboardingQuestions.filter((item) => String(profile.onboarding[item.key] || "").trim()).length;
  return Math.round((answered / onboardingQuestions.length) * 100);
}

function getWalletStats() {
  const totalDebt = profile.debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  const minimumPayment = profile.debts.reduce((sum, debt) => sum + Number(debt.min || 0), 0);
  const fixedExpenses = profile.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalAssets = profile.assets.reduce((sum, item) => sum + Number(item.value || 0), 0);
  return {
    totalDebt,
    minimumPayment,
    fixedExpenses,
    monthlyOutflow: minimumPayment + fixedExpenses,
    totalAssets,
    netWorth: totalAssets - totalDebt,
  };
}

function getFinancialHealth() {
  const progress = getKnowingPercent();
  if (!profile || progress < 50) {
    return healthLevelData("Survival", progress);
  }

  const onboarding = profile.onboarding || {};
  const income = Number(onboarding.income || 0);
  const debtTotal = profile.debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  const minimumPayment = profile.debts.reduce((sum, debt) => sum + Number(debt.min || 0), 0);
  const debtBurden = income ? minimumPayment / income : debtTotal ? 1 : 0;
  const text = `${onboarding.financialType || ""} ${onboarding.moneyProblem || ""} ${onboarding.goal || ""}`;
  const hasDebtSignal = debtTotal > 0 || text.includes("หนี้") || text.includes("ขั้นต่ำ");
  const hasInvestSignal = text.includes("ลงทุน");
  const hasReserveSignal = text.includes("สำรอง");

  if (income >= 120000 && hasInvestSignal && hasReserveSignal && !hasDebtSignal) return healthLevelData("Legacy", 100);
  if (income >= 80000 && hasInvestSignal && hasReserveSignal && debtBurden < 0.05) return healthLevelData("Freedom", 92);
  if (income >= 45000 && (hasInvestSignal || hasReserveSignal) && debtBurden < 0.1) return healthLevelData("Growth", 78 + Math.min(progress / 5, 14));
  if (hasDebtSignal && (debtTotal === 0 || debtBurden > 0.25)) return healthLevelData("Survival", 18 + Math.min(progress, 35));
  if (hasDebtSignal && debtBurden > 0.1) return healthLevelData("Recovery", 38 + Math.min(progress / 4, 20));
  if (hasDebtSignal || income > 0) return healthLevelData("Balance", 58 + Math.min(progress / 5, 18));
  return healthLevelData("Recovery", 42 + Math.min(progress / 4, 20));
}

function healthLevelData(level, progress) {
  const data = {
    Survival: {
      level: "Survival Mode",
      slug: "survival",
      color: "#ff4f6d",
      short: "S",
      icon: "heartPulse",
      nextLevel: "Recovery Mode",
      statusIntro: "ช่วงนี้คือการประคองให้ผ่านรอบการเงินอย่างมั่นคงขึ้นทีละก้าว โดยเริ่มจากสิ่งจำเป็นและภาระที่กดดันที่สุดก่อน",
      meaning: "เงินอาจชนเดือน มีแรงกดดันเรื่องหนี้หรือรายจ่าย และยังไม่มีเงินสำรองที่พออุ่นใจ",
      adviserFocus: "ช่วยจัดลำดับค่าใช้จ่ายจำเป็น เตือนกำหนดจ่ายขั้นต่ำ ลดรายจ่ายที่ไม่เร่งด่วน และเลือกหนึ่งก้าวเล็ก ๆ ที่ทำได้ทันที",
      visualMood: "ทะเลลึกและนิ่ง แสงน้อยแต่ยังเห็นทาง วาฬ AI เรืองแสงแดงอมม่วงเบา ๆ ว่ายใกล้ผู้ใช้เหมือนคอยพยุงจังหวะหายใจ",
      conditions: ["จ่ายขั้นต่ำได้ครบตามรอบ", "ไม่มี missed payment ต่อเนื่อง", "เงินพอใช้ถึงสิ้นเดือน", "เริ่มควบคุมรายจ่ายประจำได้"],
    },
    Recovery: {
      level: "Recovery Mode",
      slug: "recovery",
      color: "#49e8ff",
      short: "R",
      icon: "shield",
      nextLevel: "Balance Mode",
      statusIntro: "คุณเริ่มเห็นจังหวะของเงินชัดขึ้น และสามารถค่อย ๆ ลดแรงกดดันโดยไม่ต้องรีบเปลี่ยนทุกอย่างในครั้งเดียว",
      meaning: "เริ่มควบคุมสถานการณ์การเงินได้ หนี้ไม่เพิ่มขึ้น และเริ่มมีวินัยกับเงินเข้าออกมากขึ้น",
      adviserFocus: "ช่วยตั้ง rhythm การจ่ายหนี้ สรุปเงินเหลือจริง แนะนำ expense cut ที่ไม่กระทบชีวิตมาก และสร้าง safety buffer เริ่มต้น",
      visualMood: "ทะเลเริ่มมีแสง cyan จากผิวน้ำ วาฬ AI เรืองแสงฟ้าเขียวชัดขึ้น เคลื่อนไหวช้าและมั่นคงเหมือนกำลังนำทางออกจากน้ำลึก",
      conditions: ["จ่ายหนี้ได้มากกว่าขั้นต่ำบางรอบ", "เริ่มมีเงินออมแม้จำนวนเล็ก", "มีเงินเหลือปลายเดือน", "ไม่สร้างหนี้เพิ่มต่อเนื่อง"],
    },
    Balance: {
      level: "Balance Mode",
      slug: "balance",
      color: "#50f0ad",
      short: "B",
      icon: "target",
      nextLevel: "Growth Mode",
      statusIntro: "รายรับรายจ่ายเริ่มสมดุลขึ้น คุณมีพื้นที่ให้คิดเป็นระบบมากขึ้น และสามารถเลือกแผนที่ยั่งยืนกับชีวิตจริง",
      meaning: "รายรับรายจ่ายสมดุล หนี้ลดลงต่อเนื่อง และเริ่มมี financial stability ที่จับต้องได้",
      adviserFocus: "ช่วย optimize แผนจ่ายหนี้ สร้าง emergency fund ทีละเดือน ตรวจ spending pattern และเริ่มวาง passive income experiment เล็ก ๆ",
      visualMood: "ทะเลเปิดกว้างขึ้น มีแสง emerald ใต้ผิวน้ำ วาฬ AI ตัวใหญ่ขึ้น โปร่งใสขึ้น และมี glow สม่ำเสมอรอบลำตัว",
      conditions: ["มี emergency fund 3-6 เดือน", "หนี้ดอกสูงลดลงชัดเจน", "เริ่มมี passive income หรือรายได้เสริมที่วัดผลได้", "มี monthly surplus ต่อเนื่อง"],
    },
    Growth: {
      level: "Growth Mode",
      slug: "growth",
      color: "#9d6cff",
      short: "G",
      icon: "trend",
      nextLevel: "Freedom Mode",
      statusIntro: "ฐานการเงินเริ่มเติบโต ความเครียดลดลง และคุณเริ่มมีพลังไปต่อยอดรายได้ การลงทุน และระบบระยะยาว",
      meaning: "การเงินเริ่มเติบโต มี passive income หรือรายได้เสริมบางส่วน และความเครียดทางการเงินลดลง",
      adviserFocus: "ช่วยเพิ่ม consistency ของรายได้เสริม สร้าง investment habit ตรวจ risk/reward และคุมไม่ให้การเติบโตสร้างภาระใหม่",
      visualMood: "ทะเลสว่างขึ้นเป็นม่วง emerald มีประกายละเอียดรอบตัว วาฬ AI เรืองแสงมากขึ้น ว่ายช้าลงและดูสง่างามขึ้น",
      conditions: ["passive income ช่วยค่าใช้จ่ายได้บางส่วน", "หนี้ดอกสูงเกือบหมดหรือมีแผนปิดชัดเจน", "มี investment habit ต่อเนื่อง", "มีเงินสำรองที่แข็งแรง"],
    },
    Freedom: {
      level: "Freedom Mode",
      slug: "freedom",
      color: "#ffffff",
      short: "F",
      icon: "sparkles",
      nextLevel: "Legacy Mode",
      statusIntro: "คุณมีอิสระในการเลือกมากขึ้น ไม่ต้องตัดสินใจจากความกดดันระยะสั้นเพียงอย่างเดียว และเริ่มออกแบบชีวิตตามคุณค่าของตัวเอง",
      meaning: "debt-free หรือใกล้ debt-free มี freedom of choice และไม่ใช้ชีวิตแบบ paycheck to paycheck",
      adviserFocus: "ช่วยรักษาระบบ wealth allocation วางเป้าหมายชีวิต ระวัง lifestyle creep และต่อยอด passive income ให้มั่นคงขึ้น",
      visualMood: "มหาสมุทรเปิดกว้างและสว่าง วาฬ AI โปร่งแสงเหมือน liquid glass มี glow ขาว cyan และ emerald ที่สงบมาก",
      conditions: ["passive income ครอบคลุมค่าใช้จ่ายหลักได้มากขึ้น", "มี wealth system ที่ยั่งยืน", "มี financial flexibility สูง", "ทบทวนระบบเงิน การลงทุน และความเสี่ยงเป็นประจำ"],
    },
    Legacy: {
      level: "Legacy Mode",
      slug: "legacy",
      short: "L",
      icon: "legacy",
      color: "#ffe8a3",
      nextLevel: "Legacy Mode",
      statusIntro: "นี่คือช่วงที่เงินเริ่มทำงานร่วมกับเวลาและคุณค่าของชีวิต คุณมีพื้นที่ในการสร้าง impact และส่งต่อความมั่นคงอย่างตั้งใจ",
      meaning: "beyond survival เงินทำงานแทนเวลา มีความมั่นคงระยะยาว และสามารถสร้าง impact หรือส่งต่อความมั่นคงให้คนอื่นได้",
      adviserFocus: "ช่วยออกแบบระบบระยะยาว การส่งต่อทรัพย์สิน แผนภาษี การให้ และการรักษาความยั่งยืนของ wealth system",
      visualMood: "ทะเลเป็นสีรุ่งเช้า กว้าง สว่าง และนิ่ง วาฬ AI ดู majestic ที่สุด มีแสงนุ่มลึกไหลอยู่ภายในเหมือน guardian ของทั้ง ecosystem",
      conditions: ["รักษา passive income ให้ครอบคลุมค่าใช้จ่ายหลัก", "ดูแลระบบทรัพย์สินและความเสี่ยงระยะยาว", "ออกแบบ legacy goal ที่สอดคล้องกับชีวิต", "ส่งต่อความรู้หรือความมั่นคงในแบบที่คุณเลือก"],
    },
  };
  const health = data[level];
  const completedConditions = getCompletedConditions(health.slug, health.conditions.length);
  const completedCount = completedConditions.filter(Boolean).length;
  const checkpointBoost = completedCount * 8;
  return {
    progress: Math.max(0, Math.min(100, Math.round(progress + checkpointBoost))),
    completedConditions,
    ...health,
  };
}

function getCompletedConditions(slug, count) {
  const saved = profile?.checkpoints?.[slug] || {};
  return Array.from({ length: count }, (_, index) => Boolean(saved[index]));
}

function updateFinancialCheckpoints(text) {
  if (!profile?.known || !text) return false;
  const currentHealth = getFinancialHealth();
  const rules = checkpointRules[currentHealth.slug];
  if (!rules) return false;

  const normalizedText = String(text).toLowerCase();
  profile.checkpoints = profile.checkpoints || {};
  profile.checkpoints[currentHealth.slug] = profile.checkpoints[currentHealth.slug] || {};

  let changed = false;
  rules.forEach((keywords, index) => {
    if (profile.checkpoints[currentHealth.slug][index]) return;
    const matched = keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
    if (matched) {
      profile.checkpoints[currentHealth.slug][index] = true;
      changed = true;
    }
  });

  return changed;
}

function getFinancialProfileLines() {
  if (!profile) {
    return [
      { label: "สถานะ", value: "ยังไม่ได้เข้าสู่ระบบ" },
      { label: "ข้อมูลประเมิน", value: "0%" },
    ];
  }
  const onboarding = profile.onboarding || {};
  const debtTotal = profile.debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  const minimumPayment = profile.debts.reduce((sum, debt) => sum + Number(debt.min || 0), 0);
  return [
    { label: "Username", value: currentUser || "-" },
    { label: "โฟกัสหลัก", value: onboarding.financialType || "ยังไม่ระบุ" },
    { label: "ปัญหาที่กังวล", value: onboarding.moneyProblem || "ยังไม่ระบุ" },
    { label: "รายได้ต่อเดือน", value: onboarding.income ? `฿${Number(onboarding.income).toLocaleString("th-TH")}` : "ยังไม่ระบุ" },
    { label: "หนี้ที่บันทึก", value: debtTotal ? `฿${debtTotal.toLocaleString("th-TH")} / ขั้นต่ำ ฿${minimumPayment.toLocaleString("th-TH")}` : "ยังไม่มีรายการหนี้" },
    { label: "ข้อมูลประเมิน", value: `${getKnowingPercent()}%` },
  ];
}

function closeHealthSheet() {
  isHealthOpen = false;
  render();
}

function restartAssessment() {
  if (!profile) return;
  profile.onboarding = {};
  profile.known = false;
  onboardingStep = 0;
  isHealthOpen = false;
  saveUsers();
  enterOnboardingChat();
  render();
}

function resetChat() {
  if (!profile) {
    view = "login";
    authStep = "username";
    pendingUsername = "";
    pendingUserExists = false;
    pinEntry = "";
    authToast = "";
    conversation = initialAuthConversation();
    render();
    return;
  }
  if (!profile.known) {
    enterOnboardingChat();
  } else {
    enterChat();
  }
  isThinking = false;
  render();
}

function resetTestData() {
  localStorage.removeItem(STORAGE_KEY);
  users = {};
  currentUser = null;
  profile = null;
  view = "login";
  flowMode = "normal";
  authStep = "username";
  pendingUsername = "";
  pendingUserExists = false;
  pinEntry = "";
  authToast = "";
  onboardingStep = 0;
  conversation = [
    {
      role: "ai",
      text: "ล้างข้อมูลเทสแล้วครับ พิมพ์ username ใหม่เพื่อเริ่ม flow สมัครได้เลย",
    },
  ];
  render();
}

function temporarySystemMessage(text) {
  document.querySelector("#appContent").insertAdjacentHTML("beforeend", `<p class="form-error">${escapeHtml(text)}</p>`);
}

function delay(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function keepChatAtBottom() {
  const content = document.querySelector("#appContent");
  requestAnimationFrame(() => {
    content.scrollTop = content.scrollHeight;
  });
}

function loadUsers() {
  try {
    const storedUsers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return Object.fromEntries(
      Object.entries(storedUsers).map(([username, storedProfile]) => [
        username,
        normalizeProfile(storedProfile),
      ]),
    );
  } catch {
    return {};
  }
}

function loadViewMode() {
  return localStorage.getItem(VIEW_MODE_KEY) === "desktop" ? "desktop" : "mobile";
}

function toggleViewMode() {
  viewMode = viewMode === "mobile" ? "desktop" : "mobile";
  localStorage.setItem(VIEW_MODE_KEY, viewMode);
  updateChrome();
}

function saveUsers() {
  if (currentUser && profile) users[currentUser] = profile;
  persistUsers();
}

function persistUsers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Could not persist users", error);
  }
  saveProfileToBackend();
  syncCurrentProfileToSupabase();
}

async function initSupabaseStorage() {
  try {
    const response = await fetch(`${API_BASE}/api/config`);
    const config = await response.json();
    if (!config.supabaseConfigured) {
      storageStatus = "local";
      return;
    }
    supabaseTable = config.supabaseTable || supabaseTable;
    storageStatus = "backend";
    render();
  } catch (error) {
    console.error("Backend storage status fallback to localStorage", error);
    storageStatus = "local";
  }
}

function syncCurrentProfileToSupabase() {
  return;
}

function normalizeProfile(storedProfile, fallbackPin = "") {
  const safeProfile = storedProfile && typeof storedProfile === "object" ? storedProfile : {};
  return {
    pin: String(safeProfile.pin || fallbackPin || ""),
    known: Boolean(safeProfile.known),
    onboarding: safeProfile.onboarding && typeof safeProfile.onboarding === "object" ? safeProfile.onboarding : {},
    debts: Array.isArray(safeProfile.debts) ? safeProfile.debts : [],
    expenses: Array.isArray(safeProfile.expenses) ? safeProfile.expenses : [],
    assets: Array.isArray(safeProfile.assets) ? safeProfile.assets : [],
    checkpoints: safeProfile.checkpoints && typeof safeProfile.checkpoints === "object" ? safeProfile.checkpoints : {},
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function refreshStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/status`);
    const data = await response.json();
    const aiConfigured = data.geminiConfigured || data.openaiConfigured;
    aiStatus = aiConfigured
      ? `เชื่อมต่อ AI หลังบ้านแล้ว · ${data.model}`
      : "เชื่อม backend แล้ว · รอ GEMINI_API_KEY";
    if (data.supabaseConfigured) {
      aiStatus += storageStatus === "backend" ? " · Backend auth พร้อม" : " · กำลังเชื่อม backend auth";
    }
  } catch {
    aiStatus = "ยังตรวจสอบ backend ไม่สำเร็จ";
  }
  render();
}

document.querySelector("#profileButton")?.addEventListener("click", () => {
  if (!(profile && profile.known)) return;
  isHealthOpen = false;
  walletTab = "overview";
  view = "wallet";
  render();
});

render();
refreshStatus();
initSupabaseStorage().then(refreshStatus);
