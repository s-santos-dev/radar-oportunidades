/* ============================================================
   data.js — Camada de dados do Radar
   Faz a ponte entre o site (Vercel) e a planilha do Google Drive
   usando o endpoint público "gviz" do Google Sheets.

   NÃO é necessária API key: basta que a planilha esteja
   compartilhada como "Qualquer pessoa com o link pode VER"
   (Compartilhar > Acesso geral > Leitor).

   Opcional: para forçar atualização imediata sem cache do
   Google, publique a planilha (Arquivo > Compartilhar >
   Publicar na Web) e defina SHEET_PUBLIC = true abaixo.
   ============================================================ */

const SHEET_ID      = "1pflgLAckgx3keRJLka9_15uZIMCWx8RjBO-8Chb7zKw";
const SHEET_NAME    = "Página1";   // nome da aba da planilha
const SHEET_PUBLIC  = false;       // true se você "Publicar na Web"
const CACHE_KEY     = "radar_events_cache";
const CACHE_TS_KEY  = "radar_events_cache_ts";
const CACHE_TTL_MS  = 10 * 60 * 1000; // 10 min de cache local

/* ---------- Fallback: dados embarcados (da planilha oficial, 19/09/2026) ----------
   Usado se a planilha estiver indisponível ou sem permissão pública. */
const FALLBACK_EVENTS = [
  {id:"OPP-2026-001",name:"Hackathon Viva Piauí – O Futuro que Queremos",category:"Hackathon / Desafio de Inovação",modality:"Híbrido",organizer:"Águas de Teresina, Águas do Piauí, Grupo Cidade Verde e Programe Studio",city:"Teresina",state:"PI",country:"Brasil",format:"Híbrido",startDate:"2026-09-17",endDate:"2026-10-19",regDeadline:"2026-10-05",regStatus:"Inscrições Abertas",targetAudience:"Estudantes de graduação e cursos técnicos do Piauí",requirements:"Regularmente matriculado em instituição de ensino no Piauí; equipes de 2 a 5 integrantes com orientador opcional",teamRequired:"Sim (2 a 5 pessoas)",projectSubmission:"Sim (desenvolvimento de soluções e MVPs em saneamento, água e saúde)",prizes:"Certificado técnico, mentoria especializada na etapa final, feedback e exibição na programação especial do Dia do Piauí (TV Cidade Verde)",officialLink:"https://hackathon.cidadeverde.com",source:"Portal Águas de Teresina (Notícia de 17/09/2026)",lastVerified:"2026-09-19",relevance:"Alta relevância"},
  {id:"OPP-2026-002",name:"Acelera Startups – Da Ideia à Venda",category:"Aceleração / Inovação",modality:"Híbrido",organizer:"Sebrae Piauí",city:"Teresina",state:"PI",country:"Brasil",format:"Híbrido",startDate:"2026-08-14",endDate:"2026-11-30",regDeadline:"2026-09-30",regStatus:"Inscrições Abertas",targetAudience:"Startups em fase de ideação/validação e projetos inovadores do PI",requirements:"Projeto ou MVP com base tecnológica no estado do Piauí",teamRequired:"Não obrigatória (aceita fundadores individuais ou equipes)",projectSubmission:"Sim (submissão de proposta de negócio inovador/software)",prizes:"Capacitação especializada, consultorias tecnológicas do Sebrae e conexão com mercado e investidores",officialLink:"https://pi.agenciasebrae.com.br/inovacao-e-tecnologia/aceleracao-de-startups-sebrae-no-piaui-lanca-edital-para-selecao-de-negocios-inovadores/",source:"Agência Sebrae Piauí",lastVerified:"2026-09-19",relevance:"Alta relevância"},
  {id:"OPP-2026-003",name:"Siará Tech Summit 2026 (STS 2026)",category:"Feira / Congresso / Competição de Startups",modality:"Presencial",organizer:"Sebrae Ceará",city:"Fortaleza",state:"CE",country:"Brasil",format:"Presencial",startDate:"2026-10-07",endDate:"2026-10-09",regDeadline:"2026-10-07",regStatus:"Inscrições Abertas",targetAudience:"Desenvolvedores, pesquisadores, estudantes e empreendedores tech do Nordeste",requirements:"Inscrição prévia gratuita no site oficial",teamRequired:"Não",projectSubmission:"Sim (rodadas de negócios e pitch sessions para projetos)",prizes:"Networking regional com mais de 300 startups, investidores e trilhas temáticas em Deep Tech e Inteligência Artificial",officialLink:"https://stssebrae.com.br/",source:"Sebrae CE / Portal do Evento",lastVerified:"2026-09-19",relevance:"Alta relevância"},
  {id:"OPP-2026-004",name:"III Congresso Internacional de Tecnologias Emergentes (CITE 2026)",category:"Congresso Acadêmico / Submissão Científica",modality:"Online",organizer:"Comissão CITE / Even3",city:"Online",state:"Nacional/Internacional",country:"Brasil",format:"Online",startDate:"2026-11-18",endDate:"2026-11-20",regDeadline:"2026-11-18",regStatus:"Inscrições Abertas",targetAudience:"Estudantes de graduação, pesquisadores e profissionais de TI e IA",requirements:"Submissão de resumo/artigo até 13/11/2026; participação gratuita para estudantes",teamRequired:"Aceita autores individuais ou até 5 autores",projectSubmission:"Sim (artigos e resumos expandidos sobre IA, computação e sistemas autônomos)",prizes:"Publicação de trabalhos em anais com registro DOI e emissão de certificados acadêmicos",officialLink:"https://www.even3.com.br/iii-cite/",source:"Plataforma Even3",lastVerified:"2026-09-19",relevance:"Alta relevância"},
  {id:"OPP-2026-005",name:"NASA Space Apps Challenge 2026",category:"Hackathon Internacional",modality:"Híbrido / Online",organizer:"NASA & Global Organizing Team",city:"Global / Capítulos no Brasil",state:"Global / Remoto",country:"Internacional / Brasil",format:"Híbrido",startDate:"2026-11-14",endDate:"2026-11-15",regDeadline:"2026-11-14",regStatus:"Inscrições Abertas",targetAudience:"Estudantes, desenvolvedores, cientistas de dados, designers e criadores",requirements:"Inscrição gratuita individual ou em equipes (1 a 6 integrantes)",teamRequired:"Recomendada (1 a 6 pessoas)",projectSubmission:"Sim (desenvolvimento de soluções e MVPs utilizando dados abertos da NASA e agências parceiras)",prizes:"Julgamento global pela NASA, certificação internacional oficial e visita de gala ao Kennedy Space Center para os vencedores globais",officialLink:"https://www.spaceappschallenge.org/",source:"NASA Space Apps Official Website",lastVerified:"2026-09-19",relevance:"Alta relevância"},
  {id:"OPP-2026-006",name:"ARC Prize 2026 (ARC-AGI-3 & Paper Track)",category:"Desafio de Inteligência Artificial / Pesquisa",modality:"Online",organizer:"François Chollet, Mike Knoop & Kaggle",city:"Online",state:"Global",country:"Internacional",format:"Online",startDate:"2026-03-25",endDate:"2026-11-09",regDeadline:"2026-10-26",regStatus:"Inscrições Abertas",targetAudience:"Estudantes e pesquisadores de IA e Aprendizado de Máquina",requirements:"Aceitar as regras da competição no Kaggle até 26/10/2026; submissão de modelo e write-up técnico",teamRequired:"Individual ou em equipe",projectSubmission:"Sim (submissão de código de IA e relatório científico)",prizes:"Pool de premiação superior a US$ 1.000.000 e destaque na comunidade mundial de IA",officialLink:"https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3",source:"Kaggle",lastVerified:"2026-09-19",relevance:"Alta relevância"},
  {id:"OPP-2026-007",name:"Superhackathon 2026",category:"Hackathon / Maratona de Inovação",modality:"Híbrido",organizer:"Ecossistema de Inovação / Superhackathon Brasil",city:"Cidades Polo / Remoto",state:"Nacional",country:"Brasil",format:"Híbrido",startDate:"2026-10-20",endDate:"2026-10-25",regDeadline:"2026-10-15",regStatus:"Inscrições Abertas",targetAudience:"Universitários, desenvolvedores e jovens empreendedores",requirements:"Inscrição no portal do evento",teamRequired:"Sim (equipes multidisciplinares)",projectSubmission:"Sim (criação e validação de MVPs em 48 horas)",prizes:"Premiação por categorias, mentoria com especialistas e encaminhamento para programas de aceleração",officialLink:"https://www.superhackathon.com.br/",source:"Portal Oficial Superhackathon",lastVerified:"2026-09-19",relevance:"Média relevância"},
  {id:"OPP-2026-008",name:"1º Congresso Nacional Interdisciplinar de Inteligência Artificial (CONIA 2026)",category:"Congresso Acadêmico / Inovação",modality:"Online",organizer:"Comitê CONIA / Even3",city:"Online",state:"Nacional",country:"Brasil",format:"Online",startDate:"2026-10-15",endDate:"2026-10-17",regDeadline:"2026-10-14",regStatus:"Inscrições Abertas",targetAudience:"Estudantes de IA, pesquisadores e profissionais de tecnologia",requirements:"Inscrição na plataforma Even3",teamRequired:"Não",projectSubmission:"Sim (apresentações científicas e painéis temáticos)",prizes:"Certificação acadêmica de 40 horas e publicação de anais científicos",officialLink:"https://www.even3.com.br/1-congresso-nacional-de-inteligencia-artificial-660771/",source:"Plataforma Even3",lastVerified:"2026-09-19",relevance:"Alta relevância"}
];

/* ---------- Mapeamento: cabeçalho da planilha -> campo do sistema ---------- */
const COLUMN_MAP = {
  "id da oportunidade":                    "id",
  "nome do evento":                        "name",
  "categoria":                             "category",
  "modalidade":                            "modality",
  "instituição organizadora":              "organizer",
  "cidade":                                "city",
  "estado":                                "state",
  "país":                                  "country",
  "formato":                               "format",
  "data de início":                        "startDate",
  "data de encerramento":                  "endDate",
  "prazo de inscrição":                    "regDeadline",
  "status da inscrição":                   "regStatus",
  "público-alvo":                          "targetAudience",
  "requisitos de participação":            "requirements",
  "necessidade de equipe":                 "teamRequired",
  "possibilidade de submissão de projetos":"projectSubmission",
  "premiação ou benefícios":               "prizes",
  "link oficial":                          "officialLink",
  "fonte da informação":                   "source",
  "data da última verificação":            "lastVerified",
  "nível de relevância para mim":          "relevance"
};

/* ---------- Conversão de datas ----------
   A planilha grava datas como número de série do Excel.
   46282 -> 2026-09-17  (epoch: 30/12/1899) */
function excelSerialToISO(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && value > 20000) {
    const d = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

/* ---------- Parser do formato "gviz" do Google ----------
   O Google retorna: setResponse({...conteúdo JSON...}); */
function parseGviz(text) {
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Resposta gviz inválida");
  const json = JSON.parse(text.slice(start, end + 1));
  if (!json.table || !json.table.rows) throw new Error("Planilha sem dados (verifique o nome da aba)");
  return json.table;
}

/* ---------- Normaliza uma linha da planilha em objeto de evento ---------- */
function rowToEvent(row, headers) {
  const event = {};
  headers.forEach((h, i) => {
    const field = COLUMN_MAP[h];
    if (!field) return;
    const cell = row.c[i];
    let value = cell ? cell.v : null;
    // Colunas de data: converte número de série do Excel
    if (["startDate", "endDate", "regDeadline", "lastVerified"].includes(field)) {
      value = excelSerialToISO(value);
    }
    event[field] = value === null || value === undefined ? "" : String(value).trim();
  });
  return event;
}

/* ---------- URL do endpoint gviz ---------- */
function buildSheetUrl() {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
  const sheet = SHEET_NAME ? `&sheet=${encodeURIComponent(SHEET_NAME)}` : "";
  const pub = SHEET_PUBLIC ? "&headers=1" : "";
  return base + sheet + pub;
}

/* ---------- Cache local (resiliência offline + menos requisições) ---------- */
function readCache() {
  try {
    const ts  = Number(localStorage.getItem(CACHE_TS_KEY) || 0);
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw && (Date.now() - ts) < CACHE_TTL_MS) return JSON.parse(raw);
  } catch (e) { /* ignora */ }
  return null;
}

function writeCache(events) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(events));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch (e) { /* ignora */ }
}

/* ============================================================
   loadEvents({ force }) -> Promise<{ events, fromCache, source }>

   1. Tenta a planilha (rede);
   2. Se falhar, usa cache local;
   3. Se não houver cache, usa FALLBACK_EVENTS embarcado.
   ============================================================ */
async function loadEvents({ force = false } = {}) {
  const cached = readCache();
  if (!force && cached) {
    return { events: cached, fromCache: true, source: "cache local" };
  }

  try {
    const res = await fetch(buildSheetUrl());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const table = parseGviz(await res.text());

    // Aba 1 do arquivo tem título repetido (linhas 1-2); os headers
    // estão na primeira linha cujos valores batem com COLUMN_MAP.
    let headers = null, dataRows = [];
    for (const row of table.rows) {
      const labels = (row.c || []).map(c => (c && c.v !== null ? String(c.v).trim().toLowerCase() : ""));
      const isHeader = labels.some(l => COLUMN_MAP[l]);
      if (isHeader && !headers) {
        headers = labels;
        continue;
      }
      if (headers) dataRows.push(row);
    }
    if (!headers) throw new Error("Cabeçalhos não encontrados na planilha");

    const events = dataRows
      .map(r => rowToEvent(r, headers))
      .filter(e => e.id && e.name);

    if (!events.length) throw new Error("Planilha retornou zero eventos");

    writeCache(events);
    return { events, fromCache: false, source: "Google Sheets" };
  } catch (err) {
    console.warn("[Radar] Falha ao ler planilha:", err.message);
    if (cached) return { events: cached, fromCache: true, source: "cache local (planilha indisponível)" };
    return { events: FALLBACK_EVENTS, fromCache: false, source: "dados embarcados (fallback)" };
  }
}