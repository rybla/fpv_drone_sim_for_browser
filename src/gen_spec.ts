import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import * as dotenv from "dotenv";
import { Spec_Schema } from "./spec";
import type { Post } from "./gen_common";
import * as fs from "fs/promises";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function example1() {
  const CalendarEvent = z.object({
    name: z.string(),
    date: z.string(),
    participants: z.array(z.string()),
  });

  const response = await openai.responses.parse({
    model: "gpt-4o-2024-08-06",
    input: [
      { role: "system", content: "Extract the event information." },
      {
        role: "user",
        content: "Alice and Bob are going to a science fair on Friday.",
      },
    ],
    text: {
      format: zodTextFormat(CalendarEvent, "event"),
    },
  });

  const event = response.output_parsed;

  console.log(event);
}

async function test1() {
  const response = await openai.responses.parse({
    model: "o3-2025-04-16",
    input: [
      {
        role: "system",
        content:
          "You are an assistant for designing levels for a new video game where the player flies a drone through an indoor environment (in a mansion). Take into account the user's description of the level in order to produce a structured level specification. Make sure to take into account EVERYTHING that the user wants in the level. Be creative as well!",
      },
      {
        role: "user",
        content:
          "The level should have low light and be in a winter sort of environment.",
      },
    ],
    text: {
      format: zodTextFormat(Spec_Schema, "level_specification"),
    },
  });

  const spec = response.output_parsed;
  console.log(JSON.stringify(spec, null, 4));
}

async function generate_spec_from_forum_post(post: Post) {
  console.log(`Processing post ${post.id}...`);

  // convert a forum post to a level prompt
  const prompt_response = await openai.responses.create({
    model: "gpt-4.1",
    input:
      "Write a description of a specific and simple drone maneuvering scenario that relates to the difficulties discussed in the attached JSON representation of a forum discussion. Make sure to include all the most important specific details of the scenario mentioned in the post and comments, such as drone maneuvers, objects, and locations.",
  });
  const prompt = prompt_response.output_text;

  // actually generate the level spec
  const spec_response = await openai.responses.parse({
    model: "o3-2025-04-16",
    input: [
      {
        role: "system",
        content:
          "You are an assistant for designing levels for a new video game where the player flies a drone through an indoor environment (in a mansion). Take into account the user's description of the level in order to produce a structured level specification. Make sure to take into account EVERYTHING that the user wants in the level. Be creative as well! Choose reasonable values for the environmental settings.",
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
  console.log(JSON.stringify(spec, null, 4));

  await fs.writeFile(
    `forum_level_specs/${post.id}.json`,
    JSON.stringify(spec, null, 4),
    { encoding: "utf8" },
  );
}

async function generate_specs_from_forum_posts() {
  const fns = await fs.readdir("forum_posts");
  for (const fn of fns) {
    console.log(`Processing ${fn}...`);
    const text = await fs.readFile(`forum_posts/${fn}`, { encoding: "utf8" });
    const post: Post = JSON.parse(text);
    await generate_spec_from_forum_post(post);
  }
}

generate_specs_from_forum_posts();
