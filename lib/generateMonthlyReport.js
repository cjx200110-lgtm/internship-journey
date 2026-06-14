import OpenAI from "openai";
import { z } from "zod";

const ReportSchema = z.object({
  overview_lines: z.array(z.string().min(1)).length(3),
  reflections: z.array(
    z.object({
      title: z.string().min(1),
      example: z.string().min(1),
      analysis: z.string().min(1)
    })
  ).min(2).max(4),
  todo_items: z.array(
    z.object({
      title: z.string().min(1),
      detail: z.string().min(1)
    })
  ).min(3).max(5)
});

const reportJsonSchema = {
  name: "monthly_report",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["overview_lines", "reflections", "todo_items"],
    properties: {
      overview_lines: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" }
      },
      reflections: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "example", "analysis"],
          properties: {
            title: { type: "string" },
            example: { type: "string" },
            analysis: { type: "string" }
          }
        }
      },
      todo_items: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "detail"],
          properties: {
            title: { type: "string" },
            detail: { type: "string" }
          }
        }
      }
    }
  },
  strict: true
};

function getAiClient() {
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
      }),
      model: process.env.DEEPSEEK_REPORT_MODEL || "deepseek-v4-pro",
      provider: "deepseek"
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: process.env.OPENAI_REPORT_MODEL || "gpt-4.1-mini",
      provider: "openai"
    };
  }

  throw new Error("Missing DEEPSEEK_API_KEY or OPENAI_API_KEY.");
}

export async function generateMonthlyReport({ reflections, period }) {
  const { client, model, provider } = getAiClient();

  const input = reflections.map((item) => ({
    date: item.reflection_date,
    title: item.title || "",
    content: item.content
  }));

  const messages = [
    {
      role: "system",
      content: [
        "你只返回 JSON，不添加解释性文案、Markdown 或额外字段。",
        "JSON 必须包含 overview_lines、reflections、todo_items。",
        "overview_lines 正好 3 行。",
        "reflections 为 2 到 4 条，每条包含 title、example、analysis。",
        "todo_items 为 3 到 5 条，每条包含 title、detail。"
      ].join("\n")
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "根据日常心得生成月度工作报告",
        period,
        schema: reportJsonSchema.schema,
        daily_reflections: input
      })
    }
  ];

  if (provider === "deepseek") {
    const response = await client.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const json = JSON.parse(response.choices[0]?.message?.content || "{}");
    return ReportSchema.parse(json);
  }

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: messages[0].content
      },
      {
        role: "user",
        content: messages[1].content
      }
    ],
    text: {
      format: {
        type: "json_schema",
        ...reportJsonSchema
      }
    }
  });

  const json = JSON.parse(response.output_text);
  return ReportSchema.parse(json);
}
