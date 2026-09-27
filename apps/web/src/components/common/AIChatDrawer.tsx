import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, 
  Send, 
  Sparkles, 
  FileCode, 
  RefreshCw, 
  ChevronRight
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import { AIChatMessage } from '../../types';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

const quickPrompts = [
  'Explain the overall architecture flow',
  'Where are the API route definitions?',
  'What are the key dependencies and services?',
  'Are there any security or complexity hotspots?',
];

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  projectName,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your **Code-Liner AI Architect**. Ask me anything about the **${projectName}** repository architecture, modules, or implementations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || !id || loading) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await aiService.chatWithCodebase(id, textToSend.trim());
      const aiMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedFiles: res.referencedFiles || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ **Analysis Error**: ${err.message || 'Failed to query codebase.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white border-l border-[#E2E8F0] shadow-dropdown flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-[14px] text-[#0F172A] flex items-center gap-1.5">
              <span>Ask My Codebase</span>
              <span className="text-[10px] font-mono font-medium bg-[#EDE9FE] text-[#7C3AED] px-1.5 py-0.2 rounded-[4px] border border-[#DDD6FE]">
                AI
              </span>
            </h3>
            <p className="text-[11px] text-[#64748B] font-mono truncate max-w-[220px]">
              {projectName}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-[12px] p-3.5 text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-[#2563EB] text-white rounded-br-xs'
                    : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap text-[13px] space-y-2">
                  {msg.text}
                </div>

                {/* File Reference Chips */}
                {msg.referencedFiles && msg.referencedFiles.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] space-y-1.5">
                    <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] select-none">
                      Referenced Files
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.referencedFiles.map(filePath => (
                        <button
                          key={filePath}
                          onClick={() => {
                            if (id) {
                              navigate(`/project/${id}/files?path=${encodeURIComponent(filePath)}`);
                              onClose();
                            }
                          }}
                          className="flex items-center gap-1 bg-white border border-[#CBD5E1] px-2 py-0.5 rounded-[4px] text-[11px] font-mono text-[#0F172A] hover:border-[#2563EB] transition-colors shadow-2xs"
                        >
                          <FileCode size={11} className="text-[#2563EB]" />
                          <span className="truncate max-w-[160px]">{filePath.split('/').pop()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8] mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-[#64748B] font-mono p-3 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
            <RefreshCw size={13} className="animate-spin text-[#7C3AED]" />
            <span>Analyzing repository architecture...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase text-[#64748B]">Suggested Prompts</span>
          <div className="flex flex-col gap-1">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-left text-[12px] text-[#475569] hover:text-[#0F172A] hover:bg-white p-1.5 rounded-[6px] border border-transparent hover:border-[#E2E8F0] transition-all flex items-center justify-between"
              >
                <span className="truncate">{prompt}</span>
                <ChevronRight size={12} className="text-[#94A3B8] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-[#E2E8F0] bg-white">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about auth flow, database schema, routes..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-2 text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-xs"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatDrawer;
