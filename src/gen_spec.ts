import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { Post } from "./gen_common";
import { Spec_Schema } from "./spec";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function generate_spec_from_forum_post(post: Post) {
  console.log(`Processing post ${post.id}...`);

  // convert a forum post to a level prompt
  const prompt_response = await openai.responses.create({
    model: "gpt-4.1",
    input: `
Write a description of a specific and simple drone maneuvering scenario that relates to the difficulties discussed in the attached JSON representation of a forum discussion. Make sure to include all the most important specific details of the scenario mentioned in the post and comments, such as drone maneuvers, objects, and locations. Here is the JSON encoding of the forum conversation:

\`\`\`json
${JSON.stringify(post, null, 4)}
\`\`\`
`.trim(),
  });
  const prompt = prompt_response.output_text;

  console.log(`[prompt]\n${prompt}`);

  // actually generate the level spec
  const spec_response = await openai.responses.parse({
    model: "o3-2025-04-16",
    input: [
      {
        role: "system",
        content: `
You are an assistant for designing levels for a new video game where the player flies a drone through an indoor environment (in a mansion). Take into account the user's description of the level in order to produce a structured level specification. Make sure to take into account EVERYTHING that the user wants in the level.

Keep in mind the following important notes:
- Create only 1-3 checkpoints.
- You may use any number of copies of each object. Make sure to place many objects! At least 10 or so.
- VERY IMPORTANT: no two things can be put at the exact same location. Each thing (startpoint, endpoint, checkpoint, ir object) must be placed at a UNIQUE location. But still, the same room can have multiple things in it.
- Choose reasonable values for the environmental settings
- Be creative!
`.trim(),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    text: {
      format: zodTextFormat(Spec_Schema, "level_specification"),
    },
  });

  const spec = spec_response.output_parsed;

  if (spec === null) {
    console.error("failed to generated spec");
    return;
  }

  console.log(`generated spec ${spec.name}`);

  await fs.writeFile(
    `public/specs/${post.id}.json`,
    JSON.stringify(spec, null, 4),
    { encoding: "utf8" },
  );
}

async function generate_specs_from_forum_posts() {
  await Promise.all(
    (await fs.readdir("forum_posts")).map(async (fn) => {
      console.log(`Processing ${fn}...`);
      const text = await fs.readFile(`forum_posts/${fn}`, { encoding: "utf8" });
      const post: Post = JSON.parse(text);
      await generate_spec_from_forum_post(post);
    }),
  );
}

generate_specs_from_forum_posts();
