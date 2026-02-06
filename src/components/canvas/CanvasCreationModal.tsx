import { Formik } from "formik";
import TextInput from "../form-ui/TextInput";
import toast from "react-hot-toast";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { toastError } from "../utils/errorUtils";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";

export default function CanvasCreationModal() {
  const createCanvas = useMutation(api.canvases.createCanvas);
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{ name: "" }}
      validate={(values) => {
        const errors: { name?: string } = {};
        if (!values.name.trim()) {
          errors.name = "Le nom ne peut pas être vide";
        }
        return errors;
      }}
      onSubmit={async (values) => {
        try {
          console.log("omf");
          const newCanvasId = await createCanvas({
            name: values.name,
          });
          if (newCanvasId) {
            toast.success(`Espace "${values.name}" créé avec succès !`);
            navigate({
              to: `/canvas/${newCanvasId}`,
              params: { canvasId: newCanvasId },
            });
          } else {
            throw new Error("Échec de la création de l'espace.");
          }
        } catch (error) {
          toastError(error, "Erreur lors de la création de l'espace.");
        }
      }}
    >
      {({ submitForm }) => (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un espace</DialogTitle>
            <DialogDescription>
              Donnez un nom à ce nouvel espace.
            </DialogDescription>
          </DialogHeader>
          <div className="my-3">
            <TextInput name="name" label="Nom de l'espace" placeholder="" />
          </div>
          <DialogFooter>
            <Button type="button" onClick={submitForm}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Formik>
  );
}
