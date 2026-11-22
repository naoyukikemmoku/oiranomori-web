// ディープ利用案内（/deep-guide/）の「場内マップ」の項（#map）。spec §10.4。
// App の公開の取り口 deepmap.php から、紙の絵のタイルの設定（map）とその日のテントの位置（tents）を実行時に読み、Leaflet で描く。
// 地図の設定値（tiles・ズーム・bounds・corners・center・size・bearing）はここに書き写さない
// （ナオが絵を描き直したとき、App 側の入れ替えだけで HP にも反映されるようにするため）。
// 出すのは紙の絵とその日のテントだけ。背景の地図（地理院地図・OSM・航空写真など）と現在地は出さない。
// 外へ出るリクエストは、Leaflet と leaflet-rotate の CDN・この取り口・/app/deepmap/ のタイルだけ。
// 取り口の形の正本は OirasApp の docs/spec_camp.md §6-11・docs/spec_geo.md。

export const DEEPMAP_API = "https://oiranomori.com/app/camp/api/deepmap.php";

// Leaflet は /lightforest-map/ と同じ版を同じ CDN（unpkg・SRI）から読む
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_CSS_SRI = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_JS_SRI = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
// 紙と同じ向きに回す。App のポータルと同じ leaflet-rotate 0.2.8（npm の公開物そのまま・GPL-3.0）
const ROTATE_JS =
	"https://unpkg.com/leaflet-rotate@0.2.8/dist/leaflet-rotate.js";
const ROTATE_JS_SRI = "sha256-Ta4E5oRGbcJDRqmfp6qbzK7uDvaQyR0yDOGP6Bi1Ng8=";

// 今日のテントの丸印。ポータルの「ほかの組のテント」（App の assets/tent.svg）のオレンジ
export const DEEPMAP_TENT_COLOR = "#EC5F32";

type LatLng = [number, number];
type MapConfig = {
	tiles: string;
	minZoom: number;
	maxNativeZoom: number;
	maxZoom: number;
	bounds: [LatLng, LatLng];
	corners: LatLng[];
	center: LatLng;
	size: [number, number];
	bearing: number;
};
type DeepMapData = { map: MapConfig; tents: LatLng[] };

const isNum = (v: unknown): v is number =>
	typeof v === "number" && Number.isFinite(v);
const isLatLng = (v: unknown): v is LatLng =>
	Array.isArray(v) && v.length === 2 && isNum(v[0]) && isNum(v[1]);

// 取り口の返りを確かめる。形が違えば null（描かずに「読み込めませんでした」を出す）
function parse(json: unknown): DeepMapData | null {
	if (!json || typeof json !== "object") return null;
	const j = json as Record<string, unknown>;
	const m = j.map as Record<string, unknown> | undefined;
	if (j.ok !== true || !m || typeof m !== "object") return null;
	const {
		tiles,
		minZoom,
		maxNativeZoom,
		maxZoom,
		bounds,
		corners,
		center,
		size,
		bearing,
	} = m;
	if (
		typeof tiles !== "string" ||
		!tiles.startsWith("https://") ||
		!isNum(minZoom) ||
		!isNum(maxNativeZoom) ||
		!isNum(maxZoom) ||
		!(Array.isArray(bounds) && bounds.length === 2 && bounds.every(isLatLng)) ||
		!(
			Array.isArray(corners) &&
			corners.length === 4 &&
			corners.every(isLatLng)
		) ||
		!isLatLng(center) ||
		!(
			Array.isArray(size) &&
			size.length === 2 &&
			isNum(size[0]) &&
			isNum(size[1]) &&
			size[0] > 0 &&
			size[1] > 0
		) ||
		!isNum(bearing) ||
		!Array.isArray(j.tents)
	) {
		return null;
	}
	return {
		map: {
			tiles,
			minZoom,
			maxNativeZoom,
			maxZoom,
			bounds,
			corners,
			center,
			size,
			bearing,
		} as MapConfig,
		tents: (j.tents as unknown[]).filter(isLatLng),
	};
}

async function fetchDeepMap(): Promise<DeepMapData> {
	const res = await fetch(DEEPMAP_API, { credentials: "omit" });
	if (!res.ok) throw new Error(`deepmap ${res.status}`);
	const data = parse(await res.json());
	if (!data) throw new Error("deepmap: unexpected shape");
	return data;
}

function loadCss(href: string, integrity: string): void {
	if (document.querySelector(`link[href="${href}"]`)) return;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = href;
	link.integrity = integrity;
	link.crossOrigin = "anonymous";
	document.head.appendChild(link);
}

function loadScript(src: string, integrity: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const sc = document.createElement("script");
		sc.src = src;
		sc.integrity = integrity;
		sc.crossOrigin = "anonymous";
		sc.onload = () => resolve();
		sc.onerror = () => reject(new Error(`load ${src}`));
		document.head.appendChild(sc);
	});
}

// Leaflet → leaflet-rotate の順に読む（leaflet-rotate は読み込まれた L を書き換えるため）
async function loadLeaflet(): Promise<any> {
	const w = window as unknown as { L?: any };
	loadCss(LEAFLET_CSS, LEAFLET_CSS_SRI);
	if (!w.L) await loadScript(LEAFLET_JS, LEAFLET_JS_SRI);
	if (w.L && typeof w.L.Map.prototype.setBearing !== "function") {
		await loadScript(ROTATE_JS, ROTATE_JS_SRI);
	}
	// 回せないと紙が逆さまに近い向きで出るため、回転が使えなければ失敗として扱う
	if (!w.L || typeof w.L.Map.prototype.setBearing !== "function") {
		throw new Error("leaflet-rotate unavailable");
	}
	return w.L;
}

// 紙の全体が枠に入る拡大率（size＝紙の 幅・高さ m。紙と同じ向きに回した後の画面での縦横。pad＝四辺の余白 px）。
// App の campmap.js の fitZoom と同じ考え方（leaflet-rotate の fitBounds は回した後の縦横を見ないため）
function fitZoom(
	map: any,
	size: [number, number],
	lat: number,
	pad = 12,
): number {
	const s = map.getSize();
	const mpp = Math.max(
		size[0] / Math.max(s.x - pad * 2, 40),
		size[1] / Math.max(s.y - pad * 2, 40),
	); // 1画素あたりの m
	return Math.log2(
		(40075016.686 * Math.cos((lat * Math.PI) / 180)) / 256 / mpp,
	);
}

function render(
	L: any,
	el: HTMLElement,
	data: DeepMapData,
	onTilesFailed: () => void,
): void {
	const cfg = data.map;
	const map = L.map(el, {
		// 紙と同じ向き（入口が下）に固定で回す。bearing＝北の向き（画面の上から時計回り）。
		// 2本指の回転・Shift＋ホイール・回転ボタン・端末の向きでは回らない
		rotate: true,
		bearing: cfg.bearing,
		touchRotate: false,
		shiftKeyRotate: false,
		rotateControl: false,
		compassBearing: false,
		minZoom: cfg.minZoom,
		maxZoom: cfg.maxZoom,
		zoomSnap: 0,
		// マウスホイールでは拡大しない。1本指のなぞりはページのスクロールに回す（ドラッグは下でマウスのときだけ有効にする）
		scrollWheelZoom: false,
		dragging: false,
		boxZoom: false,
		bounceAtZoomLimits: false,
		zoomControl: false,
		attributionControl: false,
	});
	L.control
		.zoom({ position: "topright", zoomInTitle: "拡大", zoomOutTitle: "縮小" })
		.addTo(map);

	// 紙の絵のタイル（背景の地図は敷かない）。タイルは CORS ヘッダーが無いので img のまま読む
	let loaded = 0;
	let failed = 0;
	const tiles = L.tileLayer(cfg.tiles, {
		minZoom: cfg.minZoom,
		maxNativeZoom: cfg.maxNativeZoom,
		maxZoom: cfg.maxZoom,
		bounds: L.latLngBounds(cfg.bounds),
	});
	tiles.on("tileload", () => {
		loaded++;
	});
	tiles.on("tileerror", () => {
		failed++;
	});
	// 最初の画面のタイルが1枚も読めなかったら、紙が出ていないので失敗として扱う
	tiles.once("load", () => {
		if (loaded === 0 && failed > 0) onTilesFailed();
	});
	tiles.addTo(map);

	map.setView(cfg.center, fitZoom(map, cfg.size, cfg.center[0]), {
		animate: false,
	});

	// 今日のテント（押しても何も出さない）
	for (const ll of data.tents) {
		L.circleMarker(ll, {
			radius: 7,
			color: "#ffffff",
			weight: 2,
			fillColor: DEEPMAP_TENT_COLOR,
			fillOpacity: 1,
			interactive: false,
		}).addTo(map);
	}

	// 紙の外へ大きく動かせないように、中心が紙の範囲（bounds）を出たら範囲の端まで戻す
	const limit = L.latLngBounds(cfg.bounds);
	map.on("moveend", () => {
		const c = map.getCenter();
		if (limit.contains(c)) return;
		const lat = Math.min(Math.max(c.lat, limit.getSouth()), limit.getNorth());
		const lng = Math.min(Math.max(c.lng, limit.getWest()), limit.getEast());
		map.panTo([lat, lng]);
	});

	// ドラッグはマウスのときだけ。指（ペン）で触ったときは切る＝1本指のなぞりはページのスクロール、
	// 地図の移動・拡大は2本指（Leaflet の touch-action: pan-x pan-y で2本指は地図に届く）か拡大縮小のボタン
	el.addEventListener(
		"pointerdown",
		(e) => {
			if (e.pointerType === "mouse") map.dragging.enable();
			else map.dragging.disable();
		},
		true,
	);
	el.addEventListener("pointerover", (e) => {
		if (e.pointerType === "mouse") map.dragging.enable();
	});
}

// [data-deepmap] の中の [data-deepmap-canvas] に描く。読めなかったときは [data-deepmap-error] だけを出す。
// Leaflet と取り口は、項が画面に近づいてから読む（このページの下のほうにあるため）
export function mountDeepMap(root: HTMLElement): void {
	const canvas = root.querySelector<HTMLElement>("[data-deepmap-canvas]");
	const legend = root.querySelector<HTMLElement>("[data-deepmap-legend]");
	const error = root.querySelector<HTMLElement>("[data-deepmap-error]");
	if (!canvas || !error) return;

	let failedShown = false;
	const fail = () => {
		if (failedShown) return;
		failedShown = true;
		canvas.hidden = true;
		if (legend) legend.hidden = true;
		error.hidden = false;
	};

	let started = false;
	const start = () => {
		if (started) return;
		started = true;
		Promise.all([loadLeaflet(), fetchDeepMap()])
			.then(([L, data]) => render(L, canvas, data, fail))
			.catch(fail);
	};

	if (!("IntersectionObserver" in window)) {
		start();
		return;
	}
	const io = new IntersectionObserver(
		(entries) => {
			if (entries.some((en) => en.isIntersecting)) {
				io.disconnect();
				start();
			}
		},
		{ rootMargin: "600px 0px" },
	);
	io.observe(root);
}
