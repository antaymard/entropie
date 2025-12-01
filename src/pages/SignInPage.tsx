import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          void signIn("password", formData);
        }}
        className="border border-gray-300 bg-white rounded p-5 flex flex-col gap-5"
      >
        <div>
          <h1 className="text-3xl font-semibold">Nolenor</h1>
          <i>L'app des projets complexes</i>
        </div>
        <input
          className="border border-gray-300 p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          name="email"
          placeholder="Email"
          type="text"
        />
        <input
          className="border border-gray-300 p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          name="password"
          placeholder="Password"
          type="password"
        />
        <input name="flow" type="hidden" value={step} />
        <button type="submit" className="rounded-md p-2 bg-blue-500 text-white">
          {step === "signIn" ? "Se connecter" : "S'inscrire"}
        </button>
        <button
          type="button"
          className="rounded-md p-2 text-blue-500 hover:bg-blue-100"
          onClick={() => {
            setStep(step === "signIn" ? "signUp" : "signIn");
          }}
        >
          {step === "signIn" ? "Je n'ai pas de compte" : "J'ai déjà un compte"}
        </button>
      </form>
    </div>
  );
}
