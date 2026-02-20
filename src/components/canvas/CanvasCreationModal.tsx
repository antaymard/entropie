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
          errors.name = "Name cannot be empty";
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
            toast.success(`Workspace "${values.name}" created successfully!`);
            navigate({
              to: `/canvas/${newCanvasId}`,
              params: { canvasId: newCanvasId },
            });
          } else {
            throw new Error("Failed to create workspace.");
          }
        } catch (error) {
          toastError(error, "Error while creating workspace.");
        }
      }}
    >
      {({ submitForm }) => (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>
              Give this new workspace a name.
            </DialogDescription>
          </DialogHeader>
          <div className="my-3">
            <TextInput name="name" label="Workspace name" placeholder="" />
          </div>
          <DialogFooter>
            <Button type="button" onClick={submitForm}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Formik>
  );
}
