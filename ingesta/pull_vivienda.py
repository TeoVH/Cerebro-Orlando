#!/usr/bin/env python3
"""Ingesta · precio de la vivienda en Orlando: largo plazo, mercado de hoy y ciudades pares (F14, FRED).

Lee:     fredgraph.csv de FRED (sin llave; la API oficial sí pide llave gratuita, el CSV no):
         - ATNHPIUS36740Q: índice de precios de vivienda del área de Orlando (FHFA), trimestral, desde 1978;
         - índices de Tampa, Jacksonville y Miami-Miami Beach-Kendall (FHFA), para comparar;
         - precio mediano de lista, casas en venta y días en el mercado del área (Realtor.com), mensual, desde 2016;
         - viviendas nuevas autorizadas por permisos en el área (Census, BPS), mensual, ajustado por estacionalidad.
Escribe: lago/raw/vivienda/vivienda.json con la forma del contrato.

La licencia de FRED varía por serie: se copió a catalogo/fuentes_lago.json tal como la declara la ficha de cada serie.
Las series de Realtor.com dicen «Copyrighted: Citation Required»: la vista las cita en el mismo bloque donde aparecen."""
import csv, io
from comun import get_texto, fred, fuente_lago, cifra, escribir_lago, variacion_pct, mes

SERIE = "ATNHPIUS36740Q"
URL = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={SERIE}"
UNIDAD = "índice (1995-Q1 = 100, sin ajuste estacional)"
PARES = {"ATNHPIUS45300Q": "tampa", "ATNHPIUS27260Q": "jacksonville", "ATNHPIUS33124Q": "miami"}
REALTOR = {"MEDLISPRI36740": ("precio_mediano_lista", "dólares"), "ACTLISCOU36740": ("casas_en_venta", "viviendas en venta"),
           "MEDDAYONMAR36740": ("dias_en_mercado", "días (mediana)")}

filas = list(csv.reader(io.StringIO(get_texto(URL))))
assert filas[0][1] == SERIE, f"La columna es «{filas[0][1]}», se esperaba {SERIE}"


def trimestre(fecha):          # 1978-04-01 -> 1978-Q2
    return f"{fecha[:4]}-Q{(int(fecha[5:7]) - 1) // 3 + 1}"


puntos = [[trimestre(f[0]), float(f[1])] for f in filas[1:] if len(f) > 1 and f[1] not in ("", ".")]
if len(puntos) < 8:
    raise SystemExit("La serie llegó casi vacía: no se escribe el lago.")
ultimo = puntos[-1]

url_p, p = fred(list(PARES))
url_r, r = fred(list(REALTOR))
url_b, b = fred(["ORLA712BPPRIVSA"], desde="2000-01-01")

series = {"indice_trimestral": {"unidad": UNIDAD, "fuente": "fred_ihv_orlando", "puntos": puntos}}
for sid, ciudad in PARES.items():
    series[f"indice_trimestral_{ciudad}"] = {"unidad": UNIDAD.replace("1995-Q1", "1995-Q1 de cada área"), "fuente": "fred_ihv_pares",
                                             "puntos": [[trimestre(f), v] for f, v in p[sid]]}
for sid, (nombre, unidad) in REALTOR.items():
    series[nombre] = {"unidad": unidad, "fuente": "fred_realtor", "puntos": [[mes(f), v] for f, v in r[sid]]}
series["viviendas_autorizadas"] = {"unidad": "viviendas nuevas autorizadas al mes (ajustado por estacionalidad)", "fuente": "fred_bps",
                                   "puntos": [[mes(f), round(v, 1)] for f, v in b["ORLA712BPPRIVSA"]]}

lista = series["precio_mediano_lista"]["puntos"]
inv = series["casas_en_venta"]["puntos"]
aut = series["viviendas_autorizadas"]["puntos"]
ult12 = sum(v for _, v in aut[-12:])
prev12 = sum(v for _, v in aut[-24:-12])
cifras = {"indice_ultimo_trimestre": cifra(ultimo[1], UNIDAD, ultimo[0], "fred_ihv_orlando"),
          "variacion_4_trimestres": cifra(variacion_pct(ultimo[1], puntos[-5][1]), "%", ultimo[0], "fred_ihv_orlando"),
          "precio_mediano_lista_ultimo_mes": cifra(lista[-1][1], "dólares", lista[-1][0], "fred_realtor"),
          "variacion_precio_lista_12_meses": cifra(variacion_pct(lista[-1][1], lista[-13][1]), "%", lista[-1][0], "fred_realtor"),
          "casas_en_venta_ultimo_mes": cifra(inv[-1][1], "viviendas en venta", inv[-1][0], "fred_realtor"),
          "variacion_casas_en_venta_12_meses": cifra(variacion_pct(inv[-1][1], inv[-13][1]), "%", inv[-1][0], "fred_realtor"),
          "dias_en_mercado_ultimo_mes": cifra(series["dias_en_mercado"]["puntos"][-1][1], "días (mediana)", lista[-1][0], "fred_realtor"),
          "viviendas_autorizadas_12_meses": cifra(round(ult12), "viviendas nuevas autorizadas en 12 meses", aut[-1][0], "fred_bps"),
          "variacion_viviendas_autorizadas": cifra(variacion_pct(ult12, prev12), "% frente a los 12 meses anteriores", aut[-1][0], "fred_bps")}
ruta = escribir_lago("vivienda", [fuente_lago("fred_ihv_orlando", URL), fuente_lago("fred_ihv_pares", url_p),
                                  fuente_lago("fred_realtor", url_r), fuente_lago("fred_bps", url_b)], cifras, series)
print(f"FRED {SERIE}: {len(puntos)} trimestres, último {ultimo[0]} con {ultimo[1]}; lista {lista[-1]}; autorizadas 12 m {round(ult12)} -> {ruta.name}")
