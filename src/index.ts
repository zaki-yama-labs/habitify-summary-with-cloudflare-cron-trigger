import { format } from "@formkit/tempo";
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const HABITIFY_API_KEY = "xxxx";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const response = await fetch("https://api.habitify.me/habits", {
      headers: {
        Authorization: HABITIFY_API_KEY,
      },
    });
    const json = (await response.json()) as { data: any };
    const habits = json.data.map((data: { id: any; name: any }) => ({
      id: data.id,
      name: data.name,
    }));

    console.log(JSON.stringify(habits));

    const today = new Date();
    // 先月1日0:00:00
    const from = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
      0,
      0,
      0,
    );
    // 先月の末日23:59:59
    const to = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    const searchParams = new URLSearchParams({
      from: format(from, "YYYY-MM-DDTHH:mm:ssZ"),
      to: format(to, "YYYY-MM-DDTHH:mm:ssZ"),
    });
    for (const habit of habits) {
      const response = await fetch(
        `https://api.habitify.me/notes/${habit.id}?${searchParams.toString()}`,
        {
          headers: {
            Authorization: HABITIFY_API_KEY,
          },
        },
      );
      const json = (await response.json()) as { data: any };
      const contentCount = json.data.reduce(
        (acc: { [x: string]: any }, item: { content: string | number }) => {
          // アイテムの content をキーにして集計
          acc[item.content] = (acc[item.content] || 0) + 1;
          return acc;
        },
        {},
      );

      console.log(contentCount);
      // console.log(json);
      // json.data.
    }
    // const notesResponse =await fetch('https://api.habitify.me/notes', {
    return new Response("Hello Worker!");
  },
} satisfies ExportedHandler<Env>;
