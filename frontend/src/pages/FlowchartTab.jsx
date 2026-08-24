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

// --- Custom Animations & Glassmorphism Styles ---
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
  
  /* The slow-moving animated background */
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .bg-animated-mesh {
    background: linear-gradient(-45deg, #eef2ff, #f8fafc, #f3e8ff, #e0e7ff, #f1f5f9);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
  }

  /* Custom styling for the ReactFlow edges */
  .react-flow__edge-path {
    stroke-linecap: round;
  }
  
  /* Custom scrollbar for the sidebar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
`;

const CustomNode = ({ data, selected }) => {
  const isTrigger = data.nodeType === "trigger";
  const isCondition = data.nodeType === "condition";
  const status = data.status || "default";

  let borderColor, headerBg, bodyBg;

  if (status === "positive") {
    borderColor = "border-emerald-400";
    headerBg = "bg-gradient-to-r from-emerald-500 to-emerald-600";
    bodyBg = "bg-white/80 backdrop-blur-md";
  } else if (status === "negative") {
    borderColor = "border-red-400";
    headerBg = "bg-gradient-to-r from-red-500 to-red-600";
    bodyBg = "bg-white/80 backdrop-blur-md";
  } else if (isTrigger) {
    borderColor = "border-indigo-400";
    headerBg = "bg-gradient-to-r from-indigo-500 to-indigo-600";
    bodyBg = "bg-white/80 backdrop-blur-md";
  } else if (isCondition) {
    borderColor = "border-amber-400";
    headerBg = "bg-gradient-to-r from-amber-500 to-amber-600";
    bodyBg = "bg-white/80 backdrop-blur-md";
  } else {
    borderColor = "border-slate-300";
    headerBg = "bg-gradient-to-r from-slate-700 to-slate-800";
    bodyBg = "bg-white/80 backdrop-blur-md";
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
      className={`animate-pop-in ${bodyBg} rounded-2xl shadow-xl hover:shadow-2xl border-[2px] border-white/60 ring-1 ring-inset ${
        selected ? "ring-4 ring-indigo-400/50 scale-105" : `ring-${borderColor.split('-')[1]}-400/50 hover:-translate-y-1`
      } transition-all duration-300 ease-out overflow-hidden min-w-[220px] max-w-[280px] group ${isTrigger ? "animate-glow-pulse" : ""}`}
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
      
      <div className="p-4 text-xs font-semibold text-slate-800 text-center leading-relaxed">
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
            const offset = idx === 0 ? -220 : 220;
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
        const yPos = 40 + depth * 140;

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

        let strokeColor = "#94a3b8"; 
        let edgeAnimated = true; 

        if (isPositive) strokeColor = "#10b981"; 
        else if (isNegative) strokeColor = "#ef4444"; 
        else strokeColor = "#6366f1"; 

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
      <div className="min-h-screen bg-animated-mesh flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        
        {/* Glassmorphism Header */}
        <header className="bg-white/50 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex justify-between items-center h-16 px-8 w-full fixed top-0 z-50 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="material-symbols-outlined text-white text-[18px]">account_tree</span>
            </div>
            <div className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-600 tracking-tight shrink-0">
              LogicFlow AI
            </div>
            <div className="h-6 w-px bg-slate-300/50 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-600 tracking-wide">Workflow Studio</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 pt-16 h-full relative">
          
          {/* Floating Glassmorphism Sidebar */}
          <aside className="absolute left-6 top-24 bottom-6 w-80 flex flex-col z-40 bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-5 shadow-[0_8px_32px_rgba(31,38,135,0.07)]">
            <div className="mb-4">
              <h2 className="font-extrabold text-lg text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500">
                Workflow Engine
              </h2>
              <p className="text-xs font-semibold text-slate-500 tracking-wide">AI Logic Extraction</p>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 border border-white/50 bg-white/40 rounded-2xl p-4 pr-12 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 resize-none transition-all shadow-inner placeholder:text-slate-400 font-medium"
                  placeholder="Describe process, record voice, or attach files..."
                ></textarea>

                <button
                  onClick={handleMicrophoneToggle}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                  className={`absolute right-3 bottom-4 p-2.5 rounded-full transition-all duration-300 ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      : "bg-white/80 text-indigo-500 hover:text-indigo-700 hover:bg-white shadow-sm hover:shadow-md"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
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
                  className="w-full border-2 border-dashed border-indigo-200/6Got it! If you are strictly using React and want to avoid dealing with traditional `.css` files altogether, you have a few excellent options that keep everything contained within your JavaScript. 

Because React is heavily component-driven, handling your styling directly inside your components is a very common and powerful approach. Here is how you can build and style your app without external CSS:

### 1. Inline Styles (The Native React Way)
In React, you can pass a JavaScript object directly to the `style` attribute of an element. This means you write styles using JavaScript's camelCase naming convention instead of standard CSS hyphenation (e.g., you use `backgroundColor` instead of `background-color`).

This is perfect if you want zero external dependencies:

```jsx
export default function PlayerDashboard() {
  // Define styles as a JavaScript object
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#282c34',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  };

  return (
    <div style={containerStyle}>
      {/* Or pass the object directly into the element */}
      <h1 style={{ color: '#61dafb', fontSize: '24px' }}>Welcome Back</h1>
      <button style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Start Game
      </button>
    </div>
  );
}
