// Ce hook doit trouver les nodes connectés à un canvasNode donné (format Node xyFlow/reactflow)
// Il doit fouiller dans le store zustand NodeData pour récupérer les données associées à ces nodes connectés

// Les inputs du node sont un node xyNode, et un type ("source" | "target" | "all")
// Le hook retourne un array de type :
//
//    Array<{
//       node: Node; // Le node connecté format xyNode
//       nodeData: NodeData | null; // Les données associées, ou null si pas trouvées
//       type: "source" | "target"; // Le type de connexion
//    }>;
// }

// On peut utiliser les hooks useNodes() de reactflow pour récupérer tous les nodes du canvas, ou useEdges() pour récupérer les edges
// Ensuite, on peut filtrer les edges pour trouver ceux connectés au node donné, selon le type demandé
// Puis, pour chaque edge connecté, on trouve le node connecté (source ou target) et on récupère ses données depuis le store NodeData

// Il faut peut-être créer la méthode zustand pour récupérer les données NodeData par nodeDataId ?

// Optimimser le hook pour éviter les recalculs inutiles
