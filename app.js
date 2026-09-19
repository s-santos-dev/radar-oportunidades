/* ============================================================
   app.js — Interface do Radar de Oportunidades Tech
   Depende de data.js (loadEvents, FALLBACK_EVENTS)
   ============================================================ */

let currentEvents = [];
const REFERENCE_DATE = new Date();
REFERENCE_DATE.setHours(0, 0, 0, 0);

/* ---------- Utilidades ---------- */
function getDaysUntil(dateStr) {
  if (!dateStr || dateStr === "Em breve" || dateStr === "Fluxo contínuo") return null;
  const target = new Date(dateStr + "T23:59:59");
  const diffTime = target - REFERENCE_DATE;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getUrgencyBadge(days) {
  if (days === null) return "";
  if (days <= 0) return '<span class="badge badge-closed">Inscrições Hoje</span>';
  if (days <= 3) return `<span class="badge" style="background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.4);">🔴 Encerra em ${days}d</span>`;
  if (days <= 7) return `<span class="badge" style="background:rgba(249,115,22,0.2);color:#fb923c;border:1px solid rgba(249,115,22,0.4);">🟠 ${days} dias restantes</span>`;
  if (days <= 15) return `<span class="badge" style="background:rgba(245,158,11,0.2);color:#fde047;border:1px solid rgba(245,158,11,0.4);">🟡 ${days} dias restantes</span>`;
  return `<span class="badge" style="background:rgba(100,116,139,0.2);color:#94a3b8;">${days} dias</span>`;
}

function getRegionBadge(event) {
  if (event.state === "PI") return '<span class="badge badge-piaui">📍 Piauí</span>';
  if (["CE","MA","BA","PE","RN","PB","AL","SE"].includes(event.state)) return '<span class="badge badge-nordeste">🌴 Nordeste</span>';
  if (event.country && event.country.includes("Brasil")) return '<span class="badge badge-nacional">🇧🇷 Brasil</span>';
  return '<span class="badge badge-global">🌐 Internacional</span>';
}

function getBorderClass(event) {
  if (event.state === "PI") return "border-piaui";
  if (["CE","MA","BA","PE","RN","PB","AL","SE"].includes(event.state)) return "border-nordeste";
  if (event.country && event.country.includes("Brasil")) return "border-nacional";
  return "border-global";
}

function formatDateBR(iso) {
  if (!iso || iso.length < 10) return iso || "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function brToISO(dateStr) {
  // Converte dd/mm/aaaa -> aaaa-mm-dd (caso a planilha traga texto formatado)
  const m = String(dateStr).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : dateStr;
}

/* ---------- KPIs ---------- */
function updateKPIs(events) {
  document.getElementById("kpi-total").textContent = events.length;
  document.getElementById("kpi-open").textContent =
    events.filter(e => /aberta/i.test(e.regStatus || "")).length;
  document.getElementById("kpi-piaui").textContent =
    events.filter(e => e.state === "PI").length;
  document.getElementById("kpi-urgent").textContent =
    events.filter(e => {
      const d = getDaysUntil(brToISO(e.regDeadline));
      return d !== null && d >= 0 && d <= 15;
    }).length;
  document.getElementById("kpi-submission").textContent =
    events.filter(e => /^sim/i.test(e.projectSubmission || "")).length;

  const last = events
    .map(e => brToISO(e.lastVerified))
    .filter(d => d && d.length >= 10)
    .sort()
    .pop();
  document.getElementById("kpi-updated").textContent = last ? formatDateBR(last) : "—";
}

/* ---------- Filtro dinâmico de categorias ---------- */
function populateCategoryFilter(events) {
  const select = document.getElementById("filter-category");
  const current = select.value;
  const categories = [...new Set(events.map(e => e.category).filter(Boolean))].sort();
  select.innerHTML = '<option value="all">Todas as Categorias</option>' +
    categories.map(c => `<option value="${c.replace(/"/g, "&quot;")}">${c}</option>`).join("");
  if (categories.includes(current)) select.value = current;
}

/* ---------- Renderização ---------- */
function renderEvents(events) {
  const container = document.getElementById("events-container");
  container.innerHTML = "";

  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Nenhuma oportunidade encontrada</h3>
        <p>Tente ajustar os filtros ou os termos de pesquisa.</p>
      </div>`;
    return;
  }

  events.forEach(event => {
    const days = getDaysUntil(brToISO(event.regDeadline));
    const card = document.createElement("div");
    card.className = `card ${getBorderClass(event)}`;

    card.innerHTML = `
      <div>
        <div class="card-top">
          <div class="card-badges">
            ${getRegionBadge(event)}
            <span class="badge ${(event.relevance || "").includes("Alta") ? "badge-relevance-high" : "badge-relevance-med"}">${event.relevance || "—"}</span>
          </div>
          <div>${getUrgencyBadge(days)}</div>
        </div>

        <h3 class="card-title">${event.name}</h3>
        <div class="card-organizer">🏛️ ${event.organizer}</div>

        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-label">Local / Formato</span>
            <span class="meta-value">${event.city}, ${event.state} (${event.format})</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Prazo de Inscrição</span>
            <span class="meta-value ${days !== null && days <= 7 ? "urgent-orange" : (days !== null && days <= 15 ? "urgent-yellow" : "")}">${formatDateBR(brToISO(event.regDeadline))}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Data do Evento</span>
            <span class="meta-value">${formatDateBR(brToISO(event.startDate))} a ${formatDateBR(brToISO(event.endDate))}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Submissão Projetos</span>
            <span class="meta-value" style="color:#38bdf8;">${(event.projectSubmission || "").split("(")[0].trim()}</span>
          </div>
        </div>

        <p class="card-notes">${event.source ? "📰 " + event.source : ""}</p>
      </div>

      <div class="card-actions">
        <button class="btn-detail" onclick="openDetails('${event.id}')">Ver Detalhes</button>
        <a href="${event.officialLink}" target="_blank" rel="noopener noreferrer" class="btn-link">Acessar Site ↗</a>
      </div>`;
    container.appendChild(card);
  });
}

/* ---------- Filtros + Ordenação ---------- */
function filterAndSortEvents() {
  const query     = document.getElementById("filter-search").value.toLowerCase().trim();
  const priority  = document.getElementById("filter-priority").value;
  const category  = document.getElementById("filter-category").value;
  const format    = document.getElementById("filter-format").value;
  const relevance = document.getElementById("filter-relevance").value;
  const submission= document.getElementById("filter-submission").value;
  const order     = document.getElementById("filter-order").value;

  let filtered = currentEvents.filter(e => {
    if (query) {
      const searchStr = `${e.name} ${e.organizer} ${e.city} ${e.category}`.toLowerCase();
      if (!searchStr.includes(query)) return false;
    }
    if (priority === "PI" && e.state !== "PI") return false;
    if (priority === "Nordeste" && !["CE","MA","BA","PE","RN","PB","AL","SE"].includes(e.state)) return false;
    if (priority === "Brasil" && (!(e.country || "").includes("Brasil") || e.state === "PI")) return false;
    if (priority === "Internacional" && (e.country || "").includes("Brasil")) return false;
    if (category !== "all" && e.category !== category) return false;
    if (format !== "all" && e.format !== format) return false;
    if (relevance !== "all" && e.relevance !== relevance) return false;
    if (submission !== "all") {
      const hasSub = /^sim/i.test(e.projectSubmission || "");
      if (submission === "Sim" && !hasSub) return false;
      if (submission === "Não" && hasSub) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (order === "deadline-asc") {
      const da = getDaysUntil(brToISO(a.regDeadline)) ?? 9999;
      const db = getDaysUntil(brToISO(b.regDeadline)) ?? 9999;
      return da - db;
    }
    if (order === "priority") {
      const score = ev =>
        ev.state === "PI" ? 1 :
        ["CE","MA","BA","PE","RN","PB","AL","SE"].includes(ev.state) ? 2 :
        (ev.country || "").includes("Brasil") ? 3 : 4;
      return score(a) - score(b);
    }
    if (order === "relevance") {
      const score = ev => (ev.relevance || "").includes("Alta") ? 1 : 2;
      return score(a) - score(b);
    }
    return 0;
  });

  renderEvents(filtered);
}

/* ---------- Modal ---------- */
function openDetails(id) {
  const event = currentEvents.find(e => e.id === id);
  if (!event) return;

  document.getElementById("modal-content").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-right:30px;">
      <div>
        <span style="font-size:0.75rem;color:#38bdf8;font-weight:700;">${event.id} &bull; ${event.category}</span>
        <h2 style="font-size:1.4rem;color:#f8fafc;margin-top:4px;">${event.name}</h2>
      </div>
    </div>

    <div class="modal-section" style="border-top:none;padding-top:0;">
      <h4>Informações Gerais</h4>
      <div class="modal-grid">
        <div class="modal-field"><span class="lbl">Organizador</span><span class="val">${event.organizer}</span></div>
        <div class="modal-field"><span class="lbl">Localização</span><span class="val">${event.city} - ${event.state}, ${event.country}</span></div>
        <div class="modal-field"><span class="lbl">Modalidade / Formato</span><span class="val">${event.format}</span></div>
        <div class="modal-field"><span class="lbl">Status da Inscrição</span><span class="val" style="color:#34d399;font-weight:700;">${event.regStatus}</span></div>
      </div>
    </div>

    <div class="modal-section">
      <h4>Datas e Prazos</h4>
      <div class="modal-grid">
        <div class="modal-field"><span class="lbl">Prazo Limite de Inscrição</span><span class="val" style="color:#f59e0b;font-weight:700;">${formatDateBR(brToISO(event.regDeadline))}</span></div>
        <div class="modal-field"><span class="lbl">Período de Realização</span><span class="val">${formatDateBR(brToISO(event.startDate))} até ${formatDateBR(brToISO(event.endDate))}</span></div>
      </div>
    </div>

    <div class="modal-section">
      <h4>Participação e Requisitos</h4>
      <div class="modal-field" style="margin-bottom:8px;"><span class="lbl">Público-Alvo</span><span class="val">${event.targetAudience}</span></div>
      <div class="modal-field" style="margin-bottom:8px;"><span class="lbl">Requisitos</span><span class="val">${event.requirements}</span></div>
      <div class="modal-field"><span class="lbl">Necessidade de Equipe</span><span class="val">${event.teamRequired}</span></div>
    </div>

    <div class="modal-section">
      <h4>Projetos e Premiação</h4>
      <div class="modal-field" style="margin-bottom:8px;"><span class="lbl">Possibilidade de Submissão de Projetos</span><span class="val" style="color:#38bdf8;">${event.projectSubmission}</span></div>
      <div class="modal-field"><span class="lbl">Premiação e Benefícios</span><span class="val">${event.prizes}</span></div>
    </div>

    <div class="modal-section">
      <h4>Avaliação do Radar &bull; Simão</h4>
      <div class="modal-grid" style="margin-bottom:8px;">
        <div class="modal-field"><span class="lbl">Nível de Relevância</span><span class="val" style="color:#fbbf24;font-weight:700;">${event.relevance}</span></div>
        <div class="modal-field"><span class="lbl">Data da Última Verificação</span><span class="val">${formatDateBR(brToISO(event.lastVerified))}</span></div>
      </div>
      <div class="modal-field"><span class="lbl">Fonte da Informação</span><span class="val" style="line-height:1.4;">${event.source}</span></div>
    </div>

    <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">
      <button class="btn-detail" onclick="closeModal()">Fechar</button>
      <a href="${event.officialLink}" target="_blank" rel="noopener noreferrer" class="btn-link" style="padding:10px 20px;">Acessar Site Oficial ↗</a>
    </div>`;

  document.getElementById("modal").classList.add("active");
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
}

/* ---------- Status de sincronização ---------- */
function setSyncStatus(text, isError = false) {
  const el = document.getElementById("sync-status");
  const txt = document.getElementById("sync-status-text");
  txt.textContent = text;
  el.classList.toggle("error", isError);
}

/* ---------- Boot ---------- */
async function boot({ force = false } = {}) {
  const btn = document.getElementById("btn-sync-now");
  btn.disabled = true;
  setSyncStatus(force ? "Sincronizando..." : "Carregando dados...");

  const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const { events, source } = await loadEvents({ force });

  currentEvents = events;
  populateCategoryFilter(events);
  updateKPIs(events);
  filterAndSortEvents();
  setSyncStatus(`Radar Ativo | ${now} (${source})`, source.includes("fallback"));
  btn.disabled = false;
}

/* ---------- Event Listeners ---------- */
document.getElementById("modal-close-btn").addEventListener("click", closeModal);
document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") closeModal();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

["filter-search","filter-priority","filter-category","filter-format",
 "filter-relevance","filter-submission","filter-order"].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("input", filterAndSortEvents);
  el.addEventListener("change", filterAndSortEvents);
});

document.getElementById("btn-sync-now").addEventListener("click", () => boot({ force: true }));

boot();