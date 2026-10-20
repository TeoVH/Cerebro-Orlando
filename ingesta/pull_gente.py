#!/usr/bin/env python3
"""Ingesta · cuánta gente vive en Orlando y cómo le va: población, ingreso y pobreza (F14, FRED).

Lee:     fredgraph.csv de FRED (sin llave):
         - población residente del condado de Orange (1970 en adelante) y del área metropolitana (2000 en adelante), en miles
           (U.S. Census Bureau, estimaciones de población);
         - ingreso mediano de los hogares y porcentaje de personas en pobreza (U.S. Census Bureau, SAIPE) del condado de
           Orange y de sus pares: Hillsborough (Tampa), Duval (Jacksonville), Miami-Dade, y Florida.
Escribe: lago/raw/gente/gente.json con la forma del contrato.

Escala: la ciudad de Orlando no tiene series de población por año en FRED; el condado de Orange (que la contiene) sí.
Se dice así en cada cifra. La población por barrio exige la API del Census con llave: queda como hueco declarado."""
from comun import fred, fuente_lago, cifra, escribir_lago, variacion_pct, anio

CONDADOS = {"12095": "orange", "12057": "hillsborough", "12031": "duval", "12086": "miami_dade", "12000": "florida"}

url_p, p = fred(["FLORAN0POP", "ORLPOP"])
ids_s = [f"MHIFL{c}A052NCEN" for c in CONDADOS] + [f"PPAAFL{c}A156NCEN" for c in CONDADOS]
url_s, s = fred(ids_s)

series = {
    "poblacion_condado": {"unidad": "miles de personas", "fuente": "fred_poblacion", "puntos": [[anio(f), v] for f, v in p["FLORAN0POP"]]},
    "poblacion_area_metro": {"unidad": "miles de personas", "fuente": "fred_poblacion", "puntos": [[anio(f), v] for f, v in p["ORLPOP"]]},
}
for c, nombre in CONDADOS.items():
    series[f"ingreso_mediano_{nombre}"] = {"unidad": "dólares corrientes por hogar al año", "fuente": "fred_saipe",
                                           "puntos": [[anio(f), v] for f, v in s[f"MHIFL{c}A052NCEN"]]}
    series[f"pobreza_{nombre}"] = {"unidad": "% de las personas", "fuente": "fred_saipe",
                                   "puntos": [[anio(f), v] for f, v in s[f"PPAAFL{c}A156NCEN"]]}

pc, pm = series["poblacion_condado"]["puntos"], series["poblacion_area_metro"]["puntos"]
ing = {n: series[f"ingreso_mediano_{n}"]["puntos"][-1] for n in CONDADOS.values()}
pob = {n: series[f"pobreza_{n}"]["puntos"][-1] for n in CONDADOS.values()}
ult_s = ing["orange"][0]
assert all(v[0] == ult_s for v in list(ing.values()) + list(pob.values())), "Los condados no tienen el mismo último año"
pares = ["orange", "hillsborough", "duval", "miami_dade"]
diez = dict(pc).get(str(int(pc[-1][0]) - 10))

cifras = {
    "poblacion_condado_ultimo_anio": cifra(pc[-1][1], "miles de personas (condado de Orange)", pc[-1][0], "fred_poblacion"),
    "crecimiento_condado_10_anios": cifra(variacion_pct(pc[-1][1], diez), "%", pc[-1][0], "fred_poblacion"),
    "poblacion_area_metro_ultimo_anio": cifra(pm[-1][1], "miles de personas (área metropolitana)", pm[-1][0], "fred_poblacion"),
    "ingreso_mediano_condado": cifra(ing["orange"][1], "dólares por hogar al año", ult_s, "fred_saipe"),
    "ingreso_frente_a_florida": cifra(variacion_pct(ing["orange"][1], ing["florida"][1]), "% frente al de Florida", ult_s, "fred_saipe"),
    "pobreza_condado": cifra(pob["orange"][1], "% de las personas", ult_s, "fred_saipe"),
    "puesto_ingreso_entre_pares": cifra(sorted(pares, key=lambda n: -ing[n][1]).index("orange") + 1,
                                        "puesto entre 4 condados (1 = mayor ingreso)", ult_s, "fred_saipe"),
}
ruta = escribir_lago("gente", [fuente_lago("fred_poblacion", url_p), fuente_lago("fred_saipe", url_s)], cifras, series)
print(f"Condado de Orange {pc[-1][0]}: {pc[-1][1]} mil personas; ingreso mediano {ult_s}: {ing['orange'][1]} -> {ruta.name}")
