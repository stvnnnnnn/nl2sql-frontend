"use client";

import React, { useMemo, useState, useRef } from "react";

interface ColumnInfo {
  name: string;
  type: string;
  is_primary: boolean;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

interface Relationship {
  table: string;
  column: string;
  references: {
    table: string;
    column: string;
  };
}

interface NodePos {
  x: number;
  y: number;
}

interface Props {
  tables: TableInfo[];
  relationships: Relationship[];
}

export default function RelationalModel({ tables, relationships }: Props) {
  // ======================================================
  // 1) Grid inicial
  // ======================================================
  const baseNodes = useMemo(() => {
    const cols = 3;
    const colW = 320;
    const rowH = 200;

    return tables.map((t, i) => ({
      id: t.name,
      table: t,
      x: (i % cols) * colW,
      y: Math.floor(i / cols) * rowH,
    }));
  }, [tables]);

  // ======================================================
  // 2) Posiciones reales
  // ======================================================
  const [positions, setPositions] = useState<Record<string, NodePos>>(() => {
    const init: Record<string, NodePos> = {};
    baseNodes.forEach((n) => (init[n.id] = { x: n.x, y: n.y }));
    return init;
  });

  // ======================================================
  // 3) Zoom + Pan del canvas aislado
  // ======================================================
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const panning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseStart = useRef({ x: 0, y: 0 });

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();

    const factor = 0.1;
    const next = zoom - Math.sign(e.deltaY) * factor;

    setZoom(Math.max(0.3, Math.min(3, next)));
  }

  function startPan(e: React.MouseEvent) {
    if ((e.target as HTMLElement).dataset.type === "node") return;

    panning.current = true;
    panStart.current = { x: pan.x, y: pan.y };
    mouseStart.current = { x: e.clientX, y: e.clientY };
  }

  function movePan(e: React.MouseEvent) {
    if (!panning.current) return;

    const dx = e.clientX - mouseStart.current.x;
    const dy = e.clientY - mouseStart.current.y;

    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  }

  // ======================================================
  // 4) Drag de nodos
  // ======================================================
  const dragging = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  function onNodeDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();

    dragging.current = id;
    const pos = positions[id];

    dragOffset.current = {
      x: (e.clientX - pan.x) / zoom - pos.x,
      y: (e.clientY - pan.y) / zoom - pos.y,
    };
  }

  function onMove(e: React.MouseEvent) {
    if (dragging.current) {
      const id = dragging.current;

      setPositions((prev) => ({
        ...prev,
        [id]: {
          x: (e.clientX - pan.x) / zoom - dragOffset.current.x,
          y: (e.clientY - pan.y) / zoom - dragOffset.current.y,
        },
      }));
    } else if (panning.current) {
      movePan(e);
    }
  }

  function onUp() {
    dragging.current = null;
    panning.current = false;
  }

  // ======================================================
  // 5) Nodos renderizados
  // ======================================================
  const nodes = useMemo(() => {
    return baseNodes.map((n) => ({
      ...n,
      x: positions[n.id].x,
      y: positions[n.id].y,
    }));
  }, [positions, baseNodes]);

  // ======================================================
  // 6) Líneas
  // ======================================================
  const lines = relationships.map((r, i) => {
    const from = positions[r.table];
    const to = positions[r.references.table];

    if (!from || !to) return null;

    return (
      <line
        key={i}
        x1={from.x + 260}
        y1={from.y + 20}
        x2={to.x}
        y2={to.y + 20}
        stroke="#4ade80"
        strokeWidth={2}
      />
    );
  });

  // ======================================================
  // RENDER FINAL
  // ======================================================
  return (
    <div
      className="w-full h-full overflow-hidden bg-neutral-950"
      style={{ userSelect: "none" }}
      onWheel={handleWheel}
      onMouseDown={startPan}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      {/* VIEWPORT FIJO */}
      <div
        className="relative"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        {/* CANVAS ESCALADO */}
        <div
          style={{
            position: "absolute",
            left: pan.x,
            top: pan.y,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: "fit-content",
            height: "fit-content",
          }}
        >
          {/* LÍNEAS */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width="5000"
            height="5000"
          >
            {lines}
          </svg>

          {/* TABLAS */}
          {nodes.map((n) => (
            <div
              key={n.id}
              data-type="node"
              onMouseDown={(e) => onNodeDown(e, n.id)}
              className="absolute bg-neutral-800 text-white rounded-lg border border-neutral-600 p-3 shadow-lg"
              style={{
                left: n.x,
                top: n.y,
                width: 260,
                cursor: "grab",
                userSelect: "none",
              }}
            >
              <div className="font-bold mb-1">{n.table.name}</div>

              {n.table.columns.map((col) => (
                <div key={col.name} className="text-xs text-neutral-300 flex gap-1">
                  <span>{col.name}</span>
                  <span className="text-neutral-500">({col.type})</span>
                  {col.is_primary && (
                    <span className="text-yellow-400 ml-1">PK</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}