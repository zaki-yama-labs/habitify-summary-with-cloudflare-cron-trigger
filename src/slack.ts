import type { NoteCountByHabit } from ".";

export async function postToSlack(webhookUrl: string, habits: NoteCountByHabit) {
  const blocks = buildBlocks(habits);
  const body = JSON.stringify({ blocks });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`ERROR (${response.status}): ${response.statusText}. ${text}`);
    }
  } catch (error) {
    console.error(error);
  }
}

function buildBlocks(habits: NoteCountByHabit) {
  const res = [];
  for (const [habitName, noteCounts] of Object.entries(habits)) {
    res.push({
      type: "header",
      text: { type: "plain_text", text: habitName, emoji: true },
    });
    const noteCountsString = Object.keys(noteCounts)
      .map((note) => {
        return `[${noteCounts[note].toString().padStart(2, " ")}] ${note}`;
      })
      .join("\n");
    res.push({
      type: "rich_text",
      elements: [
        {
          type: "rich_text_preformatted",
          border: 0,
          elements: [{ type: "text", text: noteCountsString || 'none'}],
        },
      ],
    });
  }
  return res;
}
