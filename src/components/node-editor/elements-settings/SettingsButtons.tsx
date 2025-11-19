import { useFormikContext } from "formik";
import { get } from "lodash";

export function StyleClickButton({
  elementPath,
  styleName,
  styleValue,
  label,
  icon,
}: {
  elementPath: string;
  styleName: string;
  styleValue: string | number;
  label?: string | React.ReactNode;
  icon: React.ReactNode;
}) {
  const { values, setFieldValue } = useFormikContext<any>();
  const stylePath = elementPath + ".style." + styleName;
  const isActive = get(values, stylePath) === styleValue;

  return (
    <button
      type="button"
      className={`bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 rounded-md px-3 h-10 border-2 ${
        isActive ? " border-gray-500 font-medium" : "border-transparent"
      }`}
      onClick={() => setFieldValue(stylePath, styleValue)}
    >
      {icon} {label}
    </button>
  );
}

export function StyleValueInput({
  elementPath,
  styleName,
  label,
  icon,
  valueType = "number",
  disabled,
  unit = "px",
}: {
  elementPath: string;
  styleName: string | string[];
  label: string;
  icon: React.ReactNode;
  valueType?: "number" | "text";
  disabled?: boolean;
  unit?: string;
}) {
  const { values, setFieldValue } = useFormikContext<any>();

  // Support both single string and array of strings
  const styleNames = Array.isArray(styleName) ? styleName : [styleName];
  const firstStylePath = elementPath + ".style." + styleNames[0];

  const currentValue = get(values, firstStylePath) || "0";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = String(e.target.value) + unit;
    // Update all style names with the same value
    styleNames.forEach((name) => {
      const stylePath = elementPath + ".style." + name;
      setFieldValue(stylePath, newValue);
    });
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-3">{icon}</span>
      <input
        disabled={disabled}
        className="bg-gray-100 not-disabled:hover:bg-gray-200 h-10 rounded-md w-full pl-10 pr-2 disabled:opacity-50 disabled:cursor-not-allowed "
        title={label}
        type={valueType}
        value={String(currentValue)?.replace(unit, "") || 0}
        onChange={handleChange}
      />
    </div>
  );
}
