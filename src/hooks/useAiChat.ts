// Same signature as the scaffold's useAiChat, but replies come from a `reply`
// function you pass instead of POST /api/ai/chat. Drop the `reply` option on OverSkill.
import { useState, useCallback, useRef } from "react";
import { fakeAI } from "@/lib/mock/ai";

export interface ChatMessage { id: string; role: "user" | "assistant" | "system"; content: string; timestamp: Date }
export interface UseAiChatOptions {
  systemPrompt?: string;
  reply: (userText: string, history: ChatMessage[]) => string;
  onMessage?: (m: ChatMessage) => void;
}

export function useAiChat(options: UseAiChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const n = useRef(0);
  const id = () => `msg_${Date.now()}_${++n.current}`;

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return null;
    setLoading(true); setError(null);
    const user: ChatMessage = { id: id(), role: "user", content: content.trim(), timestamp: new Date() };
    setMessages((p) => [...p, user]);
    try {
      const text = await fakeAI(() => options.reply(content, messages), { prompt: options.systemPrompt ?? "" });
      const a: ChatMessage = { id: id(), role: "assistant", content: text, timestamp: new Date() };
      setMessages((p) => [...p, a]);
      options.onMessage?.(a);
      return a;
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
      return null;
    } finally { setLoading(false); }
  }, [messages, options]);

  const clearHistory = useCallback(() => { setMessages([]); setError(null); }, []);
  return { messages, sendMessage, loading, error, clearHistory, clearError: () => setError(null), messageCount: messages.length };
}
export default useAiChat;
