// 場内カメラの記録（/camera/）の材料。
// OirasApp の公開 API camera.php（写真とタイムラプスの一覧）を実行時に読む（ビルド時には取らない）。
// 契約の正本は OirasApp の docs/spec_weather.md「一覧の公開 API（camera.php）」。
// 日付はすべて JST の暦日（"YYYY-MM-DD"）で扱う。

export const CAMERA_API =
	"https://oiranomori.com/app/weather/api/public/camera.php";

// 写真が始まった日（材料がまだ無い画面の案内に使う）
export const RECORD_START = "2026-11-02";

export type Still = {
	taken_at: string;
	width: number;
	height: number;
	url: string; // 原本
	medium_url: string; // 幅 1280
	thumb_url: string; // 幅 320
};

export type Video = {
	period_start: string;
	period_end: string;
	url: string;
	cover_url: string;
	duration_s: number;
	frames: number;
	built_at: string;
};

export type Range = { first_date: string | null; last_date: string | null };

export type DayView = {
	range: Range;
	date: string;
	video: Video | null;
	count: number;
	slots: { slot: string; slot_at: string; still: Still | null }[];
};

export type MonthView = {
	range: Range;
	month: string;
	days: { date: string; stills: number; video: Video | null }[];
	weekly: Video[];
	monthly: Video | null;
};

export type TimeView = {
	range: Range;
	month: string;
	slot: string;
	count: number;
	days: { date: string; slot_at: string; still: Still | null }[];
};

export type ByMonthView = {
	range: Range;
	count: number;
	months: {
		month: string;
		date: string | null;
		exists: boolean;
		slot_at: string | null;
		still: Still | null;
	}[];
};

export type ByYearView = {
	range: Range;
	count: number;
	years: {
		year: number;
		date: string | null;
		exists: boolean;
		slot_at: string | null;
		still: Still | null;
	}[];
};

async function get<T>(params: Record<string, string>): Promise<T> {
	const q = new URLSearchParams(params).toString();
	const r = await fetch(`${CAMERA_API}?${q}`, { cache: "default" });
	if (!r.ok) throw new Error(`http:${r.status}`);
	const d = await r.json();
	if (!d.ok) throw new Error(d.error ?? "ok:false");
	return d as T;
}

export const fetchRange = () =>
	get<{ range: Range }>({ view: "range" }).then((d) => d.range);
export const fetchDay = (date: string) => get<DayView>({ view: "day", date });
export const fetchMonth = (month: string) =>
	get<MonthView>({ view: "month", month });
export const fetchTime = (month: string, slot: string) =>
	get<TimeView>({ view: "time", month, slot });
export const fetchByMonth = (
	fromYear: number,
	toYear: number,
	day: string,
	slot: string,
) =>
	get<ByMonthView>({
		view: "by_month",
		from_year: String(fromYear),
		to_year: String(toYear),
		day,
		slot,
	});
export const fetchByYear = (
	fromYear: number,
	toYear: number,
	md: string,
	slot: string,
) =>
	get<ByYearView>({
		view: "by_year",
		from_year: String(fromYear),
		to_year: String(toYear),
		md,
		slot,
	});

// 期間（いつから〜いつまで）の毎日・同じ時刻の写真。
// App 側に期間で返す view ができるまでは、view=time を月ごとに呼んでつなぐ。
export async function fetchDays(
	from: string,
	to: string,
	slot: string,
): Promise<{ date: string; still: Still | null }[]> {
	const months: string[] = [];
	for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = addMonths(m, 1))
		months.push(m);
	const views = await Promise.all(months.map((m) => fetchTime(m, slot)));
	return views
		.flatMap((v) => v.days)
		.filter((d) => d.date >= from && d.date <= to)
		.map((d) => ({ date: d.date, still: d.still }));
}

// ── 日付（JST の暦日） ─────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

export function todayJst(now: number = Date.now()): string {
	const j = new Date(now + 9 * 60 * 60 * 1000);
	return `${j.getUTCFullYear()}-${pad(j.getUTCMonth() + 1)}-${pad(j.getUTCDate())}`;
}

// "YYYY-MM-DD" を UTC の 0 時として扱う（曜日・日数の計算用）
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const ymd = (d: Date) =>
	`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export function addDays(date: string, n: number): string {
	const d = utc(date);
	d.setUTCDate(d.getUTCDate() + n);
	return ymd(d);
}

export function addMonths(month: string, n: number): string {
	const [y, m] = month.split("-").map(Number);
	const t = y * 12 + (m - 1) + n;
	return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
}

export function daysBetween(from: string, to: string): number {
	return Math.round((utc(to).getTime() - utc(from).getTime()) / 86_400_000);
}

export const dayOfWeek = (date: string) => utc(date).getUTCDay(); // 0=日

export function isValidDate(s: string | null): s is string {
	if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	return ymd(utc(s)) === s;
}

export const isValidMonth = (s: string | null): s is string =>
	!!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

export const DOW = ["日", "月", "火", "水", "木", "金", "土"];

export function fmtMd(date: string): string {
	const [, m, d] = date.split("-").map(Number);
	return `${m}月${d}日`;
}

export function fmtYmd(date: string): string {
	const [y, m, d] = date.split("-").map(Number);
	return `${y}年${m}月${d}日`;
}

export function fmtYmdDow(date: string): string {
	return `${fmtYmd(date)}（${DOW[dayOfWeek(date)]}）`;
}

export function fmtYm(month: string): string {
	const [y, m] = month.split("-").map(Number);
	return `${y}年${m}月`;
}

// ── 時刻（1時間刻み） ───────────────────────────────────────────
// 写真は昼（日の出の15分前〜日没の15分後）だけ。夏至のころでも 5 時〜19 時台に収まる。
export const HOURS = Array.from({ length: 15 }, (_, i) => i + 5);
export const DEFAULT_TIME = "12:00";
export const isValidTime = (s: string | null): s is string =>
	!!s && /^\d{2}:00$/.test(s) && HOURS.includes(Number(s.slice(0, 2)));
export const fmtTime = (t: string) => `${Number(t.slice(0, 2))}:00`;

// ── 画面の状態（クエリに持たせて共有できるようにする） ────────────

export type Tab =
	| "today"
	| "hourly"
	| "calendar"
	| "daily"
	| "monthly"
	| "yearly";

export const TABS: { id: Tab; label: string }[] = [
	{ id: "today", label: "今日" },
	{ id: "hourly", label: "時間別" },
	{ id: "calendar", label: "カレンダー" },
	{ id: "daily", label: "日ごと" },
	{ id: "monthly", label: "月ごと" },
	{ id: "yearly", label: "年ごと" },
];

export type State =
	| { tab: "today" }
	| { tab: "hourly"; date: string }
	| { tab: "calendar"; month: string; time: string }
	| { tab: "daily"; from: string; to: string; time: string }
	| { tab: "monthly"; from: string; to: string; time: string }
	| { tab: "yearly"; from: string; to: number; time: string };

export const DAILY_MAX_DAYS = 366; // 最長1年（両端を含む）

// クエリを読み、無い・形の違う・今日より先の値は既定に直す。
// first はいちばん古い写真の日（range.first_date。読めなければ RECORD_START）。
export function parseState(
	q: URLSearchParams,
	today: string,
	first: string,
): State {
	const tab = (q.get("tab") ?? "today") as Tab;
	const time = isValidTime(q.get("time"))
		? (q.get("time") as string)
		: DEFAULT_TIME;
	const clampDate = (s: string | null, def: string) => {
		if (!isValidDate(s)) return def;
		if (s > today) return today;
		if (s < first) return first;
		return s;
	};
	switch (tab) {
		case "hourly": {
			const date = clampDate(q.get("date"), addDays(today, -1));
			return date === today ? { tab: "today" } : { tab, date };
		}
		case "calendar": {
			const m = q.get("month");
			const thisMonth = today.slice(0, 7);
			const month = !isValidMonth(m)
				? thisMonth
				: m > thisMonth
					? thisMonth
					: m < first.slice(0, 7)
						? first.slice(0, 7)
						: m;
			return { tab, month, time };
		}
		case "daily": {
			const to = clampDate(q.get("to"), today);
			let from = clampDate(q.get("from"), maxDate(first, addDays(to, -29)));
			if (from > to) from = to;
			if (daysBetween(from, to) >= DAILY_MAX_DAYS)
				from = addDays(to, -(DAILY_MAX_DAYS - 1));
			return { tab, from, to, time };
		}
		case "monthly": {
			const from = clampDate(q.get("from"), first);
			const t = q.get("to");
			const thisMonth = today.slice(0, 7);
			let to = isValidMonth(t) && t <= thisMonth ? t : thisMonth;
			if (to < from.slice(0, 7)) to = from.slice(0, 7);
			return { tab, from, to, time };
		}
		case "yearly": {
			const from = clampDate(q.get("from"), first);
			const thisYear = Number(today.slice(0, 4));
			const t = Number(q.get("to"));
			let to = Number.isInteger(t) && t <= thisYear ? t : thisYear;
			if (to < Number(from.slice(0, 4))) to = Number(from.slice(0, 4));
			return { tab, from, to, time };
		}
		default:
			return { tab: "today" };
	}
}

export function stateToQuery(s: State): string {
	const q = new URLSearchParams();
	if (s.tab !== "today") q.set("tab", s.tab);
	switch (s.tab) {
		case "hourly":
			q.set("date", s.date);
			break;
		case "calendar":
			q.set("month", s.month);
			q.set("time", s.time);
			break;
		case "daily":
		case "monthly":
			q.set("from", s.from);
			q.set("to", s.to);
			q.set("time", s.time);
			break;
		case "yearly":
			q.set("from", s.from);
			q.set("to", String(s.to));
			q.set("time", s.time);
			break;
	}
	const str = q.toString();
	return str ? `?${str}` : "";
}

const maxDate = (a: string, b: string) => (a > b ? a : b);
