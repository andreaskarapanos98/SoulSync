import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/errors", label: "Errors & Audit Log" },
  { to: "/admin/questions", label: "Questionnaire" },
  { to: "/admin/funnel", label: "Funnel & Analytics" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-8">
      <nav className="w-44 shrink-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Admin</p>
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-neutral-800 dark:text-brand-300"
                    : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
