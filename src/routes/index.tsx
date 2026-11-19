import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "@/components/folio/studio";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <Studio home />;
}
