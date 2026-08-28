import { NextRequest } from "next/server";
import type { GenerateContentResponse } from "@google/genai";
import { CHAT_MODEL, gemini, getChatSystemPrompt } from "@/lib/ai";

export const runtime = "nodejs";

type IncomingMessage = { role: "user" | "assistant"; content: string };
type ChatMessage = { role: "user" | "model"; parts: [{ text: string }] };

export async function POST(request: NextRequest) {
    const token = request.headers.get("authorization");
    if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
    const client = gemini;
    if (!client) return Response.json({ error: "Gemini API key is not configured" }, { status: 500 });

    const body = await request.json();
    const history = Array.isArray(body.history) ? body.history : [];
    const messages: ChatMessage[] = history
        .filter((message: IncomingMessage) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
        .map((message: IncomingMessage) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
        }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
        return Response.json({ error: "A user message is required" }, { status: 400 });
    }

    let stream: AsyncGenerator<GenerateContentResponse> | undefined;
    const textStream = new ReadableStream<string>({
        async start(controller) {
            try {
                stream = await client.models.generateContentStream({
                    model: CHAT_MODEL,
                    contents: messages,
                    config: {
                        maxOutputTokens: 1200,
                        systemInstruction: getChatSystemPrompt(body.language, body.mode),
                    },
                });
                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) controller.enqueue(text);
                }
                controller.close();
            } catch (error) {
                controller.error(error);
            }
        },
        async cancel() {
            await stream?.return?.(undefined);
        },
    });

    return new Response(textStream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    });
}