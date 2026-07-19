import { useEffect, useRef, useState } from 'react';
import { useApi } from '@chargeops/api';
import { IconChat, PageHeader } from '@chargeops/ui';

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  sources?: string[];
}

const QUICK_QS = [
  'Chính sách hoàn tiền khi hủy?',
  'Cửa sổ check-in kéo dài bao lâu?',
  'Khi nào đặt chỗ được xác nhận?',
];

const GREETING: ChatMessage = {
  role: 'bot',
  text: 'Xin chào! Mình là Trợ lý chính sách ChargeOps. Hỏi mình về quy định hủy/hoàn tiền, cửa sổ check-in, thanh toán, hay cách hoạt động của hệ thống nhé.',
};

/** FR15 — ask-only assistant; answers are grounded on the policy KB (RAG). */
export function Assistant() {
  const api = useApi();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || pending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setPending(true);
    try {
      const answer = await api.policies.ask(q);
      setMessages((m) => [...m, { role: 'bot', text: answer.text, sources: answer.sources }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: `Xin lỗi, đã có lỗi: ${(e as Error).message}` }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <PageHeader title="Trợ lý chính sách" subtitle="Tra cứu quy định hủy, check-in, thanh toán." />

      <div className="flex min-h-[440px] flex-col overflow-hidden rounded-card border border-line-2 bg-white" style={{ height: 'calc(100vh - 200px)' }}>
        {/* header */}
        <div className="flex items-center gap-2.5 border-b border-line-3 px-4 py-3.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-soft">
            <IconChat size={18} className="text-brand" />
          </span>
          <div>
            <div className="text-[14px] font-semibold">Trợ lý chính sách</div>
            <div className="text-[11.5px] text-faint">Chỉ tra cứu · trả lời dựa trên kho chính sách (RAG)</div>
          </div>
        </div>

        {/* transcript */}
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex max-w-[78%] flex-col gap-[5px]">
                <div
                  className={`rounded-[13px] border px-3.5 py-[11px] text-[13px] leading-[1.55] ${
                    m.role === 'user'
                      ? 'border-brand bg-brand text-white'
                      : 'border-line-3 bg-canvas text-ink'
                  }`}
                >
                  {m.text}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="pl-1 font-mono text-[10.5px] text-faint">
                    Nguồn: {m.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-[13px] border border-line-3 bg-canvas px-3.5 py-[11px]">
                <span className="h-[14px] w-[14px] animate-[spin360_.7s_linear_infinite] rounded-full border-2 border-line-3 border-t-brand" />
                <span className="text-[12px] font-medium text-faint">Đang tra cứu…</span>
              </div>
            </div>
          )}
        </div>

        {/* composer */}
        <div className="border-t border-line-3 px-4 py-3">
          <div className="mb-2.5 flex flex-wrap gap-[7px]">
            {QUICK_QS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={pending}
                className="rounded-full border border-line px-[11px] py-1.5 text-[11.5px] font-medium text-body hover:border-brand hover:bg-canvas disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-[9px]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(input)}
              placeholder="Hỏi về quy định hủy, check-in, thanh toán…"
              className="flex-1 rounded-[10px] border border-line px-[13px] py-[11px] text-[13px] focus:border-brand"
            />
            <button
              onClick={() => ask(input)}
              disabled={pending || !input.trim()}
              className="flex w-11 items-center justify-center rounded-[10px] bg-brand text-white hover:bg-brand-strong disabled:opacity-50"
              aria-label="Gửi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
