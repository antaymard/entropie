import { useFormikContext } from "formik";

export default function Selector({
  name,
  label,
  options,
}: {
  name: string;
  label?: string;
  options: { value: string; label: string }[];
}) {
  const { setFieldValue, values } = useFormikContext();

  return (
    <div className="space-y-2">
      {label && <label>{label}</label>}
      <select onChange={(e) => setFieldValue(name, e.target.value)}>
        {options.map((option, i) => (
          <option key={i} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
