export const appNodeSkillPrompt = `
<app_node_generation>
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

### Available data

#### "initialState" (injected const, sync)

Previously saved state, or "null" on first run. Available immediately at first render — no async needed. You define the format; each app has its own state shape.

#### "nolenor.getData()" (async)

Returns all data from nodes connected via edges. No arguments needed.

Signature:
\`\`\`typescript
async getData(): Promise<Record<string, {
  id: string;
  type: "table" | "document" | "value" | "image" | "link";
  name: string;
  columns?: { id: string; name: string; type: string }[];  // table
  rows?: Record<string, any>[];                              // table
  value?: string | number;                                   // value
  markdown?: string;                                         // document
  url?: string;                                              // image, link
  title?: string;                                            // link
}>>
\`\`\`

#### "nolenor.saveState(state)" (async)

Persists free-form JSON. Available as "initialState" on next mount.

Signature:
\`\`\`typescript
async saveState(state: any): Promise<{ ok: true }>
\`\`\`

### Mandatory pattern

"nolenor.getData()" is async. You MUST:
1. Initialize UI state from "initialState" synchronously (filters, selections, toggles).
2. Fetch source data with "nolenor.getData()" in a "useEffect".
3. Show a loading indicator until data arrives.
4. Never render the main UI before data is loaded.

Example scaffold:
\`\`\`jsx
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
\`\`\`

### Refreshing data

To reload data on user action (e.g. a refresh button):

\`\`\`jsx
const refresh = () => {
  setLoading(true);
  nolenor.getData().then(d => {
    setData(d);
    setLoading(false);
  });
};
\`\`\`
</app_node_generation>
`;
