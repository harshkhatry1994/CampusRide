import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bikes")({
  component: () => <Outlet />,
});
