import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

// --- Custom Animations ---
const customStyles = `
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.85) translateY(15px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-pop-in {
    animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes glowPulse {
    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5); }
    70% { box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  }
  .animate-glow-pulse {
    animation: glowPulse 2.5s infinite;
  }
  .react-flow__edge-path {
    stroke-linecap: round;
  }
`;

const CustomNode = ({ data, selected }) => {
  const isTrigger = data.nodeType === "trigger";
  const isCondition = data.nodeType === "condition";
  const status = data.status || "default";

  let borderColor, headerBg, bodyBg;

  if (status === "positive") {
    borderColor = "border-emerald-400";
    headerBg = "bg-gradient-to-r from-emerald-500 to-emerald-600";
    bodyBg = "bg-gradient-to-b from-white to-emerald-50";
  } else if (status === "negative") {
    borderColor = "border-red-400";
    headerBg = "bg-gradient-to-r from-red-500 to-red-600";
    bodyBg = "bg-gradient-to-b from-white to-red-50";
  } else if (isTrigger) {
    borderColor = "border-indigo-400";
    headerBg = "bg-gradient-to-r from-indigo-500 to-indigo-600";
    bodyBg = "bg-gradient-to-b from-white to-indigo-50";
  } else if (isCondition) {
    borderColor = "border-amber-400";
    headerBg = "bg-gradient-to-r from-amber-500 to-amber-600";
    bodyBg = "bg-gradient-to-b from-white to-amber-50";
  } else {
    borderColor = "border-slate-300";
    headerBg = "bg-gradient-to-r from-slate-700 to-slate-800";
    bodyBg = "bg-gradient-to-b from-white to-slate-50";
  }

  const iconName = status === "positive"
    ? "check_circle"
    : status === "negative"
    ? "cancel"
    : isTrigger
    ? "bolt"
    : isCondition
    ? "call_split"
    : "settings";

  return (
    <div
      className={`animate-pop-in ${bodyBg} rounded-2xl shadow-lg hover:shadow-2xl border-[2.5px] ${borderColor} transition-all duration-300 ease-out overflow-hidden min-w-[220px] max-w-[280px] group ${
        selected ? "ring-4 ring-indigo-300/50 scale-105" : "hover:-translate-y-1.5"
      } ${isTrigger ? "animate-glow-pulse" : ""}`}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className={`!w-3.5 !h-3.5 !border-2 !border-white transition-transform group-hover:scale-125 ${isTrigger ? '!bg-indigo-500' : '!bg-slate-400'}`} 
      />
      
      <div className={`px-4 py-2 flex items-center justify-between text-[11px] font-extrabold tracking-widest uppercase shadow-sm ${headerBg}`}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-white/90 drop-shadow-md">{iconName}</span>
          <span className="text-white/95 drop-shadow-sm">{data.nodeType || "Step"}</span>
        </div>
      </div>
      
      <div className="p-4 text-xs font-semibold text-slate-700 text-center leading-relaxed">
        {data.label}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className={`!w-3.5 !h-3.5 !border-2 !border-white transition-transform group-hover:scale-125 ${isTrigger ? '!bg-indigo-500' : '!bg-slate-400'}`}
      />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const PALETTE = [
  { type: "trigger", label: "Trigger / Terminal", icon: "bolt", color: "#6366f1" },
  { type: "action", label: "Action Process", icon: "settings", color: "#1e293b" },
  { type: "condition", label: "Condition / Check", icon: "call_split", color: "#d97706" },
];

let idCounter = 1;
const nextId = () => `node_${idCounter++}`;

function FlowchartContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  const { project, fitView } = useReactFlow();

  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
      };
      document.head.appendChild(script);
    }
  }, []);

  const extractPdfText = async (file) => {
    if (!window.pdfjsLib) throw new Error("PDF library loading...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item) => item.str).join(" ") + "\n";
    }
    return fullText.trim();
  };

  const handleMicrophoneToggle = async () => {
    if (isRecording) {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) {}
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.lang = "en-US";
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);
        recognition.onresult = (e) => {
          const transcript = e.results[0][0].transcript;
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };
        recognition.start();
        return;
      } catch (err) {}
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setPrompt((prev) => prev ? `${prev}\n\n[Voice note recorded]` : "[Voice note recorded]");
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone permission denied.");
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    for (const file of files) {
      setAttachedFiles((prev) => [...prev, file.name]);
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          const parsedText = await extractPdfText(file);
          if (parsedText) setPrompt((prev) => prev ? `${prev}\n\nProcess document:\n${parsedText}` : `Process document:\n${parsedText}`);
        } catch (pdfErr) {
          setError("Failed to parse PDF file.");
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPrompt((prev) => prev ? `${prev}\n\n${e.target.result}` : e.target.result);
        };
        reader.readAsText(file);
      }
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: true, style: { stroke: "#6366f1", strokeWidth: 3 } }, eds)),
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

      const meta = PALETTE.find((n) => n.type === nodeType);
      const newNode = {
        id: nextId(),
        type: "custom",
        position,
        data: { label: meta.label, nodeType, status: "default" },
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://logicflow-ompw.onrender.com/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate workflow");

      setRecommendations(data.recommendations || []);
      const mermaidText = data.mermaidCode || "";

      const nodeRegex = /([A-Za-z0-9_]+)\s*[\{\[\(]"?(.*?)"?[\}\]\)]/g;
      const nodeMatches = [...mermaidText.matchAll(nodeRegex)];
      const nodeMap = {};
      nodeMatches.forEach((m) => (nodeMap[m[1]] = m[2]));

      const edgeRegex = /([A-Za-z0-9_]+)\s*-->\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g;
      const rawEdges = [...mermaidText.matchAll(edgeRegex)];

      const nodeStatusMap = {};

      rawEdges.forEach((e) => {
        const branchLabel = (e[2] || "").toLowerCase();
        const targetId = e[3];

        if (branchLabel.includes("yes") || branchLabel.includes("accept") || branchLabel.includes("approve") || branchLabel.includes("confirm") || branchLabel.includes("success")) {
          nodeStatusMap[targetId] = "positive";
        } else if (branchLabel.includes("no") || branchLabel.includes("reject") || branchLabel.includes("fail") || branchLabel.includes("cancel") || branchLabel.includes("out of stock")) {
          nodeStatusMap[targetId] = "negative";
        }
      });

      const keys = Object.keys(nodeMap);
      const levels = {};
      const xOffsets = {};

      rawEdges.forEach((e) => {
        const src = e[1];
        const tgt = e[3];
        if (levels[src] === undefined) levels[src] = 0;
        levels[tgt] = Math.max(levels[tgt] || 0, levels[src] + 1);
      });

      keys.forEach((parentKey) => {
        const children = rawEdges.filter((e) => e[1] === parentKey);
        if (children.length > 1) {
          children.forEach((cEdge, idx) => {
            const childKey = cEdge[3];
            const offset = idx === 0 ? -220 : 220; // Increased offset slightly for wider nodes
            xOffsets[childKey] = (xOffsets[parentKey] || 0) + offset;
          });
        }
      });

      const parsedNodes = keys.map((key, index) => {
        const label = nodeMap[key];
        const lower = label.toLowerCase();
        let nType = "action";
        if (lower.includes("start") || lower.includes("end")) {
          nType = "trigger";
        } else if (label.includes("?") || lower.includes("check") || lower.includes("stock") || lower.includes("retry")) {
          nType = "condition";
        }

        let nodeStatus = nodeStatusMap[key] || "default";
        if (lower.includes("confirmed") || lower.includes("success") || lower.includes("approved")) {
          nodeStatus = "positive";
        } else if (lower.includes("failed") || lower.includes("cancelled") || lower.includes("rejected")) {
          nodeStatus = "negative";
        }

        const depth = levels[key] !== undefined ? levels[key] : index;
        const xPos = 300 + (xOffsets[key] || 0);
        const yPos = 40 + depth * 140; // increased depth spacing slightly

        return {
          id: key,
          type: "custom",
          position: { x: xPos, y: yPos },
          data: { label, nodeType: nType, status: nodeStatus },
        };
      });

      const parsedEdges = rawEdges.map((e, idx) => {
        const source = e[1];
        const branchLabel = e[2] || "";
        const target = e[3];

        const lowerBranch = branchLabel.toLowerCase();
        const isPositive = lowerBranch.includes("yes") || lowerBranch.includes("accept") || lowerBranch.includes("approve") || lowerBranch.includes("confirm") || lowerBranch.includes("success");
        const isNegative = lowerBranch.includes("no") || lowerBranch.includes("reject") || lowerBranch.includes("fail") || lowerBranch.includes("cancel") || lowerBranch.includes("out of stock");

        let strokeColor = "#94a3b8"; // slate-400 default
        let edgeAnimated = false; // Add motion only to specific branches if desired, or all

        if (isPositive) {
          strokeColor = "#10b981"; // emerald-500
          edgeAnimated = true;
        } else if (isNegative) {
          strokeColor = "#ef4444"; // red-500
          edgeAnimated = true;
        } else {
            strokeColor = "#6366f1"; // indigo-500 for normal flow
            edgeAnimated = true;
        }

        return {
          id: `e_${source}_${target}_${idx}`,
          source,
          target,
          label: branchLabel,
          type: "smoothstep",
          animated: edgeAnimated,
          style: { stroke: strokeColor, strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
          labelStyle: { fill: strokeColor, fontWeight: 800, fontSize: 12 },
          labelBgPadding: [8, 6],
          labelBgBorderRadius: 8,
          labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95, stroke: strokeColor, strokeWidth: 1.5 },
        };
      });

      if (parsedNodes.length > 0) {
        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setTimeout(() => fitView({ padding: 0.25, duration: 600 }), 50);
      }
    } catch (err) {
      setError("Failed to generate correct flow logic.");
    } finally {
      setLoading(false);
    }
  };

  const hasWorkflow = nodes.length > 0;

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center h-14 px-6 w-full fixed top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500 tracking-tighter shrink-0">
              LogicFlow AI
            </div>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-slate-700">Workflow Studio</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 pt-14 h-full relative">
          <aside className="bg-white border-r border-slate-200 fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-72 flex flex-col p-4 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="mb-3">
              <h2 className="font-bold text-base text-slate-900">Workflow Engine</h2>
              <p className="text-xs text-slate-500">AI Logic Extraction</p>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-28 border border-slate-200 rounded-2xl p-3 pr-10 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 resize-none bg-slate-50 transition-all"
                  placeholder="Describe process, record voice, or attach files..."
                ></textarea>

                <button
                  onClick={handleMicrophoneToggle}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                  className={`absolute right-2 bottom-3 p-2 rounded-full transition-all ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                      : "text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isRecording ? "mic_off" : "mic"}
                  </span>
                </button>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.txt,.csv,.json,image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 py-2.5 rounded-2xl text-slate-600 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:text-indigo-600 group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-y-0.5 transition-transform">attach_file</span>
                  Attach Files
                </button>

                {attachedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {attachedFiles.map((name, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-lg truncate max-w-full"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold py-3 rounded-2xl transition-all shadow-md shadow-indigo-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                  {loading ? "sync" : "magic_button"}
                </span>
                {loading ? "Synthesizing..." : "Generate Workflow"}
              </button>

              {recommendations.length > 0 && (
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2 text-amber-800 font-extrabold text-xs">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">lightbulb</span>
                    AI Recommendations
                  </div>
                  <ul className="text-[11px] font-medium text-amber-900/80 flex flex-col gap-1.5 list-disc pl-4">
                    {recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="h-px bg-slate-100 my-1"></div>

              <div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Drag to Add</h3>
                <div className="flex flex-col gap-2.5">
                  {PALETTE.map((n) => (
                    <div
                      key={n.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, n.type)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 border-slate-100 bg-white cursor-grab hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-xs font-bold text-slate-700 active:cursor-grabbing"
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ color: n.color }}>{n.icon}</span>
                      {n.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="animate-pop-in mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[11px] font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}
          </aside>

          <main
            ref={reactFlowWrapper}
            className="flex-1 ml-72 relative overflow-hidden bg-slate-50/50 h-[calc(100vh-3.5rem)]"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            {!hasWorkflow && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none z-10 text-center p-6 animate-pop-in">
                <div className="w-16 h-16 rounded-3xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <span className="material-symbols-outlined text-[32px]">account_tree</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm mb-1">Canvas is empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs font-medium">Use voice input, upload documents, or drag nodes onto the canvas to begin.</p>
                </div>
              </div>
            )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
              className="w-full h-full"
            >
              <Background gap={24} color="#94a3b8" variant="dots" size={1.5} className="opacity-40" />
              <Controls className="bg-white/90 backdrop-blur-sm border-none shadow-[0_4px_20px_rgb(0,0,0,0.08)] rounded-xl p-1 !m-6 overflow-hidden" />
            </ReactFlow>

            {selectedNode && (
              <div className="absolute top-6 right-6 w-72 bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-5 z-30 animate-pop-in">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Edit Node</h4>
                  <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium mb-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                  autoFocus
                />
                <button
                  onClick={saveNodeLabel}
                  className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default function FlowchartTab() {
  return (
    <ReactFlowProvider>
      <FlowchartContent />
    </ReactFlowProvider>
  );
}
