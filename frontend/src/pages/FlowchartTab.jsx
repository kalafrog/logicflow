import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

// --- Draggable node palette definitions ---
const NODE_TYPES = [
  { type: "trigger", label: "Trigger", icon: "bolt", color: "#6366f1" },
  { type: "action", label: "Action", icon: "settings", color: "#4f46e5" },
  { type: "condition", label: "Condition", icon: "call_split", color: "#d97706" },
  { type: "apiCall", label: "API Call", icon: "cloud", color: "#0ea5e9" },
];

let idCounter = 1;
const nextId = () => `node_${idCounter++}`;

function nodeStyle(nodeType) {
  const meta = NODE_TYPES.find((n) => n.type === nodeType) || NODE_TYPES[1];
  return {
    background: "#ffffff",
    border: `2px solid ${meta.color}`,
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#1e293b",
    minWidth: 220,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)"
  };
}

function FlowchartCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('flowchart'); // 'flowchart', 'swimlane'
  const [error, setError] = useState('');

  const reactFlowWrapper = useRef(null);
  const { project, fitView } = useReactFlow();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/reactflow");
      if (!nodeType) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const meta = NODE_TYPES.find((n) => n.type === nodeType);
      const newNode = {
        id: nextId(),
        type: "default",
        position,
        data: { label: meta.label, nodeType },
        style: nodeStyle(nodeType),
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setEditLabel(node.data.label);
  }, []);

  const saveNodeLabel = () => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: editLabel } } : n))
    );
    setSelectedNode(null);
  };

  // Connects to backend and aligns nodes in a single straight vertical flow
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://logicflow-ompw.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate workflow');

      const mermaidText = data.mermaidCode || '';
      const nodeMatches = [...mermaidText.matchAll(/([A-Za-z0-9_]+)\s*\["?(.*?)"?\]/g)];
      const edgeMatches = [...mermaidText.matchAll(/([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/g)];

      let parsedNodes = [];
      let parsedEdges = [];

      if (nodeMatches.length > 0) {
        const startX = 250;
        const startY = 80;
        const gapY = 110; // Vertical distance between nodes in a straight line

        const idMap = {};
        nodeMatches.forEach((match, index) => {
          const rawId = match[1];
          const label = match[2];
          const uniqueId = nextId();
          idMap[rawId] = uniqueId;

          let nType = "action";
          const lower = label.toLowerCase();
          if (lower.includes('trigger') || index === 0) nType = "trigger";
          else if (lower.includes('?') || lower.includes('check') || lower.includes('if')) nType = "condition";
          else if (lower.includes('api') || lower.includes('request') || lower.includes('fetch')) nType = "apiCall";

          parsedNodes.push({
            id: uniqueId,
            type: "default",
            position: { x: startX, y: startY + (index * gapY) },
            data: { label, nodeType: nType },
            style: nodeStyle(nType)
          });
        });

        edgeMatches.forEach((ematch) => {
          const sourceKey = idMap[ematch[1]];
          const targetKey = idMap[ematch[2]];
          if (sourceKey && targetKey) {
            parsedEdges.push({
              id: `e_${sourceKey}_${targetKey}`,
              source: sourceKey,
              target: targetKey,
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2 }
            });
          }
        });

        if (parsedEdges.length === 0 && parsedNodes.length > 1) {
          for (let i = 0; i < parsedNodes.length - 1; i++) {
            parsedEdges.push({
              id: `e_${i}_${i+1}`,
              source: parsedNodes[i].id,
              target: parsedNodes[i+1].id,
              animated: true,
              style: { stroke: "#6366f1", strokeWidth: 2 }
            });
          }
        }
      }

      if (parsedNodes.length > 0) {
        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
      } else {
        throw new Error('No valid nodes parsed from response');
      }

    } catch (err) {
      console.error(err);
      setError("AI generation fallback loaded.");
      const fallbackNodes = [
        { id: nextId(), type: "default", position: { x: 250, y: 80 }, data: { label: `Trigger: ${prompt}`, nodeType: "trigger" }, style: nodeStyle("trigger") },
        { id: nextId(), type: "default", position: { x: 250, y: 190 }, data: { label: "Process Request", nodeType: "action" }, style: nodeStyle("action") },
        { id: nextId(), type: "default", position: { x: 250, y: 300 }, data: { label: "Valid?", nodeType: "condition" }, style: nodeStyle("condition") },
      ];
      const fallbackEdges = [
        { id: 'e1-2', source: fallbackNodes[0].id, target: fallbackNodes[1].id, animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } },
        { id: 'e2-3', source: fallbackNodes[1].id, target: fallbackNodes[2].id, animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }
      ];
      setNodes(fallbackNodes);
      setEdges(fallbackEdges);
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
    } finally {
      setLoading(false);
    }
  };

  const hasWorkflow = nodes.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Professional Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center h-16 px-6 w-full fixed top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
            LogicFlow AI
          </div>
          <div className="h-5 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2 group cursor-pointer hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all">
            <span className="font-medium text-sm text-slate-700">Employee Onboarding SOP</span>
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-600 transition-colors">edit</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button 
            onClick={() => setActiveTab('flowchart')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'flowchart' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Flowchart
          </button>
          <button 
            onClick={() => setActiveTab('swimlane')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'swimlane' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Swimlane
          </button>
        </nav>

        {/* Right Actions & Sign In Button */}
        <div className="flex items-center gap-3">
          <button className="text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors flex items-center justify-center" title="Share">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button className="text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors flex items-center justify-center" title="Settings">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <div className="h-5 w-px bg-slate-200 mx-1"></div>
          <button className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-sm shadow-indigo-100 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">login</span>
            Sign In
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 pt-16 h-screen overflow-hidden relative">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-[76px] left-3 z-40 bg-indigo-600 text-white p-2.5 rounded-xl shadow-md"
          aria-label="Open workflow panel"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Sidebar Panel */}
        <aside
          className={`bg-white border-r border-slate-200 fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 flex flex-col p-5 z-40 shadow-xs transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-base text-slate-900 tracking-tight">Workflow Engine</h2>
              <p className="text-xs text-slate-500 font-medium">AI Logic Extraction & Palette</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="mb-5 flex-1 flex flex-col gap-4 overflow-y-auto">
            <div className="relative group border border-slate-200 rounded-xl p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all bg-slate-50/50">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-28 resize-none bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                placeholder="Describe your business process or paste an SOP transcript..."
              ></textarea>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 mt-1">
                <div className="flex gap-1">
                  <button className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 transition-colors" title="Voice Input">
                    <span className="material-symbols-outlined text-[16px]">mic</span>
                  </button>
                  <button className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 transition-colors" title="Attach Transcript">
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{prompt.length} chars</span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold py-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">magic_button</span>
              {loading ? "Synthesizing..." : "Generate Workflow"}
            </button>

            <div className="h-px bg-slate-200 my-1"></div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Drag to Add Node</h3>
              <div className="flex flex-col gap-2">
                {NODE_TYPES.map((n) => (
                  <div
                    key={n.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, n.type)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-xs transition-all"
                    style={{ borderColor: `${n.color}40` }}
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ color: n.color }}>
                      {n.icon}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{n.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-amber-600 text-[11px] font-medium mb-3 bg-amber-50 p-2.5 rounded-lg border border-amber-200">{error}</p>}
        </aside>

        {/* React Flow Canvas Area */}
        <main
          ref={reactFlowWrapper}
          className="flex-1 md:ml-80 relative dot-grid overflow-hidden bg-[#F8FAFC]"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {!hasWorkflow && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center pointer-events-none z-10 p-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <span className="material-symbols-outlined text-[32px]">account_tree</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-1">No active workflow</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Describe your process in the sidebar to generate via AI, or drag components onto the canvas.
                </p>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            className="w-full h-full"
          >
            <Background gap={24} color="#e2e8f0" />
            <Controls className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden p-1 gap-1" />
          </ReactFlow>

          {selectedNode && (
            <div className="absolute top-6 right-6 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-4 z-30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm">Edit Node Label</h4>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Node Text
              </label>
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mb-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
              <button
                onClick={saveNodeLabel}
                className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Apply Changes
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function FlowchartTab() {
  return (
    <ReactFlowProvider>
      <FlowchartCanvas />
    </ReactFlowProvider>
  );
}
