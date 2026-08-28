import { NextRequest } from "next/server";
import { anthropic, CHAT_MODEL, getChatSystemPrompt } from "@/lib/ai";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
    const token = request.headers.get("authorization");
    if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });

    const body = await request.json();
    const history = Array.isArray(body.history) ? body.history : [];
    const messages: ChatMessage[] = history
        .filter((message: ChatMessage) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
        .map((message: ChatMessage) => ({ role: message.role, content: message.content }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
        return Response.json({ error: "A user message is required" }, { status: 400 });
    }

    const stream = anthropic.messages.stream({
        model: CHAT_MODEL,
        max_tokens: 1200,
        system: getChatSystemPrompt(body.language, body.mode),
        messages,
    });

    const textStream = new ReadableStream<string>({
        async start(controller) {
            try {
                for await (const event of stream) {
                    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                        controller.enqueue(event.delta.text);
                    }
                }
                controller.close();
            } catch (error) {
                controller.error(error);
            }
        },
        cancel() {
            stream.abort();
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