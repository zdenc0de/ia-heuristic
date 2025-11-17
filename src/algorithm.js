import { CITIES, EDGES } from "./data";

/**
 * Resuelve el TSP usando Heurística Voraz.
 * @param {string} type - 'min' para ruta más corta, 'max' para ruta más larga.
 */
export function solveGreedyTSP(type = 'min') {
  // 1. Ordenar aristas:
  // Si es 'min' (corta) -> Menor a Mayor (a - b)
  // Si es 'max' (larga) -> Mayor a Menor (b - a)
  const sortedEdges = [...EDGES].sort((a, b) => 
    type === 'min' ? a.weight - b.weight : b.weight - a.weight
  );

  const n = CITIES.length;
  const degree = new Array(n).fill(0); 
  const parent = new Array(n).fill(0).map((_, i) => i); 

  const find = (i) => {
    if (parent[i] === i) return i;
    return (parent[i] = find(parent[i]));
  };

  const union = (i, j) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  };

  const selectedEdges = [];

  for (let edge of sortedEdges) {
    const u = edge.fromId;
    const v = edge.toId;

    // REGLA 1: Grado < 2
    if (degree[u] >= 2 || degree[v] >= 2) continue;

    // REGLA 2: Ciclos
    const rootU = find(u);
    const rootV = find(v);
    const formsCycle = rootU === rootV;
    
    if (!formsCycle || (formsCycle && selectedEdges.length === n - 1)) {
        
        if (formsCycle && selectedEdges.length < n - 1) continue;

        union(u, v);
        degree[u]++;
        degree[v]++;
        selectedEdges.push(edge);
    }
    
    if (selectedEdges.length === n) break;
  }

  return {
    // Devolvemos ordenado por peso descendente para la tabla visual
    routes: selectedEdges.sort((a, b) => b.weight - a.weight),
    totalDistance: selectedEdges.reduce((acc, curr) => acc + curr.weight, 0)
  };
}