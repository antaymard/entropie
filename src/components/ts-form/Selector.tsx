import { memo, useId, useState } from "react";
import { Label } from "@/components/shadcn/label";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Type simplifié pour le form TanStack (les types réels sont très complexes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TanStackFormApi = any;

interface SelectorProps {
  form: TanStackFormApi;
  name: string;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Composant Selector/Dropdown qui fonctionne avec TanStack Form
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   defaultValues: { status: "active" },
 *   onSubmit: (values) => console.log(values),
 * });
 *
 * <Selector
 *   form={form}
 *   name="status"
 *   label="Statut"
 *   options={[
 *     { value: "active", label: "Actif" },
 *     { value: "inactive", label: "Inactif" },
 *   ]}
 * />
 * ```
 */
function Selector({
  form,
  name,
  label,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: SelectorProps) {
  const generatedId = useId();
  const id = `selector-${name}-${generatedId}`;

  const [open, setOpen] = useState(false);

  return (
    <form.Field name={name}>
      {(field: {
        state: {
          value: string;
          meta: { errors: string[] };
        };
        handleChange: (value: string) => void;
      }) => {
        const currentValue = field.state.value;

        const selectedOption = options.find(
          (opt) => opt.value === currentValue,
        );

        const handleSelect = (newValue: string) => {
          field.handleChange(newValue);
          setOpen(false);
        };

        return (
          <div className={cn("space-y-2", className)}>
            {label && (
              <Label
                htmlFor={id}
                className={cn(disabled && "cursor-not-allowed opacity-50")}
              >
                {label}
              </Label>
            )}
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  id={id}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={disabled}
                  className={cn(
                    "w-full justify-between",
                    !currentValue && "text-muted-foreground",
                  )}
                >
                  {selectedOption ? selectedOption.label : placeholder}
                  <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-(--radix-dropdown-menu-trigger-width)">
                {options.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentValue === option.value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors.join(", ")}
              </p>
            )}
          </div>
        );
      }}
    </form.Field>
  );
}

export default memo(Selector);
