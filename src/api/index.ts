/**
 * API Canvas - Gestion de la sauvegarde des canvas
 * 
 * Ce module expose les fonctions pour sauvegarder les canvas dans la base de données
 * avec gestion automatique du debounce.
 */

export {
    initializeCanvasApi,
    saveCanvasToDbNow,
    saveCanvasToDbDebounced,
    cancelPendingSave,
} from "./canvas.api";
