/* Cerebro Orlando · v2 · toda cifra sale del lago incrustado en <script id="datos">; nada se escribe a mano. */
(() => {
"use strict";
const D = JSON.parse(document.getElementById("datos").textContent);
const L = D.lago, M = D.mapa;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const ic = (id, cls = "i") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------- formato en español ---------- */
const nf = (v, d = 0) => new Intl.NumberFormat("es-CO", {minimumFractionDigits: d, maximumFractionDigits: d}).format(v);
const NB = " ";
const pct = (v, d = 1) => (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v), d) + NB + "%";
const pp = (v, d = 1) => (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v), d) + NB + "puntos";
const usd = v => "US$" + NB + nf(v);
const millones = miles => miles >= 1000 ? nf(miles / 1000, 2) + NB + "millones" : nf(miles) + NB + "mil";
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const fDia = s => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return `${d} ${MES[m - 1]} ${y}`; };
const fMes = (s, largo) => { const [y, m] = s.split("-").map(Number); return largo ? `${MESL[m - 1]} de ${y}` : `${MES[m - 1]} ${y}`; };
const fTrim = s => { const y = s.slice(0, 4), q = +s.slice(-1); return `${MES[(q - 1) * 3]}–${MES[(q - 1) * 3 + 2]} ${y}`; };
const fVig = s => !s ? "" : /^\d{4}-Q\d$/.test(s) ? fTrim(s) : /^\d{4}-\d{2}$/.test(s) ? fMes(s) : /^\d{4}-\d{2}-\d{2}/.test(s) ? fDia(s) : s.replace("-", "–");
const aC = f => Math.round((f - 32) * 5 / 9);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
// Espacio duro entre la cifra y su unidad: «25 %» nunca se parte en dos líneas
const nb = s => String(s).replace(/(\d) (?=%|°|puntos\b|millones\b|mil\b|veces\b|días\b|casos\b|permisos\b)/g, "$1\u00a0");
// Nombres que la capa trae en mayúsculas («ORLANDO INTERNATIONAL AIRPORT») se muestran como título
const bonito = s => s && s === s.toUpperCase() && /[A-Z]{3}/.test(s) ? s.toLowerCase().replace(/(^|[\s/-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : s;

/* ---------- acceso al lago ---------- */
const C = (tema, k) => L[tema].cifras[k];
const S = (tema, k) => L[tema].series[k] ? L[tema].series[k].puntos : [];
const ult = arr => arr[arr.length - 1];
function tendencia(v, umbral = 1, modo = "normal", fmt = pct) {
  // modo: normal (subir es bueno), inverso (subir es malo) o neutro (sin juicio)
  const t = Math.abs(v) < umbral ? "igual" : v > 0 ? "sube" : "baja";
  const txt = {igual: "Estable", sube: "Sube", baja: "Baja"}[t];
  const cls = t === "igual" || modo === "neutro" ? "igual" : modo === "inverso" ? (t === "sube" ? "baja" : "sube") : t;
  return `<span class="tend ${cls}">${ic(t === "igual" ? "igual" : t)}${txt} ${fmt(v)}</span>`;
}

/* ---------- trazabilidad ---------- */
const FUENTES = Object.fromEntries(D.fuentes_lago.map(f => [f.id, f]));
const TEMA_DE = {};
for (const [tema, o] of Object.entries(L)) for (const f of o.fuentes) if (!TEMA_DE[f.id]) TEMA_DE[f.id] = tema;
const CORTO = {indeed_hiring_lab: "Indeed Hiring Lab · CC BY 4.0", fred_ihv_orlando: "FHFA vía FRED", fred_ihv_pares: "FHFA vía FRED",
  fred_laus: "BLS vía FRED", fred_ces: "BLS vía FRED", fred_realtor: "Realtor.com vía FRED", fred_bps: "Census vía FRED",
  fred_poblacion: "Census vía FRED", fred_saipe: "Census vía FRED", wikimedia_pageviews: "Wikimedia", nws_api: "Servicio Meteorológico (NWS)",
  noaa_gsoy: "NOAA NCEI", orlando_permisos: "Datos abiertos de Orlando", orlando_barrios: "Datos abiertos de Orlando",
  orlando_distritos: "Datos abiertos de Orlando", orlando_limites: "Datos abiertos de Orlando", orlando_lagos: "Datos abiertos de Orlando",
  orlando_codigo: "Datos abiertos de Orlando", orlando_negocios: "Datos abiertos de Orlando", orlando_alquiler_corto: "Datos abiertos de Orlando",
  opd_casos: "Policía de Orlando (mapa público)"};
function chip(fuente, campo, vigencia, etiqueta) {
  const v = vigencia ? ` · ${fVig(String(vigencia))}` : "";
  return `<button type="button" class="fuente" data-fuente="${fuente}" data-campo="${campo || ""}" aria-label="Ver de dónde sale este dato">${ic("fuente")}<span>${etiqueta ? esc(etiqueta) + " · " : ""}${esc(CORTO[fuente] || fuente)}${esc(v)}</span></button>`;
}
function filaDic(ficha, campo) {
  if (!campo) return null;
  const base = campo.replace(/_(20\d\d)$/, "_<AAAA>").replace(/_(orlando|tampa|miami|jacksonville|florida|eeuu|orange|hillsborough|duval|miami_dade)$/, "");
  return D.diccionario.find(r => r.fuente === ficha && r.campo === campo)
      || D.diccionario.find(r => r.fuente === ficha && (r.campo || "").split(" / ").some(x => x === campo || x === base || x.replace(/<[^>]+>/g, "").replace(/_$/, "") === base.replace(/<[^>]+>/g, "").replace(/_$/, "")))
      || D.diccionario.find(r => r.fuente === ficha && (r.campo || "").includes(base.split("_")[0]));
}
function abrirTraza(fuente, campo) {
  const f = FUENTES[fuente]; if (!f) return;
  const tema = TEMA_DE[fuente], lago = L[tema] || {};
  const enLago = (lago.fuentes || []).find(x => x.id === fuente) || {};
  const ficha = D.catalogo.find(c => c.id === f.ficha_excel) || {};
  let dato = "";
  if (campo) {
    const r = filaDic(f.ficha_excel, campo);
    const cl = campo.replace("<AAAA>", "");
    const c = (lago.cifras || {})[campo] || (lago.series || {})[campo] || Object.entries(lago.series || {}).find(([k]) => k.startsWith(cl))?.[1];
    if (r || c) dato = `<div class="campo"><p class="eyebrow">Este dato</p><dl>
      <div><dt>Campo en el lago</dt><dd class="mono">${esc(r ? r.archivo : `lago/raw/${tema}/${tema}.json`)} → ${esc(campo)}</dd></div>
      ${r ? `<div><dt>Qué significa</dt><dd>${esc(r.significado)}</dd></div>` : ""}
      ${c && c.unidad ? `<div><dt>Unidad</dt><dd>${esc(c.unidad)}</dd></div>` : ""}
      ${c && c.vigencia ? `<div><dt>A qué fecha corresponde</dt><dd>${esc(fVig(c.vigencia))}</dd></div>` : ""}
      ${r && r.transformacion ? `<div><dt>Qué le hicimos</dt><dd>${esc(r.transformacion)}</dd></div>` : ""}
      ${r ? `<div><dt>Clasificación</dt><dd>${esc(r.clasificacion)}</dd></div>` : ""}</dl></div>`;
  }
  const lic = f.licencia === "no declara" ? "No declara licencia. La ficha del portal tiene el campo vacío; la usamos con esa advertencia anotada." : esc(f.licencia);
  $("#trazaIn").innerHTML = `<button class="btn cerrar" type="button" id="cerrarTraza">${ic("cerrar")}Cerrar</button>
    <div><p class="eyebrow">${esc(f.ficha_excel)} · fuente en uso</p><h2 id="trazaT" style="font-size:1.4rem;margin-top:6px">${esc(f.nombre)}</h2></div>
    ${dato}<dl>
      <div><dt>Quién la publica</dt><dd>${esc(f.entidad)}</dd></div>
      <div><dt>Licencia, tal como aparece</dt><dd>${lic}</dd></div>
      <div><dt>Para qué la usamos</dt><dd>${esc(f.uso)}</dd></div>
      <div><dt>¿Trae datos de personas?</dt><dd>${esc(f.personas)}${f.proteccion ? ` · protección: ${esc(f.proteccion)}` : ""}</dd></div>
      <div><dt>Comprobada el</dt><dd>${esc(fDia(lago.probado || D.generado))} (día en que la fuente respondió y se escribió el lago)</dd></div>
      ${enLago.url ? `<div><dt>Enlace exacto que consultó el script</dt><dd class="mono"><a href="${esc(enLago.url)}" target="_blank" rel="noopener">${esc(enLago.url)}</a></dd></div>` : ""}
      ${ficha.frecuencia ? `<div><dt>Cada cuánto se actualiza</dt><dd>${esc(ficha.frecuencia)}</dd></div>` : ""}
      ${f.nota ? `<div><dt>Nota del equipo</dt><dd>${esc(f.nota)}</dd></div>` : ""}</dl>`;
  const dlg = $("#traza"); dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", ""); $("#cerrarTraza").focus();
}
document.addEventListener("click", e => {
  const b = e.target.closest(".fuente[data-fuente]");
  if (b) { e.preventDefault(); e.stopPropagation(); abrirTraza(b.dataset.fuente, b.dataset.campo); }
  if (e.target.closest("#cerrarTraza")) $("#traza").close();
});
$("#traza").addEventListener("click", e => { if (e.target.id === "traza") $("#traza").close(); });

/* ---------- glosario y globo ---------- */
const GLOSARIO = {
  indice100: "Un índice compara contra un momento de referencia. Aquí 100 es el nivel de avisos del 1 de febrero de 2020, antes de la pandemia: 110 sería 10 % más avisos que entonces. Está ajustado por estacionalidad.",
  indice1995: "100 es el precio promedio de la vivienda de cada área en enero–marzo de 1995. Para comparar ciudades lo re-escalamos a 2015 = 100: así se ve cuánto subió cada una desde el mismo punto.",
  vistas: "Visitas hechas por personas al artículo de cada ciudad en Wikipedia en español. La fuente separa y no cuenta a los robots.",
  umbral: "Si un barrio tuvo menos de 5 casos en el año no lo mostramos: con tan pocos casos se podría saber a quién se refiere.",
  distrito: "Orlando elige su concejo en 6 distritos de comisionado. Aquí solo usamos el número del distrito, no el nombre de quien lo representa.",
  derivado: "Lo calculamos nosotros a partir del lago (por ejemplo, el área del barrio o su distrito). No viene así de la fuente.",
  km2: "Total dividido por el área del barrio. Sirve para comparar barrios grandes con barrios pequeños. El área es aproximada (la calculamos del mapa).",
  indice: "Lo calculamos nosotros: cada señal se convierte en un puntaje de 0 a 100 según el puesto del barrio, y se promedian con los pesos que elijas. No es un dato oficial ni mide riesgo; ordena dónde mirar primero.",
  pp: "Puntos porcentuales: la diferencia entre dos porcentajes. Pasar de 4 % a 5 % es subir 1 punto (y un 25 %)."
};
const globo = $("#globo");
function mostrarGlobo(html, x, y) {
  globo.innerHTML = html; globo.classList.add("on");
  const r = globo.getBoundingClientRect();
  let gx = x + 14, gy = y + 14;
  if (gx + r.width > innerWidth - 8) gx = x - r.width - 14;
  if (gy + r.height > innerHeight - 8) gy = y - r.height - 14;
  globo.style.left = Math.max(8, gx) + "px"; globo.style.top = Math.max(8, gy) + "px";
}
const ocultarGlobo = () => globo.classList.remove("on");
const termGlobo = t => { const r = t.getBoundingClientRect(); mostrarGlobo(esc(GLOSARIO[t.dataset.term] || ""), r.left, r.bottom - 6); };
document.addEventListener("pointerover", e => { const t = e.target.closest(".term"); if (t) termGlobo(t); });
document.addEventListener("pointerout", e => { if (e.target.closest(".term")) ocultarGlobo(); });
document.addEventListener("focusin", e => { const t = e.target.closest(".term"); if (t) termGlobo(t); });
document.addEventListener("focusout", e => { if (e.target.closest(".term")) ocultarGlobo(); });
document.addEventListener("click", e => { const t = e.target.closest(".term"); if (t) termGlobo(t); });
addEventListener("scroll", ocultarGlobo, {passive: true});
function aviso(txt) { const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = txt; document.body.append(t); setTimeout(() => t.remove(), 2200); }
async function copiar(texto, ok = "Copiado") {
  try { await navigator.clipboard.writeText(texto); aviso(ok); }
  catch { const t = document.createElement("textarea"); t.value = texto; document.body.append(t); t.select(); try { document.execCommand("copy"); aviso(ok); } catch { aviso("Selecciona y copia el texto"); } t.remove(); }
}

/* ================= GRÁFICOS (SVG propio, un solo eje) ================= */
function tiempo(s) {
  s = String(s);
  if (/^\d{4}-Q\d$/.test(s)) return Date.UTC(+s.slice(0, 4), (+s.slice(-1) - 1) * 3 + 1, 15);
  if (/^\d{4}-\d{2}$/.test(s)) return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, 15);
  if (/^\d{4}$/.test(s)) return Date.UTC(+s, 6, 1);
  const [f, h] = s.split("T"); const [y, m, d] = f.split("-").map(Number); const [hh, mm] = (h || "00:00").split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm);
}
function ticksY(min, max, n = 5) {
  const span = max - min || 1, paso0 = span / n, mag = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 5, 10].map(k => k * mag).find(k => k >= paso0);
  const t = [], fin = Math.ceil(max / paso - 1e-9) * paso;
  for (let v = Math.floor(min / paso) * paso; v <= fin + 1e-9; v += paso) t.push(+v.toFixed(6));
  t.dec = Math.max(0, -Math.floor(Math.log10(paso) + 1e-9));
  return t;
}
const graficos = [];
function observar(el, fn) { if (!el) return; const ro = new ResizeObserver(() => { if (el.clientWidth > 0) fn(); }); ro.observe(el); graficos.push({el, fn}); }
function redibujar() { graficos.forEach(g => g.el.clientWidth && g.fn()); }

function lineas(el, cfg) {
  // cfg.series: [{nombre, puntos, color, resaltar}] · fmtX, fmtY, fmtTick, ref, refs, notas, alto, cero, area, etiquetas (directas al final)
  const W = el.clientWidth, H = cfg.alto || 260;
  const series = cfg.series.filter(s => s.puntos && s.puntos.length);
  const m = {t: 18, r: cfg.etiquetas ? 98 : 18, b: 28, l: 48};
  if (W < 420 && cfg.etiquetas) m.r = 74;
  const todas = series.flatMap(s => s.puntos);
  const ys = todas.map(p => p[1]);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (const r of [cfg.ref, ...(cfg.refs || [])].filter(Boolean)) { y0 = Math.min(y0, r.y); y1 = Math.max(y1, r.y); }
  if (cfg.cero) y0 = 0;
  const pad = (y1 - y0) * .08 || 1; if (!cfg.cero) y0 -= pad; y1 += pad;
  const ty = ticksY(y0, y1, cfg.nTicks || 5); y0 = Math.min(y0, ty[0]); y1 = Math.max(y1, ty[ty.length - 1]);
  if (W < m.l + m.r + 60) return;
  const xsUnicos = [...new Set(todas.map(p => tiempo(p[0])))].sort((a, b) => a - b);
  const x0 = xsUnicos[0], x1 = ult(xsUnicos);
  const X = t => m.l + (t - x0) / (x1 - x0 || 1) * (W - m.l - m.r);
  const Y = v => m.t + (1 - (v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const anios = (x1 - x0) / 3.15e10, tx = [];
  if (cfg.ticksX) tx.push(...cfg.ticksX(x0, x1));
  else if (anios > 4) { const paso = anios > 40 ? 10 : anios > 18 ? 5 : anios > 8 ? 2 : 1; for (let y = new Date(x0).getUTCFullYear() + 1; y <= new Date(x1).getUTCFullYear(); y++) if (y % paso === 0) tx.push([Date.UTC(y, 0, 1), String(y)]); }
  else { const paso = anios > 2 ? 6 : anios > 1 ? 3 : 2; const d = new Date(x0); for (let y = d.getUTCFullYear(), mm = d.getUTCMonth() + 1; Date.UTC(y, mm, 1) <= x1; mm++) { if (mm > 11) { mm = 0; y++; } if (mm % paso === 0) tx.push([Date.UTC(y, mm, 1), `${MES[mm]} ${String(y).slice(2)}`]); } }
  let s = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(cfg.aria || "")}">`;
  s += `<g class="grid">${ty.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`).join("")}</g>`;
  s += ty.map(v => `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${(cfg.fmtTick || ((v, d) => nf(v, d)))(v, ty.dec)}</text>`).join("");
  let ultX = -1e9;
  s += tx.filter(t => cfg.ticksX ? X(t[0]) >= m.l - 1 && X(t[0]) <= W - m.r + 1 : X(t[0]) > m.l + 10 && X(t[0]) < W - m.r - 6).filter(t => { const ok = X(t[0]) - ultX >= 56; if (ok) ultX = X(t[0]); return ok; })
    .map(t => `<text x="${X(t[0])}" y="${H - 8}" text-anchor="middle">${t[1]}</text>`).join("");
  for (const r of [cfg.ref, ...(cfg.refs || [])].filter(Boolean)) {
    const x2 = r.hasta ? X(tiempo(r.hasta)) : W - m.r, xa = r.desde ? X(tiempo(r.desde)) : m.l;
    s += `<line class="ref" x1="${xa}" x2="${x2}" y1="${Y(r.y)}" y2="${Y(r.y)}"/>`;
    if (r.texto) s += `<text class="ref-t" x="${r.desde ? xa + 4 : x2}" y="${Y(r.y) - 7}" text-anchor="${r.desde ? "start" : "end"}">${esc(r.texto)}</text>`;
  }
  const orden = [...series].sort((a, b) => (a.resaltar ? 1 : 0) - (b.resaltar ? 1 : 0));
  for (const se of orden) {
    // Un hueco en la serie (años sin dato) corta la línea en vez de unir los extremos
    const ts = se.puntos.map(p => tiempo(p[0])), pasos = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b), tipico = pasos[pasos.length >> 1] || 1;
    const d = se.puntos.map((p, i) => `${!i || ts[i] - ts[i - 1] > tipico * 1.8 ? "M" : "L"}${X(ts[i]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
    if (cfg.area && (se.resaltar || series.length === 1)) s += `<path d="${d}L${X(tiempo(ult(se.puntos)[0]))},${Y(y0)}L${X(tiempo(se.puntos[0][0]))},${Y(y0)}Z" style="fill:${se.color};opacity:.12"/>`;
    s += `<path d="${d}" fill="none" style="stroke:${se.color}" stroke-width="${se.resaltar || series.length === 1 ? 2.4 : 1.6}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const u = ult(se.puntos);
    s += `<circle cx="${X(tiempo(u[0]))}" cy="${Y(u[1])}" r="${se.resaltar || series.length === 1 ? 4.5 : 3}" style="fill:${se.color};stroke:var(--surface)" stroke-width="2"/>`;
  }
  if (cfg.etiquetas && series.length > 1) {
    const etq = series.map(se => ({se, y: Y(ult(se.puntos)[1]), x: X(tiempo(ult(se.puntos)[0]))})).sort((a, b) => a.y - b.y);
    for (let i = 1; i < etq.length; i++) if (etq[i].y - etq[i - 1].y < 14) etq[i].y = etq[i - 1].y + 14;
    for (const e of etq) s += `<text class="etq" x="${e.x + 8}" y="${e.y + 4}" style="fill:${e.se.resaltar ? "var(--ink)" : "var(--ink-2)"};font-weight:${e.se.resaltar ? 700 : 500}">${esc(e.se.nombre)}</text>`;
  }
  (cfg.notas || []).forEach(n => {
    const p = series[0].puntos.find(q => q[0] === n.x); if (!p) return;
    const cx = X(tiempo(p[0])), cy = Y(p[1]), arriba = n.pos !== "abajo";
    const anc = cx > W - 120 ? "end" : cx < m.l + 80 ? "start" : "middle";
    s += `<circle cx="${cx}" cy="${cy}" r="3.5" style="fill:var(--surface);stroke:var(--ink-2)" stroke-width="1.5"/><text class="anot" x="${cx}" y="${arriba ? cy - 12 : cy + 20}" text-anchor="${anc}">${esc(n.texto)}</text>`;
  });
  s += `<line class="cruz" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/>`;
  series.forEach((se, k) => s += `<circle class="pz" data-k="${k}" r="5" style="fill:${se.color};stroke:var(--surface)" stroke-width="2" visibility="hidden"/>`);
  s += `<rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent"/></svg>`;
  el.innerHTML = s;
  const svg = el.querySelector("svg"), cz = svg.querySelector(".cruz");
  const mapas = series.map(se => new Map(se.puntos.map(p => [tiempo(p[0]), p])));
  const bx = xsUnicos.map(X);
  const mover = e => {
    const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * (W / r.width);
    let lo = 0, hi = bx.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (bx[mid] < x) lo = mid; else hi = mid; }
    const i = Math.abs(bx[lo] - x) < Math.abs(bx[hi] - x) ? lo : hi, t = xsUnicos[i];
    cz.setAttribute("x1", bx[i]); cz.setAttribute("x2", bx[i]); cz.setAttribute("visibility", "visible");
    let html = "", etiqueta = null;
    const filas = [];
    series.forEach((se, k) => {
      const p = mapas[k].get(t), c = svg.querySelector(`.pz[data-k="${k}"]`);
      if (!p) { c.setAttribute("visibility", "hidden"); return; }
      etiqueta = etiqueta || p[0];
      c.setAttribute("cx", X(t)); c.setAttribute("cy", Y(p[1])); c.setAttribute("visibility", "visible");
      filas.push([se, p]);
    });
    filas.sort((a, b) => b[1][1] - a[1][1]);
    html = `<b>${esc(cfg.fmtX(etiqueta))}</b>` + filas.map(([se, p]) => `<br>${series.length > 1 ? esc(se.nombre) + ": " : ""}<b>${cfg.fmtY(p[1], p, se)}</b>`).join("");
    if (cfg.extra) html += cfg.extra(etiqueta);
    mostrarGlobo(html, e.clientX, e.clientY);
  };
  svg.addEventListener("pointermove", mover);
  svg.addEventListener("pointerdown", mover);
  svg.addEventListener("pointerleave", () => { ocultarGlobo(); cz.setAttribute("visibility", "hidden"); $$(".pz", svg).forEach(c => c.setAttribute("visibility", "hidden")); });
}

function barras(el, cfg) {
  const W = el.clientWidth, H = cfg.alto || 230, m = {t: 22, r: 8, b: 28, l: 48};
  const pts = cfg.puntos, n = pts.length, max = Math.max(...pts.map(p => p[1] ?? 0));
  if (W < m.l + m.r + 60) return;
  const ty = ticksY(0, max, 4), y1 = ult(ty);
  const bw = (W - m.l - m.r) / n, Y = v => m.t + (1 - v / y1) * (H - m.t - m.b);
  const res = cfg.resaltar ?? n - 1;
  let s = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(cfg.aria || "")}"><g class="grid">${ty.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`).join("")}</g>`;
  s += ty.map(v => `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${(cfg.fmtTick || nf)(v)}</text>`).join("");
  const cada = Math.ceil(n / Math.max(3, Math.floor((W - m.l) / 58)));
  pts.forEach((p, i) => {
    if ((n - 1 - i) % cada === 0) s += `<text x="${m.l + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(cfg.fmtEje ? cfg.fmtEje(p[0]) : p[0])}</text>`;
    if (p[1] == null) return;
    const x = m.l + i * bw + 1, w = Math.max(1, bw - 2), y = Y(p[1]), r = Math.min(4, w / 2, Math.max(0, Y(0) - y));
    const col = cfg.color ? cfg.color(p, i) : i === res ? "var(--accent)" : "var(--seq-2)";
    s += `<path class="br" data-i="${i}" d="M${x},${Y(0)}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${Y(0)}Z" style="fill:${col}"/>`;
  });
  const u = pts[res];
  if (u) s += `<text x="${Math.min(m.l + res * bw + bw / 2, W - 28)}" y="${Y(u[1]) - 7}" text-anchor="middle" style="fill:var(--ink);font-weight:500">${(cfg.fmtTick || nf)(u[1])}</text>`;
  s += `</svg>`;
  el.innerHTML = s;
  const svg = el.querySelector("svg");
  svg.addEventListener("pointermove", e => {
    const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * (W / r.width);
    const i = Math.max(0, Math.min(n - 1, Math.floor((x - m.l) / bw)));
    $$(".br", svg).forEach(b => b.style.opacity = +b.dataset.i === i ? 1 : .55);
    mostrarGlobo(`<b>${esc(cfg.fmtX(pts[i][0]))}</b><br>${pts[i][1] == null ? "Sin dato completo ese año" : cfg.fmtY(pts[i][1], i)}`, e.clientX, e.clientY);
  });
  svg.addEventListener("pointerleave", () => { ocultarGlobo(); $$(".br", svg).forEach(b => b.style.opacity = 1); });
}

function spark(puntos, color = "var(--accent)", alto = 52) {
  const W = 300, H = alto, ys = puntos.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = i => 2 + i / (puntos.length - 1) * (W - 8), Y = v => 6 + (1 - (v - y0) / (y1 - y0 || 1)) * (H - 12);
  const d = puntos.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}L${X(puntos.length - 1)},${H}L2,${H}Z" style="fill:${color};opacity:.12"/><path d="${d}" fill="none" style="stroke:${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

function listaBarras(ol, filas, cfg = {}) {
  // filas: [{nombre, valor, i?, yo?, par?, fmt?}] · cfg.onClick(fila), cfg.max, cfg.fmt, cfg.pos (mostrar puesto)
  const max = cfg.max || Math.max(...filas.map(f => f.valor || 0), 1);
  ol.innerHTML = filas.map((f, k) => {
    const cls = [f.yo ? "yo" : "", f.par ? "par" : ""].join(" ");
    const tag = cfg.onClick ? "button" : "div";
    return `<li class="${cls}"><${tag} ${tag === "button" ? `type="button" data-k="${k}" aria-pressed="${!!f.sel}"` : 'class="fila"'}><span class="pos">${cfg.pos === false ? "" : f.pos ?? k + 1}</span><span class="nom">${esc(f.nombre)}</span><span class="val">${(f.fmt || cfg.fmt || nf)(f.valor)}</span><span class="bar"><i style="width:${Math.max(0, f.valor) / max * 100}%"></i></span></${tag}></li>`;
  }).join("");
  if (cfg.onClick) ol.onclick = e => { const b = e.target.closest("button[data-k]"); if (b) cfg.onClick(filas[+b.dataset.k]); };
}

function barrasSimples(el, filas, fmt = nf) {
  const max = Math.max(...filas.map(f => f[1]), 1);
  el.innerHTML = filas.map(([k, n]) => `<div class="f"><span>${esc(k)}</span><b class="num">${fmt(n)}</b><span class="bar"><i style="width:${n / max * 100}%"></i></span></div>`).join("");
}

/* ================= BARRIOS: un solo modelo para todas las vistas ================= */
const norm = s => String(s || "").trim().toLowerCase();
const IDX = new Map(M.barrios.map((b, i) => [norm(b.nombre), i]));
const B = M.barrios.map(b => ({...b, nombre: bonito(b.nombre), permisos: {}, delitos: {}, codigo: {}}));
const anioFin = (tema, pref) => Object.keys(L[tema].series).filter(k => k.startsWith(pref)).map(k => +k.slice(-4)).filter(Boolean).sort();
const A_PERM = anioFin("permisos", "permisos_barrio_"), A_DEL = anioFin("seguridad", "delitos_barrio_"), A_COD = anioFin("codigo", "casos_barrio_");
const U_PERM = ult(A_PERM), U_DEL = ult(A_DEL), U_COD = ult(A_COD);
function cargar(tema, serie, fn) { for (const [n, v] of S(tema, serie)) { const i = IDX.get(norm(n)); if (i != null) fn(B[i], v); } }
A_PERM.forEach(a => cargar("permisos", `permisos_barrio_${a}`, (b, v) => b.permisos[a] = v));
A_DEL.forEach(a => cargar("seguridad", `delitos_barrio_${a}`, (b, v) => b.delitos[a] = v));
A_COD.forEach(a => cargar("codigo", `casos_barrio_${a}`, (b, v) => b.codigo[a] = v));
for (const g of ["hurtos", "violencia", "drogas"]) cargar("seguridad", `${g}_barrio_${U_DEL}`, (b, v) => b[g] = v);
cargar("codigo", `quejas_barrio_${U_COD}`, (b, v) => b.quejas = v);
cargar("negocios", "negocios_barrio", (b, v) => b.negocios = v);
cargar("negocios", "restaurantes_barrio", (b, v) => b.restaurantes = v);
cargar("negocios", "hospedajes_barrio", (b, v) => b.hospedajes = v);
const VIG_NEG = C("negocios", "negocios_vigentes").vigencia;

// Una métrica se define una vez: nombre, unidad, de dónde sale y cómo se lee de un barrio
const METRICAS = {
  permisos: {frase: "permisos", nombre: "Permisos de construcción", corto: "Permisos", unidad: "permisos", anios: A_PERM, v: (b, a = U_PERM) => b.permisos[a], fuente: "orlando_permisos", campo: "permisos_barrio_<AAAA>", icono: "grua"},
  delitos: {frase: "casos de policía", nombre: "Casos de policía", corto: "Casos policía", unidad: "casos", anios: A_DEL, v: (b, a = U_DEL) => b.delitos[a], fuente: "opd_casos", campo: "delitos_barrio_<AAAA>", icono: "sirena", nota: "hurtos, violencia y drogas"},
  hurtos: {frase: "hurtos", nombre: "Hurtos y robos a la propiedad", corto: "Hurtos", unidad: "casos", anios: [U_DEL], v: b => b.hurtos, fuente: "opd_casos", campo: `hurtos_barrio_${U_DEL}`},
  violencia: {frase: "casos de violencia", nombre: "Violencia contra personas", corto: "Violencia", unidad: "casos", anios: [U_DEL], v: b => b.violencia, fuente: "opd_casos", campo: `violencia_barrio_${U_DEL}`},
  drogas: {frase: "casos de drogas", nombre: "Casos de drogas", corto: "Drogas", unidad: "casos", anios: [U_DEL], v: b => b.drogas, fuente: "opd_casos", campo: `drogas_barrio_${U_DEL}`},
  quejas: {frase: "quejas ciudadanas", nombre: "Quejas ciudadanas de código", corto: "Quejas", unidad: "quejas", anios: [U_COD], v: b => b.quejas, fuente: "orlando_codigo", campo: `quejas_barrio_${U_COD}`, icono: "alerta"},
  codigo: {frase: "casos de código", nombre: "Casos de código urbano", corto: "Casos de código", unidad: "casos", anios: A_COD, v: (b, a = U_COD) => b.codigo[a], fuente: "orlando_codigo", campo: "casos_barrio_<AAAA>"},
  negocios: {frase: "negocios", nombre: "Negocios con licencia vigente", corto: "Negocios", unidad: "licencias", anios: [VIG_NEG.slice(0, 4)], v: b => b.negocios, fuente: "orlando_negocios", campo: "negocios_barrio", icono: "empleo"},
  restaurantes: {frase: "restaurantes", nombre: "Restaurantes con licencia", corto: "Restaurantes", unidad: "licencias", anios: [VIG_NEG.slice(0, 4)], v: b => b.restaurantes, fuente: "orlando_negocios", campo: "restaurantes_barrio"},
  hospedajes: {frase: "hospedajes", nombre: "Hospedajes con licencia", corto: "Hospedajes", unidad: "licencias", anios: [VIG_NEG.slice(0, 4)], v: b => b.hospedajes, fuente: "orlando_negocios", campo: "hospedajes_barrio", icono: "maleta"},
};
const porKm2 = (v, b) => v == null || !b.km2 ? null : v / b.km2;
const valorDe = (met, b, a, km2) => { const v = METRICAS[met].v(b, a); return km2 ? porKm2(v, b) : v ?? null; };
const fmtV = (v, km2) => v == null ? "sin dato" : km2 ? nf(v, v < 10 ? 1 : 0) : nf(v);
function cortesQ(vals, n = 5) {
  const o = vals.filter(v => v != null).sort((a, b) => a - b);
  if (!o.length) return [];
  return Array.from({length: n - 1}, (_, k) => o[Math.min(o.length - 1, Math.floor((k + 1) / n * o.length))]);
}
const binDe = (v, cortes) => v == null ? -1 : (cortes.findIndex(c => v < c) + 1 || cortes.length + 1) - 1;
const colorBin = i => i < 0 ? css("--nodata") : css(`--seq-${i + 1}`);
const colorBinVar = i => i < 0 ? "url(#rayado)" : `var(--seq-${i + 1})`;

// Índice derivado: cuatro señales por km², puntaje de 0 a 100 según el puesto (percentil); sin dato = el valor más bajo
const DIMS = [
  {k: "permisos", nombre: "Construcción", desc: "permisos por km²"},
  {k: "delitos", nombre: "Seguridad", desc: "casos de policía por km²"},
  {k: "quejas", nombre: "Convivencia", desc: "quejas ciudadanas por km²"},
  {k: "negocios", nombre: "Actividad", desc: "negocios por km²"},
];
const PRESETS = {"Equilibrio": [1, 1, 1, 1], "Crecimiento": [3, 1, 1, 1], "Seguridad": [1, 3, 1, 1], "Convivencia": [1, 1, 3, 1]};
const percentil = DIMS.map(d => {
  const vals = B.map(b => valorDe(d.k, b, undefined, true) ?? 0);
  const ord = [...vals].sort((a, b) => a - b);
  return vals.map(v => { let lo = 0; while (lo < ord.length && ord[lo] < v) lo++; let hi = lo; while (hi < ord.length && ord[hi] === v) hi++; return ((lo + hi - 1) / 2) / (ord.length - 1) * 100; });
});
let pesos = [...PRESETS.Equilibrio];
function indice(p = pesos) { const t = p.reduce((a, b) => a + b, 0) || 1; return B.map((b, i) => DIMS.reduce((s, d, k) => s + percentil[k][i] * p[k], 0) / t); }
let IND = indice();
METRICAS.indice = {frase: "puntaje en el índice", nombre: "Índice de atención (derivado)", corto: "Índice", unidad: "puntos de 0 a 100", anios: [String(U_PERM)], v: b => IND[M.barrios.indexOf(M.barrios.find(x => x.id === b.id))], icono: "pesas", sinKm2: true};
B.forEach((b, i) => b._i = i);
METRICAS.indice.v = b => IND[b._i];

/* ================= MAPA PLANO (SVG) ================= */
function mapaPlano(svg, cfg) {
  // cfg: valores(i) -> número|null, onClick(i), globo(i) -> html, ley (elemento), titulo
  svg.setAttribute("viewBox", `0 0 ${M.ancho} ${M.alto}`);
  svg.innerHTML = `<defs><pattern id="${svg.id}-r" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><rect width="7" height="7" style="fill:var(--nodata)"/><line x1="0" y1="0" x2="0" y2="7" style="stroke:var(--hatch)" stroke-width="2.4"/></pattern></defs>
    ${M.barrios.map((b, i) => `<path class="b" data-i="${i}" d="${b.d}"/>`).join("")}
    <path class="lago" d="${M.lagos}"/>${M.distritos.map(d => `<path class="dist" d="${d.d}"/>`).join("")}<path class="lim" d="${M.limite}"/>`;
  const pintar = () => {
    const vals = M.barrios.map((_, i) => cfg.valores(i));
    const cortes = cortesQ(vals);
    $$(".b", svg).forEach(p => { const k = binDe(vals[+p.dataset.i], cortes); p.style.fill = k < 0 ? `url(#${svg.id}-r)` : `var(--seq-${k + 1})`; });
    if (cfg.ley) {
      const o = vals.filter(v => v != null).sort((a, b) => a - b), lim = [o[0], ...cortes, ult(o)], f = cfg.fmt || nf;
      cfg.ley.innerHTML = (cfg.titulo ? `<b>${esc(cfg.titulo())}</b>` : "") + [0, 1, 2, 3, 4].map(k => `<span class="sw"><i style="background:var(--seq-${k + 1})"></i>${k < 4 ? `${f(lim[k])}–${f(lim[k + 1])}` : `${f(lim[4])} o más`}</span>`).join("") + `<span class="sw"><i class="nd"></i>Sin dato publicable</span>`;
    }
  };
  svg.addEventListener("pointermove", e => { const p = e.target.closest(".b"); if (!p) return ocultarGlobo(); mostrarGlobo(cfg.globo(+p.dataset.i), e.clientX, e.clientY); });
  svg.addEventListener("pointerleave", ocultarGlobo);
  svg.addEventListener("click", e => { const p = e.target.closest(".b"); if (p && cfg.onClick) cfg.onClick(+p.dataset.i); });
  pintar();
  return {pintar};
}

/* ================= MAPA 3D (MapLibre GL, sin teselas ni llaves: solo las capas del lago) ================= */
const LENTES = [
  {k: "permisos", nombre: "Construcción", icono: "grua"},
  {k: "delitos", nombre: "Seguridad", icono: "sirena"},
  {k: "quejas", nombre: "Quejas", icono: "alerta"},
  {k: "negocios", nombre: "Negocios", icono: "empleo"},
  {k: "hospedajes", nombre: "Hospedaje", icono: "maleta"},
  {k: "indice", nombre: "Índice", icono: "pesas"},
];
const hay3D = () => { try { return !!(window.maplibregl && (maplibregl.supported ? maplibregl.supported() : true)); } catch { return false; } };
function crearAtlas(el, cfg) {
  // cfg: lentes (lista de claves), estado {lente, anio, km2}, onSelect(i), compacto
  const st = Object.assign({lente: "permisos", anio: null, km2: false, sel: null}, cfg.estado || {});
  const lentes = LENTES.filter(l => !cfg.lentes || cfg.lentes.includes(l.k));
  el.innerHTML = `<div class="lienzo3d"></div>
    <div class="superior"><div class="lentes" role="group" aria-label="Qué mostrar en el mapa">${lentes.map(l => `<button type="button" data-l="${l.k}" aria-pressed="${l.k === st.lente}">${ic(l.icono)}${l.nombre}</button>`).join("")}</div></div>
    <div class="controles"><button type="button" data-z="mas" aria-label="Acercar">${ic("mas")}</button><button type="button" data-z="menos" aria-label="Alejar">${ic("menos")}</button><button type="button" data-z="3d" aria-label="Cambiar entre vista 3D y plana">2D</button><button type="button" data-z="todo" aria-label="Ver toda la ciudad">${ic("centrar")}</button></div>
    <div class="ley3d"></div>`;
  const lienzo = $(".lienzo3d", el), ley = $(".ley3d", el);
  let map = null, listo = false, svgFallback = null;
  const datos = () => {
    const met = METRICAS[st.lente], a = st.anio && met.anios.includes(+st.anio) ? +st.anio : undefined;
    const km2 = st.km2 && !met.sinKm2;
    const vals = B.map(b => valorDe(st.lente, b, a, km2));
    return {met, a: a ?? ult(met.anios), km2, vals, cortes: cortesQ(vals), max: Math.max(...vals.filter(v => v != null), 1)};
  };
  const leyenda = d => {
    const o = d.vals.filter(v => v != null).sort((a, b) => a - b);
    const t = `${d.met.nombre}${d.km2 ? " por km²" : ""}${d.met.anios.length > 1 || st.lente === "permisos" || st.lente === "delitos" ? ` · ${d.a}` : ""}`;
    ley.innerHTML = `<b>${esc(t)}</b><span class="ex">Color y altura: más alto, más ${esc(d.met.unidad)}</span><div class="esc">${[1, 2, 3, 4, 5].map(k => `<i style="background:var(--seq-${k})"></i>`).join("")}</div><div class="esc-t"><span>${fmtV(o[0], d.km2)}</span><span>${fmtV(ult(o), d.km2)}</span></div><span class="ex">Gris plano: sin dato publicable</span>${chip(d.met.fuente || "orlando_barrios", d.met.campo, d.met.fuente === "orlando_negocios" ? VIG_NEG : String(d.a))}`;
  };
  const geoBarrios = d => ({type: "FeatureCollection", features: M.geo.barrios.features.map((f, i) => {
    const v = d.vals[i], k = binDe(v, d.cortes);
    return {...f, properties: {i, nombre: B[i].nombre, color: colorBin(k), h: v == null ? 0 : 30 + v / d.max * 1200}};
  })});
  function pintar() {
    const d = datos(); leyenda(d);
    if (svgFallback) return svgFallback.pintar();
    if (!listo) return;
    map.getSource("barrios").setData(geoBarrios(d));
    map.setPaintProperty("fondo", "background-color", css("--surface"));
    map.setPaintProperty("lagos", "fill-color", css("--water"));
    map.setPaintProperty("distritos", "line-color", css("--ink"));
    map.setPaintProperty("limite", "line-color", css("--ink"));
    map.setPaintProperty("sel", "line-color", css("--sun"));
    map.setPaintProperty("barrios-3d", "fill-extrusion-color", ["case", ["boolean", ["feature-state", "hover"], false], css("--sun"), ["get", "color"]]);
  }
  // Encuadre de un barrio: su caja con margen, sin acercarse tanto que las columnas tapen la vista
  const CAJAS = M.geo.barrios.features.map(f => { let x0 = 180, y0 = 90, x1 = -180, y1 = -90; JSON.stringify(f.geometry.coordinates).replace(/\[(-?[\d.]+),(-?[\d.]+)\]/g, (_, x, y) => { x = +x; y = +y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; return ""; }); return [x0, y0, x1, y1]; });
  const PAD = () => el.clientWidth < 560 ? {top: 64, bottom: 64, left: 6, right: 54} : {top: 70, bottom: 50, left: 40, right: 80};
  function enfocar(i, animar = true) { if (!map) return; const angosto = el.clientWidth < 560; map.fitBounds(CAJAS[i], {padding: {top: angosto ? 90 : 140, bottom: $(".relato", el) ? Math.min(el.clientHeight * .55, 300) : angosto ? 110 : 140, left: angosto ? 60 : 140, right: angosto ? 80 : 160}, maxZoom: 11.3, pitch: map.getPitch(), bearing: map.getBearing(), duration: animar && !matchMedia("(prefers-reduced-motion: reduce)").matches ? 1500 : 0}); }
  function seleccionar(i, volar = true) {
    st.sel = i;
    if (svgFallback) { if (cfg.onSelect) cfg.onSelect(i); return; }
    if (listo) map.setFilter("sel", ["==", ["get", "i"], i == null ? -1 : i]);
    if (i != null && volar && map) enfocar(i);
    if (cfg.onSelect) cfg.onSelect(i);
  }
  function verTodo(animar = true) { if (map) map.fitBounds(M.caja, {padding: PAD(), pitch: map.getPitch(), bearing: map.getBearing(), duration: animar ? 1200 : 0}); }
  if (!hay3D()) {
    lienzo.innerHTML = `<svg class="svgmapa" id="${el.id}-svg" role="img" aria-label="Mapa de barrios" style="padding:70px 12px 90px"></svg>`;
    svgFallback = mapaPlano($("svg", lienzo), {valores: i => datos().vals[i], onClick: i => seleccionar(i, false),
      globo: i => { const d = datos(); return `<b>${esc(B[i].nombre)}</b><br>${fmtV(d.vals[i], d.km2)} ${esc(d.met.unidad)}${d.km2 ? " por km²" : ""}`; }});
    $(".controles", el).hidden = true;
  } else {
    try {
      map = new maplibregl.Map({container: lienzo, style: {version: 8, sources: {}, layers: [{id: "fondo", type: "background", paint: {"background-color": css("--surface")}}]},
        bounds: M.caja, fitBoundsOptions: {padding: PAD()}, pitch: 52, bearing: -17, maxPitch: 72,
        attributionControl: false, cooperativeGestures: matchMedia("(pointer: coarse)").matches, locale: {"CooperativeGesturesHandler.WindowsHelpText": "Usa Ctrl + rueda para acercar el mapa", "CooperativeGesturesHandler.MacHelpText": "Usa ⌘ + rueda para acercar el mapa", "CooperativeGesturesHandler.MobileHelpText": "Usa dos dedos para mover el mapa"}});
    } catch (e) { map = null; }
    if (!map) { el.innerHTML = `<div class="aviso3d">Tu navegador no pudo abrir el mapa 3D. La misma información está en la tabla de barrios.</div>`; return {pintar() {}, seleccionar() {}, st}; }
    map.on("load", () => {
      const d = datos();
      map.addSource("lagos", {type: "geojson", data: M.geo.lagos});
      map.addSource("barrios", {type: "geojson", data: geoBarrios(d), promoteId: "i"});
      map.addSource("distritos", {type: "geojson", data: M.geo.distritos});
      map.addSource("limite", {type: "geojson", data: M.geo.limite});
      map.addLayer({id: "lagos", type: "fill", source: "lagos", paint: {"fill-color": css("--water")}});
      map.addLayer({id: "barrios-3d", type: "fill-extrusion", source: "barrios", paint: {"fill-extrusion-color": ["get", "color"], "fill-extrusion-height": ["get", "h"], "fill-extrusion-opacity": .93, "fill-extrusion-vertical-gradient": true}});
      map.addLayer({id: "distritos", type: "line", source: "distritos", paint: {"line-color": css("--ink"), "line-width": 1, "line-opacity": .45}});
      map.addLayer({id: "limite", type: "line", source: "limite", paint: {"line-color": css("--ink"), "line-width": 1.4, "line-opacity": .8}});
      map.addLayer({id: "sel", type: "line", source: "barrios", filter: ["==", ["get", "i"], -1], paint: {"line-color": css("--sun"), "line-width": 3.5}});
      for (const dd of M.distritos) { const e = document.createElement("div"); e.className = "et-dist"; e.textContent = "D" + dd.distrito; new maplibregl.Marker({element: e}).setLngLat([dd.lon, dd.lat]).addTo(map); }
      listo = true; pintar();
      if (st.sel != null) map.setFilter("sel", ["==", ["get", "i"], st.sel]);
    });
    let hoverId = null;
    map.on("mousemove", "barrios-3d", e => {
      const f = e.features[0]; if (!f) return;
      if (hoverId !== null) map.setFeatureState({source: "barrios", id: hoverId}, {hover: false});
      hoverId = f.id; map.setFeatureState({source: "barrios", id: hoverId}, {hover: true});
      const d = datos(), i = f.properties.i;
      mostrarGlobo(`<b>${esc(B[i].nombre)}</b><br>${fmtV(d.vals[i], d.km2)} ${esc(d.met.unidad)}${d.km2 ? " por km²" : ""}<br><span class="s">Distrito ${B[i].distrito} · toca para ver su ficha</span>`, e.originalEvent.clientX, e.originalEvent.clientY);
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "barrios-3d", () => { if (hoverId !== null) map.setFeatureState({source: "barrios", id: hoverId}, {hover: false}); hoverId = null; ocultarGlobo(); map.getCanvas().style.cursor = ""; });
    map.on("click", "barrios-3d", e => { const f = e.features[0]; if (f) seleccionar(f.properties.i, false); });
    $(".controles", el).addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.z === "mas") map.zoomIn(); else if (b.dataset.z === "menos") map.zoomOut();
      else if (b.dataset.z === "todo") verTodo();
      else { const plano = map.getPitch() > 10; map.easeTo({pitch: plano ? 0 : 55, bearing: plano ? 0 : -17, duration: 800}); b.textContent = plano ? "3D" : "2D"; }
    });
    // Si el mapa nació en una vista oculta (0×0), encuadra la ciudad la primera vez que tiene tamaño
    // Un mapa que estuvo oculto (0×0) pierde el encuadre: al volver a tener tamaño, se encuadra de nuevo
    let anchoPrevio = el.clientWidth;
    new ResizeObserver(() => { if (!map) return; map.resize(); const w = el.clientWidth; if (anchoPrevio === 0 && w > 0) st.sel == null ? verTodo(false) : enfocar(st.sel, false); anchoPrevio = w; }).observe(el);
  }
  $(".lentes", el).addEventListener("click", e => {
    const b = e.target.closest("button[data-l]"); if (!b) return;
    st.lente = b.dataset.l; $$(".lentes button", el).forEach(x => x.setAttribute("aria-pressed", x === b)); pintar(); if (cfg.onLente) cfg.onLente(st.lente);
  });
  return {st, pintar, seleccionar, verTodo, get map() { return map; }, setLente(k) { st.lente = k; $$(".lentes button", el).forEach(x => x.setAttribute("aria-pressed", x.dataset.l === k)); pintar(); }};
}

/* ================= CIFRAS Y FRASES (se escriben solas desde el lago) ================= */
const pobC = C("gente", "poblacion_condado_ultimo_anio"), pobM = C("gente", "poblacion_area_metro_ultimo_anio"), crec = C("gente", "crecimiento_condado_10_anios");
const ing = C("gente", "ingreso_mediano_condado"), ingFl = C("gente", "ingreso_frente_a_florida"), pob = C("gente", "pobreza_condado"), pIng = C("gente", "puesto_ingreso_entre_pares");
const fraseGente = nb(`En el condado de Orange viven ${millones(pobC.valor)} de personas (${pobC.vigencia}), ${nf(crec.valor, 0)} % más que hace diez años. El ingreso mediano de sus hogares es ${usd(ing.valor)} al año, ${ingFl.valor >= 0 ? nf(ingFl.valor, 0) + " % más" : nf(-ingFl.valor, 0) + " % menos"} que el de Florida, y ${nf(pob.valor, 1).replace(",0", "")} de cada 100 personas viven en pobreza.`);

const des = C("economia", "desempleo_ultimo_mes"), desAnt = C("economia", "desempleo_hace_un_anio"), desFl = C("economia", "diferencia_con_florida"), pDes = C("economia", "puesto_desempleo_entre_pares");
const difDes = des.valor - desAnt.valor;
const fraseDes = nb(`El desempleo del área está en ${nf(des.valor, 1)} % (${fMes(des.vigencia)}), ${Math.abs(difDes) < .15 ? "igual que" : difDes > 0 ? nf(difDes, 1) + " puntos más que" : nf(-difDes, 1) + " puntos menos que"} hace un año, y ${Math.abs(desFl.valor) < .15 ? "igual al de Florida" : desFl.valor > 0 ? "por encima del de Florida" : "por debajo del de Florida"}. Entre las cuatro áreas grandes del estado es la ${["", "de menor", "segunda de menor", "tercera de menor", "de mayor"][pDes.valor]} desempleo.`);
const e12 = C("empleo", "variacion_12_meses").valor, eUlt = C("empleo", "indice_ultimo_dia"), pEmp = C("empleo", "puesto_entre_pares");
const fraseEmpleo = nb((Math.abs(e12) < 2 ? "Los avisos de empleo están casi igual que hace un año" : e12 > 0 ? `Hay más avisos de empleo que hace un año (${pct(e12)})` : `Hay menos avisos de empleo que hace un año (${pct(e12)})`)
  + (eUlt.valor >= 97 && eUlt.valor <= 103 ? ", al nivel de antes de la pandemia" : eUlt.valor > 103 ? ", por encima del nivel de antes de la pandemia" : ", por debajo del nivel de antes de la pandemia")
  + (pEmp ? `; pero Tampa, Miami y Jacksonville se recuperaron más: Orlando es ${pEmp.valor === 4 ? "la última" : "la " + ["", "primera", "segunda", "tercera"][pEmp.valor]} de las cuatro.` : "."));
const viv = S("vivienda", "indice_trimestral"), vUlt = C("vivienda", "indice_ultimo_trimestre"), v4 = C("vivienda", "variacion_4_trimestres").valor;
const yoy = viv.map((p, i) => i >= 4 ? [p[0], (p[1] / viv[i - 4][1] - 1) * 100] : null).filter(Boolean);
const maxYoy = yoy.filter(p => +p[0].slice(0, 4) >= +vUlt.vigencia.slice(0, 4) - 6).reduce((a, b) => b[1] > a[1] ? b : a);
const lista = C("vivienda", "precio_mediano_lista_ultimo_mes"), vLista = C("vivienda", "variacion_precio_lista_12_meses").valor;
const fraseViv = nb((Math.abs(v4) < 2 ? `El precio de la vivienda casi no se movió en el último año (${pct(v4)})` : v4 > 0 ? `El precio de la vivienda sigue subiendo: ${pct(v4)} en un año` : `El precio de la vivienda bajó ${pct(-v4)} en un año`)
  + (maxYoy[1] > 8 ? `, después de subir hasta ${nf(maxYoy[1], 0)} % al año en ${maxYoy[0].slice(0, 4)}` : "") + `. Una vivienda en venta pide hoy ${usd(lista.valor)} (mediana, ${fMes(lista.vigencia)}).`);
const fraseEco = `${fraseDes.split(".")[0]}. ${fraseViv}`;

const tot = C("permisos", "permisos_emitidos_ultimo_anio_completo"), vPer = C("permisos", "variacion_ultimo_anio").valor;
const topPerm = S("permisos", "permisos_por_barrio_ultimo_anio").slice(0, 2).map(p => [bonito(p[0]), p[1]]), partTop = (topPerm[0][1] + topPerm[1][1]) / tot.valor * 100;
const frasePer = nb(`En ${tot.vigencia} la ciudad emitió ${nf(tot.valor)} permisos de construcción, ${Math.abs(vPer) < 1 ? "casi los mismos que" : vPer > 0 ? nf(vPer, 0) + " % más que" : nf(-vPer, 0) + " % menos que"} el año anterior. ${topPerm[0][0]} y ${topPerm[1][0]} se llevan ${nf(partTop, 0)} de cada 100.`);

const del = C("seguridad", "delitos_ultimo_anio"), vDel = C("seguridad", "variacion_ultimo_anio").valor;
const topDel = S("seguridad", `delitos_barrio_${U_DEL}`).slice(0, 2).map(p => [bonito(p[0]), p[1]]);
const fraseSeg = nb(`En ${del.vigencia} la policía abrió ${nf(del.valor)} casos de hurtos, violencia y drogas, ${Math.abs(vDel) < 1 ? "casi los mismos que" : vDel > 0 ? nf(vDel, 0) + " % más que" : nf(-vDel, 0) + " % menos que"} el año anterior. ${topDel[0][0]} y ${topDel[1][0]} son los barrios con más casos.`);

const ocio = C("turismo", "participacion_ocio_ultimo_mes"), ocioN = C("turismo", "empleo_ocio_ultimo_mes"), vOcio = C("turismo", "variacion_empleo_ocio_12_meses").valor;
const fraseTur = nb(`${ocio.valor >= 18 && ocio.valor <= 22 ? "Uno de cada cinco" : nf(ocio.valor, 0) + " de cada 100"} empleos del área es de ocio y hotelería: ${nf(ocioN.valor, 0)} mil (${fMes(ocioN.vigencia)}), ${Math.abs(vOcio) < 1 ? "casi los mismos que" : vOcio > 0 ? nf(vOcio, 1) + " % más que" : nf(-vOcio, 1) + " % menos que"} hace un año.`);

const tAct = C("clima", "temperatura_actual"), alertas = C("clima", "alertas_activas").valor;
const difCal = C("clima_historico", "diferencia_entre_periodos"), p1 = C("clima_historico", "promedio_primeros_30"), p2 = C("clima_historico", "promedio_ultimos_30"), caliente = C("clima_historico", "anio_mas_caliente");
const fraseClima = nb(`Al correr la ingesta hacía ${nf(tAct.valor, 0)} °F (${aC(tAct.valor)} °C) y ${alertas ? `había ${alertas} alerta${alertas > 1 ? "s" : ""} vigente${alertas > 1 ? "s" : ""}` : "no había alertas vigentes"}. En el largo plazo, los últimos 30 años fueron ${nf(difCal.valor, 1)} °F (${nf(difCal.valor * 5 / 9, 1)} °C) más calientes que los primeros 30 del registro; el año más caliente fue ${caliente.valor}.`);

/* ================= RESUMEN ================= */
const ver = D.verificacion, verOk = typeof ver === "object";
$("#estadoTxt").innerHTML = `<span class="largo">Datos comprobados el </span>${fDia(D.generado)}`;
$("#estadoLago").addEventListener("click", () => { location.hash = "fuentes"; setTimeout(() => $("#notaVerif").scrollIntoView({behavior: "smooth", block: "center"}), 80); });
const enUso = D.catalogo.filter(f => f.estado === "integrado").length;
$("#lineaInicio").innerHTML = `<span>${ic("ok")}${verOk ? `${ver.pasan} comprobaciones, 0 fallos` : "Sin verificar"}</span><span>${ic("fuente")}${enUso} fuentes en uso de ${D.catalogo.length} revisadas</span><span>${ic("escudo")}Nadie aparece con nombre</span>`;
$("#linkRepo").href = D.repo;

function tarjeta({icono, tema, pregunta, cifra, unidad, vig, tend, frase, graf, vista, fuente}) {
  return `<article class="card resp"><div class="tema"><span class="ic">${ic(icono)}</span>${tema}</div>
    <p class="pregunta">${pregunta}</p>
    <div class="cifra"><b>${cifra}</b><span>${unidad}</span></div>
    <div class="cifra" style="gap:8px">${tend || ""}<span class="vig">${esc(vig)}</span></div>
    <p class="frase">${frase}</p>${graf || ""}
    <div class="pie"><a class="ver" href="#${vista}">Ver la evidencia ${ic("flecha")}</a>${fuente}</div></article>`;
}
const mini = (valores) => { const vals = M.barrios.map((_, i) => valores(i)); const c = cortesQ(vals);
  return `<svg class="minimapa" viewBox="0 0 ${M.ancho} ${M.alto}" aria-hidden="true">${M.barrios.map((b, i) => `<path d="${b.d}" style="fill:${vals[i] == null ? "var(--nodata)" : colorBinVar(binDe(vals[i], c))}"/>`).join("")}<path d="${M.lagos}" style="fill:var(--water);stroke:none"/></svg>`; };
const temps = S("clima_historico", "temperatura_anual");
// Una franja por año calendario: los años sin dato completo quedan en gris rayado, en su lugar (no se juntan los vecinos)
const A0 = +temps[0][0], A1 = +ult(temps)[0], TEMP_ANIO = new Map(temps.map(p => [+p[0], p[1]]));
const ANIOS_T = Array.from({length: A1 - A0 + 1}, (_, k) => A0 + k), FALTAN_T = ANIOS_T.filter(y => !TEMP_ANIO.has(y));
const MEDIA_T = temps.reduce((a, p) => a + p[1], 0) / temps.length, DEV_T = Math.max(...temps.map(p => Math.abs(p[1] - MEDIA_T)));
function franjasSVG(alto = 40) {
  return `<svg viewBox="0 0 ${ANIOS_T.length} 1" preserveAspectRatio="none" style="width:100%;height:${alto}px;display:block;border-radius:8px" aria-hidden="true">${ANIOS_T.map((y, k) => `<rect x="${k}" y="0" width="1.04" height="1" style="fill:${TEMP_ANIO.has(y) ? colorAnomalia((TEMP_ANIO.get(y) - MEDIA_T) / DEV_T) : "var(--nodata)"}"/>`).join("")}</svg>`;
}
function colorAnomalia(t) {   // −1 (frío) … 0 (neutro) … +1 (calor): escala divergente continua azul ↔ rojo
  const a = Math.min(1, Math.abs(t)), [c1, c2, c3] = t < 0 ? ["--cold-1", "--cold-2", "--cold-3"] : ["--warm-1", "--warm-2", "--warm-3"];
  if (a < .34) return `color-mix(in oklab, var(${c1}) ${Math.round(a / .34 * 100)}%, var(--mid))`;
  if (a < .67) return `color-mix(in oklab, var(${c2}) ${Math.round((a - .34) / .33 * 100)}%, var(${c1}))`;
  return `color-mix(in oklab, var(${c3}) ${Math.round((a - .67) / .33 * 100)}%, var(${c2}))`;
}
$("#tarjetas").innerHTML = [
  tarjeta({icono: "gente", tema: "Gente", pregunta: "¿Cuánta gente vive aquí?", cifra: millones(pobC.valor).replace(NB + "millones", ""), unidad: "millones de personas en el condado de Orange", vig: `${pobC.vigencia}`,
    tend: tendencia(crec.valor, 1, "neutro").replace("Sube", "Creció").replace("</span>", " en 10 años</span>"), frase: `Ingreso mediano por hogar: ${usd(ing.valor)} (${ing.vigencia}), ${pct(ingFl.valor, 0)} frente a Florida.`,
    graf: spark(S("gente", "poblacion_condado").slice(-30)), vista: "gente", fuente: chip("fred_poblacion", "poblacion_condado_ultimo_anio", pobC.vigencia)}),
  tarjeta({icono: "empleo", tema: "Economía y vivienda", pregunta: "¿Cómo va el empleo y cuánto cuesta vivir aquí?", cifra: nf(des.valor, 1) + NB + "%", unidad: "de desempleo en el área", vig: fMes(des.vigencia),
    tend: tendencia(difDes, .15, "inverso", v => pp(v)), frase: `Una vivienda en venta pide ${usd(lista.valor)} (mediana, ${fMes(lista.vigencia)}), ${pct(vLista)} en un año.`,
    graf: spark(S("economia", "desempleo_orlando").slice(-60)), vista: "economia", fuente: chip("fred_laus", "desempleo_ultimo_mes", des.vigencia)}),
  tarjeta({icono: "grua", tema: "Barrios", pregunta: "¿Dónde se construye?", cifra: nf(tot.valor), unidad: `permisos emitidos en ${tot.vigencia}`, vig: tot.vigencia,
    tend: tendencia(vPer, 1, "neutro"), frase: `${topPerm[0][0]} y ${topPerm[1][0]} se llevan ${nf(partTop, 0)} de cada 100.`,
    graf: mini(i => B[i].permisos[U_PERM] ?? null), vista: "barrios", fuente: chip("orlando_permisos", "permisos_emitidos_ultimo_anio_completo", tot.vigencia)}),
  tarjeta({icono: "sirena", tema: "Seguridad", pregunta: "¿Qué pasa con la seguridad?", cifra: nf(del.valor), unidad: `casos de hurtos, violencia y drogas en ${del.vigencia}`, vig: del.vigencia,
    tend: tendencia(vDel, 1, "inverso"), frase: `Los barrios con más casos: ${topDel[0][0]} y ${topDel[1][0]}. Nadie aparece con nombre ni dirección.`,
    graf: mini(i => porKm2(B[i].delitos[U_DEL], B[i])), vista: "seguridad", fuente: chip("opd_casos", "delitos_ultimo_anio", del.vigencia)}),
  tarjeta({icono: "maleta", tema: "Turismo", pregunta: "¿Cuánto pesa el turismo?", cifra: nf(ocio.valor, 1) + NB + "%", unidad: "del empleo es de ocio y hotelería", vig: fMes(ocio.vigencia),
    tend: tendencia(vOcio, 1, "normal"), frase: `${nf(ocioN.valor, 0)} mil empleos. ${nf(C("negocios", "hospedajes_vigentes").valor)} hospedajes y ${nf(C("negocios", "restaurantes_vigentes").valor)} restaurantes con licencia en la ciudad.`,
    graf: spark(S("turismo", "empleo_ocio_hoteleria").slice(-84)), vista: "turismo", fuente: chip("fred_ces", "participacion_ocio_ultimo_mes", ocio.vigencia)}),
  tarjeta({icono: "sol", tema: "Clima", pregunta: "¿Cómo está cambiando el clima?", cifra: "+" + nf(difCal.valor, 1) + NB + "°F", unidad: "más calientes los últimos 30 años que los primeros 30", vig: `${p1.vigencia.replace("-", "–")} → ${p2.vigencia.replace("-", "–")}`,
    tend: "", frase: `Hoy: ${nf(tAct.valor, 0)} °F (${aC(tAct.valor)} °C), ${alertas ? alertas + " alertas" : "sin alertas"}. El año más caliente del registro fue ${caliente.valor}.`,
    graf: franjasSVG(44), vista: "clima", fuente: chip("noaa_gsoy", "diferencia_entre_periodos", p2.vigencia)}),
].join("");

// Contra qué: Orlando frente a sus pares en cuatro medidas
function contraCard(titulo, filas, fmt, fuente, campo, vig, nota) {
  const id = "c" + Math.random().toString(36).slice(2, 8);
  setTimeout(() => listaBarras($("#" + id), filas, {fmt, pos: false}));
  return `<div class="card"><h3>${titulo}</h3><ol class="ranking sinpos" id="${id}"></ol><p class="vig">${esc(nota)}</p>${chip(fuente, campo, vig)}</div>`;
}
const desU = des.vigencia;
const val = (tema, k, et) => (S(tema, k).find(p => p[0] === et) || ult(S(tema, k)))[1];
const empMes = S("empleo", "indice_mensual"), empU = ult(empMes)[0];
const visDoce = k => S("escucha", k).slice(-12).reduce((a, p) => a + p[1], 0);
$("#contra").innerHTML = [
  contraCard("Desempleo (menos es mejor)", [["Orlando", "orlando", true], ["Tampa", "tampa"], ["Miami", "miami"], ["Jacksonville", "jacksonville"], ["Florida", "florida"]]
    .map(([n, k, yo]) => ({nombre: n, valor: val("economia", `desempleo_${k}`, desU), yo, par: !yo})).sort((a, b) => a.valor - b.valor), v => nf(v, 1) + NB + "%", "fred_laus", "desempleo_<área>", desU, `Áreas metropolitanas, ${fMes(desU)}`),
  contraCard("Avisos de empleo (feb 2020 = 100)", [["Orlando", "indice_mensual", true], ["Tampa", "indice_mensual_tampa"], ["Miami", "indice_mensual_miami"], ["Jacksonville", "indice_mensual_jacksonville"]]
    .map(([n, k, yo]) => ({nombre: n, valor: val("empleo", k, empU), yo, par: !yo})).sort((a, b) => b.valor - a.valor), v => nf(v, 1), "indeed_hiring_lab", "indice_mensual_<ciudad>", empU, `Índice, 100 = feb 2020 · ${fMes(empU)}`),
  contraCard("Ingreso mediano de los hogares", [["Orange", "orange", true], ["Hillsborough", "hillsborough"], ["Duval", "duval"], ["Miami-Dade", "miami_dade"], ["Florida", "florida"]]
    .map(([n, k, yo]) => ({nombre: n, valor: ult(S("gente", `ingreso_mediano_${k}`))[1], yo, par: !yo})).sort((a, b) => b.valor - a.valor), usd, "fred_saipe", "ingreso_mediano_<condado>", ing.vigencia, `Condados, ${ing.vigencia}. Orange es el de Orlando; Hillsborough, el de Tampa; Duval, el de Jacksonville`),
  contraCard("Interés en Wikipedia en español", [["Orlando", "vistas_mensuales", true], ["Tampa", "vistas_mensuales_tampa"], ["Miami", "vistas_mensuales_miami"], ["Jacksonville", "vistas_mensuales_jacksonville"]]
    .map(([n, k, yo]) => ({nombre: n, valor: visDoce(k), yo, par: !yo})).sort((a, b) => b.valor - a.valor), v => nf(v), "wikimedia_pageviews", "vistas_mensuales_<ciudad>", C("escucha", "vistas_ultimo_mes").vigencia, "Visitas en los últimos 12 meses"),
].join("");

const PENDIENTES = [
  {t: "¿Qué reclaman los vecinos al 311?", p: "Las solicitudes al 311 no están publicadas. Las quejas de código urbano son lo más cercano, pero solo cubren el estado de los predios."},
  {t: "¿Cuánta gente vive en cada barrio?", p: "La American Community Survey (F12) lo tiene, pero su API pide llave. Sin población por barrio no hay tasas por habitante: comparamos por km²."},
  {t: "¿Cuánto produce la economía del área?", p: "El PIB del área está descontinuado en FRED. No lo reemplazamos por un número viejo."},
  {t: "¿Qué cargos se buscan y cuánto pagan?", p: "Las ofertas de Indeed (F19) prohíben la extracción. El índice que usamos dice si los avisos suben o bajan, no cuáles son."},
  {t: "¿Cuántos turistas llegan?", p: "Visitantes y pasajeros del aeropuerto vienen en PDF y notas de prensa (F23, F51); la ocupación hotelera es de plataformas privadas."},
];
$("#pendientes").innerHTML = PENDIENTES.map(x => `<div class="pend">${ic("hueco")}<b>${esc(x.t)}</b><p>${esc(x.p)}</p></div>`).join("");
$("#copiarResumen").addEventListener("click", () => copiar([
  `Cerebro Orlando · resumen con datos comprobados el ${fDia(D.generado)}`,
  `1. Gente: ${fraseGente} Fuente: U.S. Census Bureau vía FRED.`,
  `2. Economía y vivienda: ${fraseDes} ${fraseViv} Fuentes: BLS, FHFA y Realtor.com vía FRED.`,
  `3. Barrios: ${frasePer} Fuente: City of Orlando Open Data.`,
  `4. Seguridad: ${fraseSeg} Fuente: Policía de Orlando (agregado por barrio).`,
  `5. Turismo: ${fraseTur} Fuente: BLS vía FRED.`,
  `6. Clima: ${fraseClima} Fuentes: NWS y NOAA NCEI.`].join("\n"), "Resumen copiado"));

// Mapa 3D de la portada, con recorrido guiado
const atlasInicio = crearAtlas($("#atlasInicio"), {lentes: ["permisos", "delitos", "quejas", "negocios"], estado: {lente: "permisos"},
  onSelect: i => { if (i != null && !recorridoActivo) { irABarrio(i); } }});
let recorridoActivo = false;
function paradas() {
  const mejor = (f, filtro = () => true) => B.map((b, i) => [i, f(b)]).filter(([i, v]) => v != null && filtro(B[i])).sort((a, b) => b[1] - a[1])[0][0];
  const p1 = mejor(b => b.permisos[U_PERM]);
  const a0 = A_PERM[0], baja = B.map((b, i) => [i, (b.permisos[a0] ?? 0) - (b.permisos[U_PERM] ?? 0)]).sort((a, b) => b[1] - a[1])[0][0];
  const p3 = mejor(b => porKm2(b.delitos[U_DEL], b), b => b.km2 > .3);
  const p4 = mejor(b => b.quejas);
  const p5 = mejor(b => b.negocios);
  const r = (i, lente, titulo, texto) => ({i, lente, titulo, texto});
  return [
    r(p1, "permisos", `Donde más se construye: ${B[p1].nombre}`, `${nf(B[p1].permisos[U_PERM])} permisos emitidos en ${U_PERM}, el primer puesto de la ciudad. Está en el distrito ${B[p1].distrito}, en el sureste, donde Orlando crece hacia el aeropuerto y Lake Nona.`),
    r(baja, "permisos", `Donde la construcción se frenó: ${B[baja].nombre}`, `Pasó de ${nf(B[baja].permisos[a0] ?? 0)} permisos en ${a0} a ${nf(B[baja].permisos[U_PERM] ?? 0)} en ${U_PERM}. Fue el barrio que más construyó al comienzo del periodo.`),
    r(p3, "delitos", `Más casos de policía por km²: ${B[p3].nombre}`, `${nf(porKm2(B[p3].delitos[U_DEL], B[p3]), 0)} casos por km² en ${U_DEL} (${nf(B[p3].delitos[U_DEL])} en total). Es un barrio pequeño y concurrido: sin población por barrio, esto no es una tasa por habitante.`),
    r(p4, "quejas", `Más quejas ciudadanas: ${B[p4].nombre}`, `${nf(B[p4].quejas)} casos de código abiertos por queja de vecinos en ${U_COD}: lotes, viviendas y avisos. Lo más cercano a «qué reclaman los vecinos» que hay abierto.`),
    r(p5, "negocios", `Más negocios: ${B[p5].nombre}`, `${nf(B[p5].negocios)} licencias de negocio vigentes. El centro concentra oficinas, comercio y servicios, y por eso aparece alto en casi todas las medidas.`),
  ];
}
function recorrido(el, atlas) {
  const pasos = paradas(); let k = 0;
  recorridoActivo = true;
  const caja = document.createElement("div"); caja.className = "relato"; el.append(caja);
  const ir = () => {
    const p = pasos[k];
    atlas.setLente(p.lente); atlas.seleccionar(p.i, true);
    caja.innerHTML = `<p class="eyebrow">Parada ${k + 1} de ${pasos.length}</p><h3>${esc(p.titulo)}</h3><p class="peq">${esc(p.texto)}</p>
      <div class="pasos"><button class="btn" type="button" data-p="ant" ${k ? "" : "disabled"}>${ic("atras")}Anterior</button><button class="btn" type="button" data-p="fin">Terminar</button><button class="btn prim" type="button" data-p="sig">${k < pasos.length - 1 ? "Siguiente" : "Ver la ficha"}${ic("flecha")}</button></div>`;
  };
  caja.addEventListener("click", e => {
    const b = e.target.closest("button[data-p]"); if (!b) return;
    if (b.dataset.p === "ant") { k--; ir(); }
    else if (b.dataset.p === "sig") { if (k < pasos.length - 1) { k++; ir(); } else { const i = pasos[k].i; fin(); irABarrio(i); } }
    else fin();
  });
  const fin = () => { caja.remove(); recorridoActivo = false; atlas.seleccionar(null, false); atlas.verTodo(); };
  ir();
}
$("#recorridoBtn").addEventListener("click", () => { $("#atlasInicio").scrollIntoView({behavior: "smooth", block: "center"}); if (!$(".relato", $("#atlasInicio"))) recorrido($("#atlasInicio"), atlasInicio); });

/* ================= GENTE ================= */
$("#r-gente").textContent = fraseGente;
$("#k-poblacion").innerHTML = `<div class="kpi"><small>Condado de Orange</small><b>${millones(pobC.valor)}</b><span class="vig">${pobC.vigencia}</span></div>
  <div class="kpi"><small>En 10 años</small><b>${pct(crec.valor)}</b><span class="vig">${+pobC.vigencia - 10}–${pobC.vigencia}</span></div>
  <div class="kpi"><small>Área metropolitana</small><b>${millones(pobM.valor)}</b><span class="vig">${pobM.vigencia}</span></div>`;
$("#f-poblacion").innerHTML = chip("fred_poblacion", "poblacion_condado", pobC.vigencia);
$("#ley-poblacion").innerHTML = `<span><i style="background:var(--accent)"></i>Condado de Orange</span><span><i style="background:var(--peer)"></i>Área metropolitana</span>`;
observar($("#g-poblacion"), () => lineas($("#g-poblacion"), {series: [
  {nombre: "Condado", puntos: S("gente", "poblacion_condado").map(p => [p[0], p[1] / 1000]), color: "var(--accent)", resaltar: true},
  {nombre: "Área metro", puntos: S("gente", "poblacion_area_metro").map(p => [p[0], p[1] / 1000]), color: "var(--peer)"}],
  fmtX: s => s, fmtY: v => nf(v, 2) + " millones", fmtTick: (v, d) => nf(v, d), cero: true, etiquetas: true, area: true, aria: "Población del condado de Orange y del área metropolitana"}));
const PARES_C = [["orange", "Orange (Orlando)", true], ["hillsborough", "Hillsborough (Tampa)"], ["duval", "Duval (Jacksonville)"], ["miami_dade", "Miami-Dade"], ["florida", "Florida"]];
const COL_PAR = {hillsborough: "var(--c1)", duval: "var(--c3)", miami_dade: "var(--c2)", florida: "var(--peer)"};
function seriesPares(pref, desde) {
  return PARES_C.map(([k, n, yo]) => ({nombre: n.split(" (")[0], puntos: S("gente", `${pref}_${k}`).filter(p => !desde || p[0] >= desde), color: yo ? "var(--ink)" : COL_PAR[k], resaltar: yo}));
}
const ingU = Object.fromEntries(PARES_C.map(([k]) => [k, ult(S("gente", `ingreso_mediano_${k}`))[1]]));
$("#r-ingreso").textContent = `Orange es el ${["", "primero", "segundo", "tercero", "cuarto"][pIng.valor]} de los cuatro condados por ingreso (${ing.vigencia}). En dólares corrientes: no descuenta la inflación.`;
$("#f-ingreso").innerHTML = chip("fred_saipe", "ingreso_mediano_<condado>", ing.vigencia);
observar($("#g-ingreso"), () => lineas($("#g-ingreso"), {series: seriesPares("ingreso_mediano", "2005"), fmtX: s => s, fmtY: v => usd(v), fmtTick: v => nf(v / 1000) + " mil", etiquetas: true, aria: "Ingreso mediano por condado"}));
const pobU = Object.fromEntries(PARES_C.map(([k]) => [k, ult(S("gente", `pobreza_${k}`))[1]]));
$("#r-pobreza").textContent = `En ${pob.vigencia}, ${nf(pobU.orange, 1)} % en Orange, frente a ${nf(pobU.florida, 1)} % en Florida y ${nf(pobU.miami_dade, 1)} % en Miami-Dade.`;
$("#f-pobreza").innerHTML = chip("fred_saipe", "pobreza_condado", pob.vigencia);
observar($("#g-pobreza"), () => lineas($("#g-pobreza"), {series: seriesPares("pobreza", "2005"), fmtX: s => s, fmtY: v => nf(v, 1) + " %", fmtTick: (v, d) => nf(v, d) + NB + "%", etiquetas: true, aria: "Pobreza por condado"}));

/* ================= ECONOMÍA Y VIVIENDA ================= */
$("#r-eco").textContent = fraseEco;
$("#r-desempleo").textContent = fraseDes;
$("#k-desempleo").innerHTML = `<div class="kpi"><small>Orlando</small><b>${nf(des.valor, 1)} %</b><span class="vig">${fMes(des.vigencia)}</span></div><div class="kpi"><small>Frente a un año antes</small><b>${pp(difDes)}</b><span class="vig">${fMes(desAnt.vigencia)}: ${nf(desAnt.valor, 1)} %</span></div>`;
$("#f-desempleo").innerHTML = chip("fred_laus", "desempleo_<área>", des.vigencia);
const DES = [["orlando", "Orlando", "var(--ink)", true], ["tampa", "Tampa", "var(--c1)"], ["miami", "Miami", "var(--c2)"], ["jacksonville", "Jacksonville", "var(--c3)"], ["florida", "Florida", "var(--peer)"], ["eeuu", "EE. UU.", "var(--muted)"]];
let rDes = 10, ocultosDes = new Set(["eeuu"]);
const leyToggle = (el, items, ocultos, cb) => { el.innerHTML = items.map(([k, n, c]) => `<button type="button" data-k="${k}" aria-pressed="${!ocultos.has(k)}"><i style="background:${c}"></i>${n}</button>`).join(""); el.onclick = e => { const b = e.target.closest("button"); if (!b) return; ocultos.has(b.dataset.k) ? ocultos.delete(b.dataset.k) : ocultos.add(b.dataset.k); b.setAttribute("aria-pressed", !ocultos.has(b.dataset.k)); cb(); }; };
const dibDes = () => { const desde = rDes ? `${+des.vigencia.slice(0, 4) - rDes}${des.vigencia.slice(4)}` : "";
  lineas($("#g-desempleo"), {series: DES.filter(([k]) => !ocultosDes.has(k) || k === "orlando").map(([k, n, c, yo]) => ({nombre: n, puntos: S("economia", `desempleo_${k}`).filter(p => p[0] >= desde), color: c, resaltar: yo})),
    fmtX: s => fMes(s, true), fmtY: v => nf(v, 1) + " %", fmtTick: (v, d) => nf(v, d) + NB + "%", etiquetas: true, cero: true, aria: "Desempleo de Orlando y de sus pares"}); };
leyToggle($("#ley-desempleo"), DES.slice(1), ocultosDes, dibDes);
observar($("#g-desempleo"), dibDes);
$("#r-empleo").textContent = fraseEmpleo;
$("#k-empleo").innerHTML = `<div class="kpi"><small>Índice al ${fDia(eUlt.vigencia)}</small><b>${nf(eUlt.valor, 1)}</b></div><div class="kpi"><small>En 12 meses</small><b>${pct(e12)}</b></div>`;
$("#f-empleo").innerHTML = chip("indeed_hiring_lab", "indice_mensual_<ciudad>", eUlt.vigencia);
const EMP = [["", "Orlando", "var(--ink)", true], ["_tampa", "Tampa", "var(--c1)"], ["_miami", "Miami", "var(--c2)"], ["_jacksonville", "Jacksonville", "var(--c3)"]];
const ocultosEmp = new Set();
const dibEmp = () => lineas($("#g-empleo"), {series: EMP.filter(([k]) => !ocultosEmp.has(k) || !k).map(([k, n, c, yo]) => ({nombre: n, puntos: S("empleo", `indice_mensual${k}`), color: c, resaltar: yo})),
  fmtX: s => fMes(s, true), fmtY: v => nf(v, 1), ref: {y: 100}, etiquetas: true, aria: "Índice de avisos de empleo de Orlando y sus pares"});
leyToggle($("#ley-empleo"), EMP.slice(1), ocultosEmp, dibEmp);
observar($("#g-empleo"), dibEmp);
const hace5 = viv[viv.length - 21];
$("#r-vivienda").textContent = fraseViv;
$("#k-vivienda").innerHTML = `<div class="kpi"><small>En un año</small><b>${pct(v4)}</b><span class="vig">${fTrim(vUlt.vigencia)}</span></div><div class="kpi"><small>En 5 años</small><b>${pct((vUlt.valor / hace5[1] - 1) * 100, 0)}</b><span class="vig">desde ${fTrim(hace5[0])}</span></div><div class="kpi"><small>Desde 1995</small><b>× ${nf(vUlt.valor / 100, 1)}</b><span class="vig">sin descontar inflación</span></div>`;
$("#f-vivienda").innerHTML = chip("fred_ihv_orlando", "indice_trimestral", vUlt.vigencia);
let modoViv = "pares";
const rebase = (pts, base) => { const b = pts.find(p => p[0] === base); return b ? pts.filter(p => p[0] >= base).map(p => [p[0], p[1] / b[1] * 100]) : []; };
const VIVP = [["", "Orlando", "var(--ink)", true], ["_tampa", "Tampa", "var(--c1)"], ["_miami", "Miami", "var(--c2)"], ["_jacksonville", "Jacksonville", "var(--c3)"]];
const picoViv = viv.filter(p => p[0] < "2010").reduce((a, b) => b[1] > a[1] ? b : a), fondoViv = viv.filter(p => p[0] > picoViv[0] && p[0] < "2016").reduce((a, b) => b[1] < a[1] ? b : a);
const dibViv = () => {
  if (modoViv === "pares") {
    $("#t-vivienda").innerHTML = `Precio de la vivienda, re-escalado a 2015 = 100 (<button class="term" data-term="indice1995">derivado</button>)`;
    $("#ley-vivienda").innerHTML = `<span>La serie de Tampa termina en ${fTrim(ult(S("vivienda", "indice_trimestral_tampa"))[0])}</span>`;
    lineas($("#g-vivienda"), {series: VIVP.map(([k, n, c, yo]) => ({nombre: n, puntos: rebase(S("vivienda", `indice_trimestral${k}`), "2015-Q1"), color: c, resaltar: yo})),
      fmtX: fTrim, fmtY: v => nf(v, 0) + " (2015 = 100)", ref: {y: 100, texto: "2015 = 100"}, etiquetas: true, aria: "Precio de la vivienda de Orlando y sus pares desde 2015"});
  } else {
    $("#t-vivienda").innerHTML = `Precio de la vivienda en Orlando, <button class="term" data-term="indice1995">índice 1995 = 100</button>`;
    $("#ley-vivienda").innerHTML = "";
    lineas($("#g-vivienda"), {series: [{nombre: "Orlando", puntos: viv, color: "var(--accent)"}], fmtX: fTrim, fmtY: v => nf(v, 1), ref: {y: 100, texto: "1995 = 100"}, area: true,
      extra: et => { const j = viv.findIndex(x => x[0] === et); return j >= 4 ? `<br><span class="s">${pct((viv[j][1] / viv[j - 4][1] - 1) * 100)} en un año</span>` : ""; },
      notas: [{x: picoViv[0], texto: `Pico de ${picoViv[0].slice(0, 4)}`}, {x: fondoViv[0], texto: `Fondo de ${fondoViv[0].slice(0, 4)}`, pos: "abajo"}], aria: "Precio de la vivienda en Orlando desde 1978"});
  }
};
observar($("#g-vivienda"), dibViv);
const inv = C("vivienda", "casas_en_venta_ultimo_mes"), vInv = C("vivienda", "variacion_casas_en_venta_12_meses").valor, dias = C("vivienda", "dias_en_mercado_ultimo_mes");
$("#r-mercado").textContent = `En ${fMes(lista.vigencia, true)} había ${nf(inv.valor)} viviendas en venta en el área (${pct(vInv)} en un año), con un precio mediano de lista de ${usd(lista.valor)} (${pct(vLista)}). Una vivienda tarda ${nf(dias.valor)} días en venderse (mediana).`;
$("#f-realtor").innerHTML = chip("fred_realtor", "precio_mediano_lista_ultimo_mes", lista.vigencia);
observar($("#g-lista"), () => lineas($("#g-lista"), {series: [{nombre: "Precio", puntos: S("vivienda", "precio_mediano_lista"), color: "var(--accent)"}], alto: 170, fmtX: s => fMes(s, true), fmtY: usd, fmtTick: v => nf(v / 1000) + " mil", area: true, aria: "Precio mediano de lista"}));
observar($("#g-inventario"), () => lineas($("#g-inventario"), {series: [{nombre: "En venta", puntos: S("vivienda", "casas_en_venta"), color: "var(--accent)"}], alto: 170, fmtX: s => fMes(s, true), fmtY: v => nf(v) + " viviendas", fmtTick: v => nf(v / 1000) + " mil", cero: true, area: true, aria: "Viviendas en venta"}));
observar($("#g-dias"), () => lineas($("#g-dias"), {series: [{nombre: "Días", puntos: S("vivienda", "dias_en_mercado"), color: "var(--accent)"}], alto: 170, fmtX: s => fMes(s, true), fmtY: v => nf(v) + " días", cero: true, area: true, aria: "Días en el mercado"}));
const aut = S("vivienda", "viviendas_autorizadas"), autAnio = {};
aut.forEach(([m, v]) => { const y = m.slice(0, 4); (autAnio[y] = autAnio[y] || []).push(v); });
const autPts = Object.entries(autAnio).filter(([, v]) => v.length === 12).map(([y, v]) => [y, Math.round(v.reduce((a, b) => a + b, 0))]);
const a12 = C("vivienda", "viviendas_autorizadas_12_meses"), vA12 = C("vivienda", "variacion_viviendas_autorizadas").valor;
$("#r-autorizadas").textContent = `En los 12 meses a ${fMes(a12.vigencia)} se autorizaron ${nf(a12.valor)} viviendas nuevas en el área, ${pct(vA12, 0)} frente a los 12 meses anteriores. Suma anual de la serie mensual ajustada.`;
$("#f-autorizadas").innerHTML = chip("fred_bps", "viviendas_autorizadas", a12.vigencia);
observar($("#g-autorizadas"), () => barras($("#g-autorizadas"), {puntos: autPts, fmtX: s => s, fmtY: v => nf(v) + " viviendas", aria: "Viviendas nuevas autorizadas por año"}));
const perAnio = S("permisos", "permisos_por_anio"), enCurso = C("permisos", "permisos_emitidos_anio_en_curso");
$("#r-permisosanio").innerHTML = `${frasePer} El año en curso va en <b>${nf(enCurso.valor)}</b> al ${fDia(enCurso.vigencia)} (no se grafica: está incompleto).`;
$("#f-permisosanio").innerHTML = chip("orlando_permisos", "permisos_por_anio", tot.vigencia);
observar($("#g-permisosanio"), () => barras($("#g-permisosanio"), {puntos: perAnio, fmtX: s => s, fmtY: (v, i) => `${nf(v)} permisos${i > 0 ? `<br><span class="s">${pct((v / perAnio[i - 1][1] - 1) * 100)} frente a ${perAnio[i - 1][0]}</span>` : ""}`, aria: "Permisos emitidos por año"}));
const empT = S("economia", "empleo_total"), eT = C("economia", "empleo_total_ultimo_mes"), vET = C("economia", "variacion_empleo_12_meses").valor;
$("#r-empleototal").textContent = `El área tiene ${millones(eT.valor)} de empleos (${fMes(eT.vigencia)}), ${pct(vET)} en un año. En 1990 eran ${nf(empT[0][1] / 1000, 2)} millones.`;
$("#f-empleototal").innerHTML = chip("fred_ces", "empleo_total", eT.vigencia);
const pand = empT.filter(p => p[0] >= "2020-01" && p[0] <= "2020-12").reduce((a, b) => b[1] < a[1] ? b : a);
observar($("#g-empleototal"), () => lineas($("#g-empleototal"), {series: [{nombre: "Empleos", puntos: empT, color: "var(--accent)"}], fmtX: s => fMes(s, true), fmtY: v => nf(v, 0) + " mil", area: true, cero: true, notas: [{x: pand[0], texto: "Pandemia", pos: "abajo"}], aria: "Empleo total del área"}));
$$(".seg[data-rango]").forEach(g => g.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  $$("button", g).forEach(x => x.setAttribute("aria-pressed", x === b));
  const r = b.dataset.r;
  if (g.dataset.rango === "desempleo") { rDes = +r; dibDes(); }
  else if (g.dataset.rango === "vivienda") { modoViv = r; dibViv(); }
  else if (g.dataset.rango === "ocio") { modoOcio = r; dibOcio(); }
}));
$$(".seg[data-rango] button").forEach(b => { if (!b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", "false"); });

/* ================= BARRIOS ================= */
$("#r-barrios").textContent = `${frasePer.split(". ")[0]}. ${topDel[0][0]} tiene más casos de policía y ${bonito(S("negocios", "negocios_barrio")[0][0])} más negocios. Elige qué mirar en el mapa y toca un barrio para ver su ficha.`;
$("#listaBarrios").innerHTML = B.map(b => `<option value="${esc(b.nombre)}"></option>`).join("");
let selB = null, compB = null;
const atlasB = crearAtlas($("#atlasBarrios"), {estado: {lente: "permisos", anio: U_PERM}, onSelect: i => { selB = i; fichaBarrio(); rankingBarrios(); }, onLente: () => { ajustarAnio(); rankingBarrios(); }});
function ajustarAnio() {
  const met = METRICAS[atlasB.st.lente], anios = met.anios.map(Number), r = $("#anioRango");
  r.min = anios[0]; r.max = ult(anios); r.disabled = anios.length < 2; $("#anioPlay").disabled = anios.length < 2;
  if (!anios.includes(+atlasB.st.anio)) atlasB.st.anio = ult(anios);
  r.value = atlasB.st.anio; $("#anioTxt").textContent = met.k === "negocios" || met.unidad === "licencias" ? "hoy" : atlasB.st.anio;
  $("#segMedida").style.opacity = met.sinKm2 ? .4 : 1;
  atlasB.pintar();
}
$("#anioRango").addEventListener("input", e => { atlasB.st.anio = +e.target.value; $("#anioTxt").textContent = e.target.value; atlasB.pintar(); rankingBarrios(); });
let animAnio = null;
$("#anioPlay").addEventListener("click", () => {
  if (animAnio) { clearInterval(animAnio); animAnio = null; $("#anioPlay").innerHTML = ic("play"); return; }
  const r = $("#anioRango"); $("#anioPlay").innerHTML = ic("pausa");
  r.value = r.min; r.dispatchEvent(new Event("input"));
  animAnio = setInterval(() => { if (+r.value >= +r.max) { clearInterval(animAnio); animAnio = null; $("#anioPlay").innerHTML = ic("play"); return; } r.value = +r.value + 1; r.dispatchEvent(new Event("input")); }, 1300);
});
$("#segMedida").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; atlasB.st.km2 = b.dataset.m === "km2"; $$("#segMedida button").forEach(x => x.setAttribute("aria-pressed", x === b)); atlasB.pintar(); rankingBarrios(); });
$("#buscarBarrio").addEventListener("change", e => {
  const t = norm(e.target.value); if (!t) return;
  const j = IDX.has(t) ? IDX.get(t) : B.findIndex(b => norm(b.nombre).includes(t));
  if (j >= 0) { atlasB.seleccionar(j, true); e.target.value = ""; } else aviso("No encontramos ese barrio");
});
function rankingBarrios() {
  const st = atlasB.st, met = METRICAS[st.lente], km2 = st.km2 && !met.sinKm2, a = met.anios.map(Number).includes(+st.anio) ? +st.anio : undefined;
  const filas = B.map((b, i) => ({nombre: b.nombre, valor: valorDe(st.lente, b, a, km2), i, sel: i === selB})).filter(f => f.valor != null).sort((x, y) => y.valor - x.valor).slice(0, 10);
  $("#tRanking").textContent = st.lente === "indice" ? "Los 10 barrios con mayor puntaje en el índice" : `Los 10 barrios con más ${met.frase}${km2 ? " por km²" : ""}`;
  listaBarras($("#ranking"), filas, {fmt: v => fmtV(v, km2), onClick: f => atlasB.seleccionar(f.i, true)});
}
const MEDIDAS_FICHA = ["permisos", "delitos", "hurtos", "violencia", "drogas", "quejas", "codigo", "negocios", "restaurantes", "hospedajes", "indice"];
const rango = (met, i) => { const vals = B.map(b => METRICAS[met].v(b)).map((v, k) => [k, v]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]); const p = vals.findIndex(x => x[0] === i); return {p: p + 1, n: vals.length, max: vals[0] ? vals[0][1] : 1}; };
function fichaBarrio() {
  const el = $("#fichaSel");
  if (selB == null) {
    el.innerHTML = `<p class="eyebrow">${ic("info")}Cómo usar el mapa</p><h3 style="font-size:1.25rem">Toca un barrio para ver su ficha</h3>
      <p class="peq">Arriba eliges qué mirar (construcción, seguridad, quejas, negocios, hospedaje o el índice). Arrastra para mover, usa dos dedos o la rueda para acercar y el botón 2D/3D para inclinar. Con «Por km²» comparas barrios de distinto tamaño, y con la barra del año ves cómo cambió.</p>
      <div class="medidas">${["permisos", "delitos", "quejas", "negocios"].map(k => { const met = METRICAS[k], t = B.reduce((s, b) => s + (met.v(b) || 0), 0); return `<div class="medida"><span class="n">${met.nombre} (suma de barrios)</span><span class="v">${nf(t)}</span><span></span></div>`; }).join("")}</div>`;
    return;
  }
  const b = B[selB], c = compB != null ? B[compB] : null;
  const filas = MEDIDAS_FICHA.map(k => {
    const met = METRICAS[k], v = met.v(b), r = rango(k, selB), v2 = c ? met.v(c) : undefined, kmv = met.sinKm2 ? null : porKm2(v, b);
    // Serie por año solo si todos los años tienen dato publicable (un hueco no se dibuja como cero)
    const serie = met.anios.length > 2 && met.anios.every(a => met.v(b, a) != null) ? `${spark(met.anios.map(a => [String(a), met.v(b, a)]), "var(--accent)", 24)}<span class="r"><span>${met.anios[0]}</span><span>${ult(met.anios)}</span></span>` : "";
    return `<div class="medida"><span class="n">${met.nombre}${met.anios.length > 1 ? ` (${ult(met.anios)})` : ""}</span><span class="v">${v == null ? "—" : k === "indice" ? nf(v, 0) : nf(v)}</span>${c ? `<span class="v2">${v2 == null ? "—" : k === "indice" ? nf(v2, 0) : nf(v2)}</span>` : "<span></span>"}
      ${v == null ? `<span class="r"><span>Sin dato publicable (menos de 5 o ninguno)</span></span>` : `<span class="rb"><i style="width:${v / r.max * 100}%"></i>${c && v2 != null ? `<u style="left:calc(${Math.min(99, v2 / r.max * 100)}% - 1px)"></u>` : ""}</span><span class="r"><span>Puesto ${r.p} de ${r.n}</span><span>${kmv != null ? fmtV(kmv, true) + " por km²" : ""}</span></span>`}
      ${serie ? `<span style="grid-column:1/-1;display:grid;gap:2px">${serie}</span>` : ""}</div>`;
  }).join("");
  el.innerHTML = `<div class="titulo"><div><p class="eyebrow">Barrio · distrito ${b.distrito} · ${nf(b.km2, 2)} km²</p><h3>${esc(b.nombre)}</h3></div><button class="btn" type="button" id="limpiarSel" aria-label="Quitar selección">${ic("cerrar")}</button></div>
    <div class="filtros"><label class="peq" for="compSel">Comparar con</label><select class="sel" id="compSel"><option value="">— ningún barrio —</option>${B.map((x, i) => i === selB ? "" : `<option value="${i}" ${i === compB ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select></div>
    ${c ? `<p class="peq"><b style="color:var(--ink)">${esc(b.nombre)}</b> en negro · <b style="color:var(--sun)">${esc(c.nombre)}</b> en amarillo</p>` : ""}
    <div class="medidas">${filas}</div>
    <div class="filtros"><button class="btn" type="button" id="copiarFicha">${ic("copiar")}Copiar ficha</button>${chip("orlando_barrios", "properties.nombre", C("territorio", "poligonos_barrios").vigencia)}</div>`;
  $("#compSel").onchange = e => { compB = e.target.value === "" ? null : +e.target.value; fichaBarrio(); };
  $("#copiarFicha").onclick = () => copiar([`${b.nombre} (distrito ${b.distrito}, ${nf(b.km2, 2)} km²) · Cerebro Orlando, datos al ${fDia(D.generado)}`,
    ...MEDIDAS_FICHA.map(k => { const v = METRICAS[k].v(b); return `- ${METRICAS[k].nombre}: ${v == null ? "sin dato publicable" : nf(v, k === "indice" ? 0 : 0)}`; })].join("\n"), "Ficha copiada");
}
document.addEventListener("click", e => { if (e.target.closest("#limpiarSel")) { selB = null; compB = null; atlasB.seleccionar(null, false); atlasB.verTodo(); } });
function irABarrio(i) { location.hash = "barrios"; setTimeout(() => { atlasB.seleccionar(i, true); $("#atlasBarrios").scrollIntoView({behavior: "smooth", block: "center"}); }, 120); }
const umbrales = ["permisos", "seguridad", "codigo", "negocios"].map(t => C(t, "umbral_minimo_por_barrio").valor);
$("#notaPrivBarrios").innerHTML = `<b>Cuidamos a las personas.</b> Los permisos traen el nombre del propietario y el contratista; los casos de policía, el número de caso y el punto exacto; los negocios, el dueño y su teléfono. Nada de eso se descarga: los servidores de la ciudad devuelven conteos por barrio, y los barrios con menos de ${Math.min(...umbrales)} casos en el año salen en gris, igual que los que no tuvieron ninguno, para no revelar cuáles son. Distrito, área y «por km²» son <button class="term" data-term="derivado">derivados</button>.`;

// Índice con pesos movibles
$("#pesos").innerHTML = `<div class="filtros">${Object.keys(PRESETS).map(n => `<button type="button" class="chip" data-p="${n}" aria-pressed="${n === "Equilibrio"}">${n}</button>`).join("")}</div>` +
  DIMS.map((d, k) => `<div class="peso"><label for="peso${k}">${d.nombre}<span class="peq" style="font-weight:400"> · ${d.desc}</span></label><output id="o-peso${k}">${pesos[k]}</output><input type="range" id="peso${k}" min="0" max="3" step="1" value="${pesos[k]}"></div>`).join("");
const mapaIdx = mapaPlano($("#mapaIndice"), {valores: i => IND[i], onClick: i => irABarrio(i), ley: $("#leyIndice"), titulo: () => "Índice de atención (0 a 100)", fmt: v => nf(v, 0),
  globo: i => `<b>${esc(B[i].nombre)}</b><br>Índice: <b>${nf(IND[i], 0)}</b> de 100<br><span class="s">${DIMS.map((d, k) => `${d.nombre} ${nf(percentil[k][i], 0)}`).join(" · ")}</span>`});
function actualizarIndice() {
  IND = indice(); mapaIdx.pintar();
  const top = B.map((b, i) => [i, IND[i]]).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const tops = Object.values(PRESETS).map(p => new Set(indice(p).map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0])));
  const firmes = top.filter(([i]) => tops.every(s => s.has(i))).length;
  $("#r-indice").textContent = `${B[top[0][0]].nombre} encabeza con estos pesos. ${firmes} de los 10 primeros siguen en el top 10 con cualquiera de los cuatro enfoques: ${firmes >= 7 ? "la conclusión se sostiene" : firmes >= 4 ? "la conclusión se sostiene a medias" : "la conclusión depende mucho de los pesos"}.`;
  listaBarras($("#rankIndice"), top.map(([i, v]) => ({nombre: B[i].nombre, valor: v, i})), {fmt: v => nf(v, 0), max: 100, onClick: f => irABarrio(f.i)});
  if (atlasB.st.lente === "indice") { atlasB.pintar(); rankingBarrios(); }
}
$("#pesos").addEventListener("input", e => { const k = +e.target.id.replace("peso", ""); pesos[k] = +e.target.value; $("#o-peso" + k).textContent = e.target.value; $$("#pesos .chip").forEach(c => c.setAttribute("aria-pressed", "false")); actualizarIndice(); });
$("#pesos").addEventListener("click", e => { const c = e.target.closest(".chip"); if (!c) return; pesos = [...PRESETS[c.dataset.p]]; pesos.forEach((v, k) => { $("#peso" + k).value = v; $("#o-peso" + k).textContent = v; }); $$("#pesos .chip").forEach(x => x.setAttribute("aria-pressed", x === c)); actualizarIndice(); });
actualizarIndice();

// Correlaciones
const OPC = ["permisos", "delitos", "hurtos", "violencia", "drogas", "quejas", "codigo", "negocios", "restaurantes", "hospedajes"];
$("#corrX").innerHTML = OPC.map(k => `<option value="${k}" ${k === "negocios" ? "selected" : ""}>${METRICAS[k].nombre} por km²</option>`).join("");
$("#corrY").innerHTML = OPC.map(k => `<option value="${k}" ${k === "delitos" ? "selected" : ""}>${METRICAS[k].nombre} por km²</option>`).join("");
function rangos(v) { const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = Array(v.length); for (let i = 0; i < o.length;) { let j = i; while (j < o.length && o[j][0] === o[i][0]) j++; for (let k = i; k < j; k++) r[o[k][1]] = (i + j - 1) / 2; i = j; } return r; }
function spearman(x, y) { const rx = rangos(x), ry = rangos(y), n = x.length, mx = rx.reduce((a, b) => a + b) / n, my = ry.reduce((a, b) => a + b) / n; let s = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { s += (rx[i] - mx) * (ry[i] - my); sx += (rx[i] - mx) ** 2; sy += (ry[i] - my) ** 2; } return s / Math.sqrt(sx * sy); }
function dispersion() {
  const kx = $("#corrX").value, ky = $("#corrY").value, el = $("#g-corr");
  const pts = B.map((b, i) => [valorDe(kx, b, undefined, true), valorDe(ky, b, undefined, true), i]).filter(p => p[0] > 0 && p[1] > 0);
  const rho = spearman(pts.map(p => p[0]), pts.map(p => p[1]));
  const fuerza = Math.abs(rho) < .2 ? "casi ninguna relación" : Math.abs(rho) < .4 ? "una relación débil" : Math.abs(rho) < .6 ? "una relación moderada" : Math.abs(rho) < .8 ? "una relación fuerte" : "una relación muy fuerte";
  $("#r-corr").textContent = kx === ky ? "Elige dos medidas distintas." : `Entre los ${pts.length} barrios con ambos datos hay ${fuerza} ${rho > 0 ? "positiva" : "negativa"} (ρ de Spearman = ${nf(rho, 2)}): ${rho > .2 ? "donde hay más " + METRICAS[kx].frase + " tiende a haber más " + METRICAS[ky].frase : rho < -.2 ? "donde hay más de una tiende a haber menos de la otra" : "saber una no ayuda a adivinar la otra"}.`;
  const W = el.clientWidth, H = W < 500 ? 320 : 380, m = {t: 30, r: 28, b: 40, l: 54};
  const lx = pts.map(p => Math.log10(p[0])), ly = pts.map(p => Math.log10(p[1]));
  const ex = [Math.floor(Math.min(...lx)), Math.ceil(Math.max(...lx))], ey = [Math.floor(Math.min(...ly)), Math.ceil(Math.max(...ly))];
  const X = v => m.l + (Math.log10(v) - ex[0]) / (ex[1] - ex[0] || 1) * (W - m.l - m.r), Y = v => m.t + (1 - (Math.log10(v) - ey[0]) / (ey[1] - ey[0] || 1)) * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="Dispersión de barrios">`;
  for (let e = ex[0]; e <= ex[1]; e++) s += `<line x1="${X(10 ** e)}" x2="${X(10 ** e)}" y1="${m.t}" y2="${H - m.b}" style="stroke:var(--line)"/><text x="${X(10 ** e)}" y="${H - m.b + 16}" text-anchor="middle">${nf(10 ** e, e < 0 ? -e : 0)}</text>`;
  for (let e = ey[0]; e <= ey[1]; e++) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(10 ** e)}" y2="${Y(10 ** e)}" style="stroke:var(--line)"/><text x="${m.l - 8}" y="${Y(10 ** e) + 4}" text-anchor="end">${nf(10 ** e, e < 0 ? -e : 0)}</text>`;
  s += `<text x="${W - m.r}" y="${H - 4}" text-anchor="end" class="etq" style="fill:var(--ink-2)">${esc(METRICAS[kx].corto)} por km² →</text><text x="${m.l - 46}" y="${m.t - 14}" class="etq" style="fill:var(--ink-2)">↑ ${esc(METRICAS[ky].corto)} por km²</text>`;
  pts.forEach(([x, y, i]) => s += `<circle class="pt" data-i="${i}" cx="${X(x)}" cy="${Y(y)}" r="${i === selB ? 7 : 5}" style="fill:${i === selB ? "var(--sun)" : "var(--accent)"};fill-opacity:.75;stroke:var(--surface)" stroke-width="1.5"/>`);
  s += `</svg>`;
  el.innerHTML = s;
  const svg = el.querySelector("svg");
  svg.addEventListener("pointermove", e => { const c = e.target.closest(".pt"); if (!c) return ocultarGlobo(); const i = +c.dataset.i; mostrarGlobo(`<b>${esc(B[i].nombre)}</b><br>${esc(METRICAS[kx].corto)}: ${fmtV(valorDe(kx, B[i], undefined, true), true)} por km²<br>${esc(METRICAS[ky].corto)}: ${fmtV(valorDe(ky, B[i], undefined, true), true)} por km²<br><span class="s">Toca para ver su ficha</span>`, e.clientX, e.clientY); });
  svg.addEventListener("pointerleave", ocultarGlobo);
  svg.addEventListener("click", e => { const c = e.target.closest(".pt"); if (c) irABarrio(+c.dataset.i); });
}
$("#corrX").onchange = dispersion; $("#corrY").onchange = dispersion;
observar($("#g-corr"), dispersion);

// Tabla accesible
const COLS = [["nombre", "Barrio"], ["distrito", "Distrito"], ["km2", "Área km²"], ["permisos", `Permisos ${U_PERM}`], ["delitos", `Casos policía ${U_DEL}`], ["quejas", `Quejas ${U_COD}`], ["negocios", "Negocios"], ["hospedajes", "Hospedajes"], ["indice", "Índice"]];
let ordenK = "indice", ordenAsc = false;
const celda = (b, k) => k === "nombre" ? b.nombre : k === "distrito" ? +b.distrito : k === "km2" ? b.km2 : METRICAS[k].v(b);
function tabla() {
  $("#tablaBarrios thead").innerHTML = `<tr>${COLS.map(([k, t]) => `<th class="${k === "nombre" ? "" : "n"}" aria-sort="${k === ordenK ? (ordenAsc ? "ascending" : "descending") : "none"}"><button type="button" data-k="${k}">${t}</button></th>`).join("")}</tr>`;
  const filas = [...B].sort((a, b) => { const x = celda(a, ordenK), y = celda(b, ordenK); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; const r = typeof x === "string" ? x.localeCompare(y, "es") : x - y; return ordenAsc ? r : -r; });
  $("#tablaBarrios tbody").innerHTML = filas.map(b => `<tr>${COLS.map(([k]) => { const v = celda(b, k); return `<td class="${k === "nombre" ? "" : "n"}">${k === "nombre" ? esc(v) : v == null ? "—" : k === "km2" ? nf(v, 2) : nf(v)}</td>`; }).join("")}</tr>`).join("");
}
$("#tablaBarrios thead").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; if (ordenK === b.dataset.k) ordenAsc = !ordenAsc; else { ordenK = b.dataset.k; ordenAsc = ordenK === "nombre"; } tabla(); });
$("#sumTabla").textContent = `Ver los ${B.length} barrios en una tabla (— = sin dato publicable)`;
tabla(); ajustarAnio(); rankingBarrios(); fichaBarrio();

/* ================= SEGURIDAD ================= */
$("#r-seg").textContent = fraseSeg;
const GRUPOS = [["hurtos", "Hurtos y robos a la propiedad", "var(--c1)"], ["violencia", "Violencia contra personas", "var(--c2)"], ["drogas", "Drogas", "var(--c3)"]];
$("#k-seg").innerHTML = GRUPOS.map(([k, n]) => { const c = C("seguridad", `${k}_ultimo_anio`), s = S("seguridad", `${k}_por_anio`), prev = s[s.length - 2][1];
  return `<div class="kpi"><small>${n}</small><div class="fila"><b>${nf(c.valor)}</b>${tendencia((c.valor / prev - 1) * 100, 1, "inverso")}</div><span class="vig">${c.vigencia} · frente a ${s[s.length - 2][0]}</span></div>`; }).join("");
$("#ley-seg").innerHTML = GRUPOS.map(([, n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("");
$("#f-seg").innerHTML = chip("opd_casos", "hurtos_por_anio", del.vigencia);
observar($("#g-seg"), () => lineas($("#g-seg"), {series: GRUPOS.map(([k, n, c]) => ({nombre: n.split(" ")[0], puntos: S("seguridad", `${k}_por_anio`), color: c, resaltar: true})), fmtX: s => s, fmtY: v => nf(v) + " casos", cero: true, etiquetas: true,
  ticksX: (x0, x1) => S("seguridad", "hurtos_por_anio").map(p => [tiempo(p[0]), p[0]]), aria: "Casos de policía por año y grupo"}));
let grupoSeg = "delitos";
$("#segGrupo").innerHTML = [["delitos", "Todos"], ["hurtos", "Hurtos"], ["violencia", "Violencia"], ["drogas", "Drogas"]].map(([k, n]) => `<button type="button" data-g="${k}" aria-pressed="${k === "delitos"}">${n}</button>`).join("");
const mapaSeg = mapaPlano($("#mapaSeg"), {valores: i => porKm2(METRICAS[grupoSeg].v(B[i]), B[i]), ley: $("#leySeg"), fmt: v => nf(v, 0), titulo: () => `Casos por km² en ${U_DEL}`, onClick: i => { atlasB.setLente("delitos"); ajustarAnio(); irABarrio(i); },
  globo: i => { const v = METRICAS[grupoSeg].v(B[i]); return `<b>${esc(B[i].nombre)}</b><br>${v == null ? "Sin dato publicable" : `${nf(v)} casos · ${fmtV(porKm2(v, B[i]), true)} por km²`}<br><span class="s">Toca para verlo en el mapa 3D</span>`; }});
function rankSeg() {
  const met = METRICAS[grupoSeg];
  $("#t-rankseg").textContent = `Barrios con más ${met.frase} en ${U_DEL}`;
  listaBarras($("#rankSeg"), B.map((b, i) => ({nombre: b.nombre, valor: met.v(b), i})).filter(f => f.valor != null).sort((a, b) => b.valor - a.valor).slice(0, 12), {onClick: f => irABarrio(f.i)});
}
$("#segGrupo").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; grupoSeg = b.dataset.g; $$("#segGrupo button").forEach(x => x.setAttribute("aria-pressed", x === b)); mapaSeg.pintar(); rankSeg(); });
rankSeg();
$("#verSeg3d").addEventListener("click", () => { atlasB.setLente("delitos"); ajustarAnio(); });
barrasSimples($("#tiposSeg"), S("seguridad", `tipos_${U_DEL}`).slice(0, 12));
$("#f-tipos").innerHTML = chip("opd_casos", `tipos_${U_DEL}`, U_DEL);
const supSeg = C("seguridad", "barrios_suprimidos_ultimo_anio").valor, sinSeg = C("seguridad", "casos_sin_barrio_ultimo_anio").valor;
$("#notaPrivSeg").innerHTML = `<b>Qué decidimos no mostrar.</b> La capa de la policía trae número de caso, fecha y punto exacto: aquí no hay ninguno de esos datos, solo conteos que el servidor calcula por barrio y año. No entran los casos de salud mental (Baker Act), suicidios, muertes, personas desaparecidas, disputas de custodia ni órdenes de alejamiento: no son delitos y señalarían a personas vulnerables. ${supSeg} barrios con menos de ${C("seguridad", "umbral_minimo_por_barrio").valor} casos en ${U_DEL} salen sin dato, y ${nf(sinSeg)} casos no traen barrio. <span class="vig">verificar.py falla si aparece una categoría excluida o una celda bajo el umbral.</span>`;
const cod = C("codigo", "casos_ultimo_anio"), quej = C("codigo", "quejas_ultimo_anio"), vCod = C("codigo", "variacion_ultimo_anio").valor;
const topQ = S("codigo", `quejas_barrio_${U_COD}`).slice(0, 2).map(p => [bonito(p[0]), p[1]]);
$("#r-codigo").textContent = `En ${cod.vigencia} se abrieron ${nf(cod.valor)} casos de código urbano (${pct(vCod, 0)}); ${nf(quej.valor)} nacieron de una queja de vecinos. ${topQ[0][0]} y ${topQ[1][0]} encabezan las quejas.`;
$("#ley-codigo").innerHTML = `<span><i style="background:var(--accent)"></i>Todos los casos</span><span><i style="background:var(--sun)"></i>Por queja ciudadana</span>`;
$("#f-codigo").innerHTML = chip("orlando_codigo", "casos_por_anio", cod.vigencia);
observar($("#g-codigo"), () => lineas($("#g-codigo"), {series: [{nombre: "Todos", puntos: S("codigo", "casos_por_anio"), color: "var(--accent)", resaltar: true}, {nombre: "Por queja", puntos: S("codigo", "quejas_por_anio"), color: "var(--sun)", resaltar: true}],
  fmtX: s => s, fmtY: v => nf(v) + " casos", cero: true, etiquetas: true, aria: "Casos de código urbano por año"}));
listaBarras($("#rankQuejas"), B.map((b, i) => ({nombre: b.nombre, valor: b.quejas, i})).filter(f => f.valor != null).sort((a, b) => b.valor - a.valor).slice(0, 8), {onClick: f => { atlasB.setLente("quejas"); ajustarAnio(); irABarrio(f.i); }});
barrasSimples($("#tiposCodigo"), S("codigo", `tipos_${U_COD}`).slice(0, 10));
$("#notaCodigo").innerHTML = `<b>No es el 311.</b> Las solicitudes al 311 no están publicadas. Las quejas de código son lo más cercano, pero solo cubren el estado de los predios, no baches, ruido ni basuras en la vía. ${nf(C("codigo", "casos_sin_barrio_ultimo_anio").valor)} casos de ${U_COD} (${nf(C("codigo", "casos_sin_barrio_ultimo_anio").valor / cod.valor * 100, 0)} de cada 100) no traen barrio. El origen de la queja solo se anota desde 2020.`;

/* ================= TURISMO ================= */
$("#r-tur").textContent = fraseTur;
const strA = C("turismo", "alquiler_corto_activas"), strT = C("turismo", "alquiler_corto_total_historico");
$("#k-tur").innerHTML = `<div class="kpi"><small>Del empleo total</small><b>${nf(ocio.valor, 1)} %</b><span class="vig">${fMes(ocio.vigencia)}</span></div><div class="kpi"><small>Empleos en ocio y hotelería</small><div class="fila"><b>${nf(ocioN.valor, 0)}${NB}mil</b>${tendencia(vOcio, 1, "normal")}</div><span class="vig">${fMes(ocioN.vigencia)} · en 12 meses</span></div><div class="kpi"><small>Hospedajes con licencia</small><b>${nf(C("negocios", "hospedajes_vigentes").valor)}</b><span class="vig">${fDia(VIG_NEG)}</span></div>`;
$("#f-ocio").innerHTML = chip("fred_ces", "empleo_ocio_hoteleria", ocioN.vigencia);
let modoOcio = "empleos";
const ocioS = S("turismo", "empleo_ocio_hoteleria"), pandO = ocioS.filter(p => p[0] >= "2020-01" && p[0] <= "2020-12").reduce((a, b) => b[1] < a[1] ? b : a);
const dibOcio = () => { $("#t-ocio").textContent = modoOcio === "empleos" ? "Empleos en ocio y hotelería en el área (miles)" : "Ocio y hotelería como % del empleo total";
  lineas($("#g-ocio"), {series: [{nombre: "Ocio", puntos: modoOcio === "empleos" ? ocioS : S("turismo", "participacion_ocio_en_empleo"), color: "var(--accent)"}], fmtX: s => fMes(s, true), fmtY: v => modoOcio === "empleos" ? nf(v, 1) + " mil empleos" : nf(v, 1) + " % del empleo", area: true, cero: modoOcio === "empleos",
    notas: [{x: pandO[0], texto: "Pandemia", pos: "abajo"}], aria: "Empleo en ocio y hotelería"}); };
observar($("#g-ocio"), dibOcio);
mapaPlano($("#mapaHosp"), {valores: i => B[i].hospedajes ?? null, ley: $("#leyHosp"), titulo: () => "Licencias de hospedaje vigentes", onClick: i => { atlasB.setLente("hospedajes"); ajustarAnio(); irABarrio(i); },
  globo: i => `<b>${esc(B[i].nombre)}</b><br>${B[i].hospedajes == null ? "Sin dato publicable" : nf(B[i].hospedajes) + " hospedajes con licencia"}`});
$("#f-hosp").innerHTML = chip("orlando_negocios", "hospedajes_barrio", VIG_NEG);
$("#f-rest").innerHTML = chip("orlando_negocios", "restaurantes_barrio", VIG_NEG);
listaBarras($("#rankHosp"), B.map((b, i) => ({nombre: b.nombre, valor: b.hospedajes, i})).filter(f => f.valor != null).sort((a, b) => b.valor - a.valor).slice(0, 6), {onClick: f => irABarrio(f.i)});
listaBarras($("#rankRest"), B.map((b, i) => ({nombre: b.nombre, valor: b.restaurantes, i})).filter(f => f.valor != null).sort((a, b) => b.valor - a.valor).slice(0, 12), {onClick: f => irABarrio(f.i)});
$("#notaNegocios").innerHTML = `Cuenta licencias de negocio vigentes (Business Tax Receipts), no empresas ni habitaciones. ${C("negocios", "barrios_suprimidos_hospedajes").valor} barrios tienen menos de ${C("negocios", "umbral_minimo_por_barrio").valor} hospedajes y salen sin dato. La mayor parte de los parques temáticos y hoteles de Disney y Universal están fuera de la ciudad de Orlando: no aparecen aquí.`;
$("#r-str").textContent = `Orlando solo tiene ${nf(strA.valor)} alquileres de corto plazo con licencia activa (${nf(strT.valor)} registrados en total, ${fDia(strA.vigencia)}). Las licencias emitidas por año:`;
$("#f-str").innerHTML = chip("orlando_alquiler_corto", "alquiler_corto_activas", strA.vigencia);
observar($("#g-str"), () => barras($("#g-str"), {puntos: S("turismo", "alquiler_corto_emitidas_por_anio"), fmtX: s => s, fmtY: v => nf(v) + " licencias", alto: 200, aria: "Licencias de alquiler de corto plazo por año"}));
const at = C("escucha", "atencion_frente_a_pares");
$("#r-escucha").textContent = `En los últimos 12 meses Orlando recibió ${nf(at.valor, 2)} veces las visitas promedio de Tampa, Miami y Jacksonville en Wikipedia en español; Miami atrae mucho más. ${C("escucha", "variacion_anual").valor < 0 ? `Las visitas a Orlando bajaron ${nf(-C("escucha", "variacion_anual").valor, 0)} % frente al mismo mes del año pasado.` : ""}`;
$("#f-escucha").innerHTML = chip("wikimedia_pageviews", "vistas_mensuales_<ciudad>", C("escucha", "vistas_ultimo_mes").vigencia);
const ESC = [["", "Orlando", "var(--ink)", true], ["_tampa", "Tampa", "var(--c1)"], ["_miami", "Miami", "var(--c2)"], ["_jacksonville", "Jacksonville", "var(--c3)"]];
const ocultosEsc = new Set();
const dibEsc = () => lineas($("#g-escucha"), {series: ESC.filter(([k]) => !ocultosEsc.has(k) || !k).map(([k, n, c, yo]) => ({nombre: n, puntos: S("escucha", `vistas_mensuales${k}`), color: c, resaltar: yo})), fmtX: s => fMes(s, true), fmtY: v => nf(v) + " visitas", fmtTick: v => nf(v / 1000) + " mil", cero: true, etiquetas: true, aria: "Visitas mensuales en Wikipedia por ciudad"});
leyToggle($("#ley-escucha"), ESC.slice(1), ocultosEsc, dibEsc);
observar($("#g-escucha"), dibEsc);

/* ================= CLIMA ================= */
$("#r-clima").textContent = fraseClima;
const diaDe = s => DIA[new Date(tiempo(s.slice(0, 10))).getUTCDay()];
function agruparDias() {
  const t = S("clima", "pronostico_temperatura"), ll = Object.fromEntries(S("clima", "pronostico_lluvia")), porDia = new Map();
  t.forEach(([h, temp]) => { const dia = h.slice(0, 10), hora = +h.slice(11, 13), deDia = hora >= 6 && hora < 18;
    if (!porDia.has(dia)) porDia.set(dia, {fecha: dia, nombre: diaDe(dia), max: null, min: null, lluvia: 0});
    const o = porDia.get(dia); if (deDia) o.max = temp; else o.min = temp; o.lluvia = Math.max(o.lluvia, ll[h] ?? 0); });
  return [...porDia.values()];
}
const diasC = agruparDias();
$("#ahora").innerHTML = `<div class="t">${nf(tAct.valor, 0)}<sup>°F</sup></div>
  <div style="display:grid;gap:8px;min-width:0;flex:1 1 260px"><p style="font-size:1.12rem"><b>${aC(tAct.valor)} °C</b> en Orlando el ${fDia(tAct.vigencia)}, según la estación cercana más reciente.</p>
  <span class="alerta ${alertas ? "mal" : "ok"}">${ic(alertas ? "alerta" : "ok")}${alertas ? `${alertas} alerta${alertas > 1 ? "s" : ""} vigente${alertas > 1 ? "s" : ""}` : "Sin alertas vigentes"}</span></div>
  <div style="display:flex;gap:8px;flex-direction:column">${chip("nws_api", "temperatura_actual", tAct.vigencia, "Temperatura")}${chip("nws_api", "alertas_activas", C("clima", "alertas_activas").vigencia, "Alertas")}</div>`;
$("#dias").innerHTML = diasC.map((d, i) => { const icono = d.lluvia >= 50 ? "lluvia" : d.lluvia >= 20 ? "nube-sol" : "sol", txt = d.lluvia >= 50 ? "Lluvia probable" : d.lluvia >= 20 ? "Posible lluvia" : "Poca lluvia", [, m, dd] = d.fecha.split("-").map(Number);
  return `<div class="card dia"><span class="nombre">${cap(d.nombre)}</span><span class="fecha">${dd} ${MES[m - 1]}${i === 0 ? " · día de la prueba" : ""}</span>${ic(icono, "ico i")}<span class="tt">${d.max ?? "–"}° <span>/ ${d.min ?? "–"}°</span></span><span class="c">${d.max != null ? aC(d.max) + "°" : "–"} / ${d.min != null ? aC(d.min) + "°" : "–"} C</span><span class="c">${txt}: ${d.lluvia} %</span><span class="lluvia" aria-hidden="true"><i style="width:${d.lluvia}%"></i></span></div>`; }).join("");
$("#f-clima2").innerHTML = chip("nws_api", "pronostico_lluvia", L.clima.probado, "Pronóstico");
$("#t-franjas").textContent = `${A0}–${A1}: cada año, un color`;
$("#r-franjas").textContent = `Cada franja es un año: azul si fue más frío que el promedio de todo el registro, rojo si fue más caliente. Los últimos 30 años promedian ${nf(p2.valor, 1)} °F, frente a ${nf(p1.valor, 1)} °F de los primeros 30 (${nf(difCal.valor, 1)} °F más).`;
$("#f-franjas").innerHTML = chip("noaa_gsoy", "temperatura_anual", ult(temps)[0]);
$("#vig-franjas").textContent = `De ${A0} (izquierda) a ${A1} (derecha) · estación Orlando International Airport${FALTAN_T.length ? ` · en gris, años sin dato completo (${FALTAN_T[0]}–${ult(FALTAN_T)})` : ""}`;
$("#ley-franjas").innerHTML = `<span><i style="background:var(--cold-3);height:10px"></i>Más frío</span><span><i style="background:var(--mid);height:10px"></i>Promedio</span><span><i style="background:var(--warm-3);height:10px"></i>Más caliente</span>`;
const fr = $("#franjas"); fr.setAttribute("viewBox", `0 0 ${ANIOS_T.length} 1`); fr.setAttribute("preserveAspectRatio", "none"); fr.style.height = "120px"; fr.setAttribute("aria-label", "Franjas de temperatura media anual de Orlando desde " + temps[0][0]);
fr.innerHTML = franjasSVG(120).replace(/^<svg[^>]*>|<\/svg>$/g, "");
fr.addEventListener("pointermove", e => { const r = fr.getBoundingClientRect(), y = ANIOS_T[Math.max(0, Math.min(ANIOS_T.length - 1, Math.floor((e.clientX - r.left) / r.width * ANIOS_T.length)))], v = TEMP_ANIO.get(y);
  mostrarGlobo(`<b>${y}</b><br>${v == null ? "Sin dato completo ese año" : `${nf(v, 1)} °F (${nf((v - 32) * 5 / 9, 1)} °C)<br><span class="s">${v >= MEDIA_T ? "+" : "\u2212"}${nf(Math.abs(v - MEDIA_T), 1)} °F frente al promedio del registro</span>`}`, e.clientX, e.clientY); });
fr.addEventListener("pointerleave", ocultarGlobo);
$("#ley-temp").innerHTML = `<span><i style="background:var(--accent)"></i>Media del año</span><span><i style="background:transparent;height:0;border-top:2px dashed var(--muted)"></i>Promedio ${p1.vigencia.replace("-", "–")}: ${nf(p1.valor, 1)}${NB}°F · ${p2.vigencia.replace("-", "–")}: ${nf(p2.valor, 1)}${NB}°F</span>`;
$("#f-temp").innerHTML = chip("noaa_gsoy", "temperatura_anual", ult(temps)[0]);
const [pa, pb] = p1.vigencia.split("-"), [pc, pd] = p2.vigencia.split("-");
observar($("#g-temp"), () => lineas($("#g-temp"), {series: [{nombre: "Media", puntos: temps, color: "var(--accent)"}], fmtX: s => s, fmtY: v => `${nf(v, 1)} °F (${nf((v - 32) * 5 / 9, 1)} °C)`, fmtTick: (v, d) => nf(v, d) + "°",
  refs: [{y: p1.valor, desde: pa, hasta: pb}, {y: p2.valor, desde: pc, hasta: pd}],
  notas: [{x: String(caliente.valor), texto: `${caliente.valor}`}], aria: "Temperatura media anual"}));
$("#f-lluvia").innerHTML = chip("noaa_gsoy", "lluvia_anual", ult(S("clima_historico", "lluvia_anual"))[0]);
const LLUVIA = new Map(S("clima_historico", "lluvia_anual").map(p => [+p[0], p[1]]));
observar($("#g-lluvia"), () => barras($("#g-lluvia"), {puntos: ANIOS_T.map(y => [String(y), LLUVIA.get(y) ?? null]), fmtX: s => s, fmtY: v => nf(v, 1) + " pulgadas (" + nf(v * 25.4) + " mm)", aria: "Lluvia anual"}));
$("#notaClima").innerHTML = `<b>Dos fuentes, dos tiempos.</b> El clima de hoy es una foto del ${fDia(L.clima.probado)} (Servicio Meteorológico, en tiempo real). La historia sale de NOAA, año por año desde ${temps[0][0]}; los años sin dato completo quedan fuera. La diferencia entre periodos es de promedios, no una tendencia ajustada.`;

/* ================= FUENTES ================= */
const EST = {integrado: "En uso", candidato: "Candidata", excluido: "Descartada", caido: "No responde", inexistente: "No existe"};
const cuenta = {}; D.catalogo.forEach(f => cuenta[f.estado] = (cuenta[f.estado] || 0) + 1);
const ordenEst = ["integrado", "candidato", "excluido", "caido", "inexistente"].filter(k => cuenta[k]);
$("#r-fuentes").textContent = `Revisamos ${D.catalogo.length} fuentes sobre Orlando y ${cuenta.integrado} alimentan el tablero. Las demás no tienen licencia clara, no responden, piden llave o quedan como candidatas; lo que trae personas entra solo como conteos.`;
$("#embudo").setAttribute("aria-label", ordenEst.map(k => `${cuenta[k]} ${EST[k].toLowerCase()}`).join(", "));
$("#embudo").innerHTML = ordenEst.map(k => `<div class="e-${k}" style="flex:${cuenta[k]} 1 0" data-e="${k}" title="${EST[k]}: ${cuenta[k]}">${cuenta[k] >= 6 ? cuenta[k] : ""}</div>`).join("");
$("#leyEmbudo").innerHTML = ordenEst.map(k => `<span><i class="e-${k}"></i>${EST[k]}: <b>${cuenta[k]}</b></span>`).join("");
$("#embudo").addEventListener("click", e => { const d = e.target.closest("[data-e]"); if (d) { filtroEst = d.dataset.e; chipsEst(); fichas(); $("#fichas").scrollIntoView({behavior: "smooth", block: "start"}); } });
$("#notaVerif p").innerHTML = verOk ? `<b>Verificación automática:</b> antes de construir esta página, <span class="mono">verificar.py</span> pasó ${ver.pasan} comprobaciones con 0 fallos: fechas, licencias, rangos de cada tema, que no haya correos ni teléfonos, que ninguna celda por barrio esté bajo el umbral y que no aparezca ninguna categoría de la policía que decidimos excluir. Dejó ${ver.avisos} avisos: las fuentes de la ciudad no declaran licencia.` : `<b>Atención:</b> esta página se construyó ${esc(ver)}.`;
const porFicha = {}; D.fuentes_lago.forEach(f => (porFicha[f.ficha_excel] = porFicha[f.ficha_excel] || []).push(f));
$("#usadas").innerHTML = Object.entries(porFicha).sort((a, b) => a[0].localeCompare(b[0], "es", {numeric: true})).map(([fid, fs]) => { const fc = D.catalogo.find(c => c.id === fid) || {};
  const TN = {economia: "economía", codigo: "código urbano", clima_historico: "clima histórico", escucha: "interés en la web", empleo: "avisos de empleo"};
  const temas = fs.map(f => TN[TEMA_DE[f.id]] || TEMA_DE[f.id]).filter((v, i, a) => v && a.indexOf(v) === i).join(", "), lic = [...new Set(fs.map(f => f.licencia))].join(" · ");
  const probado = f => L[TEMA_DE[f.id]] ? L[TEMA_DE[f.id]].probado : "";
  // Una ficha con varias series (FRED) lista cada uso con su propia etiqueta de fuente; una ficha simple, un párrafo y una etiqueta
  const cuerpo = fs.length > 1 ? `<ul>${fs.map(f => `<li>${esc(cap(f.uso.split(" (")[0]))}${chip(f.id, "", probado(f))}</li>`).join("")}</ul>`
    : `<p>${esc(fs[0].uso.split(" (")[0])}</p><div class="chips">${chip(fs[0].id, "", probado(fs[0]))}</div>`;
  return `<article class="card usada${fs.length > 1 ? " varias" : ""}"><span class="id">${esc(fid)} · ${esc(temas)}${fs.length > 1 ? ` · ${fs.length} series` : ""}</span><h3>${esc(fc.nombre || fs[0].nombre)}</h3><p><b style="color:var(--ink)">Licencia:</b> ${esc(lic)}</p>${cuerpo}</article>`; }).join("");
const desc = D.catalogo.filter(f => f.estado === "excluido"), mot = {};
desc.forEach(f => mot[f.licencia || "no declara"] = (mot[f.licencia || "no declara"] || 0) + 1);
$("#txtDescarte").textContent = `Las ${desc.length} fuentes descartadas, según lo que declara cada una sobre su licencia. Casi todas son plataformas privadas que no dejan reutilizar sus datos.`;
barrasSimples($("#motivos"), Object.entries(mot).sort((a, b) => b[1] - a[1]).map(([k, n]) => [cap(k), n]));
const per = {}; D.catalogo.forEach(f => per[f.personas || "no declara"] = (per[f.personas || "no declara"] || 0) + 1);
barrasSimples($("#personas"), Object.entries(per).sort((a, b) => b[1] - a[1]).map(([k, n]) => [cap(k), n]));
let filtroEst = "todas", textoFicha = "", verTodas = false;
function chipsEst() { $("#chipsEstado").innerHTML = [["todas", "Todas", D.catalogo.length], ...ordenEst.map(k => [k, EST[k], cuenta[k]])].map(([k, t, n]) => `<button type="button" class="chip" data-e="${k}" aria-pressed="${filtroEst === k}">${t} · ${n}</button>`).join(""); }
function fichas() {
  const t = textoFicha.toLowerCase(), lista = D.catalogo.filter(f => (filtroEst === "todas" || f.estado === filtroEst) && (!t || `${f.id} ${f.nombre} ${f.entidad}`.toLowerCase().includes(t)));
  const LIM = 12, cortar = !verTodas && lista.length > LIM + 3;
  $("#cuentaFichas").textContent = `${lista.length} ${lista.length === 1 ? "ficha" : "fichas"}${cortar ? `, se ven las primeras ${LIM}` : ""}. Toca una para ver su licencia, cuándo la probamos y la nota del equipo.`;
  $("#fichas").innerHTML = (cortar ? lista.slice(0, LIM) : lista).map(f => `<details class="ficha"><summary><span class="fid">${esc(f.id)}</span><span class="fnom">${esc(f.nombre)}</span><span class="pill e-${f.estado}">${EST[f.estado] || esc(f.estado)}</span><span class="fent">${esc(f.entidad)}</span></summary>
    <div class="cuerpo"><dl><div><dt>Licencia</dt><dd>${esc(f.licencia || "no declara")}</dd></div><div><dt>Formato · acceso</dt><dd>${esc(f.formato)} · ${esc(f.como_se_obtiene)}</dd></div><div><dt>¿Datos de personas?</dt><dd>${esc(f.personas)}</dd></div><div><dt>Cobertura</dt><dd>${esc(f.cobertura)}</dd></div><div><dt>Periodo · frecuencia</dt><dd>${esc(f.vigencia)} · ${esc(f.frecuencia)}</dd></div><div><dt>Probada el</dt><dd>${esc(f.probado || "—")}</dd></div></dl>
    ${f.url ? `<p class="mono" style="overflow-wrap:anywhere"><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.url)}</a></p>` : ""}${f.nota ? `<p class="obs">${esc(f.nota)}</p>` : ""}</div></details>`).join("")
    + (cortar ? `<button type="button" class="btn" id="verTodas" style="justify-self:start">Mostrar las ${lista.length - LIM} restantes</button>` : "");
}
$("#chipsEstado").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; filtroEst = b.dataset.e; verTodas = false; chipsEst(); fichas(); });
$("#fichas").addEventListener("click", e => { if (e.target.closest("#verTodas")) { verTodas = true; fichas(); } });
$("#buscarFicha").addEventListener("input", e => { textoFicha = e.target.value; fichas(); });
chipsEst(); fichas();
$("#bitacora").innerHTML = D.bitacora.map(b => `<details><summary><span class="mono" style="color:var(--muted)">${esc(b.n)}</span><span>${esc(b.encargo)}</span><span class="r-${esc(b.resultado)}" style="font-size:.85rem">${esc(b.resultado || "—")}</span></summary>
  <div class="det"><p><b style="color:var(--ink)">Qué respondió:</b> ${esc(b.respuesta)}</p><p><b style="color:var(--ink)">Cómo lo comprobamos:</b> ${esc(b.comprobacion)}</p><p><b style="color:var(--ink)">Qué aprendimos:</b> ${esc(b.aprendizaje)}</p>${b.fuentes ? `<p class="mono">Fichas: ${esc(b.fuentes)}</p>` : ""}</div></details>`).join("");
$("#tablaDic tbody").innerHTML = D.diccionario.map(r => `<tr><td class="mono">${esc(r.fuente)}</td><td class="mono" style="overflow-wrap:anywhere">${esc(r.campo)}</td><td>${esc(r.significado)}</td><td>${esc(r.clasificacion)}</td></tr>`).join("");
$("#sumDic").textContent = `Ver los ${D.diccionario.length} campos`;

/* ================= MODO PRESENTACIÓN ================= */
const LAMINAS = [
  () => ({html: `<div class="contenido dos"><div style="display:grid;gap:18px"><p class="eyebrow">Orlando, Florida · Taller de datos · EAFIT</p><p class="q">Cerebro Orlando</p><p class="lead">Un sistema de información para el equipo de planeación de la ciudad: seis preguntas respondidas con datos abiertos, cada cifra con su fuente, su vigencia y su fecha de prueba.</p><p class="peq">Juan Esteban Alzate · Nicolás Saldarriaga · Mateo Villada</p></div>
      <ol class="ranking" style="font-size:1.05rem">${["¿Cuánta gente vive aquí?", "¿Cómo va el empleo y cuánto cuesta vivir aquí?", "¿Dónde se construye?", "¿Qué pasa con la seguridad?", "¿Cuánto pesa el turismo?", "¿Cómo está cambiando el clima?"].map((q, k) => `<li><div class="fila"><span class="pos">${k + 1}</span><span class="nom" style="white-space:normal">${q}</span><span></span></div></li>`).join("")}</ol></div>`}),
  () => ({html: `<div class="contenido dos"><div style="display:grid;gap:14px"><p class="eyebrow">1 · Gente</p><p class="q">¿Cuánta gente vive aquí?</p><p class="grande">${millones(pobC.valor).replace(NB + "millones", "")} <span style="font-size:.35em">millones</span></p><p class="lead">${esc(fraseGente)}</p>${chip("fred_poblacion", "poblacion_condado_ultimo_anio", pobC.vigencia)}</div><div style="display:grid;gap:8px;align-content:center"><p class="peq"><b style="color:var(--ink)">Ingreso mediano de los hogares, frente a condados parecidos</b> (dólares al año)</p><div class="chart" id="pg1"></div></div></div>`,
    despues: () => lineas($("#pg1"), {series: seriesPares("ingreso_mediano", "2005"), alto: 340, fmtX: s => s, fmtY: usd, fmtTick: v => nf(v / 1000) + " mil", etiquetas: true, aria: "Ingreso mediano por condado"})}),
  () => ({html: `<div class="contenido dos"><div style="display:grid;gap:14px"><p class="eyebrow">2 · Economía y vivienda</p><p class="q">¿Cómo va el empleo y cuánto cuesta vivir aquí?</p><p class="grande">${nf(des.valor, 1)} %</p><p class="lead">${esc(fraseDes)} ${esc(fraseViv.split(". ").slice(-1)[0])}</p>${chip("fred_laus", "desempleo_ultimo_mes", des.vigencia)}</div><div style="display:grid;gap:8px;align-content:center"><p class="peq"><b style="color:var(--ink)">Desempleo de Orlando frente a sus pares</b> (%, desde 2016)</p><div class="chart" id="pg2"></div></div></div>`,
    despues: () => lineas($("#pg2"), {series: DES.slice(0, 5).map(([k, n, c, yo]) => ({nombre: n, puntos: S("economia", `desempleo_${k}`).filter(p => p[0] >= "2016"), color: c, resaltar: yo})), alto: 340, fmtX: s => fMes(s, true), fmtY: v => nf(v, 1) + " %", fmtTick: (v, d) => nf(v, d) + NB + "%", cero: true, etiquetas: true, aria: "Desempleo"})}),
  () => ({html: `<div class="contenido dos"><div style="display:grid;gap:14px"><p class="eyebrow">3 · Barrios</p><p class="q">¿Dónde se construye?</p><p class="grande">${nf(tot.valor)}</p><p class="lead">${esc(frasePer)}</p>${chip("orlando_permisos", "permisos_por_barrio_ultimo_anio", tot.vigencia)}</div><div><svg class="svgmapa" id="pg3"></svg><div class="ley-mapa" id="pg3l"></div></div></div>`,
    despues: () => mapaPlano($("#pg3"), {valores: i => B[i].permisos[U_PERM] ?? null, ley: $("#pg3l"), titulo: () => `Permisos emitidos en ${U_PERM}`, globo: i => `<b>${esc(B[i].nombre)}</b><br>${fmtV(B[i].permisos[U_PERM])} permisos`})}),
  () => ({html: `<div class="contenido dos"><div style="display:grid;gap:14px"><p class="eyebrow">4 · Seguridad</p><p class="q">¿Qué pasa con la seguridad?</p><p class="grande">${pct(vDel, 0)}</p><p class="lead">${esc(fraseSeg)} Solo conteos por barrio: sin número de caso, sin punto exacto, sin categorías de salud mental.</p>${chip("opd_casos", "delitos_ultimo_anio", del.vigencia)}</div><div><svg class="svgmapa" id="pg4"></svg><div class="ley-mapa" id="pg4l"></div></div></div>`,
    despues: () => mapaPlano($("#pg4"), {valores: i => porKm2(B[i].delitos[U_DEL], B[i]), ley: $("#pg4l"), fmt: v => nf(v, 0), titulo: () => `Casos por km² en ${U_DEL}`, globo: i => `<b>${esc(B[i].nombre)}</b><br>${fmtV(porKm2(B[i].delitos[U_DEL], B[i]), true)} por km²`})}),
  () => ({html: `<div class="contenido dos"><div style="display:grid;gap:14px"><p class="eyebrow">5 · Turismo</p><p class="q">¿Cuánto pesa el turismo?</p><p class="grande">${nf(ocio.valor, 1)} %</p><p class="lead">${esc(fraseTur)}</p>${chip("fred_ces", "participacion_ocio_ultimo_mes", ocio.vigencia)}</div><div style="display:grid;gap:8px;align-content:center"><p class="peq"><b style="color:var(--ink)">Empleos en ocio y hotelería en el área</b> (miles)</p><div class="chart" id="pg5"></div></div></div>`,
    despues: () => lineas($("#pg5"), {series: [{nombre: "Ocio", puntos: ocioS, color: "var(--accent)"}], alto: 340, fmtX: s => fMes(s, true), fmtY: v => nf(v, 1) + " mil empleos", area: true, cero: true, notas: [{x: pandO[0], texto: "Pandemia", pos: "abajo"}], aria: "Empleo en ocio y hotelería"})}),
  () => ({html: `<div class="contenido"><div style="display:grid;gap:14px"><p class="eyebrow">6 · Clima</p><p class="q">¿Cómo está cambiando el clima?</p><p class="grande">+${nf(difCal.valor, 1)} °F</p><p class="lead">${esc(fraseClima)}</p>${franjasSVG(150)}<p class="vig">Cada franja es un año, de ${temps[0][0]} a ${ult(temps)[0]}. Azul: más frío que el promedio; rojo: más caliente.</p>${chip("noaa_gsoy", "temperatura_anual", ult(temps)[0])}</div></div>`}),
  () => ({html: `<div class="contenido"><div style="display:grid;gap:16px"><p class="eyebrow">Lo que el cerebro no sabe, lo dice</p><p class="q">Preguntas sin respuesta abierta</p><div class="pendientes">${PENDIENTES.map(x => `<div class="pend">${ic("hueco")}<b>${esc(x.t)}</b><p>${esc(x.p)}</p></div>`).join("")}</div></div></div>`}),
  () => ({html: `<div class="contenido dos"><div style="display:grid;gap:14px"><p class="eyebrow">De dónde sale todo</p><p class="q">${D.catalogo.length} fuentes revisadas, ${cuenta.integrado} en uso</p><p class="lead">${verOk ? `${ver.pasan} comprobaciones automáticas antes de publicar, 0 fallos.` : ""} Si una cifra no tiene fuente, vigencia y fecha de prueba, no se publica. Lo que trae personas entra solo como conteos por barrio, con umbral.</p></div><div class="card panel"><div class="embudo">${$("#embudo").innerHTML}</div><div class="ley-embudo">${$("#leyEmbudo").innerHTML}</div><div class="barras-simples">${$("#motivos").innerHTML}</div></div></div>`}),
];
let lam = 0;
function mostrarLamina(k) {
  lam = Math.max(0, Math.min(LAMINAS.length - 1, k));
  const l = LAMINAS[lam](); $("#pres-lamina").innerHTML = l.html; $("#pres-lamina").scrollTop = 0;
  $("#pres-n").textContent = `${lam + 1} de ${LAMINAS.length}`;
  $("#pres-puntos").innerHTML = LAMINAS.map((_, i) => `<button type="button" data-k="${i}" aria-label="Lámina ${i + 1}" aria-current="${i === lam}"></button>`).join("");
  $("#pres-ant").disabled = lam === 0; $("#pres-sig").disabled = lam === LAMINAS.length - 1;
  if (l.despues) requestAnimationFrame(l.despues);
}
function abrirPresentacion() { $("#presentacion").hidden = false; document.body.style.overflow = "hidden"; mostrarLamina(0); $("#pres-sig").focus(); try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch {} }
function cerrarPresentacion() { $("#presentacion").hidden = true; document.body.style.overflow = ""; try { if (document.fullscreenElement) document.exitFullscreen(); } catch {} }
$("#presentarBtn").addEventListener("click", abrirPresentacion); $("#presentarBtn2").addEventListener("click", abrirPresentacion);
$("#pres-cerrar").addEventListener("click", cerrarPresentacion);
$("#pres-ant").addEventListener("click", () => mostrarLamina(lam - 1)); $("#pres-sig").addEventListener("click", () => mostrarLamina(lam + 1));
$("#pres-puntos").addEventListener("click", e => { const b = e.target.closest("button"); if (b) mostrarLamina(+b.dataset.k); });
addEventListener("keydown", e => { if ($("#presentacion").hidden) return; if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); mostrarLamina(lam + 1); } else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); mostrarLamina(lam - 1); } else if (e.key === "Escape") cerrarPresentacion(); });

/* ================= NAVEGACIÓN Y TEMA ================= */
const VISTAS = ["inicio", "gente", "economia", "barrios", "seguridad", "turismo", "clima", "fuentes"];
function mostrar(nombre, desplazar = true) {
  if (!VISTAS.includes(nombre)) nombre = "inicio";
  $$(".vista").forEach(s => s.hidden = s.dataset.vista !== nombre);
  $$("nav.preguntas a").forEach(a => a.dataset.v === nombre ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  const act = $(`nav.preguntas a[data-v="${nombre}"]`); if (act && act.scrollIntoView) act.scrollIntoView({block: "nearest", inline: "center"});
  ocultarGlobo(); if (desplazar) scrollTo({top: 0});
  requestAnimationFrame(() => [atlasInicio, atlasB].forEach(a => a.map && a.map.resize()));
}
addEventListener("hashchange", () => mostrar(location.hash.slice(1)));
mostrar(location.hash.slice(1), false);
const raiz = document.documentElement;
try { const g = localStorage.getItem("cerebro-tema"); if (g) raiz.dataset.theme = g; } catch {}
$("#temaBtn").addEventListener("click", () => {
  const oscuro = raiz.dataset.theme ? raiz.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  raiz.dataset.theme = oscuro ? "light" : "dark";
  try { localStorage.setItem("cerebro-tema", raiz.dataset.theme); } catch {}
  redibujar(); atlasInicio.pintar(); atlasB.pintar();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { redibujar(); atlasInicio.pintar(); atlasB.pintar(); });
new MutationObserver(() => { atlasInicio.pintar(); atlasB.pintar(); }).observe(raiz, {attributes: true, attributeFilter: ["data-theme"]});
// Espacios duros en todo texto que se pinte, ahora o después (tarjetas, globos, láminas): «0 %» no se parte nunca
function arreglarTexto(raiz) {
  if (raiz.nodeType === 3) { const t = nb(raiz.data); if (t !== raiz.data) raiz.data = t; return; }
  if (raiz.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(raiz.nodeName)) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = nb(n.data); if (t !== n.data) n.data = t; }
}
arreglarTexto(document.body);
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(arreglarTexto))).observe(document.body, {childList: true, subtree: true});
window.cerebro = {atlasInicio, atlasB, B, METRICAS};   // para revisar desde la consola del navegador
})();
