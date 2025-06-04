import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import * as dotenv from "dotenv";
import { Spec_Schema } from "./spec";
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
          "You are an assistant for designing levels for a new video game about flying a drone through indoor environments. Take into account the user's description of the level in order to produce a structured level specification. Make sure to take into account EVERYTHING that the user wants in the level. Be creative as well!",
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

test1();
