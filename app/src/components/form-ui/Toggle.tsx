import { useFormikContext } from "formik";

export default function Toggle({
  name,
  label,
}: {
  name: string;
  label?: string;
}) {
  const { values, setFieldValue } = useFormikContext<any>();

  const handleToggle = () => {
    setFieldValue(name, !values[name]);
  };

  return (
    <div>
      <label>
        <input type="checkbox" checked={values[name]} onChange={handleToggle} />
        {label}
      </label>
    </div>
  );
}
