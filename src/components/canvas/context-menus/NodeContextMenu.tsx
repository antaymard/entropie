import { contextMenuButtonClassName } from ".";

export default function NodeContextMenu() {
  return (
    <div>
      <button className={contextMenuButtonClassName}>Node Action 1</button>
      <button className={contextMenuButtonClassName}>Node Action 2</button>
    </div>
  );
}
