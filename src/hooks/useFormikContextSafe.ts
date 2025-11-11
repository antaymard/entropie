import { useFormikContext } from "formik";

/**
 * Hook qui retourne le contexte Formik de manière sûre.
 * Retourne undefined si le composant n'est pas dans un contexte Formik.
 *
 * @returns Le contexte Formik ou undefined
 */
export function useFormikContextSafe<T = any>() {
  try {
    const context = useFormikContext<T>();
    return context;
  } catch (error) {
    // Le composant n'est pas dans un contexte Formik
    return undefined;
  }
}
