import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";

export default function SelectionContextMenu() {
  return (
    <>
      <DropdownMenuLabel>Actions sur la sélection</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => alert("Action 1 exécutée")}>
        Action 1
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => alert("Action 2 exécutée")}>
        Action 2
      </DropdownMenuItem>
    </>
  );
}
