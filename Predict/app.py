from flask import Flask, request, jsonify, make_response
import pickle
import re
import logging
from typing import List, Dict
try:
    from flask_cors import CORS
except Exception:
    CORS = None  # CORS optional if not installed

logging.basicConfig(level=logging.INFO,
                    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s')

app = Flask(__name__)
# CORS manual - más confiable que flask-cors
@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

@app.before_request
def _log_request():
    try:
        logging.info(
            f"REQ {request.method} {request.path} from {request.remote_addr}; "
            f"Origin={request.headers.get('Origin')} | ACR-Method={request.headers.get('Access-Control-Request-Method')} | "
            f"ACR-Headers={request.headers.get('Access-Control-Request-Headers')}"
        )
        if request.is_json:
            logging.info(f"Payload: {request.get_json(silent=True)}")
    except Exception:
        pass

@app.route('/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return '', 204
    return jsonify({"status": "ok"})

# Cargar modelos
with open('modelo_tablas.pkl', 'rb') as f:
    modelo_atributos = pickle.load(f)
with open('modelo_tablas_relacion.pkl', 'rb') as f:
    modelo_relacion = pickle.load(f)

@app.route('/predict/atributos', methods=['POST', 'OPTIONS'])
def predict_atributos():
    if request.method == 'OPTIONS':
        return '', 204
    """
    Espera JSON:
    {
        "tabla": "cliente",
        "tablas_existentes": [
            {"nombre": "producto", "atributos": ["id", "nombre", "precio"]}
        ]
    }
    """
    data = request.json or {}
    tabla = data.get("tabla", "")
    existentes = " ".join(
        t["nombre"] + " " + " ".join(t["atributos"])
        for t in data.get("tablas_existentes", [])
    )
    entrada = tabla + " " + existentes
    logging.info(f"Predict A: entrada='{entrada[:200]}'")
    pred = modelo_atributos.predict([entrada])[0]
    # Devuelve como lista de atributos
    atributos = pred.split()
    return jsonify({"atributos": atributos})

@app.route('/predict/relacion', methods=['POST', 'OPTIONS'])
def predict_relacion():
    if request.method == 'OPTIONS':
        return '', 204
    """
    Espera JSON:
    {
        "tablas_existentes": [
            {"nombre": "cliente", "atributos": ["id", "nombre"]},
            {"nombre": "producto", "atributos": ["id", "nombre", "precio"]}
        ]
    }
    """
    data = request.json or {}
    existentes = " ".join(
        t["nombre"] + " " + " ".join(t["atributos"])
        for t in data.get("tablas_existentes", [])
    )
    logging.info(f"Predict B: existentes='{existentes[:200]}'")
    pred = modelo_relacion.predict([existentes])[0]
    partes = pred.split()
    tabla_sugerida = partes[0]
    atributos = partes[1:]
    return jsonify({"tabla_sugerida": tabla_sugerida, "atributos": atributos})

# ---- Sugerir clases (entidades) usando vocabulario de dominios + modelo de atributos ----
def _normalize_name(n: str) -> str:
    return re.sub(r"\s+", "", n.strip().lower())


def _collect_domain_entities() -> Dict[str, List[str]]:
    try:
        from generate_training_examples import DOMAINS  # type: ignore
    except Exception:
        return {}
    mapping: Dict[str, List[str]] = {}
    for d in DOMAINS:
        names = set()
        for lang_key in ("ES", "EN", "es", "en"):
            entities = (d.get("entities", {}) or {}).get(lang_key, {}) or {}
            for k in entities.keys():
                names.add(_normalize_name(k))
        mapping[d.get("key", "misc")] = sorted(list(names))
    return mapping


_DOMAIN_ENTITIES = _collect_domain_entities()


@app.route('/suggest/classes', methods=['POST', 'OPTIONS'])
def suggest_classes():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.json or {}
    title = str(data.get('project_title', '') or '')
    existing = [str(x) for x in (data.get('existing_classes') or [])]
    max_items = int(data.get('max', 6) or 6)

    existing_norm = {_normalize_name(x) for x in existing}

    # score dominios por coincidencias con existentes y con palabras del título
    scores = []
    tnorm = _normalize_name(title)
    for key, ents in _DOMAIN_ENTITIES.items():
        score = 0
        score += sum(1 for e in ents if e in existing_norm)
        score += sum(1 for e in ents if e in tnorm)
        scores.append((score, key))
    scores.sort(reverse=True)
    chosen_key = scores[0][1] if scores else None

    suggestions: List[str] = []
    if chosen_key:
        for e in _DOMAIN_ENTITIES.get(chosen_key, []):
            if e not in existing_norm:
                suggestions.append(e)
            if len(suggestions) >= max_items:
                break

    def pretty(name_norm: str) -> str:
        return name_norm[:1].upper() + name_norm[1:]

    out = []
    for s in suggestions:
        tabla_name = pretty(s)
        try:
            # usa el modelo entrenado para proponer atributos
            existentes_payload = [{"nombre": n, "atributos": []} for n in existing]
            existentes_str = " ".join(x["nombre"] for x in existentes_payload)
            entrada = tabla_name + " " + existentes_str
            pred = modelo_atributos.predict([entrada])[0]
            attrs = [a for a in str(pred).split() if a]
        except Exception:
            attrs = []
        out.append({"name": tabla_name, "attributes": attrs})

    return jsonify(out)

if __name__ == '__main__':
    try:
        logging.info("Booting ML service...")
        logging.info(f"Running file: {__file__}")
        try:
            logging.info(f"URL Map: {app.url_map}")
        except Exception:
            pass
        app.run(host='0.0.0.0', port=5000)
    except Exception as e:
        logging.exception("Fatal error starting Flask app")