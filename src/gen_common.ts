import { z } from "zod";

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
