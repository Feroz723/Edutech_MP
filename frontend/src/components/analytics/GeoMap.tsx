import React, { useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup
} from "react-simple-maps";
import { scaleQuantile } from "d3-scale";

// India TopoJSON URL
const INDIA_TOPO_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

interface GeoStat {
    state: string;
    count: number;
}

const GeoMap: React.FC<{ data: GeoStat[] }> = ({ data }) => {
    const colorScale = useMemo(() => {
        // Handle empty or small data sets gracefully
        const domain = data.length > 0 ? data.map((d) => d.count) : [0, 1];
        return scaleQuantile<string>()
            .domain(domain)
            .range([
                "#eff6ff", // Blue 50
                "#dbeafe", // Blue 100
                "#bfdbfe", // Blue 200
                "#93c5fd", // Blue 300
                "#60a5fa", // Blue 400
                "#3b82f6", // Blue 500
                "#2563eb", // Blue 600
            ]);
    }, [data]);

    // Helper to normalize state names for matching
    const normalizeName = (name: string) => name.toLowerCase().replace(/\s/g, "");

    return (
        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 800,
                    center: [82, 22] // Centered on India
                }}
                className="w-full h-full"
            >
                <ZoomableGroup center={[82, 22]} zoom={1} minZoom={1} maxZoom={4}>
                    <Geographies geography={INDIA_TOPO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const stateName = geo.properties.ST_NM || geo.properties.NAME_1 || geo.properties.name;
                                const cur = data.find(
                                    (s) => normalizeName(s.state) === normalizeName(stateName)
                                );

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={cur ? colorScale(cur.count) : "#f8fafc"}
                                        stroke="#e2e8f0"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: "#6366f1", outline: "none", cursor: "pointer" },
                                            pressed: { fill: "#4f46e5", outline: "none" }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Legend Overlay */}
            <div className="absolute bottom-6 left-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-700 shadow-lg">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Density Scale</p>
                <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="w-4 h-2 rounded-sm"
                            style={{ backgroundColor: colorScale.range()[i] }}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[8px] font-bold text-slate-400">Low</span>
                    <span className="text-[8px] font-bold text-slate-400">High</span>
                </div>
            </div>

            {/* Legend Title */}
            <div className="absolute top-6 right-6 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">
                Interactive Heatmap
            </div>
        </div>
    );
};

export default GeoMap;
