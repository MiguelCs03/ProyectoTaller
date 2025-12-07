import json
import random
import argparse
from datetime import datetime
from pathlib import Path

# Seed for reproducibility across runs (change to None to fully randomize)
random.seed()

ES = "es"
EN = "en"

# Core domain vocab in ES/EN with typical attributes
DOMAINS = [
    {
        "key": "ecommerce",
        "entities": {
            ES: {
                "cliente": ["id", "nombre", "email", "telefono", "direccion", "fecha_registro"],
                "producto": ["id", "nombre", "descripcion", "precio", "stock", "categoria_id", "proveedor_id"],
                "categoria": ["id", "nombre", "descripcion"],
                "proveedor": ["id", "nombre", "telefono", "email"],
                "orden": ["id", "fecha", "cliente_id", "total", "estado"],
                "pago": ["id", "orden_id", "monto", "fecha", "metodo", "estado"],
                "carrito": ["id", "cliente_id", "fecha_creacion", "estado", "total"],
                "carrito_item": ["id", "carrito_id", "producto_id", "cantidad", "precio"],
            },
            EN: {
                "customer": ["id", "name", "email", "phone", "address", "register_date"],
                "product": ["id", "name", "description", "price", "stock", "category_id", "supplier_id"],
                "category": ["id", "name", "description"],
                "supplier": ["id", "name", "phone", "email"],
                "order": ["id", "date", "customer_id", "total", "status"],
                "payment": ["id", "order_id", "amount", "date", "method", "status"],
                "cart": ["id", "customer_id", "created_at", "status", "total"],
                "cart_item": ["id", "cart_id", "product_id", "quantity", "price"],
            },
        },
        "relations": {
            ES: [
                ("comentario", ["id", "texto", "fecha", "usuario_id", "proyecto_id"], ["usuario", "proyecto"]),
                ("venta", ["id", "fecha", "cliente_id", "total"], ["cliente", "producto"]),
                ("movimiento_inventario", ["id", "producto_id", "cantidad", "tipo", "fecha", "inventario_id"], ["producto", "inventario"]),
                ("pedido_item", ["id", "orden_id", "producto_id", "cantidad", "precio"], ["orden", "producto"]),
            ],
            EN: [
                ("comment", ["id", "text", "date", "user_id", "project_id"], ["user", "project"]),
                ("sale", ["id", "date", "customer_id", "total"], ["customer", "product"]),
                ("inventory_movement", ["id", "product_id", "quantity", "type", "date", "inventory_id"], ["product", "inventory"]),
                ("order_item", ["id", "order_id", "product_id", "quantity", "price"], ["order", "product"]),
            ],
        },
        "support": {
            ES: {
                "inventario": ["id", "producto_id", "cantidad", "ubicacion", "fecha_ingreso", "proveedor_id"]
            },
            EN: {
                "inventory": ["id", "product_id", "quantity", "location", "entry_date", "supplier_id"]
            },
        },
    },
    {
        "key": "health",
        "entities": {
            ES: {
                "paciente": ["id", "nombre", "fecha_nacimiento", "telefono", "direccion", "email", "historial_medico"],
                "doctor": ["id", "nombre", "especialidad", "telefono", "email"],
                "cita": ["id", "fecha", "doctor_id", "paciente_id", "motivo"],
                "prescripcion": ["id", "paciente_id", "medico_id", "medicamento", "dosis", "frecuencia", "inicio", "fin"],
                "resultado_laboratorio": ["id", "paciente_id", "prueba", "valor", "unidad", "fecha"],
            },
            EN: {
                "patient": ["id", "name", "birth_date", "phone", "address", "email", "medical_history"],
                "doctor": ["id", "name", "specialty", "phone", "email"],
                "appointment": ["id", "date", "doctor_id", "patient_id", "reason"],
                "prescription": ["id", "patient_id", "doctor_id", "medication", "dose", "frequency", "start_date", "end_date"],
                "lab_result": ["id", "patient_id", "test", "value", "unit", "date"],
            },
        },
        "relations": {
            ES: [
                ("derivacion", ["id", "paciente_id", "doctor_origen_id", "doctor_destino_id", "motivo", "fecha"], ["paciente", "doctor"]),
            ],
            EN: [
                ("referral", ["id", "patient_id", "from_doctor_id", "to_doctor_id", "reason", "date"], ["patient", "doctor"]),
            ],
        },
        "support": {ES: {}, EN: {}},
    },
    {
        "key": "education",
        "entities": {
            ES: {
                "alumno": ["id", "nombre", "email", "fecha_nacimiento", "curso_id"],
                "curso": ["id", "nombre", "descripcion", "creditos"],
                "profesor": ["id", "nombre", "email", "departamento_id"],
                "departamento": ["id", "nombre"],
                "calificacion": ["id", "alumno_id", "curso_id", "nota", "fecha"],
            },
            EN: {
                "student": ["id", "name", "email", "birth_date", "course_id"],
                "course": ["id", "name", "description", "credits"],
                "teacher": ["id", "name", "email", "department_id"],
                "department": ["id", "name"],
                "grade": ["id", "student_id", "course_id", "score", "date"],
            },
        },
        "relations": {
            ES: [
                ("matricula", ["id", "alumno_id", "curso_id", "fecha"], ["alumno", "curso"]),
            ],
            EN: [
                ("enrollment", ["id", "student_id", "course_id", "date"], ["student", "course"]),
            ],
        },
        "support": {ES: {}, EN: {}},
    },
    {
        "key": "finance",
        "entities": {
            ES: {
                "cuenta_bancaria": ["id", "numero_cuenta", "saldo", "fecha_apertura", "cliente_id"],
                "transaccion": ["id", "fecha", "monto", "tipo", "cuenta_id", "cliente_id"],
                "estado_cuenta": ["id", "cuenta_id", "periodo", "saldo_inicial", "saldo_final"],
            },
            EN: {
                "bank_account": ["id", "account_number", "balance", "open_date", "customer_id"],
                "transaction": ["id", "date", "amount", "type", "account_id", "customer_id"],
                "account_statement": ["id", "account_id", "period", "opening_balance", "closing_balance"],
            },
        },
        "relations": {ES: [], EN: []},
        "support": {ES: {}, EN: {}},
    },
    {
        "key": "logistics",
        "entities": {
            ES: {
                "envio": ["id", "fecha_envio", "direccion_destino", "cliente_id", "estado"],
                "bulto": ["id", "envio_id", "peso", "dimensiones", "codigo_tracking"],
                "sucursal": ["id", "nombre", "direccion", "ciudad_id", "telefono", "gerente_id"],
                "inventario": ["id", "producto_id", "cantidad", "ubicacion", "fecha_ingreso", "proveedor_id"],
            },
            EN: {
                "shipment": ["id", "ship_date", "destination_address", "customer_id", "status"],
                "tracking_package": ["id", "shipment_id", "weight", "dimensions", "tracking_code"],
                "branch": ["id", "name", "address", "city_id", "phone", "manager_id"],
                "inventory": ["id", "product_id", "quantity", "location", "entry_date", "supplier_id"],
            },
        },
        "relations": {
            ES: [("ruta", ["id", "sucursal_origen_id", "sucursal_destino_id", "distancia"], ["sucursal", "sucursal"])],
            EN: [("route", ["id", "branch_from_id", "branch_to_id", "distance"], ["branch", "branch"])],
        },
        "support": {ES: {}, EN: {}},
    },
    {
        "key": "crm",
        "entities": {
            ES: {
                "usuario": ["id", "nombre", "email", "fecha_registro"],
                "proyecto": ["id", "nombre", "fecha"],
                "lead": ["id", "nombre", "email", "telefono", "source", "created_at"],
                "oportunidad": ["id", "account_id", "monto", "probabilidad", "etapa", "fecha_cierre"],
                "cuenta": ["id", "nombre", "telefono", "email"],
            },
            EN: {
                "user": ["id", "name", "email", "register_date"],
                "project": ["id", "name", "date"],
                "lead": ["id", "name", "email", "phone", "source", "created_at"],
                "opportunity": ["id", "account_id", "amount", "probability", "stage", "close_date"],
                "account": ["id", "name", "phone", "email"],
            },
        },
        "relations": {
            ES: [("comentario", ["id", "texto", "fecha", "usuario_id", "proyecto_id"], ["usuario", "proyecto"])],
            EN: [("comment", ["id", "text", "date", "user_id", "project_id"], ["user", "project"])],
        },
        "support": {ES: {}, EN: {}},
    },
]

# Some generic attributes to optionally enrich outputs
GENERIC_ENRICH_ES = [
    "created_at", "updated_at", "activo", "nota", "observaciones"
]
GENERIC_ENRICH_EN = [
    "created_at", "updated_at", "active", "note", "remarks"
]

# Helper names for supporting tables that often appear in inputs
SUPPORT_TABLES = {
    ES: {
        "ciudad": ["id", "nombre"],
        "empleado": ["id", "nombre", "puesto_id"],
        "puesto": ["id", "nombre"],
        "categoria": ["id", "nombre"],
        "proveedor": ["id", "nombre", "telefono"],
        "producto": ["id", "nombre", "precio"],
        "usuario": ["id", "nombre", "email"],
        "cliente": ["id", "nombre", "email"],
    },
    EN: {
        "city": ["id", "name"],
        "employee": ["id", "name", "position_id"],
        "position": ["id", "name"],
        "category": ["id", "name"],
        "supplier": ["id", "name", "phone"],
        "product": ["id", "name", "price"],
        "user": ["id", "name", "email"],
        "customer": ["id", "name", "email"],
    },
}


def pick_language() -> str:
    return ES if random.random() < 0.5 else EN


def choose_domain():
    return random.choice(DOMAINS)


def add_optional_enrichment(attrs, lang):
    enrich = GENERIC_ENRICH_ES if lang == ES else GENERIC_ENRICH_EN
    # 0-2 extra generic attributes
    extras = random.sample(enrich, k=random.randint(0, min(2, len(enrich))))
    # Keep order stable: append
    return attrs + extras


def build_existing_tables(domain, lang, primary_table_name=None):
    tables = []
    # Prefer pulling 1-3 related tables from domain entities/support
    domain_tables = list(domain["entities"][lang].items())
    support_tables = list(domain.get("support", {}).get(lang, {}).items())

    # Always consider global SUPPORT_TABLES as well
    global_support = list(SUPPORT_TABLES[lang].items())

    # Candidate pools (avoid primary table duplication)
    def filtered(pool):
        return [item for item in pool if item[0] != primary_table_name]

    pool = filtered(domain_tables) + filtered(support_tables) + filtered(global_support)

    random.shuffle(pool)
    n = random.randint(1, min(3, len(pool)))
    selected = pool[:n]

    for name, attrs in selected:
        tables.append({"nombre": name, "atributos": attrs[:]})
    return tables


def generate_type_A(domain, lang):
    # Entity definition based on a chosen entity from domain
    entity_name, attrs = random.choice(list(domain["entities"][lang].items()))
    output_attrs = add_optional_enrichment(attrs[:], lang)
    existing = build_existing_tables(domain, lang, primary_table_name=entity_name)
    return {
        "input": {"tabla": entity_name, "tablas_existentes": existing},
        "output": output_attrs,
    }


def generate_type_B(domain, lang):
    # Relation suggestion: pick from domain relations when possible, otherwise synthesize using two random entities
    relations = domain.get("relations", {}).get(lang, [])
    if relations:
        name, attrs, related = random.choice(relations)
        output = {"tabla_sugerida": name, "atributos": add_optional_enrichment(attrs[:], lang)}
        # Build existing tables from related names plus one extra random
        existing = []
        for rname in related:
            # resolve attributes for this related name
            attrs_map = domain["entities"][lang]
            if rname in attrs_map:
                existing.append({"nombre": rname, "atributos": attrs_map[rname][:]})
            else:
                # try support tables
                sup_map = domain.get("support", {}).get(lang, {})
                global_sup = SUPPORT_TABLES[lang]
                if rname in sup_map:
                    existing.append({"nombre": rname, "atributos": sup_map[rname][:]})
                elif rname in global_sup:
                    existing.append({"nombre": rname, "atributos": global_sup[rname][:]})
        # maybe add one more random table
        maybe_extra = build_existing_tables(domain, lang)
        for t in maybe_extra:
            if all(t["nombre"] != e["nombre"] for e in existing):
                existing.append(t)
                break
        return {"input": {"tablas_existentes": existing}, "output": output}

    # Fallback: synthesize relation between two random entities
    entities = list(domain["entities"][lang].items())
    if len(entities) < 2:
        return generate_type_A(domain, lang)
    (a_name, _), (b_name, _) = random.sample(entities, 2)
    if lang == ES:
        sugg_name = f"{a_name}_{b_name}_rel"
        attrs = ["id", f"{a_name}_id", f"{b_name}_id", "fecha"]
    else:
        sugg_name = f"{a_name}_{b_name}_rel"
        attrs = ["id", f"{a_name}_id", f"{b_name}_id", "date"]
    existing = [
        {"nombre": a_name, "atributos": domain["entities"][lang][a_name][:]},
        {"nombre": b_name, "atributos": domain["entities"][lang][b_name][:]},
    ]
    return {
        "input": {"tablas_existentes": existing},
        "output": {"tabla_sugerida": sugg_name, "atributos": add_optional_enrichment(attrs, lang)},
    }


def generate_example():
    domain = choose_domain()
    lang = pick_language()
    kind = "A" if random.random() < 0.6 else "B"  # slightly favor direct entity definitions
    if kind == "A":
        return generate_type_A(domain, lang)
    return generate_type_B(domain, lang)


def load_json(path: Path):
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Generate and append training examples to tables_train.json")
    parser.add_argument("--file", default="tables_train.json", help="Path to the JSON file")
    parser.add_argument("--count", type=int, default=500, help="How many examples to generate")
    parser.add_argument("--dedupe", action="store_true", help="Try to avoid duplicates by simple hashing")
    args = parser.parse_args()

    path = Path(args.file)
    data = load_json(path)

    # Simple deduplication via a set of stringified fingerprints
    seen = set()
    if args.dedupe:
        for item in data:
            seen.add(json.dumps(item, sort_keys=True, ensure_ascii=False))

    added = 0
    tries = 0
    max_tries = args.count * 10

    while added < args.count and tries < max_tries:
        ex = generate_example()
        tries += 1
        if args.dedupe:
            fp = json.dumps(ex, sort_keys=True, ensure_ascii=False)
            if fp in seen:
                continue
            seen.add(fp)
        data.append(ex)
        added += 1

    save_json(path, data)

    print(f"Added {added} examples. Total now: {len(data)}. File: {path}")


if __name__ == "__main__":
    main()
