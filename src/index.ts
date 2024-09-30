import { format } from "@formkit/tempo";
import { postToSlack } from "./slack";
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

type NoteCount = {
  [note: string]: number;
};

export type NoteCountByHabit = {
  [habitName: string]: NoteCount;
};

type Habit = {
  id: string;
  name: string;
};

type Note = {
  id: string;
  content: string;
  habit_id: string;
};

async function main(env: Env) {
  const response = await fetch("https://api.habitify.me/habits", {
    headers: {
      Authorization: env.HABITIFY_API_KEY,
    },
  });
  const json = (await response.json()) as { data: Habit[] };
  const habits = json.data.map((data) => ({
    id: data.id,
    name: data.name,
  }));

  console.log(JSON.stringify(habits));

  const today = new Date();
  // 先月1日0:00:00
  const from = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0);
  // 先月の末日23:59:59
  const to = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

  const searchParams = new URLSearchParams({
    from: format(from, "YYYY-MM-DDTHH:mm:ssZ"),
    to: format(to, "YYYY-MM-DDTHH:mm:ssZ"),
  });

  const noteCountsByHabit: NoteCountByHabit = {};

  for (const habit of habits) {
    const response = await fetch(
      `https://api.habitify.me/notes/${habit.id}?${searchParams.toString()}`,
      {
        headers: {
          Authorization: env.HABITIFY_API_KEY,
        },
      },
    );
    const json = (await response.json()) as { data: Note[] };
    console.log(json);
    const notesCount = json.data.reduce(
      (acc: { [note: string]: number }, item) => {
        // アイテムの content をキーにして集計
        acc[item.content] = (acc[item.content] || 0) + 1;
        return acc;
      },
      {},
    );

    console.log(notesCount);
    // console.log(json);
    // json.data.
    noteCountsByHabit[habit.name] = notesCount;
  }
  console.log(JSON.stringify(noteCountsByHabit));
  await postToSlack(env.SLACK_WEBHOOK_URL, noteCountsByHabit);
}

export default {
  async scheduled(event, env, ctx) {
    console.log(event.cron);
    console.log(new Date(event.scheduledTime));
    ctx.waitUntil(main(env));
  },
} satisfies ExportedHandler<Env>;
