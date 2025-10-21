import type { InputHTMLAttributes } from "react";
import { useField } from "formik";

interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  label?: string;
  name: string;
  helperText?: string;
  required?: boolean;
}

export default function TextInput({
  label,
  name,
  helperText,
  required = false,
  className = "",
  ...props
}: TextInputProps) {
  // Utilise useField de Formik pour gérer le champ
  const [field, meta] = useField(name);

  const errorMessage = meta.touched && meta.error ? meta.error : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-700 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        type="text"
        className={`
          px-3 py-2 
          border rounded-md 
          transition-colors
          bg-gray-100 hover:bg-gray-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-200 disabled:cursor-not-allowed
          ${errorMessage ? "border-red-500" : "border-gray-300"}
          ${className}
        `}
        {...field}
        {...props}
      />
      {errorMessage && (
        <span className="text-sm text-red-500">{errorMessage}</span>
      )}
      {!errorMessage && helperText && (
        <span className="text-sm text-gray-500">{helperText}</span>
      )}
    </div>
  );
}
