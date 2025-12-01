import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import toast from "react-hot-toast";

export const Route = createFileRoute("/signin")({
  component: RouteComponent,
});

function RouteComponent() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  const navigate = useNavigate();

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/illustration_ui.png')" }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          signIn("password", formData)
            .then(() => {
              navigate({ to: "/" });
            })
            .catch((e) => {
              console.error(e);
              const errorMessage = e?.message || String(e);

              if (errorMessage.includes("already exists")) {
                toast.error(
                  "Ce compte existe déjà. Connectez-vous ou utilisez un autre email."
                );
              } else if (
                errorMessage.includes("Invalid password") ||
                errorMessage.includes("invalid password") ||
                errorMessage.includes("Invalid secret")
              ) {
                toast.error("Mot de passe incorrect.");
              } else if (errorMessage.includes("InvalidAccountId")) {
                toast.error("Aucun compte trouvé avec cet email.");
              } else if (errorMessage.includes("Invalid email")) {
                toast.error("Email invalide.");
              } else {
                toast.error("Impossible de se connecter. Veuillez réessayer.");
              }
            });
        }}
        className="bg-black/30 backdrop-blur-md border border-white/50 rounded overflow-hidden max-w-3xl"
      >
        <div className="p-8 max-w-sm flex flex-col gap-5 h-full justify-center mx-auto">
          <div className="flex gap-4 items-center">
            <img src="/favicon.svg" alt="" className="h-10" />
            <div className="text-white">
              <h1 className="text-3xl font-semibold">Nolenor</h1>
              <i>L'app des projets complexes</i>
            </div>
          </div>
          <Input
            className="border border-gray-300 p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            name="email"
            placeholder="Email"
            type="email"
          />
          <Input
            className="border border-gray-300 p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            name="password"
            placeholder="Password"
            type="password"
          />
          <input name="flow" type="hidden" value={step} />
          <Button type="submit">
            {step === "signIn" ? "Se connecter" : "S'inscrire"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep(step === "signIn" ? "signUp" : "signIn");
            }}
          >
            {step === "signIn"
              ? "Je n'ai pas de compte"
              : "J'ai déjà un compte"}
          </Button>
        </div>

        {/* <img src="/illustration_dune.jpg" alt="" className="object-cover" /> */}
      </form>
    </div>
  );
}
