from datetime import datetime, date, timedelta
from typing import Dict, Tuple, List, Any, Optional
import os, json
import pandas as pd
import pyomo.environ as pyo
from collections import defaultdict


def days_in_range(start_date: date, end_date: date) -> List[date]:
    """
    Returns a list of all days between start_date and end_date (inclusive).
    Raises an error if the range is invalid.
    """
    if start_date > end_date:
        raise ValueError("start_date must be <= end_date")
    days = []
    cur = start_date
    while cur <= end_date:
        days.append(cur)
        cur += timedelta(days=1)
    return days


def build_monthly_costs_from_csv(
    csv_path: str,
    date_col="Date",
    origin_col="Origin_City",
    dest_col="Dest_City",
    price_col="precio",
) -> Dict[Tuple[int, int], Dict[Tuple[str, str], float]]:
    """
    Builds a structure:
        monthly_costs[(year, month)] = { (origin, dest): average_price }

    - Reads and parses a CSV with daily flight data.
    - Normalizes strings.
    - Aggregates average prices per (year, month, origin, dest).
    - Adds symmetry: (o,d) and (d,o) get the same price.
    """
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"CSV not found at '{csv_path}'")

    df = pd.read_csv(csv_path)
    for col in (date_col, origin_col, dest_col, price_col):
        if col not in df.columns:
            raise KeyError(f"Column {col} not found in CSV '{csv_path}'")

    df["_parsed"] = pd.to_datetime(df[date_col], errors="coerce")
    if df["_parsed"].isna().any():
        raise ValueError("Some dates in CSV could not be parsed.")

    df[origin_col] = df[origin_col].astype(str).str.strip()
    df[dest_col] = df[dest_col].astype(str).str.strip()
    df = df.dropna(subset=[price_col])
    df[price_col] = df[price_col].astype(float)
    df["_yr"] = df["_parsed"].dt.year
    df["_mo"] = df["_parsed"].dt.month

    grouped = (
        df.groupby(["_yr", "_mo", origin_col, dest_col])[price_col].mean().reset_index()
    )
    monthly_costs = {}
    for (yr, mo), sub in grouped.groupby(["_yr", "_mo"]):
        key = (int(yr), int(mo))
        mp = {}
        for _, row in sub.iterrows():
            o = str(row[origin_col]).strip()
            d = str(row[dest_col]).strip()
            p = float(row[price_col])
            if o == "" or d == "":
                continue
            mp[(o, d)] = p
            mp[(d, o)] = p  # symetric cost
        monthly_costs[key] = mp
    return monthly_costs


def get_all_cities_from_monthly_costs(monthly_costs):
    """
    Returns a sorted list of all unique cities appearing in monthly_costs.
    """
    cities = set()
    for m in monthly_costs.values():
        for i, j in m.keys():
            cities.add(i)
            cities.add(j)
    return sorted(cities)


def optimizer(
    start_date: date,
    end_date: date,
    budget: float,
    origin: str,
    csv_path: Optional[str] = None,
    city_type_key: Optional[
        str
    ] = None,  # si quieres filtrar por results.json más adelante
    verbose: bool = False,
    solver_name: str = "appsi_highs",
    require_city_in_results: bool = False,
    min_days_per_city: Optional[int] = 1,
) -> Dict[str, Any]:
    """
    Simple optimizer version.

    Main ideas:
        - Uses monthly aggregated costs to respect a travel budget.
        - Maximizes the number of visited cities.
        - Includes flow constraints to ensure a valid tour returning to origin.
        - Includes MTZ constraints (time-based) to eliminate subtours.
        - Includes daily windows for each month so that flights occur in valid time ranges.
    """
    if csv_path is None:
        csv_path = os.path.join(os.getcwd(), "vuelos_kayak_clean_final.csv")
    if not os.path.isfile(csv_path):
        raise FileNotFoundError(f"CSV not found at '{csv_path}'")

    monthly_costs = build_monthly_costs_from_csv(csv_path)

    mref = (start_date.year, start_date.month)
    if mref not in monthly_costs:
        raise KeyError(f"No hay datos de precios para el mes de salida {mref}")

    costs_ref = monthly_costs[mref]  # dict (i,j)->price

    all_cities = get_all_cities_from_monthly_costs(monthly_costs)
    all_cities = [str(c).strip() for c in all_cities if str(c).strip() != ""]
    origin = str(origin).strip()

    if origin not in all_cities:
        raise ValueError(
            f"La ciudad origin '{origin}' no aparece en los datos de vuelos. Ejemplos: {all_cities[:10]}"
        )

    allowed_city_set = set(all_cities)
    if origin in allowed_city_set:
        allowed_city_set.remove(origin)

    possible_results_paths = [
        os.path.join(os.getcwd(), "results.json"),
        os.path.join(os.getcwd(), "data", "results.json"),
        os.path.join(os.path.dirname(__file__), "..", "data", "results.json"),
    ]
    results_json_path = None
    for path in possible_results_paths:
        if os.path.isfile(path):
            results_json_path = path
            break

    results_json = None
    if city_type_key is not None:
        if not results_json_path:
            if require_city_in_results:
                raise FileNotFoundError(
                    "Se solicitó filtro por tipo de ciudad pero no se encontró 'results.json'."
                )
        else:
            with open(results_json_path, "r", encoding="utf-8") as f:
                results_json = json.load(f)
            if city_type_key in results_json:
                requested = set([str(x).strip() for x in results_json[city_type_key]])
                allowed_city_set = requested.intersection(set(all_cities))
                if origin in allowed_city_set:
                    allowed_city_set.remove(origin)
                if len(allowed_city_set) == 0 and require_city_in_results:
                    raise ValueError(
                        f"Filtro '{city_type_key}' no devuelve ciudades presentes en los vuelos."
                    )
            else:
                if require_city_in_results:
                    raise KeyError(
                        f"Clave '{city_type_key}' no encontrada en results.json"
                    )
                # si no requerido, dejamos allowed_city_set = all_cities - {origin}

    allowed_cities = sorted(list(allowed_city_set))

    # build day list and month list
    day_list = days_in_range(start_date, end_date)
    D = len(day_list)
    if D <= 0:
        raise ValueError("Rango de fechas inválido")
    # for each (year,month), store the first and last day indices available in the trip
    month_day_ranges = {}
    for off, dt in enumerate(day_list):
        ym = (dt.year, dt.month)
        if ym not in month_day_ranges:
            month_day_ranges[ym] = [off, off]
        else:
            month_day_ranges[ym][1] = off
    months_in_trip = sorted(list(month_day_ranges.keys()))

    # validate that all needed months exist in monthly_costs
    for m in months_in_trip:
        if m not in monthly_costs:
            raise KeyError(f"Missing prices for month {m} in CSV '{csv_path}'")

    # construir nodes = origin + allowed_cities (normalizados)
    nodes = sorted(set([origin] + [str(c).strip() for c in allowed_cities]))

    # build node and arc sets
    arc_set = set()
    for m in months_in_trip:
        mp = monthly_costs.get(m, {})
        for key in mp.keys():
            try:
                i_raw, j_raw = key
            except Exception:
                # fallback if CSV formatting is odd
                s = str(key)
                parts = [p.strip() for p in s.split(",")]
                if len(parts) >= 2:
                    i_raw, j_raw = parts[0], parts[1]
                else:
                    continue
            i = str(i_raw).strip()
            j = str(j_raw).strip()
            if i == "" or j == "":
                continue
            if i in nodes and j in nodes and i != j:
                arc_set.add((i, j))

    # ensure symmetry of arcs
    for i, j in list(arc_set):
        arc_set.add((j, i))

    arcs = sorted(list(arc_set))
    if len(arcs) == 0:
        raise ValueError(
            "No se encontraron arcos válidos dentro de los meses del viaje y nodes seleccionados."
        )

    prepared = {
        "month_ref": mref,
        "nodes": nodes,
        "arcs": arcs,
        "costs_ref": costs_ref,
        "start_date": start_date,
        "end_date": end_date,
        "budget": budget,
        "origin": origin,
    }

    # MODEL DEFINITION (Pyomo)

    model = pyo.ConcreteModel()

    # sets
    model.C = pyo.Set(initialize=nodes)
    model.A = pyo.Set(initialize=arcs)
    model.M = pyo.Set(initialize=months_in_trip)

    # x[i,j] = 1 if flight i->j is taken
    model.x = pyo.Var(model.A, within=pyo.Binary)

    # y[i] = 1 if city i is visited
    model.y = pyo.Var(model.C, within=pyo.Binary)

    # d[i] = number of days spent in city i
    model.d = pyo.Var(model.C, within=pyo.NonNegativeIntegers, bounds=(0, D))

    # t[i] = time/order in which city i is visited (used for MTZ subtour elimination)
    M_big = D + 1
    model.t = pyo.Var(model.C, within=pyo.Integers, bounds=(-M_big, D))

    # z[i,j,m] indicates that arc (i,j) is chosen in month m

    # Build z_index where monthly_costs is defined
    z_index = []
    for m in months_in_trip:
        mp = monthly_costs.get(m, {})
        for i, j in arcs:
            if (i, j) in mp:
                z_index.append((i, j, m))

    if len(z_index) == 0:
        raise ValueError("z_index is empty: no arcs exist in any month of the trip.")

    model.z = pyo.Var(z_index, within=pyo.Binary)

    # objective: maximize number of visited cities

    model.obj = pyo.Objective(expr=sum(model.y[c] for c in model.C), sense=pyo.maximize)

    # FLOW CONSTRAINTS

    model.flow_in = pyo.ConstraintList()
    model.flow_out = pyo.ConstraintList()
    for j in nodes:
        inc = [model.x[i, j] for i in nodes if (i, j) in arcs]
        out = [model.x[j, k] for k in nodes if (j, k) in arcs]

        # if y[j] = 1, exactly one incoming arc must be chosen
        model.flow_in.add(sum(inc) == model.y[j])

        # if y[j] = 1, exactly one outgoing arc must be chosen
        model.flow_out.add(sum(out) == model.y[j])

    # ensure exactly one departure and one return at origin (start and end)
    outs = [model.x[origin, j] for j in nodes if (origin, j) in arcs]
    ins = [model.x[i, origin] for i in nodes if (i, origin) in arcs]

    if len(outs) == 0 or len(ins) == 0:
        raise ValueError(
            "Origin has no incoming/outgoing arcs. Change dates or datasets."
        )

    model.origin_out = pyo.Constraint(expr=sum(outs) == 1)
    model.origin_in = pyo.Constraint(expr=sum(ins) == 1)

    # BUDGET CONSTRAINT

    def budget_rule(m):
        """
        Computes total cost across all selected (i,j,m) and ensures it does not exceed budget.
        Uses monthly aggregated prices.
        """
        total_cost = 0
        for i, j, mm in z_index:
            # monthly_costs[mm][(i,j)] debe existir porque z_index se construye así
            cost_ij_mm = monthly_costs[mm][(i, j)]
            total_cost += m.z[(i, j, mm)] * cost_ij_mm
        return total_cost <= budget

    model.budget_constraint = pyo.Constraint(rule=budget_rule)

    # MINIMUM DAYS + TOTAL DAYS LIMIT

    min_days = prepared.get("min_days_per_city", min_days_per_city)

    model.min_days = pyo.ConstraintList()

    for c in nodes:
        if c == origin:
            # does not apply to origin city
            continue
        model.min_days.add(model.d[c] >= min_days * model.y[c])

    # total days cannot exceed the trip duration
    model.total_days = pyo.Constraint(expr=sum(model.d[c] for c in nodes) <= D)

    # MTZ SUBTOUR ELIMINATION + TIME ACTIVATION CONSTRAINTS

    # These constraints control the "time" variable t[i], which assigns an
    # ordering to visited cities so that subtours (small cycles not including origin)
    # are impossible. MTZ works by enforcing t[j] > t[i] whenever arc (i,j) is used.

    model.t_active = pyo.ConstraintList()

    for i in nodes:
        # (A) If city is visited (y[i]=1): t[i] <= D
        #     If not visited (y[i]=0): t[i] <= 0
        model.t_active.add(model.t[i] <= D * model.y[i])

        # (B) Lower bound activation: t[i] >= 2 * y[i] - 1
        #   y[i] = 0 → t[i] ∈ [-1, 0]
        #   y[i] = 1 → t[i] ∈ [1, D]
        model.t_active.add(
            model.t[i] >= 2 * model.y[i] - 1
        )  # Usamos 1 como tiempo de inicio

    # (C) Force the origin city to have time = 1
    # this anchors the MTZ ordering, without this the system could arbitrarily shift all t[i]'s
    model.t_origin = pyo.Constraint(expr=model.t[origin] == 1)

    # MTZ SEQUENTIAL ORDERING CONSTRAINTS
    model.time_link = pyo.ConstraintList()
    M_mtz = D

    for i, j in arcs:
        # we do NOT apply MTZ to arcs that return to origin.
        if j != origin:
            # if x[i,j]=1, then t[j] >= t[i] + 1
            # if x[i,j]=0, restriction becomes irrelevant because M_mtz is large enough to make the inequality always true
            model.time_link.add(
                model.t[j] >= model.t[i] + 1 - M_mtz * (1 - model.x[(i, j)])
            )
        else:
            # MTZ rule is *not* applied for arcs returning to origin.
            # imposing MTZ structure here would require t[origin] > t[i], which goes against t[origin] = 1.
            pass

    # Z LINKING (month selection)
    model.z_link = pyo.ConstraintList()
    for i, j in arcs:
        months_for_arc = [
            m for m in months_in_trip if (i, j) in monthly_costs.get(m, {})
        ]
        if months_for_arc:
            # exactly one month must be chosen when arc (i,j) is taken
            model.z_link.add(
                sum(model.z[(i, j, m)] for m in months_for_arc) == model.x[i, j]
            )
        else:
            model.z_link.add(model.x[i, j] == 0)

    # TIME WINDOW FOR EACH MONTH (z -> t)
    model.z_time = pyo.ConstraintList()
    for i, j, m in z_index:
        a_offset, b_offset = month_day_ranges[m]  # offsets relativos al start_date
        # si z=1 forzamos t[i] dentro del rango; si z=0 la restricción queda relajada
        model.z_time.add(model.t[i] >= a_offset - M_big * (1 - model.z[(i, j, m)]))
        model.z_time.add(model.t[i] <= b_offset + M_big * (1 - model.z[(i, j, m)]))

    # SOLVE MODEL
    solver = pyo.SolverFactory(solver_name)
    res = solver.solve(model, tee=verbose)

    status = str(res.solver.status)
    term = str(res.solver.termination_condition)

    result = {
        "status": status,
        "termination": term,
        "prepared": prepared,
        "model": model,
    }

    # EXTRACT RESULTS IF FEASIBLE

    if term in ("optimal", "feasible"):
        # recoger variables
        visited = [c for c in nodes if pyo.value(model.y[c]) > 0.5]
        flights = [(i, j) for (i, j) in arcs if pyo.value(model.x[(i, j)]) > 0.5]
        # sort flights by departure city time t[i]
        flights_sorted = sorted(flights, key=lambda pair: pyo.value(model.t[pair[0]]))

        total_cost = 0.0
        cost_by_month = defaultdict(float)
        cost_by_flight = defaultdict(float)

        for i, j, mm in z_index:
            z_val = float(pyo.value(model.z[(i, j, mm)]))
            if z_val <= 0:
                continue
            cost_ij_mm = float(monthly_costs[mm].get((i, j), 0.0))
            line_cost = z_val * cost_ij_mm
            total_cost += line_cost
            cost_by_month[mm] += line_cost
            cost_by_flight[(i, j)] += line_cost

        # sort cost_by_flight by departure time t[i] and round to 2 decimals
        cost_by_flight_sorted = {
            (i, j): round(cost_by_flight[(i, j)], 2)
            for (i, j) in sorted(
                cost_by_flight.keys(), key=lambda pair: pyo.value(model.t[pair[0]])
            )
        }

        # redondeos para presentación
        total_cost = round(total_cost, 2)
        cost_by_month = {mm: round(v, 2) for mm, v in cost_by_month.items()}
        cost_by_flight = {f: round(v, 2) for f, v in cost_by_flight.items()}

        result.update(
            {
                "objective": int(pyo.value(model.obj)),
                "visited_cities": visited,
                "flights": flights_sorted,
                "total_cost": total_cost,
                "total_cost_by_month": cost_by_month,
                "total_cost_by_flight": cost_by_flight_sorted,
            }
        )
    return result
