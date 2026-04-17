import React, { useEffect, useState } from 'react';
import {
  Home as HomeIcon,
  Circle,
  X,
  GripVertical,
  Plus,
  Heading,
  Type,
  Image as ImageIcon,
  Minus,
  Info,
  TextCursorInput,
  Hash,
  CheckSquare,
  ToggleLeft,
  Calendar,
  ListChecks,
  MousePointerClick,
  Link as LinkIcon,
  List as ListIcon,
  LayoutGrid,
  Square,
} from 'lucide-react';

const LUCIDE_ICONS = {
  Heading,
  Type,
  Image: ImageIcon,
  Minus,
  Info,
  TextCursorInput,
  Hash,
  CheckSquare,
  ToggleLeft,
  Calendar,
  ListChecks,
  MousePointerClick,
  Link: LinkIcon,
  List: ListIcon,
  LayoutGrid,
  Square,
};
const SpecIcon = ({ name, ...rest }) => {
  const Cmp = LUCIDE_ICONS[name] || Circle;
  return <Cmp {...rest} />;
};

const SCREEN_ICONS = { home: HomeIcon, circle: Circle };
const ScreenIcon = ({ name, ...rest }) => {
  const Cmp = SCREEN_ICONS[name] || Circle;
  return <Cmp {...rest} />;
};

// ─── LCARS PALETTE (duplicated from Spacebase.jsx) ──────────────────────────
const C = {
  black: '#000000',
  bg: '#000000',
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
  onAction: '#000000',
};

const FONT_UI = '"Archivo Black", "Antonio", sans-serif';
const FONT_DATA = '"Antonio", "Chakra Petch", sans-serif';

function usePlayModeStyles() {
  useEffect(() => {
    const id = 'sb-play-mode-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      [data-play-interactive="true"] { transition: filter 80ms, transform 80ms; cursor: pointer; }
      [data-play-interactive="true"]:hover { filter: brightness(1.2); }
      [data-play-interactive="true"]:active { transform: scale(0.97); }
    `;
    document.head.appendChild(style);
  }, []);
}

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
        color: C.onAction,
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

// ─── ID GENERATOR ───────────────────────────────────────────────────────────
let nextId = 1000;
const newId = (prefix) => `${prefix}_${++nextId}`;

// ─── COMPONENT REGISTRY ─────────────────────────────────────────────────────
// renderPreview / renderProps are stubs — implementations come in later prompts.
function Placeholder({ type }) {
  return (
    <div
      style={{
        background: '#222',
        color: '#888',
        padding: '10px 12px',
        borderRadius: 4,
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
      }}
    >
      [{type}]
    </div>
  );
}

const TITLE_SIZES = { small: 16, medium: 20, large: 24, xlarge: 32 };
const TEXT_SIZES = { small: 12, medium: 14, large: 16 };

const COMPONENT_SPECS = {
  // Content
  title: {
    category: 'Content',
    label: 'Title',
    icon: 'Heading',
    defaultProps: () => ({ text: 'Title', align: 'left', size: 'large', color: '#ffffff' }),
    renderPreview: (c) => (
      <div
        style={{
          fontSize: TITLE_SIZES[c.props.size] || 24,
          fontWeight: c.props.bold === false ? 400 : 700,
          color: c.props.color || '#ffffff',
          textAlign: c.props.align || 'left',
          lineHeight: 1.2,
        }}
      >
        {c.props.text}
      </div>
    ),
    renderProps: () => null,
  },
  text: {
    category: 'Content',
    label: 'Text',
    icon: 'Type',
    defaultProps: () => ({ text: 'Text', align: 'left' }),
    renderPreview: (c) => (
      <div
        style={{
          fontSize: TEXT_SIZES[c.props.size] || 14,
          color: c.props.color || '#ffffff',
          textAlign: c.props.align || 'left',
          lineHeight: 1.4,
        }}
      >
        {c.props.text}
      </div>
    ),
    renderProps: () => null,
  },
  image: {
    category: 'Content',
    label: 'Image',
    icon: 'Image',
    defaultProps: () => ({ url: '', alt: '', height: 160 }),
    renderPreview: (c) => {
      const height = c.props.height || 160;
      const radius = c.props.cornerRadius || 0;
      const fit = c.props.fit || 'cover';
      if (c.props.url) {
        return (
          <img
            src={c.props.url}
            alt={c.props.alt || ''}
            style={{
              width: '100%',
              height,
              objectFit: fit,
              borderRadius: radius,
              display: 'block',
            }}
          />
        );
      }
      return (
        <div
          style={{
            height,
            background: '#2a2a2a',
            color: '#888',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius,
            fontFamily: FONT_UI,
            fontSize: 11,
            letterSpacing: 2,
          }}
        >
          IMAGE
        </div>
      );
    },
    renderProps: () => null,
  },
  separator: {
    category: 'Content',
    label: 'Separator',
    icon: 'Minus',
    defaultProps: () => ({ thickness: 1, color: '#333333' }),
    renderPreview: (c) => (
      <div
        style={{
          height: c.props.thickness || 1,
          background: c.props.color || '#333333',
          margin: '6px 0',
        }}
      />
    ),
    renderProps: () => null,
  },
  hint: {
    category: 'Content',
    label: 'Hint',
    icon: 'Info',
    defaultProps: () => ({ text: 'Hint text', tone: 'info' }),
    renderPreview: (c) => (
      <div
        style={{
          fontStyle: 'italic',
          fontSize: 12,
          color: '#cccccc',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 999,
          padding: '6px 12px',
          display: 'inline-block',
        }}
      >
        {c.props.text}
      </div>
    ),
    renderProps: () => null,
  },
  // Input
  textInput: {
    category: 'Input',
    label: 'Text Input',
    icon: 'TextCursorInput',
    defaultProps: () => ({ label: 'Label', placeholder: '', value: '' }),
    renderPreview: (c) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: '#ccc', fontSize: 12 }}>{c.props.label}</div>
        <input
          type="text"
          placeholder={c.props.placeholder}
          disabled
          style={{
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 13,
          }}
        />
      </div>
    ),
    renderProps: () => null,
  },
  numberInput: {
    category: 'Input',
    label: 'Number Input',
    icon: 'Hash',
    defaultProps: () => ({ label: 'Label', placeholder: '', value: 0, min: null, max: null }),
    renderPreview: (c) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: '#ccc', fontSize: 12 }}>{c.props.label}</div>
        <input
          type="number"
          placeholder={c.props.placeholder}
          disabled
          style={{
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 13,
          }}
        />
      </div>
    ),
    renderProps: () => null,
  },
  checkbox: {
    category: 'Input',
    label: 'Checkbox',
    icon: 'CheckSquare',
    defaultProps: () => ({ label: 'Option', checked: false }),
    renderPreview: (c) => (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#fff',
          fontSize: 14,
        }}
      >
        <input type="checkbox" checked={!!c.props.checked} readOnly />
        {c.props.label}
      </label>
    ),
    renderProps: () => null,
  },
  switch: {
    category: 'Input',
    label: 'Switch',
    icon: 'ToggleLeft',
    defaultProps: () => ({ label: 'Enabled', on: false }),
    renderPreview: (c) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#fff',
          fontSize: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: c.props.on ? C.sky : '#333',
            position: 'relative',
            transition: 'background 120ms',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: c.props.on ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: '#fff',
              transition: 'left 120ms',
            }}
          />
        </div>
        {c.props.label}
      </div>
    ),
    renderProps: () => null,
  },
  datePicker: {
    category: 'Input',
    label: 'Date Picker',
    icon: 'Calendar',
    defaultProps: () => ({ label: 'Date', value: '' }),
    renderPreview: (c) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: '#ccc', fontSize: 12 }}>{c.props.label}</div>
        <div
          style={{
            background: '#111',
            color: '#aaa',
            border: '1px solid #333',
            borderRadius: 999,
            padding: '6px 14px',
            alignSelf: 'flex-start',
            fontSize: 13,
          }}
        >
          Select date
        </div>
      </div>
    ),
    renderProps: () => null,
  },
  choice: {
    category: 'Input',
    label: 'Choice',
    icon: 'ListChecks',
    defaultProps: () => ({ label: 'Choose', options: ['Option 1', 'Option 2'], value: '' }),
    renderPreview: (c) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: '#ccc', fontSize: 12 }}>{c.props.label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(c.props.options || []).map((opt, i) => (
            <div
              key={i}
              style={{
                background: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 12,
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    ),
    renderProps: () => null,
  },
  // Action
  button: {
    category: 'Action',
    label: 'Button',
    icon: 'MousePointerClick',
    defaultProps: () => ({ label: 'Button', color: 'butterscotch', action: 'none' }),
    renderPreview: (c) => {
      const bg = C[c.props.color] || C.butterscotch;
      const variant = c.props.variant || 'filled';
      const full = c.props.fullWidth !== false;
      const base = {
        padding: '10px 16px',
        borderRadius: 6,
        fontFamily: FONT_UI,
        fontSize: 13,
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'center',
        alignSelf: full ? 'stretch' : 'flex-start',
      };
      if (variant === 'outlined') {
        return (
          <div
            style={{
              ...base,
              background: 'transparent',
              color: bg,
              border: `2px solid ${bg}`,
            }}
          >
            {c.props.label}
          </div>
        );
      }
      return (
        <div style={{ ...base, background: bg, color: C.onAction }}>
          {c.props.label}
        </div>
      );
    },
    renderProps: () => null,
  },
  link: {
    category: 'Action',
    label: 'Link',
    icon: 'Link',
    defaultProps: () => ({ label: 'Link', url: '' }),
    renderPreview: (c) => (
      <div
        style={{
          color: '#66aaff',
          textDecoration: 'underline',
          fontSize: 14,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {c.props.label}
      </div>
    ),
    renderProps: () => null,
  },
  // Collection
  list: {
    category: 'Collection',
    label: 'List',
    icon: 'List',
    defaultProps: () => ({ source: '', itemLabel: 'Item', emptyText: 'No items' }),
    renderPreview: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: '#1a1a1a',
              color: '#ddd',
              padding: '10px 12px',
              borderRadius: 4,
              fontSize: 13,
              borderLeft: '2px solid #333',
            }}
          >
            Item {i + 1}
          </div>
        ))}
      </div>
    ),
    renderProps: () => null,
  },
  cards: {
    category: 'Collection',
    label: 'Cards',
    icon: 'LayoutGrid',
    defaultProps: () => ({ source: '', columns: 2, emptyText: 'No items' }),
    renderPreview: () => (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              background: '#1a1a1a',
              color: '#ddd',
              padding: 12,
              borderRadius: 6,
              minHeight: 80,
              fontSize: 13,
            }}
          >
            Card {i + 1}
          </div>
        ))}
      </div>
    ),
    renderProps: () => null,
  },
  // Layout
  container: {
    category: 'Layout',
    label: 'Container',
    icon: 'Square',
    defaultProps: () => ({ padding: 12, background: 'transparent', children: [] }),
    renderPreview: (c) => (
      <div
        style={{
          border: '1px dashed #555',
          borderRadius: 6,
          padding: c.props.padding ?? 12,
          minHeight: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
          fontFamily: FONT_UI,
          fontSize: 11,
          letterSpacing: 2,
        }}
      >
        CONTAINER
      </div>
    ),
    renderProps: () => null,
  },
};

const INITIAL_STATE = {
  screens: [
    {
      id: 'scr_1',
      name: 'Home',
      icon: 'home',
      components: [
        { id: 'cmp_1', type: 'title',  props: { text: 'Welcome', align: 'left', size: 'large', color: '#ffffff' } },
        { id: 'cmp_2', type: 'text',   props: { text: 'Lorem ipsum dolor sit amet.', align: 'left' } },
        { id: 'cmp_3', type: 'button', props: { label: 'Get started', color: 'butterscotch', action: 'none' } },
      ],
    },
  ],
  activeScreenId: 'scr_1',
  selectedComponentId: null,
  mode: 'select',
  deviceWidth: 375,
  pickerOpen: false,
  rightTab: 'general',
};

const DEVICES = [
  { label: 'iPhone SE', width: 375 },
  { label: 'iPhone Pro', width: 390 },
  { label: 'Pixel', width: 412 },
  { label: 'Tablet', width: 768 },
];

function PanelHeader({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_UI,
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: C.onAction,
        background: C.butterscotch,
        padding: '10px 14px',
      }}
    >
      {children}
    </div>
  );
}

function ScreenRow({ screen, active, canDelete, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(screen.name);
  const inputRef = React.useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== screen.name) onRename(v);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(screen.name);
    setEditing(false);
  };

  return (
    <div
      onClick={() => !editing && onSelect()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: active ? C.butterscotch : C.butterscotchDim,
        color: active ? C.onAction : C.text,
        borderRadius: 4,
        cursor: editing ? 'text' : 'pointer',
        fontFamily: FONT_DATA,
        fontSize: 13,
      }}
    >
      <ScreenIcon name={screen.icon} size={16} />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') cancel();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            background: 'transparent',
            color: 'inherit',
            border: 'none',
            outline: `1px solid ${C.sky}`,
            fontFamily: FONT_DATA,
            fontSize: 13,
            padding: 2,
            minWidth: 0,
          }}
        />
      ) : (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title="Double-click to rename"
        >
          {screen.name}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title={canDelete ? 'Delete screen' : 'At least one screen required'}
        style={{
          background: 'transparent',
          color: 'inherit',
          border: 'none',
          cursor: canDelete ? 'pointer' : 'not-allowed',
          opacity: canDelete ? 0.7 : 0.25,
          padding: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ScreensList({ state, setState }) {
  const [lastError, setLastError] = useState('');
  useEffect(() => {
    if (!lastError) return;
    const t = setTimeout(() => setLastError(''), 2000);
    return () => clearTimeout(t);
  }, [lastError]);

  const selectScreen = (id) =>
    setState((s) => ({ ...s, activeScreenId: id, selectedComponentId: null }));

  const renameScreen = (id, name) =>
    setState((s) => ({
      ...s,
      screens: s.screens.map((sc) => (sc.id === id ? { ...sc, name } : sc)),
    }));

  const deleteScreen = (id) => {
    if (state.screens.length <= 1) {
      setLastError('Cannot delete last screen');
      return;
    }
    setState((s) => {
      if (s.screens.length <= 1) return s;
      const deleted = s.screens.find((sc) => sc.id === id);
      const screens = s.screens.filter((sc) => sc.id !== id);
      const activeScreenId =
        s.activeScreenId === id ? screens[0].id : s.activeScreenId;
      const deletedHadSelection =
        deleted &&
        deleted.components.some((c) => c.id === s.selectedComponentId);
      const selectedComponentId = deletedHadSelection
        ? null
        : s.selectedComponentId;
      return { ...s, screens, activeScreenId, selectedComponentId };
    });
  };

  const addScreen = () =>
    setState((s) => {
      const id = newId('scr');
      const screen = {
        id,
        name: `Screen ${s.screens.length + 1}`,
        icon: 'circle',
        components: [],
      };
      return {
        ...s,
        screens: [...s.screens, screen],
        activeScreenId: id,
        selectedComponentId: null,
      };
    });

  const canDelete = state.screens.length > 1;

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minHeight: 0,
      }}
    >
      {state.screens.map((s) => (
        <ScreenRow
          key={s.id}
          screen={s}
          active={s.id === state.activeScreenId}
          canDelete={canDelete}
          onSelect={() => selectScreen(s.id)}
          onRename={(name) => renameScreen(s.id, name)}
          onDelete={() => deleteScreen(s.id)}
        />
      ))}
      <div style={{ marginTop: 6 }}>
        <LButton onClick={addScreen} color={C.sky} side="round">
          + NEW SCREEN
        </LButton>
      </div>
      {lastError && (
        <div
          role="alert"
          style={{
            marginTop: 8,
            padding: '6px 10px',
            background: C.salmon,
            color: C.onAction,
            fontFamily: FONT_UI,
            fontSize: 10,
            letterSpacing: 1,
            textTransform: 'uppercase',
            borderRadius: 4,
          }}
        >
          {lastError}
        </div>
      )}
    </div>
  );
}

function componentSubtitle(c) {
  const p = c.props || {};
  const val = p.text ?? p.label ?? p.url ?? '';
  const s = String(val);
  return s.length > 40 ? s.slice(0, 40) + '…' : s;
}

function ComponentsList({ state, setState, dragRef }) {
  const activeScreen =
    state.screens.find((s) => s.id === state.activeScreenId) ||
    state.screens[0];
  const components = activeScreen?.components || [];

  const [indicator, setIndicator] = useState(null); // { targetId, pos: 'above'|'below' }

  const selectComponent = (id) =>
    setState((s) => ({ ...s, selectedComponentId: id }));

  const deleteComponent = (id) =>
    setState((s) => ({
      ...s,
      screens: s.screens.map((sc) =>
        sc.id === s.activeScreenId
          ? { ...sc, components: sc.components.filter((c) => c.id !== id) }
          : sc
      ),
      selectedComponentId:
        s.selectedComponentId === id ? null : s.selectedComponentId,
    }));

  const openPicker = () => setState((s) => ({ ...s, pickerOpen: true }));

  const onDrop = (targetId) => {
    const drag = dragRef.current;
    const ind = indicator;
    dragRef.current = null;
    setIndicator(null);
    if (!drag || drag.kind !== 'reorder') return;
    if (!ind || ind.targetId !== targetId) return;
    if (drag.id === targetId) return;
    setState((s) => ({
      ...s,
      screens: s.screens.map((sc) => {
        if (sc.id !== s.activeScreenId) return sc;
        const list = sc.components.slice();
        const fromIdx = list.findIndex((c) => c.id === drag.id);
        if (fromIdx < 0) return sc;
        const [moved] = list.splice(fromIdx, 1);
        let toIdx = list.findIndex((c) => c.id === targetId);
        if (toIdx < 0) return sc;
        if (ind.pos === 'below') toIdx += 1;
        list.splice(toIdx, 0, moved);
        return { ...sc, components: list };
      }),
    }));
  };

  return (
    <>
      <div
        onDragOver={(e) => {
          if (dragRef.current) e.preventDefault();
        }}
        onDrop={() => {
          dragRef.current = null;
          setIndicator(null);
        }}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minHeight: 0,
        }}
      >
        {components.length === 0 && (
          <div
            style={{
              color: C.text,
              opacity: 0.6,
              fontSize: 12,
              fontFamily: FONT_DATA,
              padding: 6,
            }}
          >
            (no components)
          </div>
        )}
        {components.map((c) => {
          const spec = COMPONENT_SPECS[c.type];
          const selected = c.id === state.selectedComponentId;
          const showAbove =
            indicator?.targetId === c.id && indicator.pos === 'above';
          const showBelow =
            indicator?.targetId === c.id && indicator.pos === 'below';
          return (
            <div key={c.id} style={{ position: 'relative' }}>
              {showAbove && (
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: C.sky,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {showBelow && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: C.sky,
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div
                draggable
                onDragStart={(e) => {
                  dragRef.current = { kind: 'reorder', id: c.id };
                  try { e.dataTransfer.setData('text/plain', c.id); } catch {}
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (!dragRef.current) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos =
                    e.clientY - rect.top < rect.height / 2 ? 'above' : 'below';
                  setIndicator((cur) =>
                    cur && cur.targetId === c.id && cur.pos === pos
                      ? cur
                      : { targetId: c.id, pos }
                  );
                }}
                onDragLeave={() => {}}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDrop(c.id);
                }}
                onDragEnd={() => {
                  dragRef.current = null;
                  setIndicator(null);
                }}
                onClick={() => selectComponent(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: selected ? '#8a5d00' : C.butterscotchDim,
                  borderLeft: selected
                    ? `3px solid ${C.sky}`
                    : '3px solid transparent',
                  borderRadius: 4,
                  color: C.text,
                  cursor: 'pointer',
                  fontFamily: FONT_DATA,
                  fontSize: 13,
                }}
                className="cmp-row"
              >
                <GripVertical size={14} style={{ opacity: 0.6, cursor: 'grab' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    {spec?.label || c.type}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {componentSubtitle(c)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteComponent(c.id);
                  }}
                  title="Delete component"
                  style={{
                    background: 'transparent',
                    color: 'inherit',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0.7,
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 6 }}>
          <LButton onClick={openPicker} color={C.sky} side="round">
            <Plus size={12} style={{ verticalAlign: -2 }} /> ADD COMPONENT
          </LButton>
        </div>
      </div>
    </>
  );
}

function useViewportHeight() {
  const [h, setH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  useEffect(() => {
    const onResize = () => setH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return h;
}

function useViewportWidth() {
  const [w, setW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

function PhoneFrame({ state, setState, dragRef }) {
  const viewportH = useViewportHeight();
  const viewportW = useViewportWidth();
  const [hover, setHover] = useState(false);

  const handleDragOver = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.kind !== 'new') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!hover) setHover(true);
  };
  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setHover(false);
  };
  const handleDrop = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setHover(false);
    if (!drag || drag.kind !== 'new') return;
    e.preventDefault();
    const type = drag.type;
    const spec = COMPONENT_SPECS[type];
    if (!spec) return;
    const id = newId('cmp');
    const comp = { id, type, props: spec.defaultProps() };
    setState((s) => ({
      ...s,
      pickerOpen: false,
      selectedComponentId: id,
      screens: s.screens.map((sc) =>
        sc.id === s.activeScreenId
          ? { ...sc, components: [...sc.components, comp] }
          : sc
      ),
    }));
  };
  const activeScreen =
    state.screens.find((s) => s.id === state.activeScreenId) ||
    state.screens[0];
  // Cap the frame to the center panel's usable area. Side panels total 600px.
  const availableW = Math.max(280, viewportW - 600 - 64);
  const width = Math.min(state.deviceWidth, availableW);
  const maxH = Math.max(320, viewportH - 180);
  const height = Math.min(maxH, Math.round(width * 2.1));
  const BORDER = 8;
  return (
    <div
      style={{
        width,
        height,
        background: '#000',
        border: `${BORDER}px solid #222`,
        borderRadius: 32,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        flex: '0 0 auto',
      }}
    >
      {/* notch */}
      <div
        style={{
          height: 22,
          flex: '0 0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 6,
            background: '#222',
            borderRadius: 3,
          }}
        />
      </div>
      {/* scrollable content */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (state.mode === 'select') {
            setState((s) => ({ ...s, selectedComponentId: null }));
          }
        }}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
          outline: hover ? `2px dashed ${C.sky}` : 'none',
          outlineOffset: -4,
        }}
      >
        {activeScreen.components.map((c) => {
          const spec = COMPONENT_SPECS[c.type];
          const node = spec
            ? spec.renderPreview(c)
            : <Placeholder type={c.type} />;
          const selected = c.id === state.selectedComponentId;
          const selectMode = state.mode === 'select';
          const visibility = c.options?.visibility || 'always';
          if (visibility === 'never' && !selectMode) return null;
          const dim = visibility === 'never' && selectMode;
          const playInteractive =
            !selectMode &&
            ['button', 'link', 'checkbox', 'switch'].includes(c.type);
          return (
            <div
              key={c.id}
              data-play-interactive={playInteractive ? 'true' : undefined}
              onClick={(e) => {
                if (!selectMode) return;
                e.stopPropagation();
                setState((s) => ({ ...s, selectedComponentId: c.id }));
              }}
              onMouseEnter={(e) => {
                if (!selectMode) return;
                if (!selected) e.currentTarget.style.outline = `1px solid ${C.sky}`;
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.outline = 'none';
              }}
              style={{
                cursor: selectMode ? 'pointer' : 'default',
                outline: selected ? `2px solid ${C.sky}` : 'none',
                outlineOffset: 2,
                borderRadius: 2,
                opacity: dim ? 0.3 : 1,
              }}
            >
              {node}
            </div>
          );
        })}
      </div>
      {/* tab bar */}
      <div
        style={{
          flex: '0 0 56px',
          height: 56,
          borderTop: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: '#0a0a0a',
        }}
      >
        {state.screens.map((s) => {
          const active = s.id === state.activeScreenId;
          return (
            <button
              key={s.id}
              onClick={(e) => {
                e.stopPropagation();
                setState((st) => ({
                  ...st,
                  activeScreenId: s.id,
                  selectedComponentId: null,
                }));
              }}
              title={s.name}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? C.butterscotch : 'transparent',
                color: active ? C.onAction : '#888',
                border: active
                  ? `2px solid ${C.butterscotch}`
                  : '2px solid transparent',
                boxShadow: active ? `0 0 0 2px #0a0a0a` : 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 120ms, color 120ms',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = '#ddd';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = '#888';
              }}
            >
              <ScreenIcon name={s.icon} size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROPERTY FORM PRIMITIVES ───────────────────────────────────────────────
const fieldInputStyle = {
  background: C.black,
  color: C.text,
  border: `1px solid ${C.butterscotchDim}`,
  borderRadius: 4,
  padding: '6px 8px',
  fontFamily: FONT_DATA,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_UI,
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: C.butterscotch,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function TextField({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={fieldInputStyle}
    />
  );
}

function TextArea({ value, onChange, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...fieldInputStyle, resize: 'vertical' }}
    />
  );
}

function NumberField({ value, onChange }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Number(v));
      }}
      style={fieldInputStyle}
    />
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              background: active ? C.sky : C.black,
              color: active ? C.onAction : C.text,
              border: `1px solid ${C.butterscotchDim}`,
              fontFamily: FONT_UI,
              fontSize: 10,
              letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '6px 4px',
              cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SelectField({ options, value, onChange }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...fieldInputStyle, cursor: 'pointer' }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ColorField({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 40,
          height: 28,
          border: `1px solid ${C.butterscotchDim}`,
          background: C.black,
          cursor: 'pointer',
          padding: 0,
        }}
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldInputStyle, flex: 1 }}
      />
    </div>
  );
}

function CheckboxField({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: FONT_DATA,
        fontSize: 13,
        color: C.text,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

const BUTTON_COLORS = ['butterscotch', 'sky', 'periwinkle', 'salmon', 'gold'];
const ACTION_OPTIONS = ['none', 'navigate', 'link'];

// General-tab forms. Each takes (c, onChange) where onChange(patch) merges
// into c.props.
const GENERAL_FORMS = {
  title: (c, onChange) => (
    <>
      <Field label="Text">
        <TextField value={c.props.text} onChange={(v) => onChange({ text: v })} />
      </Field>
      <Field label="Align">
        <Segmented
          options={['left', 'center', 'right']}
          value={c.props.align}
          onChange={(v) => onChange({ align: v })}
        />
      </Field>
      <Field label="Size">
        <Segmented
          options={['small', 'medium', 'large']}
          value={c.props.size}
          onChange={(v) => onChange({ size: v })}
        />
      </Field>
    </>
  ),
  text: (c, onChange) => (
    <>
      <Field label="Text">
        <TextArea value={c.props.text} onChange={(v) => onChange({ text: v })} />
      </Field>
      <Field label="Align">
        <Segmented
          options={['left', 'center', 'right']}
          value={c.props.align}
          onChange={(v) => onChange({ align: v })}
        />
      </Field>
    </>
  ),
  button: (c, onChange) => (
    <>
      <Field label="Label">
        <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
      </Field>
      <Field label="Color">
        <SelectField
          options={BUTTON_COLORS}
          value={c.props.color}
          onChange={(v) => onChange({ color: v })}
        />
      </Field>
      <Field label="Action">
        <SelectField
          options={ACTION_OPTIONS}
          value={c.props.action}
          onChange={(v) => onChange({ action: v })}
        />
      </Field>
    </>
  ),
  image: (c, onChange) => (
    <>
      <Field label="URL">
        <TextField value={c.props.url} onChange={(v) => onChange({ url: v })} />
      </Field>
      <Field label="Alt text">
        <TextField value={c.props.alt} onChange={(v) => onChange({ alt: v })} />
      </Field>
      <Field label="Height">
        <NumberField value={c.props.height} onChange={(v) => onChange({ height: v })} />
      </Field>
    </>
  ),
  checkbox: (c, onChange) => (
    <>
      <Field label="Label">
        <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
      </Field>
      <Field label="State">
        <CheckboxField
          checked={c.props.checked}
          onChange={(v) => onChange({ checked: v })}
          label="Checked"
        />
      </Field>
    </>
  ),
  switch: (c, onChange) => (
    <>
      <Field label="Label">
        <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
      </Field>
      <Field label="State">
        <CheckboxField
          checked={c.props.on}
          onChange={(v) => onChange({ on: v })}
          label="On"
        />
      </Field>
    </>
  ),
  textInput: (c, onChange) => (
    <>
      <Field label="Label">
        <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
      </Field>
      <Field label="Placeholder">
        <TextField
          value={c.props.placeholder}
          onChange={(v) => onChange({ placeholder: v })}
        />
      </Field>
    </>
  ),
  numberInput: (c, onChange) => (
    <>
      <Field label="Label">
        <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
      </Field>
      <Field label="Placeholder">
        <TextField
          value={c.props.placeholder}
          onChange={(v) => onChange({ placeholder: v })}
        />
      </Field>
    </>
  ),
  datePicker: (c, onChange) => (
    <Field label="Label">
      <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
    </Field>
  ),
  choice: (c, onChange) => (
    <>
      <Field label="Label">
        <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
      </Field>
      <Field label="Options (comma separated)">
        <TextField
          value={(c.props.options || []).join(', ')}
          onChange={(v) =>
            onChange({
              options: v
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
    </>
  ),
  link: (c, onChange) => (
    <>
      <Field label="Label">
        <TextField value={c.props.label} onChange={(v) => onChange({ label: v })} />
      </Field>
      <Field label="URL">
        <TextField value={c.props.url} onChange={(v) => onChange({ url: v })} />
      </Field>
    </>
  ),
  separator: () => null,
  hint: (c, onChange) => (
    <Field label="Text">
      <TextField value={c.props.text} onChange={(v) => onChange({ text: v })} />
    </Field>
  ),
  list: (c, onChange) => (
    <Field label="Empty text">
      <TextField
        value={c.props.emptyText}
        onChange={(v) => onChange({ emptyText: v })}
      />
    </Field>
  ),
  cards: (c, onChange) => (
    <Field label="Empty text">
      <TextField
        value={c.props.emptyText}
        onChange={(v) => onChange({ emptyText: v })}
      />
    </Field>
  ),
  container: () => null,
};

const DESIGN_FORMS = {
  title: (c, onChange) => (
    <>
      <Field label="Color">
        <ColorField value={c.props.color} onChange={(v) => onChange({ color: v })} />
      </Field>
      <Field label="Weight">
        <CheckboxField
          checked={c.props.bold !== false}
          onChange={(v) => onChange({ bold: v })}
          label="Bold"
        />
      </Field>
    </>
  ),
  text: (c, onChange) => (
    <>
      <Field label="Color">
        <ColorField value={c.props.color} onChange={(v) => onChange({ color: v })} />
      </Field>
      <Field label="Size">
        <Segmented
          options={['small', 'medium', 'large']}
          value={c.props.size || 'medium'}
          onChange={(v) => onChange({ size: v })}
        />
      </Field>
    </>
  ),
  button: (c, onChange) => (
    <>
      <Field label="Variant">
        <Segmented
          options={['filled', 'outlined']}
          value={c.props.variant || 'filled'}
          onChange={(v) => onChange({ variant: v })}
        />
      </Field>
      <Field label="Width">
        <CheckboxField
          checked={c.props.fullWidth !== false}
          onChange={(v) => onChange({ fullWidth: v })}
          label="Full width"
        />
      </Field>
    </>
  ),
  image: (c, onChange) => (
    <>
      <Field label="Corner radius">
        <NumberField
          value={c.props.cornerRadius ?? 0}
          onChange={(v) => onChange({ cornerRadius: v })}
        />
      </Field>
      <Field label="Fit">
        <Segmented
          options={['cover', 'contain']}
          value={c.props.fit || 'cover'}
          onChange={(v) => onChange({ fit: v })}
        />
      </Field>
    </>
  ),
  separator: (c, onChange) => (
    <>
      <Field label="Thickness">
        <NumberField
          value={c.props.thickness ?? 1}
          onChange={(v) => onChange({ thickness: v })}
        />
      </Field>
      <Field label="Color">
        <ColorField value={c.props.color} onChange={(v) => onChange({ color: v })} />
      </Field>
    </>
  ),
};

function NoDesignOptions() {
  return (
    <div
      style={{
        fontFamily: FONT_UI,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: C.text,
        opacity: 0.5,
        textAlign: 'center',
        padding: 20,
      }}
    >
      No design options
    </div>
  );
}

function OptionsForm({ c, onChange }) {
  const opts = c.options || {};
  return (
    <>
      <Field label="Visibility">
        <Segmented
          options={['always', 'never']}
          value={opts.visibility || 'always'}
          onChange={(v) => onChange({ visibility: v })}
        />
      </Field>
      <Field label="Builder notes">
        <TextArea
          value={opts.builderNotes || ''}
          onChange={(v) => onChange({ builderNotes: v })}
        />
      </Field>
    </>
  );
}

function PropertiesPanel({ state, setState }) {
  const activeScreen =
    state.screens.find((s) => s.id === state.activeScreenId) ||
    state.screens[0];
  const selected = activeScreen?.components.find(
    (c) => c.id === state.selectedComponentId
  );
  const spec = selected ? COMPONENT_SPECS[selected.type] : null;
  const tab = state.rightTab || 'general';
  const playMode = state.mode === 'play';

  const setTab = (t) => setState((s) => ({ ...s, rightTab: t }));

  const updateProps = (patch) =>
    setState((s) => ({
      ...s,
      screens: s.screens.map((sc) =>
        sc.id !== s.activeScreenId
          ? sc
          : {
              ...sc,
              components: sc.components.map((c) =>
                c.id === s.selectedComponentId
                  ? { ...c, props: { ...c.props, ...patch } }
                  : c
              ),
            }
      ),
    }));

  const updateOptions = (patch) =>
    setState((s) => ({
      ...s,
      screens: s.screens.map((sc) =>
        sc.id !== s.activeScreenId
          ? sc
          : {
              ...sc,
              components: sc.components.map((c) =>
                c.id === s.selectedComponentId
                  ? { ...c, options: { ...(c.options || {}), ...patch } }
                  : c
              ),
            }
      ),
    }));

  const deleteSelected = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('Delete this component?')) return;
    }
    setState((s) => ({
      ...s,
      selectedComponentId: null,
      screens: s.screens.map((sc) =>
        sc.id !== s.activeScreenId
          ? sc
          : {
              ...sc,
              components: sc.components.filter(
                (c) => c.id !== s.selectedComponentId
              ),
            }
      ),
    }));
  };

  const crumb = selected
    ? `${activeScreen.name} › ${spec?.label || selected.type}`
    : activeScreen?.name || '';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: C.butterscotchDim,
      }}
    >
      <div
        style={{
          fontFamily: FONT_DATA,
          fontSize: 12,
          color: C.text,
          opacity: 0.85,
          padding: '10px 14px',
          borderBottom: `1px solid ${C.black}`,
        }}
      >
        {crumb}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: '8px 10px',
          borderBottom: `1px solid ${C.black}`,
        }}
      >
        {['general', 'design', 'options'].map((t, i) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => !playMode && setTab(t)}
              disabled={playMode}
              style={{
                flex: 1,
                background: active ? C.sky : C.black,
                color: active ? C.onAction : C.text,
                border: 'none',
                padding: '6px 10px',
                fontFamily: FONT_UI,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                cursor: playMode ? 'not-allowed' : 'pointer',
                opacity: playMode ? 0.4 : 1,
                borderRadius:
                  i === 0
                    ? '4px 0 0 4px'
                    : i === 2
                    ? '0 4px 4px 0'
                    : 0,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 14,
          minHeight: 0,
        }}
      >
        {playMode && (
          <div
            style={{
              fontFamily: FONT_UI,
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: C.text,
              opacity: 0.6,
            }}
          >
            Play mode — preview only
          </div>
        )}
        {!playMode && !selected && (
          <div
            style={{
              fontFamily: FONT_UI,
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: C.text,
              opacity: 0.6,
            }}
          >
            Select a component to edit.
          </div>
        )}
        {!playMode && selected && tab === 'general' && (
          GENERAL_FORMS[selected.type]
            ? GENERAL_FORMS[selected.type](selected, updateProps)
            : <NoDesignOptions />
        )}
        {!playMode && selected && tab === 'design' && (
          DESIGN_FORMS[selected.type]
            ? DESIGN_FORMS[selected.type](selected, updateProps)
            : <NoDesignOptions />
        )}
        {!playMode && selected && tab === 'options' && (
          <OptionsForm c={selected} onChange={updateOptions} />
        )}
      </div>
      {selected && !playMode && (
        <div
          style={{
            padding: 10,
            borderTop: `1px solid ${C.black}`,
          }}
        >
          <LButton onClick={deleteSelected} color={C.salmon} side="round">
            DELETE
          </LButton>
        </div>
      )}
    </div>
  );
}

const PICKER_CATEGORIES = ['Content', 'Input', 'Action', 'Collection', 'Layout'];

function PickerTile({ type, spec, onAdd, dragRef }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => {
        dragRef.current = { kind: 'new', type };
        try { e.dataTransfer.setData('text/plain', type); } catch {}
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onDragEnd={() => { dragRef.current = null; }}
      onClick={() => onAdd(type)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 120,
        height: 92,
        background: hover ? '#8a5d00' : C.butterscotchDim,
        color: C.text,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        fontFamily: FONT_UI,
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        padding: 8,
        userSelect: 'none',
      }}
    >
      <SpecIcon name={spec.icon} size={24} />
      <div style={{ textAlign: 'center' }}>{spec.label}</div>
    </div>
  );
}

function ComponentPicker({ state, setState, dragRef }) {
  const close = () => setState((s) => ({ ...s, pickerOpen: false }));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addType = (type) =>
    setState((s) => {
      const id = newId('cmp');
      const comp = { id, type, props: COMPONENT_SPECS[type].defaultProps() };
      return {
        ...s,
        pickerOpen: false,
        selectedComponentId: id,
        screens: s.screens.map((sc) =>
          sc.id === s.activeScreenId
            ? { ...sc, components: [...sc.components, comp] }
            : sc
        ),
      };
    });

  const grouped = PICKER_CATEGORIES.map((cat) => ({
    cat,
    types: Object.entries(COMPONENT_SPECS).filter(
      ([, spec]) => spec.category === cat
    ),
  }));

  return (
    <div
      onClick={close}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: '92vw',
          maxHeight: '80vh',
          background: C.black,
          border: `2px solid ${C.butterscotch}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: `1px solid ${C.butterscotchDim}`,
            gap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: FONT_UI,
              fontSize: 14,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: C.butterscotch,
            }}
          >
            ADD COMPONENT
          </div>
          <button
            onClick={close}
            title="Close"
            style={{
              background: C.salmon,
              color: C.onAction,
              border: 'none',
              width: 28,
              height: 28,
              borderRadius: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minHeight: 0,
          }}
        >
          {grouped.map(({ cat, types }) => (
            <div key={cat}>
              <div
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: C.butterscotch,
                  marginBottom: 10,
                }}
              >
                {cat}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {types.map(([type, spec]) => (
                  <PickerTile
                    key={type}
                    type={type}
                    spec={spec}
                    onAdd={addType}
                    dragRef={dragRef}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PERSIST_KEYS = ['screens', 'activeScreenId'];
function pickPersisted(s) {
  const out = {};
  for (const k of PERSIST_KEYS) if (s[k] !== undefined) out[k] = s[k];
  return out;
}

export default function MobileLayoutEditor({ onClose, initialState, onSave, baseName }) {
  useGoogleFonts();
  usePlayModeStyles();
  const [state, setState] = useState(() => ({
    ...INITIAL_STATE,
    ...(initialState ? pickPersisted(initialState) : {}),
  }));
  const dragRef = React.useRef(null);

  // Debounced save of persisted keys only.
  const saveRef = React.useRef(onSave);
  saveRef.current = onSave;
  const lastSavedRef = React.useRef(JSON.stringify(pickPersisted(state)));
  useEffect(() => {
    if (!saveRef.current) return;
    const snapshot = JSON.stringify(pickPersisted(state));
    if (snapshot === lastSavedRef.current) return;
    const t = setTimeout(() => {
      lastSavedRef.current = snapshot;
      saveRef.current(JSON.parse(snapshot));
    }, 400);
    return () => clearTimeout(t);
  }, [state]);

  const setMode = (mode) => setState((s) => ({ ...s, mode }));
  const setDeviceWidth = (w) =>
    setState((s) => ({ ...s, deviceWidth: w }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.black,
        color: C.text,
        fontFamily: FONT_DATA,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          height: 48,
          flex: '0 0 48px',
          background: C.black,
          borderBottom: `2px solid ${C.butterscotch}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 12px',
        }}
      >
        <button
          onClick={onClose}
          title="Back"
          style={{
            background: C.salmon,
            color: C.onAction,
            border: 'none',
            width: 32,
            height: 32,
            borderRadius: 16,
            cursor: 'pointer',
            fontFamily: FONT_UI,
            fontSize: 16,
            lineHeight: '32px',
            padding: 0,
          }}
        >
          ←
        </button>
        <div
          style={{
            fontFamily: FONT_UI,
            fontSize: 14,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: C.butterscotch,
            whiteSpace: 'nowrap',
          }}
        >
          LAYOUT EDITOR{baseName ? ` · ${baseName}` : ''}
        </div>
        <div style={{ flex: 1 }} />
        <select
          value={state.deviceWidth}
          onChange={(e) => setDeviceWidth(Number(e.target.value))}
          style={{
            background: C.cellBg,
            color: C.text,
            border: `1px solid ${C.butterscotch}`,
            fontFamily: FONT_UI,
            fontSize: 11,
            letterSpacing: 1,
            padding: '6px 10px',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {DEVICES.map((d) => (
            <option key={d.width} value={d.width}>
              {d.label} ({d.width})
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 2 }}>
          <LButton
            onClick={() => setMode('select')}
            color={state.mode === 'select' ? C.sky : C.butterscotchDim}
            side="left"
          >
            SELECT
          </LButton>
          <LButton
            onClick={() => setMode('play')}
            color={state.mode === 'play' ? C.sky : C.butterscotchDim}
            side="right"
          >
            PLAY
          </LButton>
        </div>
        <LButton disabled color={C.butterscotch} side="round">
          PUBLISH
        </LButton>
      </div>

      {/* THREE-PANEL ROW */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          minHeight: 0,
        }}
      >
        {/* LEFT */}
        <div
          style={{
            width: 280,
            flex: '0 0 280px',
            background: C.butterscotchDim,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <PanelHeader>SCREENS</PanelHeader>
          <ScreensList state={state} setState={setState} />
          <PanelHeader>COMPONENTS</PanelHeader>
          <ComponentsList state={state} setState={setState} dragRef={dragRef} />
        </div>

        {/* CENTER */}
        <div
          style={{
            flex: 1,
            background: C.bg,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <PanelHeader>{state.deviceWidth} PX</PanelHeader>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              minHeight: 0,
            }}
          >
            <PhoneFrame state={state} setState={setState} dragRef={dragRef} />
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            width: 320,
            flex: '0 0 320px',
            background: C.butterscotchDim,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <PanelHeader>PROPERTIES</PanelHeader>
          <PropertiesPanel state={state} setState={setState} />
        </div>
      </div>
      {state.pickerOpen && (
        <ComponentPicker
          state={state}
          setState={setState}
          dragRef={dragRef}
        />
      )}
    </div>
  );
}
