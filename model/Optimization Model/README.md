# Travel Route Optimizer — Full Documentation

This repository implements a complete **travel-route optimization engine** using **Mixed Integer Linear Programming (MILP)** with **Pyomo**, real aggregated monthly flight prices, realistic constraints, and automatic route ordering.

It computes an optimal multi-city itinerary based on:

- A start and end date
- A global travel budget
- A mandatory origin city (start and return)
- Minimum days per visited city
- Real monthly flight prices from a CSV
- Optional filtering of cities using `results.json`
- Subtour elimination using MTZ constraints

Repository contents:

- **`optimizer.py`** — main optimization engine  
- **`Optimization_Testing.ipynb`** — test notebook with automated examples

---

# Goal of the Project

The project aims to build a fully automatic **multi-city travel planner** that:

- Selects which cities to visit  
- Decides the best sequence to visit them  
- Selects valid flights between the cities  
- Maximizes the number of visited cities  
- Respects travel dates, budget, and minimum stay constraints  
- Guarantees a single continuous route with no subtours  
- Ensures return to the origin city  

The solution is obtained through **integer linear programming (MILP)** with Pyomo.

---

# How the Optimizer Works (`optimizer.py`)

The main function is:

## 1. Input Parameters

```python
out = optimizer.optimizer(start_date, end_date, budget, origin, ...)

| Parameter               | Type    | Description                                                                               |
|-------------------------|---------|-------------------------------------------------------------------------------------------|
| start_date              | date    | First day of the trip                                                                     |
| end_date                | date    | Last day of the trip                                                                      |
| budget                  | float   | Maximum total flight cost                                                                 |
| origin                  | str     | Mandatory departure and return city                                                       |
| csv_path                | str     | Path to CSV with flight data (optional)                                                   |
| city_type_key           | str     | If provided, filter cities using categories defined in results.json                       |
| min_days_per_city       | int     | Minimum stay duration per visited city                                                    |
| verbose                 | bool    | If True, prints solver output                                                             |
| solver_name             | str     | Name of the MILP solver to use (glpk, cbc, gurobi...)                                     |
| require_city_in_results | bool    | If True, raises an error when city_type_key is invalid or missing                         |

## 2. Data Loading & Preprocessing

- The optimizer reads a CSV of historical flight prices.
- It aggregates average prices for each (origin, destination) pair per month:
  
  monthly_costs[(year, month)][(i, j)] = average_price

- City names are normalized and cleaned.
- Both (i, j) and (j, i) are added to enforce symmetry.
- All cities appearing in the dataset are collected.
- If city_type_key is used, only cities listed under that key in results.json are allowed.

## 3. Model Components

Sets:
- C: set of cities
- A: set of arcs (directed flights i → j)
- M: set of months inside the travel window
- z_index: valid triples (i, j, m) where monthly costs exist

Decision Variables:
- x[i,j]     → binary, flight from city i to j is selected
- y[i]       → binary, city i is visited
- d[i]       → integer, number of days spent in city i
- t[i]       → integer, visit/order timestamp (MTZ subtour elimination)
- z[i,j,m]   → binary, arc (i,j) is used in month m

## 4. Objective Function

Maximize:  Σ y[i]
This maximizes the number of visited cities.

## 5. Constraints

1. Flow Constraints:
   - If a city is visited, exactly one incoming and one outgoing flight must exist.
   - sum(incoming arcs) = y[i]
   - sum(outgoing arcs) = y[i]

2. Origin Constraints:
   - Exactly one departure from the origin.
   - Exactly one return to the origin.

3. Budget Constraint:
   - Uses monthly prices via z[i,j,m]:
     Σ z[i,j,m] * monthly_price(i,j,m) ≤ budget

4. Minimum Days per City:
   d[i] ≥ min_days_per_city * y[i]

5. Total Days Constraint:
   Σ d[i] ≤ total number of available days

6. MTZ Subtour Elimination:
   - Creates an ordering t[i] for visited cities.
   - If city not visited → t[i] ∈ [-1, 0]
   - If city visited → t[i] ∈ [1, D]
   - Main MTZ rule:
     t[j] ≥ t[i] + 1 - M * (1 - x[i,j])

7. Month Window Constraints:
   - For each chosen z[i,j,m], t[i] must fall inside month m.

8. Linking z to x:
   Σ z[i,j,m] (over valid months) = x[i,j]

## 6. Output of the Optimizer

- status                  → solver status
- termination             → termination condition
- objective               → number of visited cities
- visited_cities          → list of visited cities
- flights                 → list of selected arcs (i, j)
- total_cost              → sum of selected monthly costs
- total_cost_by_month     → cost breakdown per month
- total_cost_by_flight    → cost breakdown per flight pair

--- 

## 7. Optimization_Testing.ipynb

The notebook includes:
- Ready-to-run test scenarios
- Different budgets and date windows
- Pretty-printed results
- Example outputs:
  - visited cities
  - ordered flights
  - cost breakdowns
- Automatic JSON export of results

## 8. Summary

This project provides a complete, extensible, and realistic travel-route optimization engine.
It can be used for:
- Trip planning
- Travel analytics
- Tourism research
- MILP experimentation
- Route feasibility testing

The model ensures realistic behavior via:
- Monthly pricing windows
- Subtour elimination
- Budget management
- Realistic travel durations

You can extend it by:
- Adding hotel costs
- Integrating multiple origins
- Adding utility scores for cities
- Penalizing long flights



