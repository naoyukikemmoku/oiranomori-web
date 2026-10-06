import type { APIRoute } from "astro";

// 版の札。ビルドのたびに1回だけ書き出す（静的）。
// OirasApp が1時間おきにこれを見て、変わっていたら HP の本文を読み直す（docs/spec.md §8）。
// commit は Cloudflare Pages のビルド環境変数、ローカルでは "local"。
// built_at はビルドごとに必ず変わる（microCMS の更新で同じコミットのまま走るビルドでも変わる）。
export const GET: APIRoute = () => {
	const body = {
		commit: process.env.CF_PAGES_COMMIT_SHA || "local",
		built_at: new Date().toISOString(),
	};
	return new Response(JSON.stringify(body), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
