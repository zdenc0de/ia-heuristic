import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { CITIES } from "./data";
import { solveGreedyTSP } from "./algorithm";
import { MapPin, Calculator, RotateCcw, TrendingDown, TrendingUp, ListOrdered } from "lucide-react";

// --- FUNCIÓN AUXILIAR PARA ORDENAR LA RUTA (ITINERARIO) ---
function sortRoutesSequentially(edges) {
  if (!edges || edges.length === 0) return [];

  // 1. Crear mapa de adyacencia (qué ciudad conecta con cuál)
  const adj = {};
  edges.forEach((e) => {
    if (!adj[e.fromId]) adj[e.fromId] = [];
    if (!adj[e.toId]) adj[e.toId] = [];
    adj[e.fromId].push(e.toId);
    adj[e.toId].push(e.fromId);
  });

  const sortedTour = [];
  const startNode = 0; // Comenzamos en CDMX (ID 0)
  let current = startNode;
  let prev = -1; // No venimos de ningún lado al inicio

  // Recorremos la cadena. El número de pasos es igual al número de aristas.
  for (let i = 0; i < edges.length; i++) {
    const neighbors = adj[current];
    
    if (!neighbors) break; // Protección por si el grafo no cerró ciclo

    // Buscamos el vecino que NO sea el anterior (para avanzar, no retroceder)
    // Si es el primer paso (prev == -1), tomamos el primero que haya.
    let next = neighbors.find((n) => n !== prev);
    
    // Caso especial: último paso para cerrar el ciclo volviendo al inicio
    if (next === undefined && neighbors.includes(startNode) && i === edges.length - 1) {
        next = startNode;
    }

    if (next === undefined) break; // Error de grafo

    // Buscamos el peso original de esta conexión
    const edgeData = edges.find(
      (e) => (e.fromId === current && e.toId === next) || (e.fromId === next && e.toId === current)
    );

    // Agregamos al itinerario forzando el orden "Origen -> Destino" visual
    sortedTour.push({
      fromId: current,
      toId: next,
      weight: edgeData.weight,
    });

    // Avanzamos
    prev = current;
    current = next;
  }

  return sortedTour;
}

// --- COMPONENTE PRINCIPAL ---
function App() {
  const [routes, setRoutes] = useState([]); // Rutas visuales (para el mapa)
  const [orderedRoutes, setOrderedRoutes] = useState([]); // Rutas ordenadas (para la tabla)
  const [totalDist, setTotalDist] = useState(0);
  const [mode, setMode] = useState('min'); 

  const handleCalculate = () => {
    const result = solveGreedyTSP(mode);
    
    // 1. Guardamos las aristas tal cual para el mapa (no importa el orden)
    setRoutes(result.routes);
    setTotalDist(result.totalDistance);

    // 2. Procesamos el orden secuencial para la tabla
    const sequence = sortRoutesSequentially(result.routes);
    setOrderedRoutes(sequence);
  };

  const handleReset = () => {
    setRoutes([]);
    setOrderedRoutes([]);
    setTotalDist(0);
  };

  // Configuración visual dinámica
  const routeColor = mode === 'min' ? '#10b981' : '#ef4444';
  const cardBg = mode === 'min' ? 'from-emerald-50 to-teal-50' : 'from-red-50 to-orange-50';
  const cardBorder = mode === 'min' ? 'border-emerald-100' : 'border-red-100';
  const textColor = mode === 'min' ? 'text-emerald-900' : 'text-red-900';

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      {/* IZQUIERDA: El Mapa */}
      <div className="w-2/3 h-full relative border-r-4 border-gray-300 shadow-2xl z-0">
        <MapContainer center={[23.6345, -102.5528]} zoom={5} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {CITIES.map((city) => (
            <Marker key={city.id} position={[city.lat, city.lng]}>
              <Popup><div className="font-bold">{city.name}</div></Popup>
            </Marker>
          ))}

          {/* Usamos routes (raw) para dibujar, es más seguro para Leaflet */}
          {routes.map((route, index) => {
            const fromCity = CITIES.find((c) => c.id === route.fromId);
            const toCity = CITIES.find((c) => c.id === route.toId);
            return (
              <Polyline
                key={index}
                positions={[
                  [fromCity.lat, fromCity.lng],
                  [toCity.lat, toCity.lng],
                ]}
                pathOptions={{ color: routeColor, weight: 4, opacity: 0.8 }}
              />
            );
          })}
        </MapContainer>
        
        <div className="absolute top-4 left-16 z-1000 bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className={mode === 'min' ? "text-emerald-500" : "text-red-500"} /> TSP México
          </h1>
          <p className="text-sm text-gray-600 font-mono">
             Heurística Voraz 2 ({mode === 'min' ? 'Mínima' : 'Máxima'})
          </p>
        </div>
      </div>

      {/* DERECHA: Panel de Control */}
      <div className="w-1/3 h-full flex flex-col bg-white shadow-xl z-10 relative">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Panel de Control</h2>
          
          {/* Switcher */}
          <div className="flex bg-gray-200 p-1 rounded-xl mb-4">
            <button
              onClick={() => setMode('min')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'min' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingDown size={16} /> Ruta Corta
            </button>
            <button
              onClick={() => setMode('max')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'max' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp size={16} /> Ruta Larga
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleCalculate}
              className={`cursor-pointer flex-1 text-white py-3 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                  mode === 'min' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'
              }`}
            >
              <Calculator size={20} /> Calcular
            </button>
            <button
              onClick={handleReset}
              className="cursor-pointer bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 py-3 px-4 rounded-xl transition flex items-center justify-center shadow-sm active:scale-95"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Total */}
          <div className={`bg-linear-to-br ${cardBg} border ${cardBorder} p-6 rounded-2xl shadow-inner transition-colors duration-300`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${mode === 'min' ? 'text-emerald-600' : 'text-red-600'}`}>
                {mode === 'min' ? 'Distancia Mínima' : 'Distancia Máxima'}
            </p>
            <p className={`text-4xl font-black tracking-tight ${textColor}`}>
              {totalDist > 0 ? `${totalDist.toLocaleString()} km` : "---"}
            </p>
          </div>
        </div>

        {/* Tabla de Rutas (USANDO orderedRoutes) */}
        <div className="flex-1 overflow-auto">
          {orderedRoutes.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <ListOrdered size={14}/> Ruta
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase border-b tracking-wider">#</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase border-b tracking-wider">Origen</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase border-b tracking-wider">Destino</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase border-b text-right tracking-wider">Km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderedRoutes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-400 italic">
                    <div className="flex flex-col items-center gap-2">
                        <MapPin className="opacity-20" size={48}/>
                        <span>El mapa está vacío...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                orderedRoutes.map((route, idx) => {
                  const fromName = CITIES.find((c) => c.id === route.fromId).name;
                  const toName = CITIES.find((c) => c.id === route.toId).name;
                  
                  return (
                    <tr key={idx} className={`hover:bg-gray-50 transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-500`} style={{animationDelay: `${idx * 50}ms`}}>
                      <td className="p-3 pl-4 text-xs text-gray-400 font-mono">{idx + 1}</td>
                      <td className="p-3 text-sm font-medium text-gray-700">{fromName}</td>
                      <td className="p-3 text-sm font-medium text-gray-700 flex items-center gap-1">
                         <span className="text-gray-300">→</span> {toName}
                      </td>
                      <td className={`p-3 text-sm font-mono text-right font-bold ${mode === 'min' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {route.weight}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-2 text-center text-[10px] text-gray-300 border-t">
            Proyecto TSP • Heurística Voraz
        </div>
      </div>
    </div>
  );
}

export default App;