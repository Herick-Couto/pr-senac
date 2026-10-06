const APP_KEY = "lava_car_system_v6";
const STATUSES = ["Na fila", "Lavando", "Finalizado", "Entregue"];
const PERIODS = { day: "Dia", week: "Semana", month: "Mês", year: "Ano", custom: "Personalizado" };
const DEFAULT_SERVICES = [
  { id: "svc-simples", name: "Simples", value: 45, active: true },
  { id: "svc-completa", name: "Completa", value: 65, active: true },
  { id: "svc-cera", name: "Completa com cera", value: 85, active: true },
  { id: "svc-higienizacao", name: "Higienização Interna", value: 120, active: true },
  { id: "svc-motor", name: "Motor", value: 70, active: true },
  { id: "svc-polimento", name: "Polimento", value: 180, active: true }
];
const now = new Date();
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = iso(now);
const money = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
const dateBR = s => s ? new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR") : "";
const monthBR = s => new Date(`${s}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const defaultBrand = { name: "Xavier Estética Automotiva", logo: "logo-xavier.png", primary: "#e10600", secondary: "#111111", theme: "light" };
const defaultSettings = { monthlyPrice: 99.90 };

let selectedDate = today;
let calendarCursor = new Date(`${today}T12:00:00`);
let dashboardPeriod = "day";
let dashboardStart = today;
let dashboardEnd = today;
let financePeriod = "day";
let financeStart = today;
let financeEnd = today;

function seedData() {
  const names = ["Carlos Henrique", "Mariana Alves", "João Paulo", "Fernanda Costa", "Rafael Souza", "Lucas Martins", "Beatriz Lima", "André Oliveira", "Camila Rocha", "Gustavo Mendes"];
  const phones = ["(44) 99999-1001", "(44) 99999-1002", "(44) 99999-1003", "(44) 99999-1004", "(44) 99999-1005", "(44) 99999-1006", "(44) 99999-1007", "(44) 99999-1008", "(44) 99999-1009", "(44) 99999-1010"];
  const cars = ["Onix Preto", "HB20 Branco", "Corolla Prata", "Gol Vermelho", "T-Cross Cinza", "Civic Preto", "Argo Branco", "Saveiro Azul", "Polo Cinza", "Creta Branco"];
  const types = ["Completa", "Simples", "Completa com cera", "Higienização Interna", "Simples", "Completa", "Motor", "Completa com cera"];
  const statuses = ["Entregue", "Finalizado", "Lavando", "Na fila", "Entregue", "Finalizado", "Entregue", "Lavando"];
  const priceByName = Object.fromEntries(DEFAULT_SERVICES.map(s => [s.name, s.value]));
  const expenseNames = [
    { name: "Shampoo automotivo", value: 38 },
    { name: "Cera líquida", value: 52 },
    { name: "Pano de microfibra", value: 27 },
    { name: "Desengraxante", value: 44 },
    { name: "Pretinho para pneu", value: 31 },
    { name: "Limpeza interna", value: 48 }
  ];
  const allCars = [];
  const allExpenses = [];
  const demoEnd = "2026-10-07";

  for (let d = -150; d <= 30; d++) {
    const dt = new Date(`${today}T12:00:00`);
    dt.setDate(dt.getDate() + d);
    const day = iso(dt);
    if (day > demoEnd) continue;
    const isFuture = day > today;
    const count = isFuture ? 5 : (day === today ? 8 : 2 + (Math.abs(d) % 4));

    for (let j = 0; j < count; j++) {
      const idx = (Math.abs(d) * 3 + j) % names.length;
      const type = types[(Math.abs(d) + j) % types.length];
      allCars.push({
        id: uid(), date: day, time: `${pad(8 + (j * 2) % 9)}:${j % 2 ? "30" : "00"}`, endTime: "",
        name: names[idx], phone: phones[idx], vehicle: cars[idx], plate: j % 3 ? "" : "ABC1D23",
        type, value: priceByName[type] || 0,
        status: isFuture ? "Na fila" : day === today ? statuses[j] : "Entregue",
        createdAt: Date.now() + d * 86400000 - j * 1000
      });
    }

    if (!isFuture && ((Math.abs(d) % 3 === 0) || day === today)) {
      const firstExpense = expenseNames[Math.abs(d) % expenseNames.length];
      allExpenses.push({ id: uid(), date: day, name: firstExpense.name, value: firstExpense.value + (Math.abs(d) % 4) * 3 });
      if (Math.abs(d) % 5 === 0 || day === today) {
        const secondExpense = expenseNames[(Math.abs(d) + 2) % expenseNames.length];
        allExpenses.push({ id: uid(), date: day, name: secondExpense.name, value: secondExpense.value + (Math.abs(d) % 3) * 4 });
      }
    }
  }

  return {
    brand: { ...defaultBrand },
    settings: { ...defaultSettings },
    services: DEFAULT_SERVICES.map(s => ({ ...s })),
    clients: [],
    cars: allCars,
    expenses: allExpenses
  };
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(APP_KEY)) || seedData();
  } catch {
    return seedData();
  }
}

function normalizeDb(raw) {
  const data = raw || seedData();
  data.brand = { ...defaultBrand, ...(data.brand || {}) };
  if (!data.brand.name || data.brand.name === "PR Mobile" || data.brand.name === "Lava Car") data.brand.name = defaultBrand.name;
  if (!data.brand.logo) data.brand.logo = defaultBrand.logo;
  // A identidade visual desta versão é fixa em preto + vermelho.
  data.brand.primary = defaultBrand.primary;
  data.brand.secondary = defaultBrand.secondary;
  data.settings = { ...defaultSettings, ...(data.settings || {}) };
  data.services = Array.isArray(data.services) && data.services.length
    ? data.services.map(s => ({ id: s.id || uid(), name: String(s.name || "Serviço"), value: Number(s.value) || 0, active: s.active !== false }))
    : DEFAULT_SERVICES.map(s => ({ ...s }));
  data.clients = Array.isArray(data.clients) ? data.clients : [];
  data.cars = (data.cars || []).map(c => ({ ...c, date: c.date || today, time: c.time || "", endTime: c.endTime || "", phone: c.phone || "", value: Number(c.value) || 0 }));
  data.expenses = (data.expenses || []).map(x => ({ ...x, value: Number(x.value) || 0 }));
  return data;
}

let db = normalizeDb(load());
save();

function save() { localStorage.setItem(APP_KEY, JSON.stringify(db)); }
function applyTheme() {
  document.body.classList.toggle("dark", db.brand.theme === "dark");
  document.documentElement.style.setProperty("--brand", db.brand.primary);
  document.documentElement.style.setProperty("--brand2", db.brand.secondary);
}
function escapeHTML(v) { return String(v ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])); }
function logoHTML(cls = "") { return db.brand.logo ? `<img class="${cls}" src="${db.brand.logo}" alt="Logo">` : `<div class="brand-placeholder ${cls}">${escapeHTML((db.brand.name || "PR").slice(0, 2).toUpperCase())}</div>`; }
function statusClass(s) { return "s-" + String(s).toLowerCase().replaceAll(" ", "-"); }
function getActiveServices() { return db.services.filter(s => s.active !== false).sort((a, b) => a.name.localeCompare(b.name)); }
function findService(ref) { return db.services.find(s => s.id === ref || s.name === ref); }
function serviceOptions(selectedName = "") {
  const rows = getActiveServices();
  const selectedExists = rows.some(s => s.name === selectedName);
  const extra = selectedName && !selectedExists ? [{ id: "legacy", name: selectedName, value: 0, active: true }] : [];
  return [...rows, ...extra].map(s => `<option value="${escapeHTML(s.id)}" data-name="${escapeHTML(s.name)}" ${s.name === selectedName ? "selected" : ""}>${escapeHTML(s.name)} — ${money(s.value)}</option>`).join("");
}

function appShell(active = "home") {
  return `<div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="side-brand">${logoHTML("side-logo")}<div><div class="side-name">${escapeHTML(db.brand.name)}</div><small class="side-subtitle">Gestão para lava car</small></div></div>
      <nav class="nav">
        <button class="${active === "home" ? "active" : ""}" onclick="navigate('home')">⌂ <span>Home</span></button>
        <button class="${active === "agenda" ? "active" : ""}" onclick="navigate('agenda')">▣ <span>Agenda</span></button>
        <button class="${active === "clientes" ? "active" : ""}" onclick="navigate('clientes')">♙ <span>Clientes</span></button>
        <button class="${active === "cadastros" ? "active" : ""}" onclick="navigate('cadastros')">＋ <span>Cadastros</span></button>
        <button class="${active === "financeiro" ? "active" : ""}" onclick="navigate('financeiro')">$ <span>Financeiro</span></button>
        <button class="${active === "relatorios" ? "active" : ""}" onclick="navigate('relatorios')">▤ <span>Relatórios</span></button>
        <button class="${active === "config" ? "active" : ""}" onclick="navigate('config')">⚙ <span>Configurações</span></button>
      </nav>
      <div class="side-bottom"><button class="btn btn-ghost" onclick="toggleTheme()">${db.brand.theme === "dark" ? "☀" : "☾"} <span>${db.brand.theme === "dark" ? "Modo claro" : "Modo escuro"}</span></button></div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="top-left"><button class="btn mobile-menu" onclick="toggleSidebar()">☰</button><span class="topbar-title">${escapeHTML(db.brand.name)}</span></div><div class="top-actions">${logoHTML("topbar-logo")}</div></header>
      <div id="page"></div><div class="footer">Desenvolvido por Tryve</div>
    </main>
  </div>`;
}

function render(active = "home") { applyTheme(); document.getElementById("app").innerHTML = appShell(active); window.scrollTo(0, 0); }
function navigate(page) {
  render(page);
  const fn = { home: renderHome, agenda: renderAgenda, clientes: renderClientes, cadastros: renderCadastros, financeiro: renderFinanceiro, relatorios: renderRelatorios, config: renderConfig }[page] || renderHome;
  fn(); closeSidebar();
  if (location.hash !== `#${page}`) location.hash = `#${page}`;
}
function closeSidebar() { document.getElementById("sidebar")?.classList.remove("open"); }
function toggleSidebar() { document.getElementById("sidebar")?.classList.toggle("open"); }
function toggleTheme() { db.brand.theme = db.brand.theme === "dark" ? "light" : "dark"; save(); navigate(location.hash.slice(1) || "home"); }
function nextDayISO() { const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() + 1); return iso(d); }
function goToNextDayAgenda() { selectedDate = nextDayISO(); calendarCursor = new Date(`${selectedDate}T12:00:00`); navigate("agenda"); }

function periodRange(period, start, end) {
  const base = new Date(`${today}T12:00:00`); let a, b;
  if (period === "day") a = b = today;
  else if (period === "week") { const x = new Date(base); const day = x.getDay(); x.setDate(x.getDate() - (day === 0 ? 6 : day - 1)); a = iso(x); const y = new Date(x); y.setDate(y.getDate() + 6); b = iso(y); }
  else if (period === "month") { a = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-01`; b = iso(new Date(base.getFullYear(), base.getMonth() + 1, 0)); }
  else if (period === "year") { a = `${base.getFullYear()}-01-01`; b = `${base.getFullYear()}-12-31`; }
  else { a = start || today; b = end || today; if (a > b) [a, b] = [b, a]; }
  return { start: a, end: b };
}
function setPeriod(scope, value) {
  if (scope === "home") { dashboardPeriod = value; const r = periodRange(value, dashboardStart, dashboardEnd); dashboardStart = r.start; dashboardEnd = r.end; renderHomeBody(); }
  else { financePeriod = value; const r = periodRange(value, financeStart, financeEnd); financeStart = r.start; financeEnd = r.end; renderFinanceiroBody(); }
}
function applyCustomPeriod(scope) {
  if (scope === "home") { dashboardPeriod = "custom"; dashboardStart = document.getElementById("homeStart").value || today; dashboardEnd = document.getElementById("homeEnd").value || today; renderHomeBody(); }
  else { financePeriod = "custom"; financeStart = document.getElementById("financeStart").value || today; financeEnd = document.getElementById("financeEnd").value || today; renderFinanceiroBody(); }
}
function filterBar(scope) {
  const period = scope === "home" ? dashboardPeriod : financePeriod;
  const start = scope === "home" ? dashboardStart : financeStart;
  const end = scope === "home" ? dashboardEnd : financeEnd;
  return `<div class="period-filter"><div class="period-buttons">${Object.entries(PERIODS).map(([k, v]) => `<button class="period-btn ${period === k ? "active" : ""}" onclick="setPeriod('${scope}','${k}')">${v}</button>`).join("")}</div>${period === "custom" ? `<div class="custom-dates"><label>Início<input id="${scope}Start" type="date" value="${start}"></label><label>Fim<input id="${scope}End" type="date" value="${end}"></label><button class="btn btn-primary" onclick="applyCustomPeriod('${scope}')">Aplicar</button></div>` : `<div class="filter-caption">Período: <strong>${dateBR(start)} a ${dateBR(end)}</strong></div>`}</div>`;
}
function inRange(date, start, end) { return date >= start && date <= end; }
function recordsInRange(start, end) { return db.cars.filter(c => inRange(c.date, start, end)); }
function expensesInRange(start, end) { return db.expenses.filter(c => inRange(c.date, start, end)); }
function completed(c) { return ["Finalizado", "Entregue"].includes(c.status); }
function sum(a, fn) { return a.reduce((x, y) => x + (Number(fn(y)) || 0), 0); }

function bucketData(start, end) {
  const a = new Date(`${start}T12:00:00`), b = new Date(`${end}T12:00:00`), days = Math.round((b - a) / 86400000) + 1;
  const mode = days <= 1 ? "hour" : days <= 31 ? "day" : "month";
  const out = [];
  if (mode === "hour") {
    for (let h = 6; h <= 22; h++) {
      const label = pad(h) + "h";
      const cars = db.cars.filter(c => c.date === start && Number((c.time || "00").slice(0, 2)) === h);
      const ex = db.expenses.filter(x => x.date === start);
      out.push({ key: label, label, revenue: sum(cars.filter(completed), c => c.value), expense: h === 12 ? sum(ex, e => e.value) : 0, count: cars.length });
    }
  } else if (mode === "day") {
    for (let i = 0; i < days; i++) {
      const d = new Date(a); d.setDate(a.getDate() + i); const key = iso(d);
      const cars = db.cars.filter(c => c.date === key), ex = db.expenses.filter(x => x.date === key);
      out.push({ key, label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), revenue: sum(cars.filter(completed), c => c.value), expense: sum(ex, e => e.value), count: cars.length });
    }
  } else {
    const cur = new Date(a.getFullYear(), a.getMonth(), 1), last = new Date(b.getFullYear(), b.getMonth(), 1);
    while (cur <= last) {
      const first = iso(cur), lastDay = iso(new Date(cur.getFullYear(), cur.getMonth() + 1, 0));
      const cars = db.cars.filter(c => c.date >= first && c.date <= lastDay), ex = db.expenses.filter(x => x.date >= first && x.date <= lastDay);
      out.push({ key: first, label: cur.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }), revenue: sum(cars.filter(completed), c => c.value), expense: sum(ex, e => e.value), count: cars.length });
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return out;
}

function chartHTML(data, id = "mainChart") {
  const max = Math.max(1, ...data.map(x => Math.max(x.revenue, x.expense)));
  return `<div class="chart-wrap" id="${id}"><div class="chart-plot">${data.map((x, i) => `<button class="chart-point" type="button" title="${escapeHTML(x.label)} | Faturamento: ${money(x.revenue)} | Gastos: ${money(x.expense)} | Lucro: ${money(x.revenue - x.expense)} | Agendamentos: ${x.count}" style="--h1:${Math.max(3, x.revenue / max * 100)}%;--h2:${Math.max(3, x.expense / max * 100)}%" onclick="toggleChartTip('${id}',${i})" onmouseenter="showChartTip('${id}',${i})" onmouseleave="hideChartTip('${id}')"><span class="chart-bar revenue"></span><span class="chart-bar expense"></span><span class="chart-label">${escapeHTML(x.label)}</span><span class="chart-tip" id="${id}-tip-${i}"><strong>${escapeHTML(x.label)}</strong><br>Faturamento: ${money(x.revenue)}<br>Gastos: ${money(x.expense)}<br>Lucro: ${money(x.revenue - x.expense)}<br>Agendamentos: ${x.count}</span></button>`).join("")}</div><div class="chart-legend"><span><i class="legend-revenue"></i>Faturamento</span><span><i class="legend-expense"></i>Gastos</span><em>Toque/clique ou passe o mouse nas barras</em></div></div>`;
}
function showChartTip(id, i) { document.querySelectorAll(`#${id} .chart-tip`).forEach(x => x.classList.remove("show")); document.getElementById(`${id}-tip-${i}`)?.classList.add("show"); }
function hideChartTip(id) { if (matchMedia("(hover: hover) and (pointer: fine)").matches) document.querySelectorAll(`#${id} .chart-tip`).forEach(x => x.classList.remove("show")); }
function toggleChartTip(id, i) { const x = document.getElementById(`${id}-tip-${i}`); const shown = x?.classList.contains("show"); document.querySelectorAll(`#${id} .chart-tip`).forEach(t => t.classList.remove("show")); if (x && !shown) x.classList.add("show"); }

function renderHome() { renderHomeBody(); }
function renderHomeBody() {
  const r = periodRange(dashboardPeriod, dashboardStart, dashboardEnd); dashboardStart = r.start; dashboardEnd = r.end;
  const cars = recordsInRange(r.start, r.end), ex = expensesInRange(r.start, r.end);
  const revenue = sum(cars.filter(completed), c => c.value), expenses = sum(ex, e => e.value);
  const clients = new Set(cars.map(c => c.phone || c.name)).size, open = cars.filter(c => ["Na fila", "Lavando"].includes(c.status)).length;
  const todayRows = db.cars.filter(c => c.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const data = bucketData(r.start, r.end);
  document.getElementById("page").innerHTML = `<div class="content">
    <div class="page-head"><div><h2>Home</h2><div class="muted">Visão geral da operação</div></div><button class="btn btn-primary" onclick="goToNextDayAgenda()">＋ Agendar carro</button></div>
    ${filterBar("home")}
    <div class="grid stats"><div class="stat"><div class="stat-label">FATURAMENTO</div><div class="stat-value positive">${money(revenue)}</div><small>${dateBR(r.start)} a ${dateBR(r.end)}</small></div><div class="stat"><div class="stat-label">GASTOS</div><div class="stat-value negative">${money(expenses)}</div><small>Saídas registradas</small></div><div class="stat"><div class="stat-label">LUCRO</div><div class="stat-value">${money(revenue - expenses)}</div><small>${clients} cliente(s) no período</small></div><div class="stat"><div class="stat-label">EM ATENDIMENTO</div><div class="stat-value">${open}</div><small>Na fila ou lavando</small></div></div>
    <div class="grid home-grid"><div class="card"><div class="section-title"><div><h3>Faturamento x gastos</h3><span class="muted">Clique/toque em uma barra para ver os valores</span></div></div>${chartHTML(data, "homeChart")}</div>
    <div class="card"><div class="section-title"><div><h3>Clientes de hoje</h3><span class="muted">${todayRows.length} agendamento(s)</span></div><button class="btn" onclick="navigate('clientes')">Ver todos</button></div><div class="list">${todayRows.slice(0, 8).map(c => `<div class="row"><div><strong>${escapeHTML(c.name)}</strong><div class="muted">${escapeHTML(c.vehicle)} · ${escapeHTML(c.time)}</div></div><span class="tag status ${statusClass(c.status)}">${escapeHTML(c.status)}</span></div>`).join("") || `<div class="empty">Nenhum cliente agendado hoje.</div>`}</div></div></div>
    <div class="grid home-grid secondary-home"><div class="card"><div class="section-title"><h3>Próximos agendamentos</h3><button class="btn" onclick="navigate('agenda')">Abrir agenda</button></div><div class="list">${db.cars.filter(c => c.date > today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3).map(c => `<div class="row"><div><strong>${dateBR(c.date)} · ${escapeHTML(c.time)}</strong><div class="muted">${escapeHTML(c.name)} · ${escapeHTML(c.vehicle)}</div></div><span class="tag">${money(c.value)}</span></div>`).join("") || `<div class="empty">Nenhum agendamento futuro.</div>`}</div></div>
    <div class="card accent-card"><div class="section-title"><h3>Lavagens mais procuradas</h3><button class="btn" onclick="navigate('relatorios')">Ver relatórios</button></div><div class="rank-list">${Object.entries(db.cars.reduce((acc, c) => ((acc[c.type] = (acc[c.type] || 0) + 1), acc), {})).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, total], i) => `<div><span>${i + 1}. ${escapeHTML(name)}</span><b>${total}</b></div>`).join("") || `<div class="empty">Sem dados de serviços.</div>`}</div></div></div>
  </div>`;
}

function calendarHTML() {
  const y = calendarCursor.getFullYear(), m = calendarCursor.getMonth(), first = new Date(y, m, 1).getDay(), offset = (first + 6) % 7, daysIn = new Date(y, m + 1, 0).getDate();
  let cells = "";
  for (let i = 0; i < offset; i++) cells += `<div class="cal-cell empty-cell"></div>`;
  for (let day = 1; day <= daysIn; day++) {
    const d = `${y}-${pad(m + 1)}-${pad(day)}`, count = db.cars.filter(c => c.date === d).length;
    cells += `<button class="cal-cell ${d === selectedDate ? "selected" : ""} ${d === today ? "today" : ""}" onclick="selectDate('${d}')"><span>${day}</span>${count ? `<b>${count}</b>` : ""}</button>`;
  }
  return `<div class="calendar"><div class="cal-head"><button class="btn" onclick="changeMonth(-1)">‹</button><strong>${monthBR(`${y}-${pad(m + 1)}`)}</strong><button class="btn" onclick="changeMonth(1)">›</button></div><div class="weekdays">${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(x => `<span>${x}</span>`).join("")}</div><div class="cal-grid">${cells}</div></div>`;
}
function changeMonth(delta) { calendarCursor.setMonth(calendarCursor.getMonth() + delta); renderAgendaBody(); }
function selectDate(d) { selectedDate = d; calendarCursor = new Date(`${d}T12:00:00`); renderAgendaBody(); }
function renderAgenda() { renderAgendaBody(); }
function renderAgendaBody() {
  const rows = db.cars.filter(c => c.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  document.getElementById("page").innerHTML = `<div class="content"><div class="page-head"><div><h2>Agenda</h2><div class="muted">Selecione o dia no calendário para visualizar e cadastrar carros.</div></div><button class="btn btn-primary" onclick="openCarModal()">＋ Novo agendamento</button></div><div class="agenda-layout"><div class="card calendar-card">${calendarHTML()}<div class="calendar-help">O número pequeno mostra quantos carros estão agendados no dia.</div></div><div class="card"><div class="section-title"><div><h3>${dateBR(selectedDate)}</h3><span class="muted" id="agendaCount">${rows.length} agendamento(s)</span></div><button class="btn" onclick="selectDate(today)">Hoje</button></div><div class="filters agenda-filters"><input id="agendaSearch" placeholder="Buscar cliente, carro ou telefone" oninput="filterAgenda()"><select id="agendaStatus" onchange="filterAgenda()"><option value="">Todos os status</option>${STATUSES.map(s => `<option>${s}</option>`).join("")}</select></div><div class="cars" id="agendaRows">${rows.length ? rows.map(carCard).join("") : `<div class="empty">Nenhum carro neste dia.<br><button class="btn btn-primary" style="margin-top:12px" onclick="openCarModal()">Adicionar carro</button></div>`}</div></div></div></div>`;
}
function filterAgenda() {
  const q = (document.getElementById("agendaSearch")?.value || "").toLowerCase(), st = document.getElementById("agendaStatus")?.value || "";
  const rows = db.cars.filter(c => c.date === selectedDate && (!st || c.status === st) && [c.name, c.vehicle, c.phone, c.plate].join(" ").toLowerCase().includes(q)).sort((a, b) => a.time.localeCompare(b.time));
  document.getElementById("agendaRows").innerHTML = rows.length ? rows.map(carCard).join("") : `<div class="empty">Nenhum resultado para esse filtro.</div>`;
  document.getElementById("agendaCount").textContent = `${rows.length} agendamento(s)`;
}
function carCard(c) {
  return `<article class="car"><div class="car-main"><div class="car-title"><span class="time-pill">${escapeHTML(c.time)}</span> ${escapeHTML(c.vehicle)}</div><div class="muted">${escapeHTML(c.name)} · ${escapeHTML(c.phone)}${c.plate ? " · " + escapeHTML(c.plate) : ""}</div><div class="car-meta"><span class="tag">${escapeHTML(c.type)}</span><span class="tag">${money(c.value)}</span>${c.endTime ? `<span class="tag">Fim ${escapeHTML(c.endTime)}</span>` : ""}<span class="tag status ${statusClass(c.status)}">${escapeHTML(c.status)}</span></div></div><div class="car-actions"><select class="select-status" onchange="changeStatus('${c.id}',this.value)">${STATUSES.map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select><button class="btn" onclick="editCar('${c.id}')">Editar</button></div></article>`;
}

function openModal(inner, size = "") { const el = document.createElement("div"); el.id = "modal"; el.className = "modal-backdrop"; el.innerHTML = `<div class="modal ${size}">${inner}</div>`; document.body.appendChild(el); }
function closeModal() { document.getElementById("modal")?.remove(); }

function openCarModal(id = null) {
  const c = id ? db.cars.find(x => x.id === id) : null, d = c?.date || selectedDate;
  const defaultService = findService(c?.type) || getActiveServices()[0];
  const selectedType = c?.type || defaultService?.name || "";
  const selectedValue = c?.value ?? defaultService?.value ?? 0;
  openModal(`<div class="modal-head"><div><h3>${c ? "Editar agendamento" : "Novo agendamento"}</h3><span class="muted">${dateBR(d)}</span></div><button class="x" onclick="closeModal()">×</button></div><form onsubmit="saveCar(event,'${id || ""}')"><div class="form-grid"><div class="field"><label class="required">Dia da agenda</label><input name="date" type="date" required value="${d}"></div><div class="field"><label class="required">Horário de início</label><input name="time" type="time" required value="${c?.time || ""}"></div><div class="field"><label>Horário de fim (opcional)</label><input name="endTime" type="time" value="${c?.endTime || ""}"></div><div class="field"><label class="required">Nome do cliente</label><input name="name" required placeholder="Nome completo" value="${escapeHTML(c?.name || "")}"></div><div class="field"><label class="required">Telefone</label><input name="phone" required inputmode="tel" placeholder="(44) 99999-9999" value="${escapeHTML(c?.phone || "")}"></div><div class="field"><label class="required">Carro</label><input name="vehicle" required placeholder="Ex: Onix Preto" value="${escapeHTML(c?.vehicle || "")}"></div><div class="field"><label>Placa</label><input name="plate" placeholder="Opcional" value="${escapeHTML(c?.plate || "")}"></div><div class="field"><label class="required">Tipo de lavagem</label><select id="carService" name="serviceId" required onchange="autoValue(this)">${serviceOptions(selectedType)}</select></div><div class="field"><label class="required">Valor</label><input id="carValue" name="value" type="number" min="0" step="0.01" required value="${selectedValue}"></div></div><div class="form-actions"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Salvar agendamento</button></div></form>`);
}
function autoValue(sel) { const service = findService(sel.value); if (service) document.getElementById("carValue").value = Number(service.value).toFixed(2); }
function saveCar(e, id) {
  e.preventDefault(); const f = new FormData(e.target); const selectedOption = document.getElementById("carService")?.selectedOptions?.[0];
  const service = findService(f.get("serviceId"));
  const data = { date: f.get("date"), time: f.get("time"), endTime: f.get("endTime"), vehicle: f.get("vehicle").trim(), name: f.get("name").trim(), phone: f.get("phone").trim(), plate: f.get("plate").trim(), type: service?.name || selectedOption?.dataset?.name || selectedOption?.textContent?.split(" — ")[0] || "Serviço", value: Number(f.get("value")) };
  if (!data.date || !data.time || !data.vehicle || !data.name || !data.phone || !data.type || !(data.value >= 0)) { alert("Preencha nome, telefone, carro, lavagem e horário de início."); return; }
  const conflict = db.cars.some(c => c.id !== id && c.date === data.date && c.time === data.time);
  if (conflict && !confirm("Já existe um agendamento nesse mesmo horário. Deseja salvar mesmo assim?")) return;
  if (id) Object.assign(db.cars.find(c => c.id === id), data); else db.cars.push({ id: uid(), status: "Na fila", createdAt: Date.now(), ...data });
  upsertClientFromCar(data);
  selectedDate = data.date; calendarCursor = new Date(`${data.date}T12:00:00`); save(); closeModal(); navigate("agenda"); toast("Agendamento salvo com sucesso.");
}
function editCar(id) { openCarModal(id); }
function changeStatus(id, status) { const c = db.cars.find(x => x.id === id); if (!c) return; c.status = status; save(); renderAgendaBody(); toast("Status atualizado."); }

function upsertClientFromCar(data) {
  const keyPhone = (data.phone || "").replace(/\D/g, "");
  let client = db.clients.find(c => (c.phone || "").replace(/\D/g, "") === keyPhone && keyPhone);
  if (!client) { client = { id: uid(), name: data.name, phone: data.phone, vehicles: [] }; db.clients.push(client); }
  client.name = data.name; client.phone = data.phone;
  const vehicleKey = `${data.vehicle}|${data.plate || ""}`;
  if (!client.vehicles.some(v => `${v.name}|${v.plate || ""}` === vehicleKey)) client.vehicles.push({ id: uid(), name: data.vehicle, plate: data.plate || "" });
}

function buildClientRows(query = "") {
  const map = {};
  db.clients.forEach(c => { const key = (c.phone || c.id).trim(); if (!key) return; map[key] = { name: c.name, phone: c.phone, vehicles: new Set((c.vehicles || []).map(v => v.name)), count: 0, total: 0 }; });
  db.cars.forEach(c => { const key = (c.phone || c.name).trim(); if (!key) return; if (!map[key]) map[key] = { name: c.name, phone: c.phone, vehicles: new Set(), count: 0, total: 0 }; map[key].vehicles.add(c.vehicle); map[key].count++; map[key].total += Number(c.value) || 0; });
  return Object.values(map).filter(x => (x.name + " " + x.phone + " " + [...x.vehicles].join(" ")).toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
}
function renderClientes() { document.getElementById("page").innerHTML = `<div class="content"><div class="page-head"><div><h2>Clientes</h2><div class="muted">Clientes cadastrados e histórico de veículos.</div></div><button class="btn btn-primary" onclick="openClientModal()">＋ Novo cliente</button></div><div class="card"><div class="filters single-filter"><input id="clientSearch" placeholder="Buscar nome, telefone ou carro" oninput="filterClients()"></div><div class="client-list" id="clientRows">${clientRows(buildClientRows())}</div></div></div>`; }
function clientRows(rows) { return rows.length ? rows.map(x => `<article class="client-card"><div class="client-avatar">${escapeHTML((x.name || "C").slice(0, 1).toUpperCase())}</div><div class="client-info"><strong>${escapeHTML(x.name)}</strong><span class="muted">${escapeHTML(x.phone)}</span><div class="vehicle-list">${[...x.vehicles].map(v => `<span class="tag">${escapeHTML(v)}</span>`).join("")}</div></div><div class="client-summary"><b>${x.count}</b><span class="muted">lavagem(ns)</span></div></article>`).join("") : `<div class="empty">Nenhum cliente encontrado.</div>`; }
function filterClients() { const q = document.getElementById("clientSearch")?.value || ""; document.getElementById("clientRows").innerHTML = clientRows(buildClientRows(q)); }

function openClientModal() {
  openModal(`<div class="modal-head"><div><h3>Novo cliente</h3><span class="muted">Cadastre o cliente mesmo sem criar um agendamento.</span></div><button class="x" onclick="closeModal()">×</button></div><form onsubmit="saveClient(event)"><div class="form-grid"><div class="field"><label class="required">Nome</label><input name="name" required placeholder="Nome completo"></div><div class="field"><label class="required">Telefone</label><input name="phone" required inputmode="tel" placeholder="(44) 99999-9999"></div><div class="field"><label>Veículo</label><input name="vehicle" placeholder="Ex: Onix Preto"></div><div class="field"><label>Placa</label><input name="plate" placeholder="Opcional"></div></div><div class="form-actions"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Cadastrar cliente</button></div></form>`);
}
function saveClient(e) {
  e.preventDefault(); const f = new FormData(e.target); const name = f.get("name").trim(), phone = f.get("phone").trim(), vehicle = f.get("vehicle").trim(), plate = f.get("plate").trim();
  if (!name || !phone) { alert("Preencha nome e telefone."); return; }
  const normalized = phone.replace(/\D/g, "");
  if (db.clients.some(c => (c.phone || "").replace(/\D/g, "") === normalized)) { alert("Já existe um cliente cadastrado com este telefone."); return; }
  db.clients.push({ id: uid(), name, phone, vehicles: vehicle ? [{ id: uid(), name: vehicle, plate }] : [] });
  save(); closeModal(); navigate("clientes"); toast("Cliente cadastrado.");
}

function renderCadastros() {
  const services = db.services.slice().sort((a, b) => a.name.localeCompare(b.name));
  document.getElementById("page").innerHTML = `<div class="content"><div class="page-head"><div><h2>Cadastros</h2><div class="muted">Cadastre os dados que o sistema usa no dia a dia.</div></div><button class="btn btn-primary" onclick="openServiceModal()">＋ Novo tipo de lavagem</button></div>
    <div class="grid cadastro-top-grid"><button class="quick-card compact" onclick="openClientModal()"><span>♙</span><strong>Cadastrar cliente</strong><small>Nome, telefone e veículo.</small></button><button class="quick-card compact" onclick="openCarModal()"><span>🚗</span><strong>Novo agendamento</strong><small>Cliente, carro, lavagem, valor e horário.</small></button><button class="quick-card compact" onclick="openExpenseModal()"><span>$</span><strong>Cadastrar gasto</strong><small>Data, descrição e valor.</small></button></div>
    <div class="card service-card"><div class="section-title"><div><h3>Tipos de lavagem e valores</h3><span class="muted">Esses valores aparecem automaticamente ao criar um agendamento.</span></div><button class="btn btn-primary" onclick="openServiceModal()">＋ Adicionar</button></div>
      <div class="service-list">${services.map(s => `<article class="service-row"><div class="service-icon">✦</div><div class="service-info"><strong>${escapeHTML(s.name)}</strong><span class="muted">${s.active ? "Disponível para novos agendamentos" : "Inativo para novos agendamentos"}</span></div><div class="service-price">${money(s.value)}</div><span class="tag ${s.active ? "tag-active" : ""}">${s.active ? "Ativo" : "Inativo"}</span><button class="btn" onclick="openServiceModal('${s.id}')">Editar</button></article>`).join("") || `<div class="empty">Nenhum tipo de lavagem cadastrado.</div>`}</div>
    </div>
  </div>`;
}

function openServiceModal(id = null) {
  const s = id ? db.services.find(x => x.id === id) : null;
  openModal(`<div class="modal-head"><div><h3>${s ? "Editar tipo de lavagem" : "Novo tipo de lavagem"}</h3><span class="muted">Defina o nome e o valor cobrado.</span></div><button class="x" onclick="closeModal()">×</button></div><form onsubmit="saveService(event,'${id || ""}')"><div class="form-grid"><div class="field"><label class="required">Tipo de lavagem</label><input name="name" required placeholder="Ex: Lavagem completa" value="${escapeHTML(s?.name || "")}"></div><div class="field"><label class="required">Valor</label><input name="value" type="number" min="0" step="0.01" required placeholder="0,00" value="${s?.value ?? ""}"></div><div class="field full switch-field"><label class="switch-line"><input name="active" type="checkbox" ${s?.active === false ? "" : "checked"}><span>Disponível para novos agendamentos</span></label></div></div><div class="form-actions"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">${s ? "Salvar alterações" : "Adicionar lavagem"}</button></div></form>`);
}
function saveService(e, id) {
  e.preventDefault(); const f = new FormData(e.target); const name = f.get("name").trim(), value = Number(f.get("value")), active = f.get("active") === "on";
  if (!name || !(value >= 0)) { alert("Informe o nome da lavagem e um valor válido."); return; }
  const duplicated = db.services.some(s => s.id !== id && s.name.toLowerCase() === name.toLowerCase());
  if (duplicated) { alert("Já existe um tipo de lavagem com esse nome."); return; }
  if (id) { const s = db.services.find(x => x.id === id); if (s) Object.assign(s, { name, value, active }); }
  else db.services.push({ id: uid(), name, value, active });
  save(); closeModal(); renderCadastros(); toast(id ? "Lavagem atualizada." : "Lavagem adicionada.");
}

function financialForRange(start, end) { const cars = db.cars.filter(c => inRange(c.date, start, end)), outs = db.expenses.filter(x => inRange(x.date, start, end)), revenue = sum(cars.filter(completed), c => c.value), expenses = sum(outs, x => x.value); return { cars, outs, revenue, expenses, profit: revenue - expenses }; }
function renderFinanceiro() { renderFinanceiroBody(); }
function renderFinanceiroBody() {
  const r = periodRange(financePeriod, financeStart, financeEnd); financeStart = r.start; financeEnd = r.end; const f = financialForRange(r.start, r.end), data = bucketData(r.start, r.end);
  document.getElementById("page").innerHTML = `<div class="content"><div class="page-head"><div><h2>Financeiro</h2><div class="muted">Acompanhe faturamento, gastos e lucro por período.</div></div><button class="btn btn-primary" onclick="openExpenseModal()">＋ Novo gasto</button></div>${filterBar("finance")}
    <div class="grid stats"><div class="stat"><div class="stat-label">FATURAMENTO</div><div class="stat-value positive">${money(f.revenue)}</div></div><div class="stat"><div class="stat-label">GASTOS</div><div class="stat-value negative">${money(f.expenses)}</div></div><div class="stat"><div class="stat-label">LUCRO</div><div class="stat-value">${money(f.profit)}</div></div><div class="stat"><div class="stat-label">SERVIÇOS CONCLUÍDOS</div><div class="stat-value">${f.cars.filter(completed).length}</div></div></div>
    <div class="card chart-card"><div class="section-title"><div><h3>Movimentação financeira</h3><span class="muted">Passe o mouse ou clique/toque em cada barra para ver os valores.</span></div></div>${chartHTML(data, "financeChart")}</div>
    <div class="card table-card"><div class="section-title"><h3>Gastos do período</h3><span class="muted">${f.outs.length} lançamento(s)</span></div><div class="table-scroll"><table><thead><tr><th>Data</th><th>Gasto</th><th>Valor</th></tr></thead><tbody>${f.outs.sort((a, b) => b.date.localeCompare(a.date)).map(x => `<tr><td>${dateBR(x.date)}</td><td>${escapeHTML(x.name)}</td><td class="negative">${money(x.value)}</td></tr>`).join("") || `<tr><td colspan="3" class="empty-cell-text">Nenhum gasto no período.</td></tr>`}</tbody></table></div></div>
  </div>`;
}
function openExpenseModal() { openModal(`<div class="modal-head"><div><h3>Novo gasto</h3><span class="muted">Registre uma saída financeira.</span></div><button class="x" onclick="closeModal()">×</button></div><form onsubmit="saveExpense(event)"><div class="form-grid"><div class="field"><label class="required">Data</label><input name="date" type="date" required value="${today}"></div><div class="field"><label class="required">Nome do gasto</label><input name="name" required placeholder="Ex: Shampoo"></div><div class="field"><label class="required">Valor</label><input name="value" type="number" min="0" step="0.01" required placeholder="0,00"></div></div><div class="form-actions"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Adicionar</button></div></form>`); }
function saveExpense(e) { e.preventDefault(); const f = new FormData(e.target), value = Number(f.get("value")); if (!f.get("date") || !f.get("name")?.trim() || !(value >= 0)) { alert("Preencha data, nome e valor."); return; } db.expenses.push({ id: uid(), date: f.get("date"), name: f.get("name").trim(), value }); save(); closeModal(); if (location.hash === "#financeiro") renderFinanceiroBody(); else renderCadastros(); toast("Gasto adicionado."); }

function renderRelatorios() {
  const r = periodRange("month", today, today), f = financialForRange(r.start, r.end), services = {};
  f.cars.forEach(c => { services[c.type] = (services[c.type] || 0) + 1; });
  const top = Object.entries(services).sort((a, b) => b[1] - a[1]);
  const recentExpenses = db.expenses.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 5);
  document.getElementById("page").innerHTML = `<div class="content"><div class="page-head"><div><h2>Relatórios</h2><div class="muted">Indicadores rápidos para acompanhar a operação.</div></div><button class="btn" onclick="window.print()">Imprimir</button></div><div class="grid report-grid"><div class="card"><h3>Resumo do mês</h3><div class="summary-list"><div><span>Faturamento</span><b>${money(f.revenue)}</b></div><div><span>Gastos</span><b class="negative">${money(f.expenses)}</b></div><div><span>Lucro</span><b>${money(f.profit)}</b></div><div><span>Agendamentos</span><b>${f.cars.length}</b></div></div></div><div class="card"><h3>Serviços mais realizados</h3><div class="rank-list">${top.map(([name, n], i) => `<div><span>${i + 1}. ${escapeHTML(name)}</span><b>${n}</b></div>`).join("") || `<div class="empty">Sem dados.</div>`}</div></div></div><div class="card"><h3>Últimos gastos lançados</h3><div class="rank-list">${recentExpenses.map(x => `<div><span>${dateBR(x.date)} · ${escapeHTML(x.name)}</span><b class="negative">${money(x.value)}</b></div>`).join("") || `<div class="empty">Sem gastos lançados.</div>`}</div></div></div>`;
}

function renderConfig() {
  document.getElementById("page").innerHTML = `<div class="content"><div class="page-head"><div><h2>Configurações</h2><div class="muted">Visualização simples. Use Editar somente quando precisar alterar algo.</div></div></div>
    <div class="grid settings-grid">
      <div class="card config-view"><div class="section-title"><div><h3>Empresa</h3><span class="muted">Identificação exibida no sistema.</span></div><button class="btn" onclick="openCompanyConfig()">Editar</button></div><div class="config-brand-preview">${logoHTML("config-logo")}<div><strong>${escapeHTML(db.brand.name)}</strong><span>Preto + vermelho</span></div></div></div>
      <div class="card config-view accent-card"><div class="section-title"><div><h3>Cadastros do sistema</h3><span class="muted">Gerencie os serviços e valores usados nos agendamentos.</span></div><button class="btn" onclick="navigate('cadastros')">Abrir</button></div><div class="summary-list"><div><span>Tipos de lavagem cadastrados</span><b>${db.services.length}</b></div><div><span>Serviços ativos</span><b>${db.services.filter(s => s.active !== false).length}</b></div><div><span>Clientes cadastrados</span><b>${db.clients.length}</b></div></div></div>
    </div>
    <div class="card config-help"><h3>O que pode ser alterado?</h3><div class="config-action-list"><div><span>Nome e logo do sistema</span><b>Editar</b></div><div><span>Tipos de lavagem e preços</span><button class="btn" onclick="navigate('cadastros')">Abrir cadastros</button></div><div><span>Gastos e clientes</span><button class="btn" onclick="navigate('cadastros')">Gerenciar</button></div></div></div>
  </div>`;
}

function openCompanyConfig() {
  openModal(`<div class="modal-head"><div><h3>Editar empresa</h3><span class="muted">A identidade de cores permanece preto e vermelho.</span></div><button class="x" onclick="closeModal()">×</button></div><form onsubmit="saveCompanyConfig(event)"><div class="form-grid"><div class="field full"><label class="required">Nome da empresa/sistema</label><input name="name" required value="${escapeHTML(db.brand.name)}"></div><div class="field full"><label>Logo</label><input id="logoFile" type="file" accept="image/*"><small class="muted">Envie uma nova imagem somente se quiser substituir a atual.</small></div></div><div class="form-actions"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-primary">Salvar alterações</button></div></form>`);
}
function saveCompanyConfig(e) {
  e.preventDefault(); const f = new FormData(e.target); const name = f.get("name").trim(); if (!name) return;
  db.brand.name = name; const file = document.getElementById("logoFile").files[0];
  const finish = () => { save(); closeModal(); navigate("config"); toast("Empresa atualizada."); };
  if (file) { const reader = new FileReader(); reader.onload = () => { db.brand.logo = reader.result; finish(); }; reader.readAsDataURL(file); } else finish();
}

function toast(msg) { const x = document.createElement("div"); x.className = "toast"; x.textContent = msg; document.body.appendChild(x); setTimeout(() => x.remove(), 2500); }
function enterSystem() { const b = document.getElementById("enterBtn"); b.disabled = true; b.innerHTML = '<span class="loading"><span class="spinner"></span>Carregando...</span>'; setTimeout(() => navigate("home"), 200); }
function splash() {
  applyTheme();
  document.getElementById("app").innerHTML = `<div class="splash"><div class="splash-card"><div class="splash-logo-wrap">${logoHTML("brand-logo")}</div><div class="splash-kicker">GESTÃO PROFISSIONAL</div><h1>${escapeHTML(db.brand.name)}</h1><p>Agenda, clientes, lavagens, financeiro e relatórios em um só lugar.</p><button id="enterBtn" class="btn btn-primary enter-btn" onclick="enterSystem()">Entrar no Sistema</button><div class="muted splash-foot">Desenvolvido por Tryve</div></div></div>`;
}

window.addEventListener("hashchange", () => { const p = location.hash.slice(1); if (["home", "agenda", "clientes", "cadastros", "financeiro", "relatorios", "config"].includes(p) && document.querySelector(".shell")) navigate(p); });
(function init() { applyTheme(); const p = location.hash.slice(1); if (["home", "agenda", "clientes", "cadastros", "financeiro", "relatorios", "config"].includes(p)) navigate(p); else splash(); })();
