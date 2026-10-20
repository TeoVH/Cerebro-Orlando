#!/usr/bin/env python3
"""Ingesta · desempleo y empleo del área de Orlando, contra ciudades pares (F14, FRED).

Lee:     fredgraph.csv de FRED (sin llave), dos consultas:
         - tasa de desempleo (BLS, LAUS, sin ajuste estacional) de Orlando, Tampa, Miami, Jacksonville, Florida y EE. UU.;
         - empleo no agrícola total del área de Orlando (BLS, CES, ajustado por estacionalidad, en miles).
Escribe: lago/raw/economia/economia.json con la forma del contrato.

«Contra qué»: Orlando se compara con las otras tres áreas metropolitanas grandes de Florida y con el estado y el país,
en el mismo mes y con la misma medida (todas sin ajuste estacional). La licencia de cada serie se leyó en su ficha de FRED."""
from comun import fred, fuente_lago, cifra, escribir_lago, variacion_pct, mes

DESEMPLEO = {"ORLA712UR": "orlando", "TAMP312UR": "tampa", "MIAM112UR": "miami", "JACK212UR": "jacksonville",
             "FLURN": "florida", "UNRATENSA": "eeuu"}
METROS = ["orlando", "tampa", "miami", "jacksonville"]

url_d, d = fred(list(DESEMPLEO), desde="2000-01-01")
url_e, e = fred(["ORLA712NA"], desde="1990-01-01")

series = {}
for sid, nombre in DESEMPLEO.items():
    series[f"desempleo_{nombre}"] = {"unidad": "% de la fuerza laboral", "fuente": "fred_laus",
                                     "puntos": [[mes(f), v] for f, v in d[sid]]}
empleo = [[mes(f), v] for f, v in e["ORLA712NA"]]
series["empleo_total"] = {"unidad": "miles de empleos (ajustado por estacionalidad)", "fuente": "fred_ces", "puntos": empleo}

# El último mes que tienen las cuatro áreas: así la comparación es del mismo mes
comunes = set.intersection(*({p[0] for p in series[f"desempleo_{m}"]["puntos"]} for m in METROS))
ultimo = max(comunes)
val = {m: dict(series[f"desempleo_{m}"]["puntos"])[ultimo] for m in METROS}
orden = sorted(METROS, key=lambda m: val[m])                     # puesto 1 = menor desempleo
hace_un_anio = f"{int(ultimo[:4]) - 1}{ultimo[4:]}"
orl = dict(series["desempleo_orlando"]["puntos"])
fl = dict(series["desempleo_florida"]["puntos"])

cifras = {
    "desempleo_ultimo_mes": cifra(orl[ultimo], "% de la fuerza laboral", ultimo, "fred_laus"),
    "desempleo_hace_un_anio": cifra(orl[hace_un_anio], "% de la fuerza laboral", hace_un_anio, "fred_laus"),
    "diferencia_con_florida": cifra(round(orl[ultimo] - fl[ultimo], 1), "puntos porcentuales", ultimo, "fred_laus"),
    "puesto_desempleo_entre_pares": cifra(orden.index("orlando") + 1, "puesto entre 4 áreas (1 = menor desempleo)", ultimo, "fred_laus"),
    "empleo_total_ultimo_mes": cifra(empleo[-1][1], "miles de empleos", empleo[-1][0], "fred_ces"),
    "variacion_empleo_12_meses": cifra(variacion_pct(empleo[-1][1], empleo[-13][1]), "%", empleo[-1][0], "fred_ces"),
}
ruta = escribir_lago("economia", [fuente_lago("fred_laus", url_d), fuente_lago("fred_ces", url_e)], cifras, series)
print(f"Desempleo {ultimo}: Orlando {orl[ultimo]} %, puesto {orden.index('orlando') + 1} de 4; empleo {empleo[-1][1]} mil -> {ruta.name}")
