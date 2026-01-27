import type { MicroCMSDate, MicroCMSListResponse } from "microcms-js-sdk";
import { microcms } from "./microcms";

export type Oshirase = {
  title: string;
  content: string;     // リッチエディタ：HTMLが入る想定
  date: string;        // 日時
  category: string;    // セレクト
  description?: string;// 概要
} & MicroCMSDate;

export async function getOshirase(limit = 3) {
  // ↓ endpoint は microCMSの「お知らせ」APIのエンドポイント名に合わせる
  // 例：oshirase / news / information など
  return microcms.getList<Oshirase>({
    endpoint: "oshirase",
    queries: {
      limit,
      orders: "-date",
      fields: "id,title,description,date,category,publishedAt", // Top表示に必要なものだけ
    },
  });
}
