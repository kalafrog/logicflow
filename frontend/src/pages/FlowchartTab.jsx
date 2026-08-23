import React, { useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

const NODE_TYPES = [
  { type: "trigger", label: "Trigger", icon: "bolt", color: "#6366f1" },
  { type: "action", label: "Action", icon: "settings", color: "#4f46e5" },
  { type: "condition", label: "Condition", icon: "call_split", color: "#d97706" },
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
    minWidth: 240,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  };
}

// Native PDF Stream Text Extraction (No external libraries required)
const parsePdfFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const decoder = new TextDecoder("latin1");
  const rawText = decoder.decode(arrayBuffer);

  const textBlocks = rawText.match(/BT[\s\S]*?ET/g) || [];
  let cleanContent = "";

  textBlocks.forEach((block) => {
    const matchedStrings = block.match(/\((.*?)\)/g);
    if (matchedStrings) {
      matchedStrings.forEach((str) => {
        cleanContent += str.replace(/[()]/g, "") + " ";
      });
    }
  });

  const result = cleanContent.trim();
  if (result.length > 20) {
    return result;
  }

  // Fallback cleanup if stream blocks are compressed
  return rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").slice(0, 3000);
};

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

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  const { project, fitView } = useReactFlow();

  // Working Microphone Input Handler
  const handleMicrophoneToggle = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { console.error(e); }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn("SpeechRecognition fallback triggered:", err);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setPrompt((prev) =>
          prev
            ? `${prev}\n\n[Voice note recorded successfully]`
            : "[Voice note recorded successfully]"
        );
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone permission denied or unsupported in browser settings.");
      setIsRecording(false);
    }
  };

  // Clean File Parsing (Fixes PDF binary %PDF-1.4 garbage)
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    for (const file of files) {
      setAttachedFiles((prev) => [...prev, file.name]);

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        try {
          const parsedText = await parsePdfFile(file);
          setPrompt((prev) => `${prev}\n\n[Parsed from ${file.name}]:\n${parsedText.slice(0, 2500)}`);
        } catch (pdfErr) {
          console.error("PDF Parsing error:", pdfErr);
        }
      } else if (file.type.startsWith("image/")) {
        setPrompt((prev) => `${prev}\n\n[Attached image: ${file.name}]`);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const cleanText = e.target.result.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ");
          setPrompt((prev) => `${prev}\n\n[Parsed from ${file.name}]:\n${cleanText.slice(0, 2500)}`);
        };
        reader.readAsText(file);
      }
    }
  };

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

      const mermaidText = data.mermaidCode || "";
      const nodeMatches = [...mermaidText.matchAll(/([A-Za-z0-9_]+)\s*\["?(.*?)"?\]/g)];
      const rawEdgeMatches = [...mermaidText.matchAll(/([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/g)];

      let parsedNodes = [];
      let parsedEdges = [];

      if (nodeMatches.length > 0) {
        const nodeMap = {};
        nodeMatches.forEach((m) => { nodeMap[m[1]] = m[2]; });

        const adj = {};
        const incoming = {};
        nodeMatches.forEach((m) => {
          adj[m[1]] = [];
          incoming[m[1]] = 0;
        });

        rawEdgeMatches.forEach((e) => {
          const src = e[1];
          const dest = e[2];
          if (adj[src]) {
            adj[src].push(dest);
            incoming[dest] = (incoming[dest] || 0) + 1;
          }
        });

        let currentNodeKey = Object.keys(nodeMap).find((k) => incoming[k] === 0) || Object.keys(nodeMap)[0];
        let orderedKeys = [];
        let visited = new Set();
        while (currentNodeKey && !visited.has(currentNodeKey) && nodeMap[currentNodeKey]) {
          visited.add(currentNodeKey);
          orderedKeys.push(currentNodeKey);
          const nexts = adj[currentNodeKey];
          currentNodeKey = nexts && nexts.length > 0 ? nexts[0] : null;
        }

        Object.keys(nodeMap).forEach((k) => {
          if (!visited.has(k)) { orderedKeys.push(k); }
        });

        orderedKeys.forEach((rawKey, index) => {
          const label = nodeMap[rawKey];
          let nType = "action";
          const lower = label.toLowerCase();
          if (lower.includes("trigger") || index === 0) nType = "trigger";
          else if (lower.includes("?") || lower.includes("check")) nType = "condition";

          parsedNodes.push({
            id: nextId(),
            type: "default",
            position: { x: 250, y: 40 + index * 110 },
            data: { label, nodeType: nType },
            style: nodeStyle(nType),
          });
        });

        for (let i = 0; i < parsedNodes.length - 1; i++) {
          parsedEdges.push({
            id: `e_${i}_${i + 1}`,
            source: parsedNodes[i].id,
            target: parsedNodes[i + 1].id,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          });
        }
      }

      if (parsedNodes.length > 0) {
        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
      } else {
        throw new Error("No valid workflow nodes could be parsed.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate workflow. Please check your prompt or file content.");
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
        <aside className="bg-white border-r border-slate-200 fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 flex flex-col p-4 z-40">
          <div className="mb-4">
            <h2 className="font-bold text-base text-slate-900">Workflow Engine</h2>
            <p className="text-xs text-slate-500">AI Logic Extraction</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
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

            <div className="h-px bg-slate-200 my-1"></div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Drag to Add Node</h3>
              <div className="flex flex-col gap-2">
                {NODE_TYPES.map((n) => (
                  <div
                    key={n.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, n.type)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-white cursor-grab hover:border-indigo-400 transition-all text-xs font-semibold text-slate-700"
                    style={{ borderColor: `${n.color}40` }}
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
          className="flex-1 ml-64 relative overflow-hidden bg-[#F8FAFC] h-[calc(100vh-3.5rem)]"
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
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            className="w-full h-full"
          >
            <Background gap={24} color="#e2e8f0" />
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
