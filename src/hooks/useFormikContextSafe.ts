import { useContext } from "react";
import { FormikContext, type FormikContextType } from "formik";

/**
 * Hook qui retourne le contexte Formik de manière sûre.
 * Retourne undefined si le composant n'est pas dans un contexte Formik.
 *
 * @returns Le contexte Formik ou undefined
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFormikContextSafe<T = any>():
  | FormikContextType<T>
  | undefined {
  const context = useContext(FormikContext);
  return context as FormikContextType<T> | undefined;
}
