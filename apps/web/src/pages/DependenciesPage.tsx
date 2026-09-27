import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { ArrowUpRight, FileInput, Loader2, Boxes } from 'lucide-react';

interface Dependency {
  name: string;
  version: string;
  type: 'direct' | 'dev';
}

interface FileImports {
  _id: string;
  path: string;
  language: string;
  imports: { name: string; path: string; isExternal: boolean }[];
}

export default function DependenciesPage() {
  const { id } = useParams<{ id: string }>();

  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [fileImports, setFileImports] = useState<FileImports[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDependencies = async () => {
    try {
      const projectData = await apiFetch(`/api/projects/${id}`);
      setDependencies(projectData.dependencies || []);

      const filesData = await apiFetch(`/api/projects/${id}/files`);
      setFileImports(filesData);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[13px] text-[#64748B] font-mono bg-[#F8FAFC] space-y-2">
        <Loader2 size={20} className="animate-spin text-[#2563EB]" />
        <span>Loading package manifests...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 select-none">
      
      {/* Column 1: Package Manifest Dependencies */}
      <section className="md:col-span-1 space-y-4">
        <div className="flex items-center gap-2">
          <Boxes size={16} className="text-[#2563EB]" />
          <h3 className="text-[15px] font-semibold text-[#0F172A]">
            Package Manifests
          </h3>
          <span className="text-[11px] font-mono text-[#64748B] bg-white px-2 py-0.5 rounded-[4px] border border-[#E2E8F0]">
            {dependencies.length}
          </span>
        </div>
        
        {dependencies.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 text-[13px] text-[#64748B] text-center shadow-card font-mono">
            No declared dependencies in project manifests.
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden shadow-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-semibold text-[#475569] font-mono">
                  <th className="p-3">Package</th>
                  <th className="p-3">Version</th>
                  <th className="p-3">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[12px] font-mono">
                {dependencies.map((dep, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3 font-medium text-[#0F172A] truncate max-w-[140px]">{dep.name}</td>
                    <td className="p-3 text-[#64748B]">{dep.version}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-[4px] ${
                        dep.type === 'direct' 
                          ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]' 
                          : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                      }`}>
                        {dep.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Column 2: File Import Inventory */}
      <section className="md:col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <FileInput size={16} className="text-[#06B6D4]" />
          <h3 className="text-[15px] font-semibold text-[#0F172A]">
            Source File Imports
          </h3>
        </div>

        {fileImports.length === 0 ? (
          <p className="text-[13px] text-[#64748B] font-mono">No source code files ingested.</p>
        ) : (
          <div className="space-y-3.5">
            {fileImports
              .filter(f => f.imports && f.imports.length > 0)
              .map(file => (
                <div key={file._id} className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-card space-y-3">
                  <div className="flex justify-between items-center text-[12px] font-mono border-b border-[#E2E8F0] pb-2">
                    <span className="font-semibold text-[#0F172A] truncate">{file.path}</span>
                    <span className="text-[10px] text-[#64748B] font-mono bg-[#F1F5F9] border border-[#E2E8F0] px-1.5 py-0.5 rounded-[4px] uppercase">
                      {file.language}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {file.imports.map((imp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 rounded-[6px] text-[11px] font-mono text-[#475569]"
                      >
                        <span className="text-[#0F172A] font-medium">{imp.name}</span>
                        <span className="text-[#CBD5E1]">|</span>
                        <span className="truncate max-w-[120px] text-[#64748B]">{imp.path}</span>
                        {imp.isExternal && (
                          <ArrowUpRight size={11} className="text-[#2563EB]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
