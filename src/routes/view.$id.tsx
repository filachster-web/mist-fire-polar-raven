import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Studio } from "@/components/folio/studio";
import { getBundle } from "@/lib/folio/store";
import type { Bundle } from "@/lib/folio/types";

export const Route = createFileRoute("/view/$id")({
  component: ViewPage,
});

function ViewPage() {
  const { id } = Route.useParams();
  const [bundle, setBundle] = useState<Bundle | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    getBundle(id)
      .then((found) => {
        if (live) setBundle(found);
      })
      .catch(() => {
        if (live) setBundle(null);
      });
    return () => {
      live = false;
    };
  }, [id]);

  if (bundle === undefined) {
    return <main className="px-6 py-16 text-sm text-muted">Открываю документ…</main>;
  }
  if (!bundle) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Документ не найден на этом устройстве</h1>
        <p className="mt-3 text-pretty text-muted">
          Ссылка хранит разбор в браузере, где он был создан. Скачайте HTML на том устройстве и откройте файл — так страница смотрится где угодно.
        </p>
      </main>
    );
  }
  return <Studio initial={bundle} />;
}
