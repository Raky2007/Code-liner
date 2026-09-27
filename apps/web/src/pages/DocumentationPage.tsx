import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { BookOpen, Loader2 } from 'lucide-react';

export default function DocumentationPage() {
  const { id } = useParams<{ id: string }>();

  const [mdContent, setMdContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDoc = async () => {
    try {
      const res = await apiFetch(`/api/projects/${id}/documentation`);
      setMdContent(res.documentation);
    } catch (err) {
      console.error('Failed to load documentation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[13px] text-[#64748B] font-mono bg-[#F8FAFC] space-y-2">
        <Loader2 size={20} className="animate-spin text-[#2563EB]" />
        <span>Compiling codebase documentation...</span>
      </div>
    );
  }

  // Pure-TS parser translating simple Markdown layout tags to clean Design System tokens
  const parseMarkdown = (markdown: string): string => {
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-[28px] font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-6 tracking-tight">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-[20px] font-semibold text-[#0F172A] border-b border-[#E2E8F0] pb-2 mt-8 mb-4 tracking-tight">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-[14px] uppercase font-mono tracking-wider font-semibold text-[#0F172A] mt-6 mb-3">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-[13px] font-semibold text-[#0F172A] mt-4 mb-2 font-mono">$1</h4>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-[#2563EB] pl-4 py-1.5 my-4 text-[#475569] bg-[#EFF6FF] rounded-r-[6px] italic text-[13px]">$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#0F172A]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-[#F1F5F9] px-1.5 py-0.5 rounded-[4px] font-mono text-[12px] text-[#0F172A] border border-[#E2E8F0]">$1</code>');

    // Code blocks translation (Design System Spec #11: #0F172A background, #E2E8F0 text, JetBrains Mono)
    html = html.replace(/```([a-zA-Z]*)\r?\n([\s\S]*?)\r?\n```/gm, '<pre class="bg-[#0F172A] text-[#E2E8F0] border border-[#1E293B] rounded-[8px] p-4 font-mono text-[13px] my-4 overflow-x-auto leading-relaxed shadow-card">$2</pre>');

    // Table parsing
    const lines = html.split(/\r?\n/);
    let inTable = false;
    let tableHtml = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHtml = '<div class="border border-[#E2E8F0] rounded-[8px] overflow-x-auto my-4 shadow-card bg-white"><table class="w-full text-left border-collapse text-[13px]">';
        }
        
        const parts = line.split('|').slice(1, -1).map(p => p.trim());
        
        if (parts.every(p => p.startsWith('-') || p.startsWith(' :') || p.endsWith(': '))) {
          continue;
        }
        
        const isHeader = !tableHtml.includes('<thead>');
        if (isHeader) {
          tableHtml += '<thead class="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-semibold text-[#475569] font-mono"><tr>';
          parts.forEach(p => {
            tableHtml += `<th class="p-3 font-semibold">${p}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr class="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">';
          parts.forEach(p => {
            tableHtml += `<td class="p-3 text-[#475569] font-mono text-[12px]">${p}</td>`;
          });
          tableHtml += '</tr>';
        }
        lines[i] = '';
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table></div>';
          lines[i] = tableHtml + '\n' + lines[i];
        }
      }
    }
    
    html = lines.join('\n');

    // Bullet lists translation
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-[14px] text-[#475569] leading-relaxed my-1.5">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-4 list-disc text-[14px] text-[#475569] leading-relaxed my-1.5">$1</li>');

    return html;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title overview badge */}
        <div className="flex justify-between items-center text-[12px] border border-[#E2E8F0] bg-white p-3.5 rounded-[12px] text-[#475569] select-none shadow-card">
          <span className="flex items-center gap-2 font-medium text-[#0F172A]">
            <BookOpen size={15} className="text-[#2563EB]" />
            Generated Architecture & API System Specification
          </span>
          <span className="font-mono text-[11px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-[4px] border border-[#E2E8F0]">
            AUTO-DOCUMENTED
          </span>
        </div>

        {/* Markdown Rendered box */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-8 shadow-card">
          <article
            className="prose prose-slate max-w-none text-[#475569] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(mdContent) }}
          />
        </div>
      </div>
    </div>
  );
}
