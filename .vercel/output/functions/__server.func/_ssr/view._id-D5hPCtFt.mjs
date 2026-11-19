import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route } from "./router-DampnXsV.mjs";
import { n as getBundle, t as Studio } from "./studio-B5aUiz5c.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/view._id-D5hPCtFt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ViewPage() {
	const { id } = Route.useParams();
	const [bundle, setBundle] = (0, import_react.useState)(void 0);
	(0, import_react.useEffect)(() => {
		let live = true;
		getBundle(id).then((found) => {
			if (live) setBundle(found);
		}).catch(() => {
			if (live) setBundle(null);
		});
		return () => {
			live = false;
		};
	}, [id]);
	if (bundle === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "px-6 py-16 text-sm text-muted",
		children: "Открываю документ…"
	});
	if (!bundle) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-xl px-6 py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-semibold tracking-tight text-ink",
			children: "Документ не найден на этом устройстве"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-pretty text-muted",
			children: "Ссылка хранит разбор в браузере, где он был создан. Скачайте HTML на том устройстве и откройте файл — так страница смотрится где угодно."
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, { initial: bundle });
}
//#endregion
export { ViewPage as component };
