import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import toast from "react-hot-toast";
import { useConvexAuth } from "convex/react";

export const Route = createFileRoute("/signin")({
  component: RouteComponent,
});

function RouteComponent() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Redirect to home when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/illustration_ui.png')" }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setIsSubmitting(true);
          const formData = new FormData(event.currentTarget);
          signIn("password", formData)
            .then(() => {
              // Don't navigate here - let the useEffect handle it when auth state updates
              toast.success(
                step === "signIn"
                  ? "Connexion réussie !"
                  : "Compte créé avec succès !"
              );
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
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        }}
        className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative z-10 overflow-hidden"
      >
        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

        <div className="p-10 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 items-center text-center">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="Nolenor" className="h-12 w-12" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nolenor</h1>
                <p className="text-sm text-gray-600 italic">
                  L'app des projets complexes
                </p>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mt-2">
              {step === "signIn"
                ? "Bon retour parmi nous !"
                : "Créez votre compte"}
            </h2>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <Input
                id="email"
                className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 bg-white h-11"
                name="email"
                placeholder="vous@exemple.com"
                type="email"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <Input
                id="password"
                className="border-gray-300 focus:border-violet-500 focus:ring-violet-500 bg-white h-11"
                name="password"
                placeholder="••••••••"
                type="password"
                required
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
          </div>

          <input name="flow" type="hidden" value={step} />

          {/* Submit button */}
          <Button
            type="submit"
            className="h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-violet-500/30 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {step === "signIn" ? "Connexion..." : "Création..."}
                </span>
              </div>
            ) : (
              <span>{step === "signIn" ? "Se connecter" : "S'inscrire"}</span>
            )}
          </Button>

          {/* Toggle button */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-violet-600 transition-colors font-medium"
              onClick={() => {
                setStep(step === "signIn" ? "signUp" : "signIn");
              }}
              disabled={isSubmitting}
            >
              {step === "signIn"
                ? "Pas encore de compte ? Créez-en un"
                : "Déjà un compte ? Connectez-vous"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
