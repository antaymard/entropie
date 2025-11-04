import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { HiMiniArrowSmallLeft } from "react-icons/hi2";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

type SidebarButton = {
  label: string;
  icon: string;
  route: string;
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

function renderSettingsSidebar() {
  return settingsSidebarSections.map((section, index) => (
    <div key={index} className="space-y-1">
      <h3 className="text-sm font-semibold text-gray-500 uppercase pl-2 ">
        {section.label}
      </h3>
      <div className="divide-y divide-gray-300 border border-gray-300 bg-gray-50 rounded-md">
        {section.buttons.map((button) => (
          <Link
            key={button.route}
            to={button.route}
            className="flex items-center p-2 first:rounded-t-md last:rounded-b-md text-gray-700 hover:bg-gray-200"
          >
            {/* {button.icon} */}
            {button.label}
          </Link>
        ))}
      </div>
    </div>
  ));
}

function RouteComponent() {
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
