// Puerta de entrada de Cerebro Orlando en Vercel: pide una contraseña antes de servir la página y la copia del lago.
// Corre en el servidor de Vercel (Routing Middleware), antes de la caché: sin la cookie de pase no sale ningún archivo.
// En el repositorio no está la contraseña, solo SHA-256 de su derivación PBKDF2 (210.000 vueltas).
// La cookie guarda esa derivación; para fabricarla hace falta saber la contraseña.
// Lo que sigue abierto, a propósito: el lago en S3/CloudFront y este repositorio (son datos abiertos).
// Para cambiar la contraseña: recalcular PASE_SHA con el mismo SAL y las mismas VUELTAS.

export const config = { matcher: ["/", "/:path*"] };

const SAL = "cerebro-orlando/puerta/v1";
const VUELTAS = 210000;
const PASE_SHA = "290ee0fd5685571f3ac7398a0787ed78357db998ea19b8882d87b0a9c8072dba";
const COOKIE = "co_pase";
const DIAS = 30;

const enc = new TextEncoder();
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (texto) => hex(await crypto.subtle.digest("SHA-256", enc.encode(texto)));

async function derivar(clave) {
  const llave = await crypto.subtle.importKey("raw", enc.encode(clave), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(SAL), iterations: VUELTAS }, llave, 256));
}

function leerCookie(request, nombre) {
  for (const parte of (request.headers.get("cookie") || "").split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return v.join("=");
  }
  return "";
}

// equivale a next() de @vercel/functions: deja pasar la petición a los archivos de la página
const seguir = () => new Response(null, { headers: { "x-middleware-next": "1" } });

const CABECERAS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

function destinoSeguro(valor) {
  const s = String(valor || "/");
  return s.startsWith("/") && !s.startsWith("//") && !s.includes("\\") ? s : "/";
}

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === "/salir") {
    return new Response(null, { status: 303, headers: { location: "/", "cache-control": "no-store",
      "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (url.pathname === "/entrar" && request.method === "POST") {
    let clave = "", siguiente = "/";
    try {
      const datos = await request.formData();
      clave = String(datos.get("clave") || ""); siguiente = destinoSeguro(datos.get("siguiente"));
    } catch { /* formulario ilegible: se trata como contraseña vacía */ }
    const pase = clave ? await derivar(clave) : "";
    if (pase && (await sha(pase)) === PASE_SHA) {
      return new Response(null, { status: 303, headers: { location: siguiente, "cache-control": "no-store",
        "set-cookie": `${COOKIE}=${pase}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Lax` } });
    }
    await new Promise((r) => setTimeout(r, 700));   // frena a quien pruebe contraseñas a ciegas
    return new Response(pagina({ error: true, siguiente }), { status: 401, headers: CABECERAS });
  }

  const pase = leerCookie(request, COOKIE);
  if (/^[0-9a-f]{64}$/.test(pase) && (await sha(pase)) === PASE_SHA) return seguir();

  return new Response(pagina({ error: false, siguiente: url.pathname + url.search }), { status: 401, headers: CABECERAS });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function pagina({ error, siguiente }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Cerebro Orlando · Entrar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Overpass:wght@800;900&display=swap">
<script>try { const t = localStorage.getItem("cerebro-tema"); if (t) document.documentElement.dataset.theme = t; } catch {}</script>
<style>
:root { --bg: #f2f6f5; --surface: #ffffff; --ink: #0f272c; --ink-2: #43585c; --muted: #5a6e71; --line: #d3dfdd;
  --accent: #0b6e7f; --accent-ink: #ffffff; --sun: #d48a00; --bad: #c23434; --bad-soft: #fbeaea;
  --font-display: "Overpass", "Segoe UI", system-ui, sans-serif; --font-body: "Atkinson Hyperlegible", "Segoe UI", system-ui, -apple-system, sans-serif;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1); --mov: 6px; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #0b1618; --surface: #112125; --ink: #e3eeec; --ink-2: #a6babc; --muted: #7d9396;
  --line: #243a3f; --accent: #46b6c7; --accent-ink: #052328; --sun: #f2b53f; --bad: #ef7070; --bad-soft: #2a1618; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #0b1618; --surface: #112125; --ink: #e3eeec; --ink-2: #a6babc; --muted: #7d9396;
  --line: #243a3f; --accent: #46b6c7; --accent-ink: #052328; --sun: #f2b53f; --bad: #ef7070; --bad-soft: #2a1618; color-scheme: dark; }
@media (prefers-reduced-motion: reduce) { :root { --mov: 0px; } }
* { box-sizing: border-box; }
html, body { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 400 1.0625rem/1.55 var(--font-body); -webkit-font-smoothing: antialiased;
  display: grid; place-items: center; padding: max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)); }
main { width: min(400px, 100%); display: grid; gap: 28px; animation: entra 260ms var(--ease-out) both; }
@keyframes entra { from { opacity: 0; transform: translateY(var(--mov)); } }
.marca { display: flex; align-items: center; gap: 14px; }
.marca svg { width: 52px; height: 52px; flex: none; }
h1 { margin: 0; font: 900 2.25rem/1 var(--font-display); letter-spacing: -0.02em; }
.lema { margin: 6px 0 0; color: var(--muted); font-size: .9375rem; line-height: 1.35; }
form { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 24px; display: grid; gap: 14px; }
label { font: 800 1rem/1.2 var(--font-display); }
input[type=password] { width: 100%; font: inherit; color: inherit; background: var(--bg); border: 1px solid var(--line); border-radius: 8px;
  padding: 12px 14px; min-height: 48px; caret-color: var(--accent); transition: border-color 120ms var(--ease-out); }
input[type=password]:hover { border-color: var(--muted); }
input[aria-invalid=true] { border-color: var(--bad); }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
button { font: 800 1rem/1 var(--font-display); color: var(--accent-ink); background: var(--accent); border: 0; border-radius: 8px; min-height: 48px;
  cursor: pointer; transition: transform 120ms var(--ease-out), filter 120ms var(--ease-out); }
button:hover { filter: brightness(1.08); }
button:active { transform: scale(.97); }
@media (prefers-reduced-motion: reduce) { button:active { transform: none; } }
.error { margin: 0; color: var(--bad); background: var(--bad-soft); border-radius: 8px; padding: 10px 12px; font-size: .9375rem; }
.nota { margin: 0; color: var(--muted); font-size: .875rem; text-align: center; }
</style>
</head>
<body>
<main>
  <div class="marca">
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--accent)"/>
      <path d="M8 25c3.5-2.6 6.5-2.6 10 0s6.5 2.6 10 0 4.2-2.2 4.2-2.2" fill="none" stroke="var(--accent-ink)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M11 30.5c2.6-1.8 5-1.8 7.6 0s5 1.8 7.6 0" fill="none" stroke="var(--accent-ink)" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
      <path d="M20 21V10M20 10c-2.5 1.2-3.6 3.6-3.4 6.4M20 10c2.5 1.2 3.6 3.6 3.4 6.4" fill="none" stroke="var(--sun)" stroke-width="2.4" stroke-linecap="round"/>
    </svg>
    <div>
      <h1>Cerebro Orlando</h1>
      <p class="lema">Datos abiertos de la ciudad para decidir, con la fuente de cada cifra</p>
    </div>
  </div>
  <form method="post" action="/entrar">
    <label for="clave">Contraseña</label>
    <input id="clave" name="clave" type="password" autocomplete="current-password" required autofocus${error ? ' aria-invalid="true" aria-describedby="error"' : ""}>
    ${error ? '<p class="error" id="error" role="alert">Esa no es la contraseña. Intenta de nuevo.</p>' : ""}
    <input type="hidden" name="siguiente" id="siguiente" value="${esc(siguiente)}">
    <button type="submit">Entrar</button>
  </form>
  <p class="nota">Tablero del taller de datos · EAFIT</p>
</main>
<script>
document.querySelector("form").addEventListener("submit", () => {
  const s = document.getElementById("siguiente");
  if (location.hash && !s.value.includes("#")) s.value += location.hash;
});
</script>
</body>
</html>`;
}
