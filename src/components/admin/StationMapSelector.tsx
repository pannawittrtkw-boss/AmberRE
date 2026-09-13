"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Train, ChevronDown, ChevronUp } from "lucide-react";
import { LINES, type StationData, type LineData } from "@/lib/stations";

export type { StationData, LineData };

interface StationMapSelectorProps {
  selectedStations: string[];
  onChange: (stations: string[]) => void;
  onClose: () => void;
}

export default function StationMapSelector({
  selectedStations,
  onChange,
  onClose,
}: StationMapSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLines, setExpandedLines] = useState<string[]>([]);

  const toggleLine = (lineKey: string) => {
    setExpandedLines((prev) =>
      prev.includes(lineKey)
        ? prev.filter((k) => k !== lineKey)
        : [...prev, lineKey]
    );
  };

  const toggleStation = (stationId: string) => {
    onChange(
      selectedStations.includes(stationId)
        ? selectedStations.filter((id) => id !== stationId)
        : [...selectedStations, stationId]
    );
  };

  const toggleAllInLine = (line: LineData) => {
    const lineStationIds = line.stations.map((s) => s.id);
    const allSelected = lineStationIds.every((id) => selectedStations.includes(id));
    if (allSelected) {
      onChange(selectedStations.filter((id) => !lineStationIds.includes(id)));
    } else {
      const newIds = lineStationIds.filter((id) => !selectedStations.includes(id));
      onChange([...selectedStations, ...newIds]);
    }
  };

  const filteredLines = useMemo(() => {
    if (!searchTerm.trim()) return LINES;
    const term = searchTerm.toLowerCase();
    return LINES.map((line) => ({
      ...line,
      stations: line.stations.filter(
        (s) =>
          s.nameEn.toLowerCase().includes(term) ||
          s.nameTh.includes(term) ||
          s.code.toLowerCase().includes(term)
      ),
    })).filter((line) => line.stations.length > 0);
  }, [searchTerm]);

  const selectedStationNames = useMemo(() => {
    const names: string[] = [];
    LINES.forEach((line) => {
      line.stations.forEach((s) => {
        if (selectedStations.includes(s.id)) {
          names.push(`${s.code} ${s.nameTh}`);
        }
      });
    });
    return names;
  }, [selectedStations]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // SSR guard: only render after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <Train className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">
                เลือกสถานีใกล้เคียง / Select Nearby Stations
              </h2>
              <p className="text-sm text-white/70">
                {selectedStations.length > 0
                  ? `เลือกแล้ว ${selectedStations.length} สถานี`
                  : "BTS / MRT / Airport Rail Link"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b bg-gray-50 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสถานี... / Search station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Selected Tags */}
        {selectedStations.length > 0 && (
          <div className="px-6 py-3 border-b bg-blue-50 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto flex-shrink-0">
            {LINES.map((line) =>
              line.stations
                .filter((s) => selectedStations.includes(s.id))
                .map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: line.color }}
                  >
                    {s.code} {s.nameTh}
                    <button
                      type="button"
                      onClick={() => toggleStation(s.id)}
                      className="hover:bg-white/30 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
            )}
          </div>
        )}

        {/* Station Lines */}
        <div className="flex-1 overflow-y-auto">
          {filteredLines.map((line) => {
            const isExpanded = expandedLines.includes(line.key);
            const lineStationIds = line.stations.map((s) => s.id);
            const selectedInLine = lineStationIds.filter((id) =>
              selectedStations.includes(id)
            ).length;

            return (
              <div
                key={line.key}
                className="relative border-b border-gray-200 last:border-b-0"
              >
                {/* Colored vertical accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: line.color }}
                />

                {/* Line Header */}
                <button
                  type="button"
                  onClick={() => toggleLine(line.key)}
                  className="w-full pl-6 pr-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow"
                      style={{ backgroundColor: line.color }}
                    />
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">
                        {line.nameTh}
                      </span>
                      <span className="text-xs text-gray-400">
                        {line.nameEn}
                      </span>
                    </div>
                    {selectedInLine > 0 && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shadow-sm"
                        style={{ backgroundColor: line.color }}
                      >
                        {selectedInLine} selected
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Stations - Rail Map Style */}
                {isExpanded && (
                  <div className="px-6 pb-4">
                    {/* Select All for this line */}
                    <button
                      type="button"
                      onClick={() => toggleAllInLine(line)}
                      className="text-xs mb-3 px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: line.color,
                        color: line.color,
                      }}
                    >
                      {lineStationIds.every((id) =>
                        selectedStations.includes(id)
                      )
                        ? "Deselect All"
                        : "Select All"}
                    </button>

                    {/* Rail Line Visual */}
                    <div className="relative ml-4">
                      {/* Vertical Rail Line */}
                      <div
                        className="absolute left-[7px] top-0 bottom-0 w-[3px] rounded-full"
                        style={{ backgroundColor: line.color }}
                      />

                      {/* Stations */}
                      <div className="space-y-0.5">
                        {line.stations.map((station, idx) => {
                          const isSelected = selectedStations.includes(
                            station.id
                          );
                          return (
                            <button
                              key={station.id}
                              type="button"
                              onClick={() => toggleStation(station.id)}
                              className={`relative w-full flex items-center gap-3 pl-7 pr-3 py-1.5 rounded-lg text-left transition-all text-sm group ${
                                isSelected
                                  ? "bg-gray-100"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {/* Station Dot */}
                              <div
                                className={`absolute left-0 w-[17px] h-[17px] rounded-full border-[3px] transition-all ${
                                  isSelected
                                    ? "scale-110"
                                    : "bg-white group-hover:scale-105"
                                }`}
                                style={{
                                  borderColor: line.color,
                                  backgroundColor: isSelected
                                    ? line.color
                                    : "white",
                                }}
                              >
                                {isSelected && (
                                  <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                )}
                              </div>

                              {/* Station Code */}
                              <span
                                className="font-mono text-xs font-bold min-w-[40px]"
                                style={{ color: line.color }}
                              >
                                {station.code}
                              </span>

                              {/* Station Name */}
                              <span className="flex-1">
                                <span
                                  className={`${
                                    isSelected
                                      ? "font-semibold"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {station.nameTh}
                                </span>
                                <span className="text-gray-400 ml-2 text-xs">
                                  {station.nameEn}
                                </span>
                              </span>

                              {isSelected && (
                                <Check
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{ color: line.color }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            เลือกแล้ว {selectedStations.length} สถานี
          </span>
          <div className="flex gap-3">
            {selectedStations.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Done ({selectedStations.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Export station data for use in other components
export { LINES };
