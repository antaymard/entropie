import { Formik } from "formik";
import Modal from "../modal/Modal";
import TextInput from "../form-ui/TextInput";
import toast from "react-hot-toast";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { toastError } from "../utils/errorUtils";

export default function CanvasCreationModal({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}) {
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
          const canvasId = await createCanvas({ name: values.name });
          setIsModalOpen(false);
          toast.success(`Espace "${values.name}" créé avec succès !`);
          navigate({ to: `/canvas/$canvasId`, params: { canvasId } });
        } catch (error) {
          toastError(error, "Erreur lors de la création de l'espace.");
        }
      }}
    >
      {({ submitForm }) => (
        <Modal
          modalTitle="Créer un espace"
          isModalOpen={isModalOpen}
          close={() => setIsModalOpen(false)}
          footer={
            <>
              <div />
              <button
                className="bg-violet-500 px-4 py-2 rounded-md text-white hover:bg-violet-600"
                type="button"
                onClick={submitForm}
              >
                Créer
              </button>
            </>
          }
        >
          <TextInput name="name" label="Nom de l'espace" placeholder="" />
        </Modal>
      )}
    </Formik>
  );
}
