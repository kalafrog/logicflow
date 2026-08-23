import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

function FlowchartTab() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('flowchart'); // 'flowchart', 'swimlane', 'mindmap'
  const [mermaidCode, setMermaidCode] = useState('');
  const [error, setError] = useState('');
  const flowchartRef = useRef(null);

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
  }, []);

  // Re-render mermaid diagram whenever the code updates
  useEffect(() => {
    const renderDiagram = async () => {
      if (mermaidCode && flowchartRef.current) {
        try {
          flowchartRef.current.innerHTML = '';
          const id = 'mermaid-' + Math.random().toString(36).substring(2, 9);
          const { svg } = await mermaid.render(id, mermaidCode);
          flowchartRef.current.innerHTML = svg;
        } catch (e) {
          console.error("Mermaid rendering error:", e);
          setError("Failed to render diagram visualization.");
        }
      }
    };
    renderDiagram();
  }, [mermaidCode]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://logicflow-ompw.onrender.com/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate workflow');
      }

      setMermaidCode(data.mermaidCode);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = (text) => {
    setPrompt(text);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Professional Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center h-16 px-6 w-full fixed top-0 z-50 shadow-xs">
        {/* Brand & Project Title */}
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

        {/* Centered Navigation Tabs */}
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
          <button 
            onClick={() => setActiveTab('mindmap')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'mindmap' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Mindmap
          </button>
        </nav>

        {/* Right Actions & Sign In Button */}
        <div className="flex items-center gap-3">
          <button className="text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button className="text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors flex items-center justify-center">
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
      <div className="flex flex-1 pt-16 h-screen overflow-hidden">
        {/* Left Sidebar Panel */}
        <aside className="bg-white border-r border-slate-200 fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 flex flex-col p-5 z-40 shadow-xs">
          <div className="mb-6">
            <h2 className="font-bold text-base text-slate-900 tracking-tight">Workflow Engine</h2>
            <p className="text-xs text-slate-500 font-medium">AI Logic Extraction & Generation</p>
          </div>

          <div className="mb-6 flex-1 flex flex-col gap-5">
            <div className="relative group border border-slate-200 rounded-xl p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all bg-slate-50/50 h-44 flex flex-col">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                placeholder="Describe your business process or paste an SOP transcript..."
              ></textarea>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 mt-2">
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 transition-colors" title="Voice Input">
                    <span className="material-symbols-outlined text-[16px]">mic</span>
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 transition-colors" title="Attach Transcript">
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{prompt.length} chars</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Quick Starts</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleQuickStart("Invoice Approval Process")} className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-medium">Invoice Approval</button>
                <button onClick={() => handleQuickStart("IT Ticketing Workflow")} className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-medium">IT Ticketing</button>
                <button onClick={() => handleQuickStart("Lead Routing Pipeline")} className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-medium">Lead Routing</button>
              </div>
            </div>
          </div>

          {error && <p className="text-rose-600 text-xs font-medium mb-3 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</p>}

          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold py-3 rounded-xl shadow-md shadow-indigo-100 transition-all flex justify-center items-center gap-2 mt-auto disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">magic_button</span>
            {loading ? "Synthesizing Logic..." : "Generate Workflow"}
          </button>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 ml-80 relative dot-grid overflow-auto bg-[#F8FAFC] flex flex-col items-center justify-center">
          <div className="relative w-full h-full flex flex-col items-center justify-center p-16">
            {mermaidCode ? (
              <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 w-full max-w-5xl overflow-auto flex justify-center my-auto">
                <div ref={flowchartRef} className="w-full flex justify-center"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                  <span className="material-symbols-outlined text-[32px]">account_tree</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base mb-1">No active workflow</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Describe your operational process or pick a quick start in the sidebar to build your map.</p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Canvas Toolbar */}
          <div className="fixed bottom-6 left-1/2 translate-x-[calc(-50%+80px)] bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full shadow-lg shadow-slate-200/50 px-4 py-2 flex items-center gap-4 z-30">
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span className="text-xs font-mono font-semibold text-slate-700 w-10 text-center">100%</span>
              <button className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <button className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100 flex items-center" title="Fit to Screen">
              <span className="material-symbols-outlined text-[16px]">fit_screen</span>
            </button>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100" title="Undo">
                <span className="material-symbols-outlined text-[16px]">undo</span>
              </button>
              <button className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg" title="Redo">
                <span className="material-symbols-outlined text-[16px]">redo</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default FlowchartTab;
