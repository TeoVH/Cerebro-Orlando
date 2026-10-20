#!/usr/bin/env python3
"""Utilidades compartidas por los scripts de ingesta. Solo biblioteca estándar de Python.

Variable de entorno opcional: CONTACTO (un correo del grupo). Algunas fuentes, como el servicio
del clima de EE. UU., piden que el cliente se identifique."""
import datetime, json, os, pathlib, sys, time, urllib.error, urllib.request

RAIZ = pathlib.Path(__file__).resolve().parents[1]
LAGO = RAIZ / "lago"
CATALOGO = RAIZ / "catalogo" / "fuentes_lago.json"
CONTACTO = os.environ.get("CONTACTO", "contacto-del-grupo@ejemplo.com")
UA = {"User-Agent": f"taller-sistemas-de-informacion/1.0 (curso universitario; {CONTACTO})"}


def abrir(url, timeout=60):
    """Abre una URL; si el servidor dice 429 o 5xx, espera y reintenta (hasta 3 veces)."""
    for intento in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and intento < 2:
                time.sleep(5 if e.code == 429 else 60)
                continue
            raise


def get_json(url, timeout=60):
    with abrir(url, timeout) as r:
        return json.load(r)


def get_texto(url, timeout=60):
    with abrir(url, timeout) as r:
        return r.read().decode("utf-8")


def hoy():
    """El día de la prueba: AAAA-MM-DD, nunca con hora."""
    return datetime.date.today().isoformat()


def variacion_pct(nuevo, viejo):
    return round((nuevo / viejo - 1) * 100, 1)


def ficha(id_fuente):
    """Lee la ficha de la fuente en catalogo/fuentes_lago.json (de ahí salen entidad y licencia)."""
    for f in json.loads(CATALOGO.read_text(encoding="utf-8")):
        if f["id"] == id_fuente:
            return f
    sys.exit(f"La fuente «{id_fuente}» no está en {CATALOGO}")


def fuente_lago(id_fuente, url):
    """Entrada de 'fuentes' del contrato. La licencia se copia de la ficha, no se escribe en el script."""
    f = ficha(id_fuente)
    if "por verificar" in f["licencia"].lower():
        print(f"AVISO {id_fuente}: licencia pendiente en el catálogo; verificar.py va a fallar hasta que se escriba.", file=sys.stderr)
    return {"id": id_fuente, "nombre": f["nombre"], "url": url, "estado": "vivo", "licencia": f["licencia"]}


def cifra(valor, unidad, vigencia, fuente):
    return {"valor": valor, "unidad": unidad, "vigencia": vigencia, "fuente": fuente}


def escribir_lago(tema, fuentes, cifras, series):
    """Escribe lago/raw/<tema>/<tema>.json con la forma del contrato."""
    carpeta = LAGO / "raw" / tema
    carpeta.mkdir(parents=True, exist_ok=True)
    lago = {"tema": tema, "probado": hoy(), "fuentes": fuentes, "cifras": cifras, "series": series}
    ruta = carpeta / f"{tema}.json"
    ruta.write_text(json.dumps(lago, ensure_ascii=False, indent=1), encoding="utf-8")
    return ruta


# ---------- utilidades para fuentes nuevas (v2) ----------
def fred(ids, desde=None):
    """Baja varias series de FRED en una sola consulta (fredgraph.csv acepta ids separados por coma, sin llave).
    Devuelve (url, {id: [[fecha AAAA-MM-DD, valor], ...]}), sin los valores vacíos ni los puntos «.»."""
    import csv, io
    url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=" + ",".join(ids)
    filas = list(csv.reader(io.StringIO(get_texto(url, timeout=120))))
    cab = filas[0]
    faltan = [i for i in ids if i not in cab]
    if faltan:
        raise SystemExit(f"FRED no devolvió las series {faltan}: ¿cambió el id o la descontinuaron?")
    series = {i: [] for i in ids}
    for f in filas[1:]:
        if desde and f[0] < desde:
            continue
        for j, i in enumerate(cab[1:], start=1):
            if j < len(f) and f[j] not in ("", "."):
                series[i].append([f[0], float(f[j])])
    for i, p in series.items():
        if not p:
            raise SystemExit(f"La serie {i} llegó vacía.")
    return url, series


def mes(fecha):
    """2026-08-01 -> 2026-08"""
    return fecha[:7]


def anio(fecha):
    return fecha[:4]


def suprimir(conteos, umbral):
    """Separa {barrio: n} en (mostrados, cuántos se suprimieron). Nunca se dice cuáles se suprimieron."""
    mostrados = {b: n for b, n in conteos.items() if b and n >= umbral}
    return mostrados, sum(1 for b, n in conteos.items() if b and n < umbral)
