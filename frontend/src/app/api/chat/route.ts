import { NextRequest } from "next/server";
import { FunctionCallingConfigMode, type GenerateContentResponse } from "@google/genai";
import { CHAT_MODEL, gemini, getChatSystemPrompt } from "@/lib/ai";
import { getUniversityInfo, getUniversityInfoSchema, getUniversityInfoTool } from "@/lib/tools";

export const runtime = "nodejs";

type IncomingMessage = { role: "user" | "assistant"; content: string };
type ChatMessage = { role: "user" | "model"; parts: [{ text: string }] };
type ToolCall = { name: string; args: Record<string, unknown> };

const encoder = new TextEncoder();

function requestsUniversityInfo(message: string): boolean {
    return /\b(university|college|institution|campus)\b/i.test(message) &&
        /\b(about|info(?:rmation)?|details?|programs?|courses?|tuition|fees?|located?|location|study)\b/i.test(message);
}

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

    const latestUserMessage = messages[messages.length - 1].parts[0].text;
    const shouldCallUniversityTool = requestsUniversityInfo(latestUserMessage);

    let stream: AsyncGenerator<GenerateContentResponse> | undefined;
    const textStream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                const send = (event: Record<string, unknown>) => {
                    controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
                };

                const config = {
                    maxOutputTokens: 1200,
                    systemInstruction: `${getChatSystemPrompt(body.language, body.mode)}\n\nWhen the user asks for information about a specific university, you must call getUniversityInfo before answering. Do not provide university profile details from memory when the tool applies.`,
                    tools: [{ functionDeclarations: [getUniversityInfoTool] }],
                    ...(shouldCallUniversityTool ? {
                        toolConfig: {
                            functionCallingConfig: {
                                mode: FunctionCallingConfigMode.ANY,
                                allowedFunctionNames: [getUniversityInfoTool.name],
                            },
                        },
                    } : {}),
                };

                const firstResponseParts: Array<Record<string, unknown>> = [];
                let firstResponseText = "";
                stream = await client.models.generateContentStream({ model: CHAT_MODEL, contents: messages, config });
                let toolCall: ToolCall | null = null;
                for await (const chunk of stream) {
                    for (const part of chunk.candidates?.[0]?.content?.parts || []) {
                        if (part.text) firstResponseText += part.text;
                        if (part.functionCall) {
                            toolCall = {
                                name: part.functionCall.name || "",
                                args: (part.functionCall.args || {}) as Record<string, unknown>,
                            };
                            firstResponseParts.push({ functionCall: part.functionCall });
                            send({ type: "tool", state: "input-streaming", name: toolCall.name });
                        }
                    }
                }

                if (toolCall?.name === getUniversityInfoTool.name) {
                    send({ type: "tool", state: "input-available", name: toolCall.name });
                    const parsedInput = getUniversityInfoSchema.safeParse(toolCall.args);
                    if (!parsedInput.success) {
                        send({ type: "tool", state: "output-error", name: toolCall.name, error: "The university details could not be read." });
                    } else {
                        try {
                            const result = getUniversityInfo(parsedInput.data);
                            send({ type: "tool", state: "output-available", name: toolCall.name, result });

                            const followUpContents = [
                                ...messages,
                                { role: "model", parts: firstResponseParts },
                                { role: "user", parts: [{ functionResponse: { name: toolCall.name, response: result } }] },
                            ];
                            stream = await client.models.generateContentStream({ model: CHAT_MODEL, contents: followUpContents, config });
                            for await (const chunk of stream) {
                                if (chunk.text) send({ type: "text", text: chunk.text });
                            }
                        } catch {
                            send({ type: "tool", state: "output-error", name: toolCall.name, error: "University information is temporarily unavailable." });
                        }
                    }
                } else if (firstResponseText) {
                    send({ type: "text", text: firstResponseText });
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