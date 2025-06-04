import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import * as fs from "fs/promises";
import * as dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const PostCommentSchema = z.object({
  id: z
    .string()
    .describe(
      "The id of the comment. Can only use letters, numbers, and underscores.",
    ),
  authorId: z
    .string()
    .describe(
      "The id of the comment's author. Can only use letters, numbers, and underscores.",
    ),
  body: z
    .string()
    .describe(
      "The text content of the comment. Must be plain text; CANNOT use Markdown.",
    ),
});

export type PostComment = z.infer<typeof PostCommentSchema>;

export const PostSchema = z.object({
  id: z
    .string()
    .describe(
      "The id of the post. Can only use letters, numbers, and underscores.",
    ),
  authorId: z
    .string()
    .describe(
      "The id of the post's author. Can only use letters, numbers, and underscores.",
    ),
  title: z.string().describe("The main title of the post."),
  body: z
    .string()
    .describe(
      "The main text content of the post. Must be plain text; CANNOT use Markdown.",
    ),
  likes: z
    .number()
    .int()
    .min(0)
    .describe("The number of likes that the post has."),
  dislikes: z
    .number()
    .int()
    .min(0)
    .describe("The number of dislikes that the post has."),
  comments: z.array(PostCommentSchema).describe("The comments on the post."),
});

export type Post = z.infer<typeof PostSchema>;

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
