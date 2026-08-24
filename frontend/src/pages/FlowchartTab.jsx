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

// --- Custom High-End Futuristic Animations ---
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap');

  :root {
    --bg-dark: #07090e;
    --panel-bg: rgba(13, 17, 28, 0.75);
    --neon-cyan: #00f0ff;
    --neon-purple: #b026ff;
    --neon-green: #39ff14;
    --neon-red: #ff2a2a;
    --neon-orange: #ff9900;
  }

  body {
    font-family: 'Space Grotesk', sans-serif;
    background-color: var(--bg-dark);
    color: #e2e8f0;
  }

  @keyframes cyberDropIn {
    0% { opacity: 0; transform: scale(0.7) translateY(-40px); filter: blur(10px); box-shadow: 0 0 0 transparent; }
    70% { transform: scale(1.05) translateY(5px); filter: blur(0px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  .animate-cyber-drop {
    animation: cyberDropIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    opacity: 0; /* Starts hidden, animation reveals it */
  }

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }

  .scanner-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(to right, transparent, var(--neon-cyan), transparent);
    opacity: 0.5;
    animation: scanline 2s linear infinite;
    pointer-events: none;
  }

  @keyframes pulseGlow {
    0% { box-shadow: 0 0 5px var(--glow), inset 0 0 5px var(--glow); }
    50% { box-shadow: 0 0 20px var(--glow), inset 0 0 10px var(--glow); }
    100% { box-shadow: 0 0 5px var(--glow), inset 0 0 5px var(--glow); }
  }

  .cyber-node-glow {
    animation: pulseGlow 3s infinite;
  }

  /* React Flow Customization */
  .react-flow__edge-path {
    stroke-linecap: round;
    filter: drop-shadow(0 0 3px currentColor);
  }
  
  .react-flow__panel {
    background: rgba(13, 17, 28, 0.8) !important;
    border: 1px solid #1e293b;
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }
  
  .react-flow__controls-button {
    background: transparent !important;
    border-bottom: 1px solid #1e293b !important;
    fill: #94a3b8 !important;
  }
  .react-flow__controls-button:hover {
    fill: var(--neon-cyan) !important;
    background: rgba(0, 240, 255, 0.1) !important;
  }
`;

const CustomNode = ({ data, selected }) => {
  const isTrigger = data.nodeType === "trigger";
  const isCondition = data.nodeType === "condition";
  const status = data.status || "default";

  let glowColor, borderColor, iconColor;

  if (status === "positive") {
    glowColor = "var(--neon-green)";
    borderColor = "border-[#39ff14]/60";
    iconColor = "text-[#39ff14]";
  } else if (status === "negative") {
    glowColor = "var(--neon-red)";
    borderColor = "border-[#ff2a2a]/60";
    iconColor = "text-[#ff2a2a]";
  } else if (isTrigger) {
    glowColor = "var(--neon-purple)";
    borderColor = "border-[#b026ff]/60";
    iconColor = "text-[#b026ff]";
  } else if (isCondition) {
    glowColor = "var(--neon-orange)";
    borderColor = "border-[#ff9900]/60";
    iconColor = "text-[#ff9900]";
  } else {
    glowColor = "var(--neon-cyan)";
    borderColor = "border-[#00f0ff]/50";
    iconColor = "text-[#00f0ff]";
  }

  const iconName =
    status === "positive" ? "check_circle"
      : status === "negative" ? "cancel"
      : isTrigger ? "bolt"
      : isCondition ? "call_split"
      : "memory";

  return (
    <div
      className={`animate-cyber-drop relative bg-[#0b101a]/95 backdrop-blur-xl rounded-xl border-2 ${borderColor} overflow-hidden min-w-[240px] max-w-[300px] group transition-all duration-300 ${
        selected ? "scale-105 z-10" : "hover:-translate-y-1"
      } ${isTrigger ? "cyber-node-glow" : ""}`}
      style={{
        "--glow": glowColor,
        boxShadow: selected ? `0 0 25px ${glowColor}, inset 0 0 10px ${glowColor}` : `0 4px 15px rgba(0,0,0,0.5)`,
        animationDelay: `${(data.index || 0) * 120}ms`, // Staggered entry
      }}
    >
      <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)` }} />
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4 !h-4 !bg-[#0b101a] !border-2 transition-transform group-hover:scale-125 rounded-full"
        style={{ borderColor: glowColor, boxShadow: `0 0 10px ${glowColor}` }}
      />

      <div className="px-4 py-3 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase bg-gradient-to-r from-white/5 to-transparent border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[18px] drop-shadow-[0_0_8px_currentColor] ${iconColor}`}>
            {iconName}
          </span>
          <span className="text-gray-300 drop-shadow-md">{data.nodeType || "Process"}</span>
        </div>
        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: glowColor, boxShadow: `0 0 8px ${glowColor}` }} />
      </div>

      <div className="p-5 text-sm font-medium text-gray-100 text-center leading-relaxed tracking-wide">
        {data.label}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4 !h-4 !bg-[#0b101a] !border-2 transition-transform group-hover:scale-125 rounded-full"
        style={{ borderColor: glowColor, boxShadow: `0 0 10px ${glowColor}` }}
      />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const PALETTE = [
  { type: "trigger", label: "System Trigger", icon: "bolt", color: "#b026ff" },
  { type: "action", label: "Execute Process", icon: "memory", color: "#00f0ff" },
  { type: "condition", label: "Logic Branch", icon: "call_split", color: "#ff9900" },
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
    if (!window.pdfjsLib) throw new Error("Neural interface loading...");
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
        setPrompt((prev) => prev ? `${prev}\n\n[Voice packet received]` : "[Voice packet received]");
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Audio interface permission denied.");
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
          if (parsedText) setPrompt((prev) => prev ? `${prev}\n\nProcess datastream:\n${parsedText}` : `Process datastream:\n${parsedText}`);
        } catch (pdfErr) {
          setError("Failed to decrypt PDF module.");
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
    (params) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: true, style: { stroke: "#00f0ff", strokeWidth: 3, filter: 'drop-shadow(0 0 5px #00f0ff)' } }, eds)),
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
        data: { label: meta.label, nodeType, status: "default", index: 0 },
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
      if (!response.ok) throw new Error(data.error || "Neural link failure");

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
            const offset = idx === 0 ? -280 : 280; 
            xOffsets[childKey] = (xOffsets[parentKey] || 0) + offset;
          });
        }
      });

      // Clear existing to trigger re-mount animations
      setNodes([]);
      setEdges([]);

      setTimeout(() => {
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
          const xPos = 350 + (xOffsets[key] || 0);
          const yPos = 50 + depth * 160; 

          return {
            id: key,
            type: "custom",
            position: { x: xPos, y: yPos },
            data: { label, nodeType: nType, status: nodeStatus, index: index }, // index handles animation stagger
          };
        });

        const parsedEdges = rawEdges.map((e, idx) => {
          const source = e[1];
          const branchLabel = e[2] || "";
          const target = e[3];

          const lowerBranch = branchLabel.toLowerCase();
          const isPositive = lowerBranch.includes("yes") || lowerBranch.includes("accept") || lowerBranch.includes("approve") || lowerBranch.includes("confirm") || lowerBranch.includes("success");
          const isNegative = lowerBranch.includes("no") || lowerBranch.includes("reject") || lowerBranch.includes("fail") || lowerBranch.includes("cancel") || lowerBranch.includes("out of stock");

          let strokeColor = "currentColor";
          let cssColor = "#00f0ff"; 

          if (isPositive) { cssColor = "#39ff14"; strokeColor = cssColor; }
          else if (isNegative) { cssColor = "#ff2a2a"; strokeColor = cssColor; }
          else { cssColor = "#00f0ff"; strokeColor = cssColor; }

          return {
            id: `e_${source}_${target}_${idx}`,
            source,
            target,
            label: branchLabel,
            type: "smoothstep",
            animated: true,
            style: { stroke: strokeColor, strokeWidth: 3, filter: `drop-shadow(0 0 4px ${cssColor})` },
            markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
            labelStyle: { fill: "#fff", fontWeight: 700, fontSize: 13, textShadow: `0 0 10px ${cssColor}` },
            labelBgPadding: [8, 6],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: "#0d111c", fillOpacity: 0.9, stroke: strokeColor, strokeWidth: 1 },
          };
        });

        if (parsedNodes.length > 0) {
          setNodes(parsedNodes);
          setEdges(parsedEdges);
          setTimeout(() => fitView({ padding: 0.3, duration: 1000 }), 100);
        }
      }, 300); // slight delay to feel like processing

    } catch (err) {
      setError("System failed to map neural logic.");
    } finally {
      setLoading(false);
    }
  };

  const hasWorkflow = nodes.length > 0;

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen flex flex-col selection:bg-[#00f0ff] selection:text-[#0d111c] relative overflow-hidden">
        
        {/* Futuristic Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00f0ff] blur-[200px] opacity-[0.05] z-0 rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#b026ff] blur-[200px] opacity-[0.05] z-0 rounded-full"></div>

        <header className="bg-[#0b101a]/80 backdrop-blur-2xl border-b border-[#1e293b] flex justify-between items-center h-16 px-6 w-full fixed top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4">
            <div className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#00f0ff] to-[#b026ff] tracking-widest uppercase shrink-0 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
              Nexus Flow // AI
            </div>
            <div className="h-6 w-[2px] bg-[#1e293b] mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-[#94a3b8] uppercase tracking-widest">Logic Synthesizer</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse shadow-[0_0_10px_#39ff14]"></div>
             <span className="text-[10px] text-[#94a3b8] font-bold tracking-widest uppercase">System Online</span>
          </div>
        </header>

        <div className="flex flex-1 pt-16 h-full relative z-10">
          <aside className="bg-[#0d111c]/90 backdrop-blur-2xl border-r border-[#1e293b] fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 flex flex-col p-5 shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-[#e2e8f0] uppercase tracking-widest">Command Interface</h2>
                <p className="text-[10px] text-[#00f0ff] tracking-widest uppercase mt-1">Data Injection Module</p>
              </div>
              <span className="material-symbols-outlined text-[#00f0ff] text-2xl drop-shadow-[0_0_8px_#00f0ff]">terminal</span>
            </div>

            <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 bg-[#06080d] border border-[#1e293b] rounded-xl p-4 pr-12 text-xs text-[#e2e8f0] outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] resize-none transition-all shadow-inner font-mono"
                  placeholder="Initiate logic sequence, attach data, or record protocol..."
                ></textarea>
                
                {/* Cyber Scanner effect on focus */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-xl overflow-hidden opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <div className="scanner-bar"></div>
                </div>

                <button
                  onClick={handleMicrophoneToggle}
                  title={isRecording ? "Terminate recording" : "Initialize voice input"}
                  className={`absolute right-3 bottom-4 p-2 rounded-lg transition-all ${
                    isRecording
                      ? "bg-[#ff2a2a]/20 text-[#ff2a2a] border border-[#ff2a2a] animate-pulse shadow-[0_0_15px_rgba(255,42,42,0.5)]"
                      : "text-[#64748b] bg-[#1e293b]/50 border border-transparent hover:text-[#00f0ff] hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isRecording ? "mic_off" : "mic"}
                  </span>
                </button>
              </div>

              <div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept=".pdf,.txt,.csv,.json,image/*" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-[#1e293b] hover:border-[#b026ff] bg-[#06080d]/50 hover:bg-[#b026ff]/10 py-3 rounded-xl text-[#94a3b8] text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:text-[#b026ff] hover:shadow-[0_0_15px_rgba(176,38,255,0.2)] group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">library_add</span>
                  Mount Data Node
                </button>

                {attachedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attachedFiles.map((name, i) => (
                      <span key={i} className="text-[9px] font-mono bg-[#0b101a] border border-[#1e293b] text-[#00f0ff] px-2 py-1 rounded md truncate max-w-full flex items-center gap-1 shadow-[0_0_5px_rgba(0,240,255,0.2)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="relative w-full bg-gradient-to-r from-[#00f0ff] to-[#0088ff] hover:from-[#39ff14] hover:to-[#00f0ff] text-[#06080d] text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                  {loading ? "autorenew" : "hub"}
                </span>
                {loading ? "Synthesizing Neural Path..." : "Compile Workflow"}
              </button>

              {recommendations.length > 0 && (
                <div className="p-4 bg-[#0b101a] border border-[#b026ff]/40 rounded-xl shadow-[0_0_15px_rgba(176,38,255,0.15)] relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#b026ff]"></div>
                  <div className="flex items-center gap-2 mb-3 text-[#b026ff] font-bold text-[10px] uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    System Insights
                  </div>
                  <ul className="text-[11px] font-medium text-gray-300 flex flex-col gap-2 list-none pl-1">
                    {recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-[#00f0ff] mt-0.5">▹</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="h-px bg-gradient-to-r from-transparent via-[#1e293b] to-transparent my-2"></div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Manual Override Blocks</h3>
                <div className="flex flex-col gap-3">
                  {PALETTE.map((n) => (
                    <div
                      key={n.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, n.type)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#1e293b] bg-[#06080d]/60 cursor-grab hover:border-current hover:shadow-[0_0_15px_currentColor] hover:-translate-y-0.5 transition-all text-[11px] font-bold uppercase tracking-wider text-gray-300 active:cursor-grabbing"
                      style={{ color: n.color }}
                    >
                      <span className="material-symbols-outlined text-[20px] drop-shadow-[0_0_8px_currentColor]">{n.icon}</span>
                      <span className="text-gray-300">{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-[#ff2a2a]/10 border border-[#ff2a2a]/50 rounded-lg text-[#ff2a2a] text-[11px] font-bold uppercase tracking-wide flex items-center gap-2 shadow-[0_0_10px_rgba(255,42,42,0.2)]">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                {error}
              </div>
            )}
          </aside>

          <main
            ref={reactFlowWrapper}
            className="flex-1 ml-80 relative overflow-hidden"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            {!hasWorkflow && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none z-10 text-center p-6">
                <div className="w-24 h-24 rounded-full border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.1)] relative">
                  <div className="absolute inset-0 border border-[#b026ff]/30 rounded-full animate-ping opacity-50"></div>
                  <span className="material-symbols-outlined text-[40px] drop-shadow-[0_0_15px_#00f0ff]">dashboard_customize</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#e2e8f0] text-sm mb-2 tracking-widest uppercase">Neural Canvas Empty</h3>
                  <p className="text-[11px] text-[#64748b] max-w-xs uppercase tracking-widest font-mono">Awaiting logic input. Use command interface or deploy manual blocks.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#07090e]/80 backdrop-blur-sm">
                 <div className="w-16 h-16 border-t-2 border-[#00f0ff] border-solid rounded-full animate-spin shadow-[0_0_15px_#00f0ff]"></div>
                 <div className="mt-6 text-[#00f0ff] text-xs font-mono tracking-[0.3em] uppercase drop-shadow-[0_0_5px_#00f0ff]">Compiling Structure...</div>
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
              <Background gap={30} color="#1e293b" variant="dots" size={2} className="opacity-50" />
              <Controls className="!bg-[#0d111c] !border-[#1e293b] shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-lg p-1 !m-6 overflow-hidden [&>button]:!border-b-[#1e293b]" />
            </ReactFlow>

            {selectedNode && (
              <div className="absolute top-6 right-6 w-80 bg-[#0d111c]/95 backdrop-blur-xl border border-[#00f0ff]/40 rounded-xl shadow-[0_10px_40px_rgba(0,240,255,0.15)] p-5 z-30 animate-cyber-drop" style={{animationDelay: '0ms'}}>
                <div className="flex justify-between items-center mb-5">
                  <h4 className="font-bold text-[#00f0ff] text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span>
                    Configure Node
                  </h4>
                  <button onClick={() => setSelectedNode(null)} className="text-[#64748b] hover:text-[#ff2a2a] bg-[#1e293b]/50 hover:bg-[#ff2a2a]/10 rounded-md p-1.5 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-4 py-3 bg-[#06080d] border border-[#1e293b] rounded-lg text-xs font-mono text-gray-200 mb-5 outline-none focus:border-[#b026ff] focus:shadow-[0_0_15px_rgba(176,38,255,0.3)] transition-all"
                  autoFocus
                />
                <button
                  onClick={saveNodeLabel}
                  className="w-full bg-gradient-to-r from-[#b026ff] to-[#00f0ff] text-[#06080d] py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Update Logic
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
