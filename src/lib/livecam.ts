// ライブカメラ（#livecam）の動き。部品 components/LiveCam.astro のマークアップを動かす。
// /now/ から切り出したもの（中身は /now/ にあったときと同じ）。
// 読み込み（fetchLivecam）は使う側のページが呼び、renderLivecam に渡す。
// /now/ は他の API と同じ Promise.allSettled の中で読む（表示の順を変えないため）。
import { fmtClock, STALE_DOWN_S, timeStampClass } from "./nowWeather";

type Json = Record<string, any>;

const getEl = (id: string) => document.getElementById(id);

export const LIVECAM_API =
	"https://oiranomori.com/app/weather/api/public/livecam.php";

// livecam.php 専用フェッチ。レスポンスに ok フィールドを前提しない
// （{ hls_url, still, is_night, next_sunrise, generated_at }）。HTTP/パース失敗は throw し、
// 呼び出し側（allSettled→renderLivecam(null)）で代わりの表示に倒す。
export async function fetchLivecam(url: string): Promise<Json> {
	const r = await fetch(url, { cache: "default" });
	if (!r.ok) throw new Error(`http:${r.status}`);
	return await r.json();
}

// ── ライブカメラ（#livecam）：最初は静止画、タップで HLS の映像 ─────
// 映像は App の VPS が「見られている間だけ」カメラから取りに行って配る。
// ページを開いただけでは読み込まない（preload=none・autoplay なし・hls.js もタップ時に読む）。
// 見ていないときに読み込み続けない：タブが裏に回ったら止める／再生から5分で止める。
const LIVECAM_HLS_DEFAULT = "https://oiranomori.com/app/livecam/hls/index.m3u8"; // livecam.php が読めないとき
const LIVECAM_LOAD_TIMEOUT_MS = 20_000; // 映像が出るまで待つ上限
const LIVECAM_WATCH_MAX_MS = 5 * 60_000; // 再生を始めてから止めるまで
// hls.js は App の確認用ページで動作を確かめた版に合わせる（cdnjs・版固定・SRI）
const HLS_JS_SRC =
	"https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.6.16/hls.min.js";
const HLS_JS_SRI =
	"sha512-zAODd1LM+/58SazX5fct5psehCijY60y5rG0BYIzxTXot7ovEo2FhfWTV0mp4oqIef2xriyg4zlrPlmFTDcPXg==";
const LIVECAM_PLAY_LABEL = "タップでライブ映像を再生";
const LIVECAM_FAIL_LABEL = "映像を読み込めませんでした（タップでもう一度）";

let livecamData: Json | null = null;
let livecamState: "idle" | "loading" | "playing" = "idle";
let livecamToken = 0; // 止めた後に届いた古い非同期処理を捨てるための番号
let livecamHls: any = null;
let livecamFailTimer: number | undefined;
let livecamWatchTimer: number | undefined;
let hlsJsLoader: Promise<any> | null = null;
let livecamStillFailed: string | null = null; // 読めなかった静止画の URL（同じ URL は出し直さない）

// "H:MM"（JST）。日の出の再開時刻の表記用。
function fmtHmJst(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
	return `${j.getUTCHours()}:${String(j.getUTCMinutes()).padStart(2, "0")}`;
}

function fmtAgo(sec: number): string {
	if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}分前`;
	return `${Math.floor(sec / 3600)}時間前`;
}

// 最初の表示（静止画か代わりの表示）を livecamData から組み立てる。
// label を渡すと再生ボタンの文言を差し替える（失敗・5分で停止・裏に回ったとき）。
function renderLivecamPoster(label: string = LIVECAM_PLAY_LABEL): void {
	const still = getEl("livecam-still") as HTMLImageElement | null;
	const play = getEl("livecam-play");
	const playLabel = getEl("livecam-play-label");
	const meta = getEl("livecam-meta");
	if (!still || !play || !meta) return;

	const data = livecamData;
	const isNight = data?.is_night === true;
	const s = data?.still;
	const takenMs = s?.taken_at ? new Date(s.taken_at).getTime() : Number.NaN;
	const hasStill =
		!!s &&
		typeof s.url === "string" &&
		/^https:\/\//.test(s.url) &&
		!Number.isNaN(takenMs) &&
		s.url !== livecamStillFailed;
	const ageS = hasStill ? Math.max(0, (Date.now() - takenMs) / 1000) : null;
	// 昼で1時間を超えたら止まった扱い：古い静止画を「最新」に見せない（A4 の停止中と同じ作法）
	const stopped = hasStill && !isNight && ageS != null && ageS > STALE_DOWN_S;

	const sunrise = data?.next_sunrise ? fmtHmJst(data.next_sunrise) : "";
	const nightNote = isNight
		? `夜間は静止画を更新していません${sunrise ? `（日の出 ${sunrise} ごろ再開）` : ""}`
		: "";

	if (hasStill && !stopped) {
		if (still.getAttribute("src") !== s.url) still.src = s.url;
		still.hidden = false;
		const stamp = `${fmtAgo(ageS as number)}（${fmtClock(s.taken_at)} 撮影）`;
		// 夜は古さの判定をしない（警告色にしない）
		meta.className = timeStampClass(isNight ? null : ageS);
		meta.textContent = nightNote ? `${stamp}　${nightNote}` : stamp;
	} else {
		still.hidden = true;
		still.removeAttribute("src");
		if (stopped) {
			meta.className = "text-xs text-amber-600";
			meta.textContent = "静止画の更新が止まっています";
		} else {
			meta.className = "text-xs text-zinc-500";
			meta.textContent = nightNote;
		}
	}

	if (playLabel) playLabel.textContent = label;
	play.hidden = false;
}

export function renderLivecam(data: Json | null): void {
	livecamData = data;
	// 再生中・読み込み中は映像を止めない（最初の表示は次に戻ったときに反映）
	if (livecamState === "idle") renderLivecamPoster();
}

function loadHlsJs(): Promise<any> {
	const w = window as any;
	if (w.Hls) return Promise.resolve(w.Hls);
	if (!hlsJsLoader) {
		hlsJsLoader = new Promise((resolve) => {
			const sc = document.createElement("script");
			sc.src = HLS_JS_SRC;
			sc.integrity = HLS_JS_SRI;
			sc.crossOrigin = "anonymous";
			sc.referrerPolicy = "no-referrer";
			sc.onload = () => resolve(w.Hls ?? null);
			// 読めなければブラウザの HLS に回す。次のタップで読み直せるよう捨てる
			sc.onerror = () => {
				hlsJsLoader = null;
				sc.remove();
				resolve(null);
			};
			document.head.appendChild(sc);
		});
	}
	return hlsJsLoader;
}

// 映像を止め、読み込みも切る（hls.js を破棄し、video の src を外す）
function stopLivecam(): void {
	livecamToken++;
	livecamState = "idle";
	window.clearTimeout(livecamFailTimer);
	window.clearTimeout(livecamWatchTimer);
	if (livecamHls) {
		livecamHls.destroy();
		livecamHls = null;
	}
	const video = getEl("livecam-video") as HTMLVideoElement | null;
	if (video) {
		video.pause();
		video.removeAttribute("src");
		video.load();
		video.hidden = true;
	}
	const loading = getEl("livecam-loading");
	if (loading) loading.hidden = true;
}

function stopLivecamTo(label: string): void {
	stopLivecam();
	renderLivecamPoster(label);
}

async function startLivecam(): Promise<void> {
	const video = getEl("livecam-video") as HTMLVideoElement | null;
	const play = getEl("livecam-play");
	const loading = getEl("livecam-loading");
	if (!video || !play || !loading || livecamState !== "idle") return;

	const token = ++livecamToken;
	livecamState = "loading";
	play.hidden = true;
	loading.hidden = false;
	livecamFailTimer = window.setTimeout(() => {
		if (token === livecamToken && livecamState === "loading")
			stopLivecamTo(LIVECAM_FAIL_LABEL);
	}, LIVECAM_LOAD_TIMEOUT_MS);

	const src =
		typeof livecamData?.hls_url === "string"
			? livecamData.hls_url
			: LIVECAM_HLS_DEFAULT;
	// 選び方は hls.js が先：Chrome は canPlayType に「対応」と答えるが、ブラウザの HLS では止まる
	const Hls = await loadHlsJs();
	if (token !== livecamToken) return; // 待っている間に止められた

	if (Hls?.isSupported()) {
		// MediaMTX はカメラにつなぐまで最初の応答を待たせるため、プレイリストの待ちを長めにする（App の確認用ページと同じ）
		const hls = new Hls({
			manifestLoadPolicy: {
				default: {
					maxTimeToFirstByteMs: 20000,
					maxLoadTimeMs: 25000,
					timeoutRetry: {
						maxNumRetry: 3,
						retryDelayMs: 1000,
						maxRetryDelayMs: 4000,
					},
					errorRetry: {
						maxNumRetry: 3,
						retryDelayMs: 1000,
						maxRetryDelayMs: 4000,
					},
				},
			},
		});
		livecamHls = hls;
		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			video.play().catch(() => {});
		});
		hls.on(Hls.Events.ERROR, (_e: unknown, d: Json) => {
			if (!d.fatal || token !== livecamToken) return;
			if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
				hls.recoverMediaError();
				return;
			}
			stopLivecamTo(LIVECAM_FAIL_LABEL);
		});
		hls.loadSource(src);
		hls.attachMedia(video);
	} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
		video.src = src;
		video.play().catch(() => {});
	} else {
		stopLivecamTo("このブラウザでは再生できません");
	}
}

export function initLivecam(): void {
	const video = getEl("livecam-video") as HTMLVideoElement | null;
	const play = getEl("livecam-play");
	const still = getEl("livecam-still") as HTMLImageElement | null;
	if (!video || !play) return;

	play.addEventListener("click", () => {
		startLivecam();
	});

	// 映像が出たら静止画と「読み込み中」を隠し、5分の時計を始める（途中の詰まりからの再開では数え直さない）
	video.addEventListener("playing", () => {
		if (livecamState !== "loading") return;
		livecamState = "playing";
		window.clearTimeout(livecamFailTimer);
		video.hidden = false;
		const loading = getEl("livecam-loading");
		if (loading) loading.hidden = true;
		if (still) still.hidden = true;
		const token = livecamToken;
		livecamWatchTimer = window.setTimeout(() => {
			if (token === livecamToken) stopLivecamTo("続けて見る");
		}, LIVECAM_WATCH_MAX_MS);
	});
	// ブラウザの HLS の再生エラー（hls.js のエラーは ERROR イベントで扱う）
	video.addEventListener("error", () => {
		if (livecamState !== "idle" && !livecamHls)
			stopLivecamTo(LIVECAM_FAIL_LABEL);
	});
	// 一時停止の間は hls.js の読み込みも止める
	video.addEventListener("pause", () => {
		if (livecamState === "playing") livecamHls?.stopLoad();
	});
	video.addEventListener("play", () => {
		if (livecamState === "playing") livecamHls?.startLoad();
	});

	// 静止画が読めなければ代わりの表示（暗い枠＋再生ボタン）にし、撮影時刻も消す
	still?.addEventListener("error", () => {
		livecamStillFailed = still.getAttribute("src");
		if (livecamState === "idle")
			renderLivecamPoster(
				getEl("livecam-play-label")?.textContent ?? LIVECAM_PLAY_LABEL,
			);
		else still.hidden = true;
	});

	// タブが裏に回ったら止める。戻っても、再生ボタンを押すまで再開しない
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden" && livecamState !== "idle")
			stopLivecamTo("続けて見る");
	});
}
