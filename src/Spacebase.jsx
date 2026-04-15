/*
 * Spacebase — LCARS-styled spreadsheet database on Supabase.
 *
 * SETUP:
 *   1. Run the schema + RPC SQL from the spec in your Supabase SQL editor.
 *   2. Fill in SUPABASE_URL and SUPABASE_ANON_KEY below.
 *   3. Import and render <Spacebase /> as your app root.
 *
 * Single-file React component. Requires: react, lodash, lucide-react,
 * @supabase/supabase-js. No localStorage. No <form>. Hand-rolled virtualization.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import { debounce } from 'lodash';
import {
  Plus,
  Trash2,
  ChevronDown,
  Search,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Undo2,
  Home,
  Edit3,
} from 'lucide-react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://pnbwckblqelmzmapbqdr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qBOu9d8zmeGJ4pH_vNStSg_0jMxy3_O';

// Disable the gotrue auth lock + persistence — we don't use auth, and the
// Web Locks API deadlocks under React StrictMode / orphaned mounts.
const noopLock = async (_name, _timeout, fn) => fn();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    lock: noopLock,
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  },
});

// ─── LCARS PALETTE ───────────────────────────────────────────────────────────
const C = {
  black: '#000000',
  cellBg: '#0a0a1a',
  cellBgEdit: '#0f0f2a',
  grid: '#1a1a3a',
  text: '#ffe8d0',
  butterscotch: '#ff9900',
  butterscotchDim: '#664400',
  periwinkle: '#cc99cc',
  sky: '#99ccff',
  gold: '#ffcc99',
  salmon: '#cc6666',
  lavender: '#9999cc',
};

const LCARS_ROTATION = [
  C.butterscotch,
  C.periwinkle,
  C.sky,
  C.gold,
  C.lavender,
];

const FONT_UI = '"Archivo Black", "Antonio", sans-serif';
const FONT_DATA = '"Antonio", "Chakra Petch", sans-serif';

const ROW_HEIGHT = 36;
const OVERSCAN = 8;
const ROW_NUM_W = 56;
const DEFAULT_COL_W = 200;

// ─── GOOGLE FONTS ────────────────────────────────────────────────────────────
function useGoogleFonts() {
  useEffect(() => {
    const id = 'spacebase-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&family=Archivo+Black&family=Chakra+Petch:wght@400;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── TOASTS ──────────────────────────────────────────────────────────────────
let toastSeq = 0;
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((kind, msg) => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      4000
    );
  }, []);
  const success = useCallback((m) => push('success', m), [push]);
  const error = useCallback((m) => push('error', m), [push]);
  return { toasts, success, error };
}

function ToastStack({ toasts }) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.kind === 'error' ? C.salmon : C.sky,
            color: C.black,
            fontFamily: FONT_UI,
            textTransform: 'uppercase',
            padding: '10px 18px 10px 22px',
            borderRadius: '4px 18px 18px 4px',
            minWidth: 220,
            fontSize: 13,
            letterSpacing: 0.5,
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.7 }}>
            {t.kind === 'error' ? 'ALERT' : 'CONFIRMED'}
          </div>
          <div>{t.msg}</div>
        </div>
      ))}
    </div>
  );
}

// ─── LCARS BUTTON ────────────────────────────────────────────────────────────
function LButton({
  children,
  onClick,
  color = C.butterscotch,
  disabled,
  side = 'left',
  style,
  title,
}) {
  const radius =
    side === 'left'
      ? '18px 4px 4px 18px'
      : side === 'right'
      ? '4px 18px 18px 4px'
      : '18px';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: disabled ? C.butterscotchDim : color,
        color: C.black,
        border: 'none',
        padding: '8px 18px',
        fontFamily: FONT_UI,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: radius,
        transition: 'opacity 100ms',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── LOADING BAR ─────────────────────────────────────────────────────────────
function LcarsLoading({ label = 'ACCESSING DATABASE...' }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(i);
  }, []);
  const blocks = 12;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: blocks }).map((_, i) => {
          const on = (tick + i) % blocks < 6;
          return (
            <div
              key={i}
              style={{
                width: 22,
                height: 14,
                borderRadius: 3,
                background: on
                  ? LCARS_ROTATION[i % LCARS_ROTATION.length]
                  : '#222',
                transition: 'background 100ms',
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          color: C.text,
          fontFamily: FONT_DATA,
          fontSize: 16,
          letterSpacing: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
async function sbCall(fn, toastErr) {
  try {
    const { data, error } = await fn();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error(e);
    if (toastErr) toastErr(e.message || 'Database error');
    throw e;
  }
}

function fmtDate(v) {
  if (!v) return '';
  try {
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString();
  } catch {
    return v;
  }
}

function pillColor(idx) {
  return LCARS_ROTATION[idx % LCARS_ROTATION.length];
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Spacebase() {
  useGoogleFonts();
  const { toasts, success, error: toastError } = useToasts();

  // Global state
  const [bases, setBases] = useState([]);
  const [activeBaseId, setActiveBaseId] = useState(null);
  const [loadingBases, setLoadingBases] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Active-base state
  const [tables, setTables] = useState([]);
  const [activeTableId, setActiveTableId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]); // [{id, position, cells: {colId: value}}]
  const [loadingTable, setLoadingTable] = useState(false);

  // Interaction state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [focus, setFocus] = useState(null); // {rowId, colId}
  const [editing, setEditing] = useState(null); // {rowId, colId}
  const [colMenu, setColMenu] = useState(null); // columnId
  const [baseDropdown, setBaseDropdown] = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);

  // Linked-table cache for `relation` columns:
  //   { [tableId]: { primaryColId, rowsById: { [rowId]: primaryValue } } }
  const [linkedData, setLinkedData] = useState({});

  // Undo stack
  const undoStack = useRef([]);
  const pushUndo = useCallback((fn) => {
    undoStack.current.push(fn);
    if (undoStack.current.length > 50) undoStack.current.shift();
  }, []);

  // Scroll virtualization
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(600);

  // Pending cell writes
  const pendingCells = useRef(new Map()); // key `${rowId}::${colId}` -> value
  const flushCells = useRef(null);

  // ─── DEBOUNCED SEARCH ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // ─── BASES: INITIAL LOAD ─────────────────────────────────────────────────
  const basesLoadedOnce = useRef(false);
  const loadBases = useCallback(async () => {
    setLoadingBases(true);
    setLoadError(null);
    try {
      const data = await sbCall(
        () =>
          supabase
            .from('spacebase_bases')
            .select('*')
            .order('created_at', { ascending: true }),
        toastError
      );
      let list = data || [];
      if (list.length === 0 && !basesLoadedOnce.current) {
        // Create default base — only once per session
        const created = await sbCall(
          () =>
            supabase
              .from('spacebase_bases')
              .insert({ name: 'My Spacebase' })
              .select()
              .single(),
          toastError
        );
        list = [created];
      }
      basesLoadedOnce.current = true;
      setBases(list);
    } catch (e) {
      setLoadError(e.message || 'Failed to load');
    } finally {
      setLoadingBases(false);
    }
  }, [toastError]);

  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    loadBases();
  }, [loadBases]);

  // ─── LOAD TABLES FOR ACTIVE BASE ─────────────────────────────────────────
  useEffect(() => {
    if (!activeBaseId) {
      setTables([]);
      setActiveTableId(null);
      setColumns([]);
      setRows([]);
      return;
    }
    (async () => {
      setLoadingTable(true);
      try {
        const data = await sbCall(
          () =>
            supabase
              .from('spacebase_tables')
              .select('*')
              .eq('base_id', activeBaseId)
              .order('created_at', { ascending: true }),
          toastError
        );
        let list = data || [];
        if (list.length === 0) {
          const created = await sbCall(
            () =>
              supabase
                .from('spacebase_tables')
                .insert({ base_id: activeBaseId, name: 'Table 1' })
                .select()
                .single(),
            toastError
          );
          list = [created];
          // Seed with a default text column
          await sbCall(
            () =>
              supabase
                .from('spacebase_columns')
                .insert({
                  table_id: created.id,
                  name: 'Name',
                  type: 'text',
                  position: 0,
                }),
            toastError
          );
        }
        setTables(list);
        setActiveTableId(list[0].id);
      } catch (e) {
        setLoadingTable(false);
      }
    })();
  }, [activeBaseId, toastError]);

  // ─── LOAD COLUMNS + ROWS + CELLS FOR ACTIVE TABLE ────────────────────────
  const loadTableData = useCallback(
    async (tableId) => {
      if (!tableId) return;
      setLoadingTable(true);
      setColumns([]);
      setRows([]);
      setSelected(new Set());
      setFocus(null);
      setEditing(null);
      try {
        const cols = await sbCall(
          () =>
            supabase
              .from('spacebase_columns')
              .select('*')
              .eq('table_id', tableId)
              .order('position', { ascending: true }),
          toastError
        );
        const rs = await sbCall(
          () =>
            supabase
              .from('spacebase_rows')
              .select('*')
              .eq('table_id', tableId)
              .order('position', { ascending: true }),
          toastError
        );
        setColumns(cols || []);
        const rowList = rs || [];
        // Load cells in batches of 500 row ids
        const cellsByRow = new Map();
        for (let i = 0; i < rowList.length; i += 500) {
          const batch = rowList.slice(i, i + 500).map((r) => r.id);
          if (!batch.length) continue;
          const cells = await sbCall(
            () =>
              supabase
                .from('spacebase_cells')
                .select('*')
                .in('row_id', batch),
            toastError
          );
          (cells || []).forEach((c) => {
            if (!cellsByRow.has(c.row_id)) cellsByRow.set(c.row_id, {});
            cellsByRow.get(c.row_id)[c.column_id] = c.value;
          });
        }
        setRows(
          rowList.map((r) => ({
            id: r.id,
            position: r.position,
            cells: cellsByRow.get(r.id) || {},
          }))
        );
      } catch (e) {
        /* handled */
      } finally {
        setLoadingTable(false);
      }
    },
    [toastError]
  );

  useEffect(() => {
    if (activeTableId) loadTableData(activeTableId);
  }, [activeTableId, loadTableData]);

  // ─── LINKED TABLE LOADER (for `relation` columns) ────────────────────────
  const loadLinkedTable = useCallback(
    async (tableId) => {
      if (!tableId) return;
      try {
        const cols = await sbCall(
          () =>
            supabase
              .from('spacebase_columns')
              .select('id,position')
              .eq('table_id', tableId)
              .order('position', { ascending: true })
              .limit(1),
          toastError
        );
        const primaryColId = cols?.[0]?.id || null;
        const rs = await sbCall(
          () =>
            supabase
              .from('spacebase_rows')
              .select('id')
              .eq('table_id', tableId)
              .order('position', { ascending: true }),
          toastError
        );
        const rowIds = (rs || []).map((r) => r.id);
        const rowsById = {};
        rowIds.forEach((id) => (rowsById[id] = ''));
        if (primaryColId && rowIds.length) {
          for (let i = 0; i < rowIds.length; i += 500) {
            const batch = rowIds.slice(i, i + 500);
            const cells = await sbCall(
              () =>
                supabase
                  .from('spacebase_cells')
                  .select('row_id,value')
                  .eq('column_id', primaryColId)
                  .in('row_id', batch),
              toastError
            );
            (cells || []).forEach((c) => {
              rowsById[c.row_id] = c.value ?? '';
            });
          }
        }
        setLinkedData((d) => ({
          ...d,
          [tableId]: { primaryColId, rowsById },
        }));
      } catch {
        /* handled */
      }
    },
    [toastError]
  );

  // Ensure linked data is loaded for every relation column in the active table.
  useEffect(() => {
    const needed = new Set();
    columns.forEach((c) => {
      if (c.type === 'relation') {
        const tid = c.options?.linked_table_id;
        if (tid && !linkedData[tid]) needed.add(tid);
      }
    });
    needed.forEach((tid) => loadLinkedTable(tid));
  }, [columns, linkedData, loadLinkedTable]);

  // ─── CELL WRITE DEBOUNCE ─────────────────────────────────────────────────
  useEffect(() => {
    flushCells.current = debounce(async () => {
      if (pendingCells.current.size === 0) return;
      const batch = Array.from(pendingCells.current.entries()).map(
        ([k, value]) => {
          const [row_id, column_id] = k.split('::');
          return { row_id, column_id, value };
        }
      );
      pendingCells.current.clear();
      try {
        const { error } = await supabase.rpc('upsert_cells', {
          cells: batch,
        });
        if (error) throw error;
      } catch (e) {
        toastError('Failed to save cells');
      }
    }, 500);
    return () => flushCells.current?.cancel?.();
  }, [toastError]);

  const queueCellWrite = useCallback((rowId, colId, value) => {
    pendingCells.current.set(`${rowId}::${colId}`, value);
    flushCells.current?.();
  }, []);

  // ─── ACTIVE TABLE META ───────────────────────────────────────────────────
  const activeTable = useMemo(
    () => tables.find((t) => t.id === activeTableId),
    [tables, activeTableId]
  );
  const activeBase = useMemo(
    () => bases.find((b) => b.id === activeBaseId),
    [bases, activeBaseId]
  );

  // ─── SORT + FILTER ───────────────────────────────────────────────────────
  const visibleRows = useMemo(() => {
    let r = rows;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      r = r.filter((row) =>
        Object.values(row.cells).some(
          (v) => v != null && String(v).toLowerCase().includes(q)
        )
      );
    }
    if (activeTable?.sort_column_id) {
      const col = columns.find((c) => c.id === activeTable.sort_column_id);
      if (col) {
        const dir = activeTable.sort_direction === 'desc' ? -1 : 1;
        r = [...r].sort((a, b) => {
          const av = a.cells[col.id];
          const bv = b.cells[col.id];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (col.type === 'number')
            return (Number(av) - Number(bv)) * dir;
          return String(av).localeCompare(String(bv)) * dir;
        });
      }
    }
    return r;
  }, [rows, debouncedSearch, activeTable, columns]);

  // ─── VIRTUALIZATION ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    const onResize = () => setViewportH(el.clientHeight);
    el.addEventListener('scroll', onScroll, { passive: true });
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [activeTableId]);

  const totalRows = visibleRows.length;
  const startIdx = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN
  );
  const endIdx = Math.min(
    totalRows,
    Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + OVERSCAN
  );
  const slice = visibleRows.slice(startIdx, endIdx);

  // ─── MUTATIONS: BASES ────────────────────────────────────────────────────
  const createBase = async () => {
    try {
      const data = await sbCall(
        () =>
          supabase
            .from('spacebase_bases')
            .insert({ name: 'Untitled Spacebase' })
            .select()
            .single(),
        toastError
      );
      setBases((b) => [...b, data]);
      success('Base created');
    } catch {}
  };

  const renameBase = async (id, name) => {
    const prev = bases.find((b) => b.id === id);
    setBases((b) => b.map((x) => (x.id === id ? { ...x, name } : x)));
    try {
      await sbCall(
        () =>
          supabase.from('spacebase_bases').update({ name }).eq('id', id),
        toastError
      );
      pushUndo(async () => {
        setBases((b) =>
          b.map((x) => (x.id === id ? { ...x, name: prev.name } : x))
        );
        await supabase
          .from('spacebase_bases')
          .update({ name: prev.name })
          .eq('id', id);
      });
    } catch {
      setBases((b) =>
        b.map((x) => (x.id === id ? { ...x, name: prev.name } : x))
      );
    }
  };

  const deleteBase = async (id) => {
    const prev = bases.find((b) => b.id === id);
    if (!prev) return;
    setBases((b) => b.filter((x) => x.id !== id));
    if (activeBaseId === id) setActiveBaseId(null);
    try {
      await sbCall(
        () => supabase.from('spacebase_bases').delete().eq('id', id),
        toastError
      );
      success('Base deleted');
    } catch {
      setBases((b) => [...b, prev]);
    }
  };

  // ─── MUTATIONS: TABLES ───────────────────────────────────────────────────
  const createTable = async () => {
    try {
      const data = await sbCall(
        () =>
          supabase
            .from('spacebase_tables')
            .insert({
              base_id: activeBaseId,
              name: `Table ${tables.length + 1}`,
            })
            .select()
            .single(),
        toastError
      );
      // Seed column
      const col = await sbCall(
        () =>
          supabase
            .from('spacebase_columns')
            .insert({
              table_id: data.id,
              name: 'Name',
              type: 'text',
              position: 0,
            })
            .select()
            .single(),
        toastError
      );
      setTables((t) => [...t, data]);
      setActiveTableId(data.id);
    } catch {}
  };

  const renameTable = async (id, name) => {
    const prev = tables.find((t) => t.id === id);
    setTables((ts) => ts.map((x) => (x.id === id ? { ...x, name } : x)));
    try {
      await supabase.from('spacebase_tables').update({ name }).eq('id', id);
      pushUndo(async () => {
        setTables((ts) =>
          ts.map((x) => (x.id === id ? { ...x, name: prev.name } : x))
        );
        await supabase
          .from('spacebase_tables')
          .update({ name: prev.name })
          .eq('id', id);
      });
    } catch {
      setTables((ts) =>
        ts.map((x) => (x.id === id ? { ...x, name: prev.name } : x))
      );
      toastError('Failed to rename table');
    }
  };

  const deleteTable = async (id) => {
    const prev = tables.find((t) => t.id === id);
    if (!prev) return;
    if (tables.length === 1) {
      toastError('Cannot delete last table');
      return;
    }
    setTables((ts) => ts.filter((x) => x.id !== id));
    if (activeTableId === id) {
      const next = tables.find((x) => x.id !== id);
      setActiveTableId(next?.id || null);
    }
    try {
      await supabase.from('spacebase_tables').delete().eq('id', id);
    } catch {
      setTables((ts) => [...ts, prev]);
      toastError('Failed to delete table');
    }
  };

  // ─── MUTATIONS: COLUMNS ──────────────────────────────────────────────────
  const addColumn = async (name, type, options = null) => {
    try {
      const position = columns.length;
      const opts =
        options != null
          ? options
          : type === 'single_select'
          ? []
          : type === 'relation'
          ? {}
          : [];
      const data = await sbCall(
        () =>
          supabase
            .from('spacebase_columns')
            .insert({
              table_id: activeTableId,
              name,
              type,
              position,
              options: opts,
            })
            .select()
            .single(),
        toastError
      );
      setColumns((c) => [...c, data]);
      pushUndo(async () => {
        setColumns((c) => c.filter((x) => x.id !== data.id));
        await supabase.rpc('delete_column_cascade', { p_column_id: data.id });
      });
    } catch {}
  };

  const updateColumn = async (id, patch) => {
    const prev = columns.find((c) => c.id === id);
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      await supabase.from('spacebase_columns').update(patch).eq('id', id);
      pushUndo(async () => {
        setColumns((cs) => cs.map((c) => (c.id === id ? prev : c)));
        await supabase.from('spacebase_columns').update(prev).eq('id', id);
      });
    } catch {
      setColumns((cs) => cs.map((c) => (c.id === id ? prev : c)));
      toastError('Failed to update column');
    }
  };

  const deleteColumn = async (id) => {
    const prev = columns.find((c) => c.id === id);
    if (!prev) return;
    // Snapshot cells for undo
    const prevCells = rows.map((r) => ({
      row_id: r.id,
      value: r.cells[id],
    }));
    setColumns((cs) => cs.filter((c) => c.id !== id));
    setRows((rs) =>
      rs.map((r) => {
        const { [id]: _, ...rest } = r.cells;
        return { ...r, cells: rest };
      })
    );
    try {
      await supabase.rpc('delete_column_cascade', { p_column_id: id });
      pushUndo(async () => {
        const restored = await sbCall(
          () =>
            supabase
              .from('spacebase_columns')
              .insert(prev)
              .select()
              .single(),
          toastError
        );
        setColumns((cs) => [...cs, restored].sort((a, b) => a.position - b.position));
        // Restore cell values
        const batch = prevCells
          .filter((c) => c.value != null)
          .map((c) => ({
            row_id: c.row_id,
            column_id: restored.id,
            value: c.value,
          }));
        if (batch.length) {
          await supabase.rpc('upsert_cells', { cells: batch });
          setRows((rs) =>
            rs.map((r) => {
              const match = prevCells.find((x) => x.row_id === r.id);
              if (!match || match.value == null) return r;
              return {
                ...r,
                cells: { ...r.cells, [restored.id]: match.value },
              };
            })
          );
        }
      });
    } catch {
      setColumns((cs) => [...cs, prev].sort((a, b) => a.position - b.position));
      toastError('Failed to delete column');
    }
  };

  const setSort = async (colId, dir) => {
    if (!activeTable) return;
    const patch = { sort_column_id: colId, sort_direction: dir };
    setTables((ts) =>
      ts.map((t) => (t.id === activeTable.id ? { ...t, ...patch } : t))
    );
    await supabase
      .from('spacebase_tables')
      .update(patch)
      .eq('id', activeTable.id);
  };

  // ─── MUTATIONS: ROWS ─────────────────────────────────────────────────────
  const addRow = async () => {
    try {
      const position = rows.length;
      const data = await sbCall(
        () =>
          supabase
            .from('spacebase_rows')
            .insert({ table_id: activeTableId, position })
            .select()
            .single(),
        toastError
      );
      const newRow = { id: data.id, position, cells: {} };
      setRows((r) => [...r, newRow]);
      pushUndo(async () => {
        setRows((r) => r.filter((x) => x.id !== data.id));
        await supabase.from('spacebase_rows').delete().eq('id', data.id);
      });
      // Focus first cell
      if (columns[0]) {
        setFocus({ rowId: data.id, colId: columns[0].id });
      }
    } catch {}
  };

  const deleteSelectedRows = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const prevRows = rows.filter((r) => ids.includes(r.id));
    setRows((r) => r.filter((x) => !ids.includes(x.id)));
    setSelected(new Set());
    try {
      await supabase.from('spacebase_rows').delete().in('id', ids);
      success(`${ids.length} row(s) deleted`);
      pushUndo(async () => {
        // Re-insert rows + cells
        const toInsert = prevRows.map((r) => ({
          id: r.id,
          table_id: activeTableId,
          position: r.position,
        }));
        await supabase.from('spacebase_rows').insert(toInsert);
        const cellBatch = [];
        prevRows.forEach((r) => {
          Object.entries(r.cells).forEach(([column_id, value]) => {
            if (value != null)
              cellBatch.push({ row_id: r.id, column_id, value });
          });
        });
        if (cellBatch.length)
          await supabase.rpc('upsert_cells', { cells: cellBatch });
        setRows((rs) => [...rs, ...prevRows].sort((a, b) => a.position - b.position));
      });
    } catch {
      setRows((r) => [...r, ...prevRows].sort((a, b) => a.position - b.position));
      toastError('Failed to delete rows');
    }
  };

  // ─── CELL EDIT ───────────────────────────────────────────────────────────
  const setCellValue = useCallback(
    (rowId, colId, value) => {
      const prev = rows.find((r) => r.id === rowId)?.cells[colId];
      setRows((rs) =>
        rs.map((r) =>
          r.id === rowId
            ? { ...r, cells: { ...r.cells, [colId]: value } }
            : r
        )
      );
      queueCellWrite(rowId, colId, value);
      pushUndo(async () => {
        setRows((rs) =>
          rs.map((r) =>
            r.id === rowId
              ? { ...r, cells: { ...r.cells, [colId]: prev } }
              : r
          )
        );
        queueCellWrite(rowId, colId, prev ?? null);
      });
    },
    [rows, queueCellWrite, pushUndo]
  );

  // ─── UNDO KEY HANDLER ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (editing) return; // don't hijack in-cell undo
        e.preventDefault();
        const fn = undoStack.current.pop();
        if (fn) {
          Promise.resolve(fn()).then(
            () => success('Undone'),
            () => toastError('Undo failed')
          );
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, success, toastError]);

  // ─── CELL NAVIGATION ─────────────────────────────────────────────────────
  const advanceFocus = (rowIdx, colIdx, dir = 1) => {
    let r = rowIdx;
    let c = colIdx + dir;
    if (c >= columns.length) {
      c = 0;
      r++;
    } else if (c < 0) {
      c = columns.length - 1;
      r--;
    }
    if (r < 0 || r >= visibleRows.length) return;
    setFocus({ rowId: visibleRows[r].id, colId: columns[c].id });
    setEditing(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (!focus || editing) return;
      const rIdx = visibleRows.findIndex((r) => r.id === focus.rowId);
      const cIdx = columns.findIndex((c) => c.id === focus.colId);
      if (rIdx === -1 || cIdx === -1) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        advanceFocus(rIdx, cIdx, 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        advanceFocus(rIdx, cIdx, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rIdx + 1 < visibleRows.length)
          setFocus({
            rowId: visibleRows[rIdx + 1].id,
            colId: focus.colId,
          });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rIdx > 0)
          setFocus({
            rowId: visibleRows[rIdx - 1].id,
            colId: focus.colId,
          });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setEditing(focus);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        advanceFocus(rIdx, cIdx, e.shiftKey ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus, editing, visibleRows, columns]);

  // ─── RENDER: HOME SCREEN ─────────────────────────────────────────────────
  if (loadingBases) {
    return (
      <FullScreen>
        <LcarsLoading />
      </FullScreen>
    );
  }

  if (loadError) {
    return (
      <FullScreen>
        <div
          style={{
            color: C.text,
            fontFamily: FONT_DATA,
            fontSize: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 16 }}>DATABASE LINK FAILED</div>
          <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.7 }}>
            {loadError}
          </div>
          <LButton onClick={loadBases} color={C.sky} side="round">
            RETRY
          </LButton>
        </div>
      </FullScreen>
    );
  }

  if (!activeBaseId) {
    return (
      <HomeScreen
        bases={bases}
        onOpen={(id) => setActiveBaseId(id)}
        onCreate={createBase}
        onRename={renameBase}
        onDelete={deleteBase}
        toasts={toasts}
      />
    );
  }

  // ─── RENDER: MAIN APP ────────────────────────────────────────────────────
  const ADD_COL_BTN_W = 56;
  const totalW =
    ROW_NUM_W +
    columns.reduce((s, c) => s + (c.width || DEFAULT_COL_W), 0) +
    ADD_COL_BTN_W;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.black,
        display: 'flex',
        color: C.text,
        fontFamily: FONT_DATA,
        overflow: 'hidden',
      }}
      onClick={() => {
        setColMenu(null);
        setBaseDropdown(false);
        setAddColOpen(false);
      }}
    >
      {/* LCARS sidebar */}
      <div
        style={{
          width: 48,
          background: C.black,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          paddingTop: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            height: 64,
            background: C.butterscotch,
            borderRadius: '0 0 0 32px',
          }}
        />
        <div style={{ flex: 1, background: C.periwinkle }} />
        <div
          style={{
            height: 80,
            background: C.gold,
            borderRadius: '32px 0 0 0',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '8px 12px 8px 0',
            background: C.black,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => setActiveBaseId(null)}
            style={{
              background: C.butterscotch,
              color: C.black,
              padding: '12px 24px',
              fontFamily: FONT_UI,
              fontSize: 20,
              letterSpacing: 2,
              borderRadius: '4px 18px 18px 4px',
              cursor: 'pointer',
            }}
            title="Return to base selector"
          >
            SPACEBASE
          </div>

          {/* Base dropdown */}
          <div style={{ position: 'relative', marginLeft: 8 }}>
            <div
              onClick={() => setBaseDropdown((v) => !v)}
              style={{
                background: C.periwinkle,
                color: C.black,
                padding: '12px 20px',
                fontFamily: FONT_UI,
                fontSize: 13,
                letterSpacing: 1,
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textTransform: 'uppercase',
              }}
            >
              {activeBase?.name || 'BASE'}
              <ChevronDown size={14} />
            </div>
            {baseDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  zIndex: 500,
                  minWidth: 220,
                }}
              >
                {bases.map((b, i) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setActiveBaseId(b.id);
                      setBaseDropdown(false);
                    }}
                    style={{
                      background: pillColor(i),
                      color: C.black,
                      padding: '10px 16px',
                      fontFamily: FONT_UI,
                      fontSize: 12,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      borderRadius: 3,
                    }}
                  >
                    {b.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 2,
              marginLeft: 16,
              flex: 1,
              minWidth: 0,
              overflowX: 'auto',
            }}
          >
            {tables.map((t) => {
              const active = t.id === activeTableId;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTableId(t.id)}
                  onDoubleClick={() => {
                    const n = prompt('Rename table', t.name);
                    if (n) renameTable(t.id, n);
                  }}
                  style={{
                    background: active ? C.butterscotch : C.butterscotchDim,
                    color: active ? C.black : C.text,
                    padding: '10px 20px',
                    fontFamily: FONT_UI,
                    fontSize: 12,
                    letterSpacing: 1,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    borderRadius: '18px 4px 4px 18px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {t.name}
                  {active && tables.length > 1 && (
                    <X
                      size={12}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete table "${t.name}"?`))
                          deleteTable(t.id);
                      }}
                    />
                  )}
                </div>
              );
            })}
            <div
              onClick={createTable}
              style={{
                background: C.sky,
                color: C.black,
                padding: '10px 14px',
                fontFamily: FONT_UI,
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              title="New table"
            >
              <Plus size={14} />
            </div>
          </div>

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: C.sky,
              borderRadius: '18px 4px 4px 18px',
              padding: '0 12px 0 16px',
              gap: 8,
            }}
          >
            <Search size={14} color={C.black} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: C.black,
                fontFamily: FONT_UI,
                fontSize: 12,
                padding: '10px 0',
                width: 180,
                textTransform: 'uppercase',
              }}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '4px 12px 8px 0',
            alignItems: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {selected.size > 0 && (
            <LButton
              onClick={deleteSelectedRows}
              color={C.salmon}
              side="right"
            >
              <Trash2 size={12} style={{ verticalAlign: -2 }} /> DELETE {selected.size}
            </LButton>
          )}
          <div style={{ flex: 1 }} />
          <div
            style={{
              background: C.gold,
              color: C.black,
              padding: '8px 16px',
              fontFamily: FONT_UI,
              fontSize: 11,
              borderRadius: '4px 18px 18px 4px',
              textTransform: 'uppercase',
            }}
          >
            {visibleRows.length} / {rows.length} ROWS
          </div>
        </div>

        {/* Grid */}
        {loadingTable ? (
          <FullScreen>
            <LcarsLoading />
          </FullScreen>
        ) : (
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              background: C.cellBg,
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ minWidth: totalW, position: 'relative' }}>
              {/* Header row */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  display: 'flex',
                  background: C.black,
                }}
              >
                <div
                  style={{
                    width: ROW_NUM_W,
                    background: C.periwinkle,
                    color: C.black,
                    fontFamily: FONT_UI,
                    fontSize: 10,
                    padding: '10px 8px',
                    position: 'sticky',
                    left: 0,
                    zIndex: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  #
                </div>
                {columns.map((col) => (
                  <ColumnHeader
                    key={col.id}
                    col={col}
                    activeSort={activeTable?.sort_column_id === col.id ? activeTable.sort_direction : null}
                    menuOpen={colMenu === col.id}
                    onToggleMenu={() =>
                      setColMenu(colMenu === col.id ? null : col.id)
                    }
                    onRename={(n) => updateColumn(col.id, { name: n })}
                    onChangeType={(t) => updateColumn(col.id, { type: t })}
                    onSortAsc={() => setSort(col.id, 'asc')}
                    onSortDesc={() => setSort(col.id, 'desc')}
                    onDelete={() => deleteColumn(col.id)}
                    onResize={(w) => updateColumn(col.id, { width: w })}
                  />
                ))}
                {/* Add-column button — sits at the right end of headers */}
                <div
                  style={{
                    position: 'relative',
                    width: ADD_COL_BTN_W,
                    minWidth: ADD_COL_BTN_W,
                    height: 44,
                    boxSizing: 'border-box',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    onClick={() => setAddColOpen((v) => !v)}
                    title="Add column"
                    style={{
                      width: '100%',
                      height: '100%',
                      background: C.butterscotch,
                      color: C.black,
                      borderRadius: '0 18px 18px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontFamily: FONT_UI,
                      transition: 'opacity 100ms',
                    }}
                  >
                    <Plus size={18} />
                  </div>
                  {addColOpen && (
                    <AddColumnPopover
                      tables={tables}
                      currentTableId={activeTableId}
                      onAdd={(n, t, opts) => {
                        addColumn(n, t, opts);
                        setAddColOpen(false);
                      }}
                      onClose={() => setAddColOpen(false)}
                    />
                  )}
                </div>
              </div>

              {/* Virtualized body */}
              <div
                style={{
                  height: totalRows * ROW_HEIGHT,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: startIdx * ROW_HEIGHT,
                    left: 0,
                    right: 0,
                  }}
                >
                  {slice.map((row, i) => {
                    const idx = startIdx + i;
                    const isSelected = selected.has(row.id);
                    return (
                      <RowView
                        key={row.id}
                        row={row}
                        idx={idx}
                        columns={columns}
                        selected={isSelected}
                        onToggleSelect={() => {
                          setSelected((s) => {
                            const n = new Set(s);
                            if (n.has(row.id)) n.delete(row.id);
                            else n.add(row.id);
                            return n;
                          });
                        }}
                        focus={focus}
                        editing={editing}
                        onFocus={(colId) =>
                          setFocus({ rowId: row.id, colId })
                        }
                        onBeginEdit={(colId) =>
                          setEditing({ rowId: row.id, colId })
                        }
                        onCommit={(colId, val) => {
                          setCellValue(row.id, colId, val);
                          setEditing(null);
                        }}
                        onCancel={() => setEditing(null)}
                        onAdvance={(colId, dir) => {
                          const rIdx = visibleRows.findIndex(
                            (r) => r.id === row.id
                          );
                          const cIdx = columns.findIndex((c) => c.id === colId);
                          advanceFocus(rIdx, cIdx, dir);
                        }}
                        linkedData={linkedData}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Empty state */}
              {rows.length === 0 && (
                <div
                  style={{
                    padding: '24px 48px 12px',
                    textAlign: 'center',
                    color: C.text,
                    fontFamily: FONT_DATA,
                    opacity: 0.6,
                  }}
                >
                  NO RECORDS. CLICK THE + BUTTON BELOW TO ADD A ROW.
                </div>
              )}

              {/* Add-row button — full-width pill under the last row */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  addRow();
                }}
                title="Add row"
                style={{
                  width: totalW,
                  minWidth: totalW,
                  height: ROW_HEIGHT,
                  background: C.butterscotch,
                  color: C.black,
                  borderRadius: '0 0 18px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontFamily: FONT_UI,
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginTop: 2,
                  transition: 'opacity 100ms',
                }}
              >
                <Plus size={14} />
                ADD ROW
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function FullScreen({ children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.black,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_DATA,
      }}
    >
      {children}
    </div>
  );
}

function HomeScreen({ bases, onOpen, onCreate, onRename, onDelete, toasts }) {
  useGoogleFonts();
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.black,
        color: C.text,
        fontFamily: FONT_DATA,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '24px 32px',
          gap: 16,
        }}
      >
        <div
          style={{
            background: C.butterscotch,
            color: C.black,
            padding: '16px 32px',
            fontFamily: FONT_UI,
            fontSize: 28,
            letterSpacing: 3,
            borderRadius: '4px 24px 24px 4px',
          }}
        >
          SPACEBASE
        </div>
        <div style={{ flex: 1 }} />
        <LButton onClick={onCreate} color={C.sky} side="round">
          <Plus size={14} style={{ verticalAlign: -2 }} /> NEW SPACEBASE
        </LButton>
      </div>

      <div
        style={{
          padding: '16px 32px 64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        {bases.map((b, i) => {
          const color = pillColor(i);
          return (
            <div
              key={b.id}
              onClick={() => onOpen(b.id)}
              style={{
                background: color,
                color: C.black,
                padding: '24px 28px',
                borderRadius: '4px 40px 40px 4px',
                cursor: 'pointer',
                position: 'relative',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'opacity 100ms',
              }}
            >
              <div>
                {renaming === b.id ? (
                  <input
                    value={renameVal}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRename(b.id, renameVal);
                        setRenaming(null);
                      } else if (e.key === 'Escape') {
                        setRenaming(null);
                      }
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.15)',
                      border: 'none',
                      outline: 'none',
                      color: C.black,
                      fontFamily: FONT_UI,
                      fontSize: 24,
                      padding: '4px 8px',
                      width: '100%',
                      textTransform: 'uppercase',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontFamily: FONT_UI,
                      fontSize: 24,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                    }}
                  >
                    {b.name}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: FONT_DATA,
                  fontSize: 12,
                  opacity: 0.7,
                  marginTop: 12,
                }}
              >
                CREATED {new Date(b.created_at).toLocaleDateString()}
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 16,
                  display: 'flex',
                  gap: 4,
                }}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameVal(b.name);
                    setRenaming(b.id);
                  }}
                  style={{
                    background: C.black,
                    color: C.text,
                    padding: '4px 10px',
                    fontFamily: FONT_UI,
                    fontSize: 10,
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  RENAME
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${b.name}"? This cannot be undone.`))
                      onDelete(b.id);
                  }}
                  style={{
                    background: C.salmon,
                    color: C.black,
                    padding: '4px 10px',
                    fontFamily: FONT_UI,
                    fontSize: 10,
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  DELETE
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ToastStack toasts={toasts} />
    </div>
  );
}

function ColumnHeader({
  col,
  activeSort,
  menuOpen,
  onToggleMenu,
  onRename,
  onChangeType,
  onSortAsc,
  onSortDesc,
  onDelete,
  onResize,
}) {
  const [renaming, setRenaming] = useState(false);
  const [val, setVal] = useState(col.name);
  useEffect(() => setVal(col.name), [col.name]);
  const w = col.width || DEFAULT_COL_W;

  return (
    <div
      style={{
        width: w,
        minWidth: w,
        background: C.periwinkle,
        color: C.black,
        borderRight: `2px solid ${C.black}`,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
        height: 44,
        boxSizing: 'border-box',
      }}
    >
      {renaming ? (
        <input
          value={val}
          autoFocus
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onRename(val);
              setRenaming(false);
            } else if (e.key === 'Escape') {
              setVal(col.name);
              setRenaming(false);
            }
          }}
          onBlur={() => {
            onRename(val);
            setRenaming(false);
          }}
          style={{
            background: 'rgba(0,0,0,0.15)',
            border: 'none',
            outline: 'none',
            color: C.black,
            fontFamily: FONT_UI,
            fontSize: 12,
            flex: 1,
            padding: 2,
            textTransform: 'uppercase',
          }}
        />
      ) : (
        <div
          onDoubleClick={() => setRenaming(true)}
          style={{
            flex: 1,
            fontFamily: FONT_UI,
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {col.name}
        </div>
      )}
      <div
        style={{
          background: C.gold,
          color: C.black,
          padding: '2px 6px',
          fontFamily: FONT_UI,
          fontSize: 9,
          borderRadius: 2,
          textTransform: 'uppercase',
        }}
      >
        {col.type.replace('_', ' ')}
      </div>
      {activeSort &&
        (activeSort === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      <ChevronDown
        size={14}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
      />
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 2,
            background: C.black,
            border: `2px solid ${C.periwinkle}`,
            zIndex: 100,
            minWidth: 180,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            onClick={() => {
              setRenaming(true);
              onToggleMenu();
            }}
          >
            <Edit3 size={12} /> RENAME
          </MenuItem>
          <MenuItem onClick={onSortAsc}>
            <ArrowUp size={12} /> SORT ASC
          </MenuItem>
          <MenuItem onClick={onSortDesc}>
            <ArrowDown size={12} /> SORT DESC
          </MenuItem>
          <div
            style={{
              color: C.text,
              fontFamily: FONT_UI,
              fontSize: 9,
              padding: '4px 8px 2px',
              opacity: 0.5,
            }}
          >
            TYPE
          </div>
          {['text', 'number', 'single_select', 'checkbox', 'date'].map((t) => (
            <MenuItem
              key={t}
              onClick={() => {
                onChangeType(t);
                onToggleMenu();
              }}
              highlight={col.type === t}
            >
              {t.replace('_', ' ').toUpperCase()}
            </MenuItem>
          ))}
          <MenuItem
            onClick={() => {
              if (confirm(`Delete column "${col.name}"?`)) {
                onDelete();
                onToggleMenu();
              }
            }}
            danger
          >
            <Trash2 size={12} /> DELETE
          </MenuItem>
        </div>
      )}
      {/* Resize handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startW = w;
          const move = (ev) => {
            const nw = Math.max(80, startW + (ev.clientX - startX));
            onResize(nw);
          };
          const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
          };
          window.addEventListener('mousemove', move);
          window.addEventListener('mouseup', up);
        }}
        onDoubleClick={() => onResize(DEFAULT_COL_W)}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
        }}
      />
    </div>
  );
}

function MenuItem({ children, onClick, danger, highlight }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: danger ? C.salmon : highlight ? C.sky : C.butterscotchDim,
        color: danger || highlight ? C.black : C.text,
        padding: '6px 10px',
        fontFamily: FONT_UI,
        fontSize: 11,
        cursor: 'pointer',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function RowView({
  row,
  idx,
  columns,
  selected,
  onToggleSelect,
  focus,
  editing,
  onFocus,
  onBeginEdit,
  onCommit,
  onCancel,
  onAdvance,
  linkedData,
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        height: ROW_HEIGHT,
        background: selected
          ? 'rgba(153,153,204,0.3)'
          : hover
          ? 'rgba(153,153,204,0.15)'
          : 'transparent',
        borderLeft: selected ? `2px solid ${C.sky}` : '2px solid transparent',
        transition: 'background 150ms',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          width: ROW_NUM_W,
          background: C.cellBg,
          borderRight: `1px solid ${C.grid}`,
          borderBottom: `1px solid ${C.grid}`,
          position: 'sticky',
          left: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 8px',
          fontFamily: FONT_DATA,
          fontSize: 12,
          color: C.text,
          boxSizing: 'border-box',
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          style={{ accentColor: C.sky }}
        />
        <span style={{ opacity: 0.6 }}>{idx + 1}</span>
      </div>
      {columns.map((col) => {
        const isFocus =
          focus && focus.rowId === row.id && focus.colId === col.id;
        const isEdit =
          editing && editing.rowId === row.id && editing.colId === col.id;
        return (
          <Cell
            key={col.id}
            col={col}
            value={row.cells[col.id]}
            focused={isFocus}
            editing={isEdit}
            onFocus={() => onFocus(col.id)}
            onBeginEdit={() => onBeginEdit(col.id)}
            onCommit={(v) => onCommit(col.id, v)}
            onCancel={onCancel}
            onAdvance={(dir) => onAdvance(col.id, dir)}
            linkedData={linkedData}
          />
        );
      })}
    </div>
  );
}

function Cell({
  col,
  value,
  focused,
  editing,
  onFocus,
  onBeginEdit,
  onCommit,
  onCancel,
  onAdvance,
  linkedData,
}) {
  const w = col.width || DEFAULT_COL_W;
  const baseStyle = {
    width: w,
    minWidth: w,
    height: ROW_HEIGHT,
    borderRight: `1px solid ${C.grid}`,
    borderBottom: `1px solid ${C.grid}`,
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    fontFamily: FONT_DATA,
    fontSize: 14,
    color: C.text,
    cursor: 'pointer',
    boxSizing: 'border-box',
    outline: focused ? `2px solid ${C.sky}` : 'none',
    outlineOffset: -2,
    background: editing ? C.cellBgEdit : 'transparent',
    justifyContent: col.type === 'number' ? 'flex-end' : 'flex-start',
  };

  // Checkbox is toggle-on-click, no edit mode
  if (col.type === 'checkbox') {
    const on = value === 'true' || value === true;
    return (
      <div
        style={baseStyle}
        onClick={(e) => {
          e.stopPropagation();
          onFocus();
          onCommit(on ? 'false' : 'true');
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            border: `2px solid ${C.sky}`,
            background: on ? C.sky : 'transparent',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {on && <Check size={12} color={C.black} />}
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div style={baseStyle}>
        <CellEditor
          col={col}
          value={value}
          onCommit={onCommit}
          onCancel={onCancel}
          onAdvance={onAdvance}
          linkedData={linkedData}
        />
      </div>
    );
  }

  // Relation pill
  if (col.type === 'relation') {
    const tid = col.options?.linked_table_id;
    const link = linkedData?.[tid];
    const label = value
      ? (link?.rowsById?.[value] || '').toString().trim() ||
        `ROW ${String(value).slice(0, 6)}`
      : '';
    return (
      <div
        style={baseStyle}
        onClick={(e) => {
          e.stopPropagation();
          onFocus();
        }}
        onDoubleClick={onBeginEdit}
      >
        {value ? (
          <div
            style={{
              background: C.lavender,
              color: C.black,
              padding: '3px 10px',
              borderRadius: 10,
              fontFamily: FONT_UI,
              fontSize: 10,
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {label}
          </div>
        ) : (
          <span style={{ opacity: 0.4 }}>—</span>
        )}
      </div>
    );
  }

  // Display mode
  let display = value ?? '';
  if (col.type === 'date') display = fmtDate(value);
  if (col.type === 'single_select' && value) {
    return (
      <div
        style={baseStyle}
        onClick={(e) => {
          e.stopPropagation();
          onFocus();
        }}
        onDoubleClick={onBeginEdit}
      >
        <div
          style={{
            background: C.gold,
            color: C.black,
            padding: '3px 10px',
            borderRadius: 10,
            fontFamily: FONT_UI,
            fontSize: 10,
            textTransform: 'uppercase',
          }}
        >
          {value}
        </div>
      </div>
    );
  }

  return (
    <div
      style={baseStyle}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
      onDoubleClick={onBeginEdit}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {display}
      </span>
    </div>
  );
}

function CellEditor({ col, value, onCommit, onCancel, onAdvance, linkedData }) {
  const [v, setV] = useState(value ?? '');
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select?.();
  }, []);

  const commitAnd = (dir = 0) => {
    onCommit(v);
    if (dir) onAdvance(dir);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitAnd(0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitAnd(e.shiftKey ? -1 : 1);
    }
  };

  const inputStyle = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: C.text,
    fontFamily: FONT_DATA,
    fontSize: 14,
    width: '100%',
    height: '100%',
    textAlign: col.type === 'number' ? 'right' : 'left',
  };

  if (col.type === 'relation') {
    const tid = col.options?.linked_table_id;
    const link = linkedData?.[tid];
    const entries = link ? Object.entries(link.rowsById) : [];
    return (
      <select
        ref={ref}
        value={v || ''}
        onChange={(e) => {
          const nv = e.target.value;
          setV(nv);
          onCommit(nv);
        }}
        onKeyDown={handleKey}
        onBlur={() => onCommit(v)}
        style={{ ...inputStyle, background: C.cellBgEdit }}
      >
        <option value="">— NONE —</option>
        {entries.map(([rowId, label]) => (
          <option key={rowId} value={rowId}>
            {(label || '').toString().trim() || `ROW ${rowId.slice(0, 6)}`}
          </option>
        ))}
        {!link && <option value="">LOADING...</option>}
      </select>
    );
  }

  if (col.type === 'single_select') {
    const opts = Array.isArray(col.options) ? col.options : [];
    return (
      <select
        ref={ref}
        value={v || ''}
        onChange={(e) => {
          const nv = e.target.value;
          setV(nv);
          onCommit(nv);
        }}
        onKeyDown={handleKey}
        onBlur={() => onCommit(v)}
        style={{
          ...inputStyle,
          background: C.cellBgEdit,
        }}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {v && !opts.includes(v) && <option value={v}>{v}</option>}
      </select>
    );
  }

  return (
    <input
      ref={ref}
      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
      value={v ?? ''}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={handleKey}
      onBlur={() => onCommit(v)}
      style={inputStyle}
    />
  );
}

function AddColumnPopover({ onAdd, onClose, tables = [], currentTableId }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const otherTables = tables.filter((t) => t.id !== currentTableId);
  const [linkedTableId, setLinkedTableId] = useState(
    otherTables[0]?.id || currentTableId || ''
  );
  const canSubmit =
    name.trim() &&
    (type !== 'relation' || (tables.length > 0 && linkedTableId));
  const submit = () => {
    if (!canSubmit) return;
    const opts =
      type === 'relation' ? { linked_table_id: linkedTableId } : null;
    onAdd(name.trim(), type, opts);
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 4,
        background: C.black,
        border: `2px solid ${C.butterscotch}`,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 300,
        minWidth: 240,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          color: C.butterscotch,
          fontFamily: FONT_UI,
          fontSize: 11,
          textTransform: 'uppercase',
        }}
      >
        NEW COLUMN
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NAME"
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        style={{
          background: C.cellBg,
          border: `1px solid ${C.grid}`,
          color: C.text,
          padding: '8px 10px',
          fontFamily: FONT_DATA,
          fontSize: 13,
          outline: 'none',
        }}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={{
          background: C.cellBg,
          border: `1px solid ${C.grid}`,
          color: C.text,
          padding: '8px 10px',
          fontFamily: FONT_UI,
          fontSize: 12,
          textTransform: 'uppercase',
        }}
      >
        <option value="text">TEXT</option>
        <option value="number">NUMBER</option>
        <option value="single_select">SINGLE SELECT</option>
        <option value="checkbox">CHECKBOX</option>
        <option value="date">DATE</option>
        <option value="relation">RELATION</option>
      </select>
      {type === 'relation' && (
        <>
          <div
            style={{
              color: C.sky,
              fontFamily: FONT_UI,
              fontSize: 10,
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            LINK TO TABLE
          </div>
          <select
            value={linkedTableId}
            onChange={(e) => setLinkedTableId(e.target.value)}
            style={{
              background: C.cellBg,
              border: `1px solid ${C.grid}`,
              color: C.text,
              padding: '8px 10px',
              fontFamily: FONT_UI,
              fontSize: 12,
              textTransform: 'uppercase',
            }}
          >
            {tables.length === 0 && <option value="">NO TABLES</option>}
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.id === currentTableId ? ' (SELF)' : ''}
              </option>
            ))}
          </select>
        </>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <LButton
          onClick={submit}
          color={C.sky}
          side="left"
          disabled={!canSubmit}
        >
          ADD
        </LButton>
        <LButton onClick={onClose} color={C.salmon} side="right">
          CANCEL
        </LButton>
      </div>
    </div>
  );
}
