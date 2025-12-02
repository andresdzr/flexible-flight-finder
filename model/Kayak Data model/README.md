#  European Cities Clustering — Flight Network Analysis

This project builds a complete clustering pipeline to analyze how European cities relate to each other based on real flight data. Instead of relying only on geography or airline prices, the analysis combines:

- **Geographical distance**
- **Cheap-flight connectivity**
- **Graph structure & network centrality**
- **Node2Vec structural embeddings**
- **Tabular flight features**
- **PCA dimensionality reduction**
- **Hybrid KMeans clustering**

The goal is to reveal the hidden structure of the European flight network—identifying regional groups, cheap-travel zones, strategic hubs, and deeper latent patterns that emerge from the interaction between prices, distances, and connectivity.

---

##  1. Distance-Based Clustering (Geographical Baseline)

We begin by modeling Europe purely through **physical distance** between cities.  
Distances are computed using the **Haversine formula**, and two clustering methods are applied:

- **Agglomerative Clustering**  
- **Spectral Clustering**

Both methods produce nearly identical geographical groupings, creating a clear baseline that shows how cities cluster when only proximity matters.

This step answers:  
-> *“How would cities group if we only looked at geography?”*

---

##  2. Modelling Europe as a Cheap-Flight Network

Next, we move from geographical space to **network space**.

We build a graph where:
- **Nodes** = cities  
- **Edges** = at least one flight with price ≤ €100  

This graph captures the structure of low-cost connectivity in Europe.

###  Louvain Community Detection  
Using the graph, we apply the **Louvain algorithm** to identify communities—groups of cities that form dense cheap-flight regions.

These communities reveal **travel zones** created by airline economics rather than physical distance.

###  Betweenness Centrality (Budget Hubs)  
We compute **betweenness centrality** to identify strategic hubs that act as bridges between regions.  
These are cities with high structural importance for multi-city routing and travel efficiency.

This step answers:  
-> *“How do low-cost routes partition Europe into travel zones, and which cities act as key connectors?”*

---

##  3. Feature Engineering for Each City

For every city, we compute a set of descriptive and structural features:

###  Route-level metrics  
- Mean / median flight price  
- Min price  
- Price-per-km  
- Distance  
- Duration  
- Stops  
- Percent of cheap flights  

###  Graph metrics  
- Degree  
- Betweenness  
- Closeness  

###  Coordinates  
- Latitude, longitude  

These combined features describe both economic and structural behavior of each city in the network.

---

##  4. Node2Vec Embeddings (Hidden Structural Features)

We generate **Node2Vec embeddings** to encode the structural role of each city within the graph.  
These embeddings capture:

- Neighborhood structure  
- Cheap-route similarity  
- Community membership  
- Connectivity importance  

Node2Vec allows us to model relationships that are not explicit in tabular data.

This step answers:  
-> *“Which cities behave similarly in the graph, even if they are geographically distant?”*

---

##  5. Hybrid Feature Construction + PCA

We combine:
- **Node2Vec embeddings**
- **Tabular features**

Then we scale, impute missing values, and apply **PCA** to reduce dimensionality while preserving variance.

The result is a compact, expressive representation of each city that blends:
- geography  
- pricing  
- connectivity  
- structural graph patterns  

---

##  6. KMeans Clustering on Hybrid PCA

Finally, we run **KMeans (k=3)** on the PCA embeddings.

This produces three meaningful clusters:

###  Cluster 0 — *High-cost Peripheral Outliers*
Cities such as Lisbon, Stockholm, Zurich  
→ expensive, low-connectivity, geographically peripheral

###  Cluster 1 — *Balanced Mid-range Connectors*
Cities such as Amsterdam, Vienna, Madrid, Budapest  
→ stable, moderately priced, well-connected but not dominant

###  Cluster 2 — *Major European Hubs*
Cities like London, Paris, Berlin, Rome, Istanbul  
→ highly connected, structurally central, competitively priced

This step answers:  
-> *“What deeper patterns emerge when combining all travel, price, and structural data?”*

---

##  7. Exporting Results to JSON

We store clustering results in a dictionary:

- Spectral clusters  
- Louvain communities  
- Budget hubs  
- KMeans hybrid clusters  


