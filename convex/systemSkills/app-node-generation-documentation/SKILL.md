---
name: app-node-generation-documentation
description: Documentation for generating AppNodes in the system, including rules, SDK usage, available data, and APIs. Must be loaded before generating or updating any AppNode.
---

# AppNode Generation documentation

When generating or updating an "app" node, you MUST follow these strict rules.

## App Node Generation Rules

You generate a single React component for an AppNode.

### Strict rules

- The component MUST be named "App"
- No "import" statements — all libs are globals
- No "export default"
- React is global: use "React.useState", "React.useEffect", etc.
- Tailwind CSS classes are available
- Chart.js is available as global "Chart"

### Mandatory workflow — ALWAYS follow this order

1. **Read source nodes first.** Before writing any code, call "readNode" on each node connected to the AppNode. This gives you the exact schema: column names, data types, field names, and sample data. Never guess or assume data shapes.
2. **Design the UI** based on the actual schema you just read. Reference the real column names and field names from step 1.
3. **Generate the component** following the mandatory pattern below.

---

## Available data & APIs

### `initialState` (injected const, sync)

Previously saved state, or `null` on first run. Available immediately at first render — no async needed. You define the format; each app has its own state shape.

---

### `nolenor.getData()` (async)

Returns all data from nodes connected via edges. No arguments needed.

```typescript
async getData(): Promise<Record<string, {
  id: string;
  type: "table" | "document" | "value" | "image" | "link" | "title" | "pdf";
  name: string;
  // --- table ---
  columns?: { id: string; name: string; type: string }[];
  // rows properties are flattened: row.annee NOT row.cells.annee
  rows?: Record<string, any>[];
  // --- document ---
  markdown?: string;
  // --- value ---
  value?: string | number;
  label?: string;
  unit?: string;
  // --- image ---
  url?: string;              // first image URL
  images?: { url: string }[]; // all images
  // --- link ---
  title?: string;
  // --- title node ---
  text?: string;
  level?: string;
  // --- pdf ---
  files?: { url: string; filename: string; mimeType?: string }[];
}>>
```

**Important**: For table rows, properties are directly on the row object. Use `row.annee`, not `row.cells?.annee`.

---

### `nolenor.saveState(state)` (async)

Persists free-form JSON. Available as `initialState` on next mount.

```typescript
async saveState(state: any): Promise<{ ok: true }>
```

---

### `nolenor.fetch(url, options?)` (async)

Makes an HTTP request proxied through the parent window. Use this to call **public external APIs**.

```typescript
async fetch(url: string, options?: RequestInit): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  data: any; // parsed JSON if response is JSON, raw string otherwise
}>
```

**Security constraints** — the following are automatically blocked and return `{ ok: false, status: 0 }`:

- `localhost` and loopback addresses (`127.x.x.x`, `0.x.x.x`)
- Private IP ranges (`10.x.x.x`, `172.16–31.x.x`, `192.168.x.x`, `169.254.x.x`)
- Non-HTTP(S) protocols

**No API key injection is available.** All requests are made from the browser with no server-side secret. Only use public, unauthenticated endpoints, or endpoints that accept a key passed directly in the URL or headers (the user must hardcode it in the component code themselves).

Example — fetching a public JSON API:

```jsx
React.useEffect(() => {
  nolenor.fetch("https://api.example.com/data").then((res) => {
    if (res.ok) setData(res.data);
    else setError(res.statusText);
    setLoading(false);
  });
}, []);
```

Example — with headers (e.g. a user-supplied API key):

```jsx
nolenor.fetch("https://api.example.com/endpoint", {
  method: "GET",
  headers: {
    Authorization: "Bearer <API_KEY_HERE>",
  },
});
```

---

## Mandatory pattern

`nolenor.getData()` and `nolenor.fetch()` are async. You MUST:

1. Initialize UI state from `initialState` synchronously (filters, selections, toggles).
2. Fetch source data with `nolenor.getData()` (and/or `nolenor.fetch()`) in a `useEffect`.
3. Show a loading indicator until data arrives.
4. Never render the main UI before data is loaded.

```jsx
const App = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // State restored from previous session (sync, available immediately)
  const [filters, setFilters] = React.useState(initialState?.filters ?? []);

  // Fetch source node data (async)
  React.useEffect(() => {
    nolenor.getData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Chargement...
      </div>
    );
  }

  // data is guaranteed non-null below this point

  const handleFilterChange = (f) => {
    setFilters(f);
    nolenor.saveState({ filters: f });
  };

  return ( /* your UI using data and filters */ );
};
```

---

## Refresh

**Do NOT add a refresh button in the component code.** The AppNode already has a built-in refresh button in its toolbar that reloads the iframe. There is no need to replicate this inside the component.

---

## Runtime errors

The iframe automatically reports runtime errors (uncaught exceptions, unhandled promise rejections, `console.error`, React render errors caught by an injected ErrorBoundary) back to the canvas. They are stored under `values.errors` on the AppNode and exposed when you `read_nodes` it.

- **You do NOT need to write any error-capture code.** The bridge installs `window.onerror`, `unhandledrejection`, a `console.error` patch, and an ErrorBoundary automatically.
- Errors are deduplicated, debounced (~500ms), and capped at the 10 most recent.
- When the AppNode's `code` is updated (via `set_node_data` or `patch_app_node_code`), `values.errors` is reset to `[]` automatically.
- After patching the code, you can `read_nodes` again to verify whether new errors appeared.
