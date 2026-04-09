/**
 * Global sequential render queue for document node previews.
 * Nodes enqueue their heavy render work here so they execute one at a time,
 * with a small gap between each to let the browser handle interactions.
 */

const GAP_MS = 30; // idle gap between renders so the UI stays responsive

type Task = () => void;

let queue: Task[] = [];
let running = false;

function processNext() {
  if (queue.length === 0) {
    running = false;
    return;
  }
  const task = queue.shift()!;
  task();
  // Leave a gap before the next render so React can flush + browser can paint
  setTimeout(processNext, GAP_MS);
}

/**
 * Enqueue a render task. Returns a cancel function.
 * The task will be called when it's this node's turn.
 */
export function enqueuePreviewRender(task: Task): () => void {
  queue.push(task);
  if (!running) {
    running = true;
    // Start on next microtask so the first paint can happen
    setTimeout(processNext, 0);
  }
  return () => {
    const idx = queue.indexOf(task);
    if (idx !== -1) queue.splice(idx, 1);
  };
}
