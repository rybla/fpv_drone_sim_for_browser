import * as dotenv from "dotenv";
import * as fs from "fs/promises";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { PostSchema, type Post } from "./gen_common";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function genPost(prompt: string) {
  const response = await openai.responses.parse({
    model: "o3-2025-04-16",
    input: [
      {
        role: "system",
        content:
          "You are an assistant for converting an unstructured description of a forum conversation into a structured representation of that forum post and comments. The user will provide the unstructured description of a forum conversation. You must output a structured representation of a forum post and comments that includes the exact same text that was used in the input unstructured description.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    text: {
      format: zodTextFormat(PostSchema, "post"),
    },
  });

  const post: Post = response.output_parsed!;
  await fs.writeFile(
    `forum_posts/${post.id}.json`,
    JSON.stringify(post, null, 4),
    {
      encoding: "utf8",
    },
  );
}

async function main() {
  const filenames = await fs.readdir("forum_prompts");
  await fs.mkdir("forum_posts");
  await Promise.all(
    filenames.map(async (fn) => {
      console.log(`start generating post for ${fn} ...`);

      const content = await fs.readFile(`forum_prompts/${fn}`, {
        encoding: "utf8",
      });
      await genPost(content);

      console.log(`done generating post for ${fn}`);
    }),
  );
}

main();
