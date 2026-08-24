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

const CustomNode = ({ data, selected }) => {
  const isTrigger = data.nodeType === "trigger";
  const isCondition = data.nodeType === "condition";

  const borderColor = isTrigger
    ? "border-indigo-500"
    : isCondition
    ? "border-amber-500"
    : "border-slate-300";

  const headerBg = isTrigger
    ? "bg-indigo-600 text-white"
    : isCondition
    ? "bg-amber-500 text-white"
    : "bg-slate-800 text-white";

  const iconName = isTrigger
    ? "bolt"
    : isCondition
    ? "call_split"
    : "settings";

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-2 ${borderColor} transition-all duration-200 overflow-hidden min-w-[220px] max-w-[280px] ${
        selected ? "ring-4 ring-indigo-200 scale-105" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3" />
      <div className={`px-3 py-1.5 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase ${headerBg}`}>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">{iconName}</span>
          <span>{data.nodeType || "Step"}</span>
        </div>
      </div>
      <div className="p-3 text-xs font-semibold text-slate-800 text-center leading-relaxed">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
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
    (params) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }, eds)),
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
        data: { label: meta.label, nodeType },
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
            const offset = idx === 0 ? -200 : 200;
            xOffsets[childKey] = (xOffsets[parentKey] || 0) + offset;
          });
        }
      });

      const parsedNodes = keys.map((key, index) => {
        const label = nodeMap[key];
        const lower = label.toLowerCase();
        let nType = "action";
        if (lower.includes("start") || lower.includes("end") || lower.includes("confirm")) {
          nType = "trigger";
        } else if (label.includes("?") || lower.includes("check") || lower.includes("stock") || lower.includes("retry")) {
          nType = "condition";
        }

        const depth = levels[key] !== undefined ? levels[key] : index;
        const xPos = 300 + (xOffsets[key] || 0);
        const yPos = 40 + depth * 130;

        return {
          id: key,
          type: "custom",
          position: { x: xPos, y: yPos },
          data: { label, nodeType: nType },
        };
      });

      const parsedEdges = rawEdges.map((e, idx) => {
        const source = e[1];
        const branchLabel = e[2] || "";
        const target = e[3];

        const lowerBranch = branchLabel.toLowerCase();
        const isNegative = lowerBranch.includes("no") || lowerBranch.includes("fail") || lowerBranch.includes("out of stock");

        return {
          id: `e_${source}_${target}_${idx}`,
          source,
          target,
          label: branchLabel,
          type: "smoothstep",
          animated: true,
          style: { stroke: isNegative ? "#ef4444" : "#6366f1", strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: isNegative ? "#ef4444" : "#6366f1" },
          labelStyle: { fill: isNegative ? "#dc2626" : "#4f46e5", fontWeight: 800, fontSize: 11 },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 6,
          labelBgStyle: { fill: "#ffffff", fillOpacity: 0.95 },
        };
      });

      if (parsedNodes.length > 0) {
        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 50);
      }
    } catch (err) {
      setError("Failed to generate correct flow logic.");
    } finally {
      setLoading(false);
    }
  };

  const hasWorkflow = nodes.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <header className="bg-white border-b border-slate-200 flex justify-between items-center h-14 px-6 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="font-bold text-lg text-indigo-600 tracking-tighter shrink-0">
            LogicFlow AI
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-700">Workflow Studio</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-14 h-full relative">
        <aside className="bg-white border-r border-slate-200 fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-72 flex flex-col p-4 z-40">
          <div className="mb-3">
            <h2 className="font-bold text-base text-slate-900">Workflow Engine</h2>
            <p className="text-xs text-slate-500">AI Logic Extraction</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-28 border border-slate-200 rounded-xl p-2.5 pr-8 text-xs text-slate-800 outline-none focus:border-indigo-500 resize-none bg-slate-50"
                placeholder="Describe process, record voice, or attach files..."
              ></textarea>

              <button
                onClick={handleMicrophoneToggle}
                title={isRecording ? "Stop recording" : "Start voice input"}
                className={`absolute right-2 bottom-3 p-1.5 rounded-full transition-all ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
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
                className="w-full border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 py-2 rounded-xl text-slate-600 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">attach_file</span>
                Attach Files (PDF, Images, Text)
              </button>

              {attachedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {attachedFiles.map((name, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md truncate max-w-full"
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">magic_button</span>
              {loading ? "Synthesizing..." : "Generate Workflow"}
            </button>

            {recommendations.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1.5 text-amber-800 font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  AI Recommendations
                </div>
                <ul className="text-[11px] text-amber-900 flex flex-col gap-1.5 list-disc pl-4">
                  {recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="h-px bg-slate-200 my-1"></div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Drag to Add Node</h3>
              <div className="flex flex-col gap-2">
                {PALETTE.map((n) => (
                  <div
                    key={n.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, n.type)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-white cursor-grab hover:border-indigo-400 transition-all text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ color: n.color }}>{n.icon}</span>
                    {n.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-amber-600 text-[10px] mt-2">{error}</p>}
        </aside>

        <main
          ref={reactFlowWrapper}
          className="flex-1 ml-72 relative overflow-hidden bg-[#F8FAFC] h-[calc(100vh-3.5rem)]"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {!hasWorkflow && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none z-10 text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <span className="material-symbols-outlined text-[28px]">account_tree</span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No active workflow found</h3>
              <p className="text-xs text-slate-500 max-w-xs">Use voice input, upload documents, or drag nodes onto the canvas.</p>
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
            <Background gap={20} color="#cbd5e1" variant="dots" />
            <Controls className="bg-white border border-slate-200 rounded-xl shadow-md p-1" />
          </ReactFlow>

          {selectedNode && (
            <div className="absolute top-6 right-6 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-30">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800 text-xs">Edit Node</h4>
                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs mb-3 outline-none focus:border-indigo-500"
              />
              <button
                onClick={saveNodeLabel}
                className="w-full bg-indigo-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700"
              >
                Save
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
      <FlowchartContent />
    </ReactFlowProvider>
  );
}
