export function buildSrcdoc(code: string, state: unknown | null): string {
  const serializedState = JSON.stringify(state ?? null);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.2/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const initialState = ${serializedState};

    const nolenor = {
      _request(type, payload) {
        const requestId = Math.random().toString(36).slice(2);
        return new Promise(resolve => {
          window.addEventListener("message", function handler(e) {
            if (e.data.requestId === requestId) {
              window.removeEventListener("message", handler);
              resolve(e.data.payload);
            }
          });
          window.parent.postMessage({ type, requestId, ...payload }, "*");
        });
      },
      getData()        { return this._request("nolenor:getData", {}); },
      saveState(state) { return this._request("nolenor:saveState", { state }); },
    };

    ${
      code.trim()
        ? code
        : `
    function App() {
      return (
        <div className="flex items-center justify-center h-full w-full bg-slate-50 text-slate-500 font-medium font-sans">
          <i>App code will be written here...</i>
        </div>
      );
    }
    `
    }

    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(document.getElementById("root")).render(<App />);
    } else {
      ReactDOM.createRoot(document.getElementById("root")).render(
        <div className="flex items-center justify-center p-4 text-red-500 font-mono text-sm text-center h-full w-full bg-red-50">
          ReferenceError: App is not defined.<br/>
          Make sure your code exports an App component.
        </div>
      );
    }
  </script>
</body>
</html>`;
}
