// スマホの幅（767px 以下）で、縦タブ（FloatingNav）と画面下の「予約する」（ReserveCTA）を
// スクロールに合わせて出し入れする。768px 以上では何もしない（いつも出したまま）。
// 動かすのは data-float-reveal の付いた要素。消すときは is-concealed を付け（滑らせ方は global.css）、
// inert で押せない・キーボードで選べないようにする。2つの部品の両方から呼ばれるので、動かすのは1回だけ。
//
// - ページを開いたときは出ている。下へ THRESHOLD_PX 動かしたら消し、上へ THRESHOLD_PX 動かしたら出す。
// - 先頭と最後で引っぱったときの戻り（iPhone のバウンド）は、位置が先頭より上・最後より下になるので数えない。
// - キーボードで縦タブや予約ボタンに移ったときは出す。そこを選んでいる間は消さない。
// - メニューを開いている間は数えない（見え方を変えない）。

const MOBILE_QUERY = "(max-width: 767px)";

// 同じ向きにこれだけ続けて動いたら切り替える（px）。390×844・375×667・320×568 の画面で指の操作をまねて試し、
// 指を少しずらしただけ（〜30px）では切り替わらず、少し読み進める・読み戻す程度の操作で切り替わる量にした。
const THRESHOLD_PX = 40;

let started = false;

export function initFloatingReveal(): void {
	if (started) return;
	started = true;

	const els = [
		...document.querySelectorAll<HTMLElement>("[data-float-reveal]"),
	];
	if (els.length === 0) return;
	const mobile = window.matchMedia(MOBILE_QUERY);
	const menuButton = document.getElementById("menu-open-btn");

	let concealed = false;
	let lastY = window.scrollY;
	let lastHeight = window.innerHeight;
	let moved = 0; // 今の向きに続けて動いた量（下が正）
	// 指・ホイール・キー・クリックで操作するまでは数えない。開いた直後にブラウザが前の位置へ戻したり、
	// # 付きのリンクで途中に飛んだりしても、開いたときの「出ている」を保つため。
	let operated = false;
	let ticking = false;

	const setInert = (on: boolean) => {
		for (const el of els) el.toggleAttribute("inert", on);
	};
	const focusInside = () =>
		els.some((el) => el.contains(document.activeElement));

	const show = () => {
		if (!concealed) return;
		concealed = false;
		for (const el of els) el.classList.remove("is-concealed");
		setInert(false);
	};
	const hide = () => {
		if (concealed || focusInside()) return;
		concealed = true;
		for (const el of els) el.classList.add("is-concealed");
		setInert(true);
	};
	const resync = () => {
		lastY = window.scrollY;
		lastHeight = window.innerHeight;
		moved = 0;
	};

	const update = () => {
		ticking = false;
		const menuOpen = menuButton?.getAttribute("aria-expanded") === "true";
		// 768px 以上のとき・まだ操作していないとき・メニューを開いているとき・画面の高さが変わった
		// （Safari のバーの出し入れ・向きの変更）ときは、今の位置を覚え直すだけで、スクロールとして数えない
		if (
			!mobile.matches ||
			!operated ||
			menuOpen ||
			window.innerHeight !== lastHeight
		) {
			resync();
			return;
		}
		const y = window.scrollY;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		if (y < 0 || y > max + 1) return; // バウンド中
		const dy = y - lastY;
		lastY = y;
		if (dy === 0) return;
		if (dy > 0 !== moved > 0) moved = 0;
		moved += dy;
		if (moved >= THRESHOLD_PX) hide();
		else if (moved <= -THRESHOLD_PX) show();
	};

	window.addEventListener(
		"scroll",
		() => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(update);
		},
		{ passive: true },
	);

	const markOperated = () => {
		operated = true;
	};
	for (const type of ["touchstart", "wheel", "pointerdown"]) {
		window.addEventListener(type, markOperated, { passive: true });
	}

	// 消えている間は inert で選べないので、Tab を押した瞬間だけ inert を外し、移った先が中なら出す。
	// 中でなければ inert に戻す（画面の外にあるので、外している間も見えない）。
	document.addEventListener("keydown", (e) => {
		markOperated();
		if (e.key !== "Tab" || !concealed) return;
		setInert(false);
		setTimeout(() => {
			if (focusInside()) show();
			else if (concealed) setInert(true);
		}, 0);
	});
	document.addEventListener("focusin", (e) => {
		if (els.some((el) => el.contains(e.target as Node))) show();
	});

	// 768px 以上になったら出したままにする。戻る・進むでページを開き直したときも出す。
	mobile.addEventListener("change", () => {
		show();
		resync();
	});
	window.addEventListener("pageshow", (e) => {
		if (!e.persisted) return;
		show();
		resync();
	});
}
