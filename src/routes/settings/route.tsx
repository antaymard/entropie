import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { HiMiniArrowSmallLeft } from "react-icons/hi2";
import { useAuthActions } from "@convex-dev/auth/react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

type SidebarButton = {
  label: string;
  icon: string;
  route?: string;
  action?: "logout";
  variant?: "danger";
};

type SettingsSidebarSection = {
  label: string;
  buttons: SidebarButton[];
};

const settingsSidebarSections: SettingsSidebarSection[] = [
  {
    label: "Personnalisation",
    buttons: [
      {
        label: "Templates",
        icon: "settings",
        route: "/settings/templates",
      },
      {
        label: "Noeuds par défaut",
        icon: "settings",
        route: "/settings/",
      },
    ],
  },
  {
    label: "Compte",
    buttons: [
      {
        label: "Informations du compte",
        icon: "settings",
        route: "/settings/",
      },
      {
        label: "Se déconnecter",
        icon: "logout",
        action: "logout",
        variant: "danger",
      },
    ],
  },
  {
    label: "Facturation",
    buttons: [
      {
        label: "Facturation",
        icon: "billing",
        route: "/settings/billing",
      },
    ],
  },
];

function RouteComponent() {
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Vous êtes déconnecté");
      navigate({ to: "/signin" });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const renderSettingsSidebar = () => {
    return settingsSidebarSections.map((section, index) => (
      <div key={index} className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-500 uppercase pl-2 ">
          {section.label}
        </h3>
        <div className="divide-y divide-gray-300 border border-gray-300 bg-gray-50 rounded-md">
          {section.buttons.map((button, btnIndex) => {
            // If it's an action button (like logout)
            if (button.action === "logout") {
              return (
                <button
                  key={btnIndex}
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center p-2 first:rounded-t-md last:rounded-b-md text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                >
                  {button.label}
                </button>
              );
            }

            // Regular link button
            return (
              <Link
                key={button.route}
                to={button.route!}
                className="flex items-center p-2 first:rounded-t-md last:rounded-b-md text-gray-700 hover:bg-gray-200"
              >
                {button.label}
              </Link>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="h-screen w-screen bg-white grid grid-cols-[300px_auto]">
      {/* Sidebar */}
      <div className="flex flex-col gap-4 p-5 border-r border-gray-300">
        <span className="flex items-center gap-2">
          <Link to="/" className="p-1 rounded-md bg-gray-100 hover:bg-gray-200">
            <HiMiniArrowSmallLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold">Paramètres</h1>
        </span>
        <div className="space-y-5">{renderSettingsSidebar()}</div>
      </div>

      {/* Core */}
      <div className="p-5">
        <Outlet />
      </div>
    </div>
  );
}
