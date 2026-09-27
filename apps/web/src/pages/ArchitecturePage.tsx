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
import { RefreshCw, Search, Filter, Network } from 'lucide-react';
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
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

const ARCHETYPES: Array<{ id: string; label: string; archetype?: Archetype }> = [
  { id: 'all', label: 'All Modules' },
  { id: 'frontend', label: 'Frontend', archetype: 'frontend' },
  { id: 'router', label: 'Routers', archetype: 'router' },
  { id: 'controller', label: 'Controllers', archetype: 'controller' },
  { id: 'service', label: 'Services', archetype: 'service' },
  { id: 'model', label: 'Models', archetype: 'model' },
  { id: 'utility', label: 'Utilities', archetype: 'utility' },
];

export default function ArchitecturePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [rawNodesData, setRawNodesData] = useState<Node[]>([]);
  const [rawEdgesData, setRawEdgesData] = useState<Edge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
        position: { x: 0, y: 0 }
      }));

      // Design System Spec #22: Connections #CBD5E1 with subtle animated lines
      const rawEdges: Edge[] = (data.edges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#CBD5E1', strokeWidth: 1.75 },
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

  // Apply filtering & layouting whenever filters or raw data change
  useEffect(() => {
    if (rawNodesData.length === 0) return;

    let filteredNodes = rawNodesData;

    // Filter by Archetype
    if (selectedArchetype !== 'all') {
      filteredNodes = filteredNodes.filter(
        node => node.data?.archetype === selectedArchetype
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(
        node =>
          (node.data?.label as string)?.toLowerCase().includes(q) ||
          (node.data?.path as string)?.toLowerCase().includes(q)
      );
    }

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = rawEdgesData.filter(
      e => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      filteredNodes,
      filteredEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [rawNodesData, rawEdgesData, selectedArchetype, searchQuery, setNodes, setEdges]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (node.data?.path) {
      handleOpenInExplorer(node.data.path as string);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] h-full w-full overflow-hidden select-none">
      
      {/* Top Filter and Search Bar */}
      <div className="px-6 py-2.5 border-b border-[#E2E8F0] bg-white flex flex-wrap justify-between items-center gap-3 text-[13px] z-10 relative">
        
        {/* Left: Archetype Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 text-[#64748B] text-[12px] font-mono mr-1 shrink-0">
            <Filter size={13} className="text-[#94A3B8]" />
            <span>Filter:</span>
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

        {/* Right: Search & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search architecture nodes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] pl-7 pr-3 py-1.5 text-[12px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-all w-52 font-mono"
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

      {/* React Flow Viewport (Design System Spec #22: Background #F8FAFC, connections #CBD5E1) */}
      <div className="flex-1 min-h-0 bg-[#F8FAFC] relative w-full h-full">
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
    </div>
  );
}
