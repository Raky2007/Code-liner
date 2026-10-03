import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dagre from 'dagre';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionLineType,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { projectService } from '../services/projectService';
import { useProject } from '../layouts/ProjectDetailLayout';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Network, 
  Sparkles, 
  ExternalLink, 
  X,
  ArrowRight,
  Focus
} from 'lucide-react';
import ArchitectureNode from '../components/ArchitectureNode';
import { Archetype } from '../types';

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 264; 
  const nodeHeight = 120;
  
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (nodeWithPosition) {
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }
  });

  return { nodes, edges };
};

const ARCHETYPES: Array<{ id: string; label: string; archetype?: Archetype; color: string }> = [
  { id: 'all', label: 'All Layers', color: '#2563EB' },
  { id: 'frontend', label: 'Frontend', archetype: 'frontend', color: '#2563EB' },
  { id: 'router', label: 'Backend / Routers', archetype: 'router', color: '#06B6D4' },
  { id: 'controller', label: 'Controllers', archetype: 'controller', color: '#06B6D4' },
  { id: 'service', label: 'Services', archetype: 'service', color: '#7C3AED' },
  { id: 'model', label: 'Database / Models', archetype: 'model', color: '#16A34A' },
  { id: 'utility', label: 'Utilities', archetype: 'utility', color: '#64748B' },
];

export default function ArchitecturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openChatWithContext } = useProject();

  const [rawNodesData, setRawNodesData] = useState<Node[]>([]);
  const [rawEdgesData, setRawEdgesData] = useState<Edge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Density Controls (Section 19)
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [densityMode, setDensityMode] = useState<'modules' | 'files' | 'dependencies'>('modules');

  // Selected Node for "Why is this connected?" Panel
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const nodeTypes = useMemo<NodeTypes>(() => ({
    customNode: ArchitectureNode as any,
  }), []);

  const handleOpenInExplorer = useCallback((filePath: string) => {
    if (id && filePath) {
      navigate(`/project/${id}/files?path=${encodeURIComponent(filePath)}`);
    }
  }, [id, navigate]);

  const fetchGraph = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await projectService.getArchitecture(id);
      
      const rawNodes: Node[] = (data.nodes || []).map((node: any) => ({
        id: node.id,
        type: 'customNode',
        data: {
          label: node.label,
          path: node.path,
          archetype: node.archetype,
          language: node.language,
          onOpenInExplorer: handleOpenInExplorer,
        },
        position: { x: 0, y: 0 },
      }));

      const rawEdges: Edge[] = (data.edges || []).map((edge: any, index: number) => ({
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#CBD5E1', strokeWidth: 1.5 },
      }));

      setRawNodesData(rawNodes);
      setRawEdgesData(rawEdges);
    } catch (err) {
      console.error('Failed to load architecture graph:', err);
    } finally {
      setLoading(false);
    }
  }, [id, handleOpenInExplorer]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Filter & Layout pipeline based on archetype, density, and search
  useEffect(() => {
    let filteredNodes = rawNodesData;

    // Archetype filter
    if (selectedArchetype !== 'all') {
      filteredNodes = filteredNodes.filter(
        node => node.data?.archetype === selectedArchetype
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(
        node =>
          (node.data?.label as string)?.toLowerCase().includes(q) ||
          (node.data?.path as string)?.toLowerCase().includes(q)
      );
    }

    // Density filter
    if (densityMode === 'modules') {
      // In modules view, prioritize key architectural units (routers, services, models, components)
      if (filteredNodes.length > 25) {
        filteredNodes = filteredNodes.slice(0, 25);
      }
    }

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = rawEdgesData
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(edge => ({
        ...edge,
        style: {
          stroke: (selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id))
            ? '#2563EB'
            : '#CBD5E1',
          strokeWidth: (selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id))
            ? 2.5
            : 1.5,
        }
      }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      filteredNodes,
      filteredEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [rawNodesData, rawEdgesData, selectedArchetype, searchQuery, densityMode, selectedNode, setNodes, setEdges]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  // Connected nodes details for selected node
  const connectedDetails = useMemo(() => {
    if (!selectedNode) return null;
    const inEdges = rawEdgesData.filter(e => e.target === selectedNode.id);
    const outEdges = rawEdgesData.filter(e => e.source === selectedNode.id);

    const inboundNodes = inEdges.map(e => rawNodesData.find(n => n.id === e.source)).filter(Boolean) as Node[];
    const outboundNodes = outEdges.map(e => rawNodesData.find(n => n.id === e.target)).filter(Boolean) as Node[];

    return { inboundNodes, outboundNodes };
  }, [selectedNode, rawEdgesData, rawNodesData]);

  const handleExplainConnectionAI = () => {
    if (!selectedNode) return;
    const prompt = `Explain the architecture relationship and responsibilities of "${selectedNode.data?.label}" located at "${selectedNode.data?.path}" within this project. How does it interact with its callers and dependencies?`;
    openChatWithContext(prompt);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] h-full w-full overflow-hidden select-none">
      
      {/* Top Filter, Density & Search Controls */}
      <div className="px-6 py-2.5 border-b border-[#E2E8F0] bg-white flex flex-wrap justify-between items-center gap-3 text-[13px] z-10 relative">
        
        {/* Left: Archetype Filter Pills with Colors */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 text-[#64748B] text-[12px] font-mono mr-1 shrink-0">
            <Filter size={13} className="text-[#94A3B8]" />
            <span>Layer:</span>
          </div>
          {ARCHETYPES.map(item => {
            const count = item.id === 'all' 
              ? rawNodesData.length 
              : rawNodesData.filter(n => n.data?.archetype === item.id).length;
            
            if (item.id !== 'all' && count === 0) return null;

            const isSelected = selectedArchetype === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedArchetype(item.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[12px] font-mono font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-[#1D4ED8] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center: Graph Density Controls (Section 19) */}
        <div className="flex items-center border border-[#E2E8F0] rounded-[6px] p-0.5 bg-[#F8FAFC] text-[11px] font-mono font-medium text-[#475569]">
          <button
            onClick={() => setDensityMode('modules')}
            className={`px-2.5 py-1 rounded-[4px] transition-colors ${
              densityMode === 'modules' ? 'bg-white text-[#0F172A] shadow-xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            Show modules
          </button>
          <button
            onClick={() => setDensityMode('files')}
            className={`px-2.5 py-1 rounded-[4px] transition-colors ${
              densityMode === 'files' ? 'bg-white text-[#0F172A] shadow-xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            Show files
          </button>
          <button
            onClick={() => setDensityMode('dependencies')}
            className={`px-2.5 py-1 rounded-[4px] transition-colors ${
              densityMode === 'dependencies' ? 'bg-white text-[#0F172A] shadow-xs font-bold' : 'hover:text-[#0F172A]'
            }`}
          >
            Show dependencies
          </button>
        </div>

        {/* Right: Search & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] pl-7 pr-3 py-1.5 text-[12px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-all w-44 font-mono"
            />
          </div>

          <button
            onClick={fetchGraph}
            className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] font-medium transition-colors p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] hover:bg-[#F1F5F9]"
            title="Recalculate layout"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Viewport & "Why is this connected?" Side Inspector */}
      <div className="flex-1 min-h-0 bg-[#F8FAFC] relative w-full h-full flex">
        
        {/* Graph Canvas */}
        <div className="flex-1 h-full relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[13px] text-[#64748B] font-mono space-y-2">
              <RefreshCw size={22} className="animate-spin text-[#2563EB]" />
              <span>Parsing AST relationships & synthesizing DAG...</span>
            </div>
          ) : nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[13px] text-[#64748B] font-mono space-y-2">
              <Network size={32} className="text-[#CBD5E1]" />
              <span>No module nodes match the current filter or query.</span>
            </div>
          ) : (
            <div className="absolute inset-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                nodesConnectable={false}
                nodesDraggable={true}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#CBD5E1" gap={20} size={1} />
                <Controls showInteractive={false} position="bottom-right" className="bg-white rounded-[8px] shadow-card overflow-hidden border border-[#E2E8F0]" />
                <MiniMap 
                  position="bottom-left" 
                  nodeColor="#94A3B8" 
                  maskColor="rgba(248, 250, 252, 0.75)"
                  className="rounded-[8px] border border-[#E2E8F0] overflow-hidden shadow-card bg-white"
                />
              </ReactFlow>
            </div>
          )}
        </div>

        {/* "Why is this connected?" Side Inspector (Section 19) */}
        {selectedNode && (
          <div className="w-80 border-l border-[#E2E8F0] bg-white h-full flex flex-col shadow-card z-20 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Focus size={16} className="text-[#2563EB]" />
                <span className="font-mono font-bold text-[13px] text-[#0F172A] truncate">
                  Node Inspector
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-[4px] hover:bg-[#E2E8F0] text-[#64748B] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-[12px]">
              {/* Node Overview */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B]">Module Target</span>
                <h4 className="text-[14px] font-bold font-mono text-[#0F172A] break-all">
                  {selectedNode.data?.label as string}
                </h4>
                <p className="text-[11px] font-mono text-[#64748B] break-all">
                  {selectedNode.data?.path as string}
                </p>
                <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] uppercase">
                  {selectedNode.data?.archetype as string}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  onClick={() => handleOpenInExplorer(selectedNode.data?.path as string)}
                  className="flex-1 py-1.5 px-2 rounded-[6px] bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#2563EB] text-[#2563EB] font-mono text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Open Code</span>
                  <ExternalLink size={11} />
                </button>
                <button
                  onClick={handleExplainConnectionAI}
                  className="flex-1 py-1.5 px-2 rounded-[6px] bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE] text-[#1D4ED8] font-medium text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <Sparkles size={11} />
                  <span>Explain AI</span>
                </button>
              </div>

              {/* Inbound Callers ("Why is this called?") */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[11px] font-mono uppercase font-semibold text-[#0F172A] flex items-center justify-between">
                  <span>Imported / Called By</span>
                  <span className="text-[#64748B]">{connectedDetails?.inboundNodes.length || 0}</span>
                </span>
                {connectedDetails?.inboundNodes.length === 0 ? (
                  <p className="text-[11px] text-[#94A3B8] font-mono italic">No inbound callers in current layout.</p>
                ) : (
                  <div className="space-y-1.5">
                    {connectedDetails?.inboundNodes.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => setSelectedNode(n)}
                        className="p-2 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#2563EB] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <span className="font-mono text-[#0F172A] truncate max-w-[180px]">{n.data?.label as string}</span>
                        <ArrowRight size={10} className="text-[#94A3B8]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outbound Dependencies ("What does this call?") */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[11px] font-mono uppercase font-semibold text-[#0F172A] flex items-center justify-between">
                  <span>Dependencies / Outbound</span>
                  <span className="text-[#64748B]">{connectedDetails?.outboundNodes.length || 0}</span>
                </span>
                {connectedDetails?.outboundNodes.length === 0 ? (
                  <p className="text-[11px] text-[#94A3B8] font-mono italic">No outbound dependencies.</p>
                ) : (
                  <div className="space-y-1.5">
                    {connectedDetails?.outboundNodes.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => setSelectedNode(n)}
                        className="p-2 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#06B6D4] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <span className="font-mono text-[#0F172A] truncate max-w-[180px]">{n.data?.label as string}</span>
                        <ArrowRight size={10} className="text-[#94A3B8]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
