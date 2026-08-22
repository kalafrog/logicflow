function FlowchartTab() {
  return (
    <>
      <header className="bg-surface-container-lowest dark:bg-surface-dim border-b border-outline-variant dark:border-outline flex justify-between items-center h-14 px-gutter w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="font-display text-headline-md text-primary dark:text-inverse-primary tracking-tighter shrink-0">
            LogicFlow AI
          </div>
          <div className="h-6 w-px bg-outline-variant mx-2"></div>
          <div className="flex items-center gap-2 group cursor-pointer hover:bg-surface-container-low px-2 py-1 rounded transition-colors">
            <span className="font-headline-md text-headline-md text-on-surface">Employee Onboarding SOP</span>
            <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 h-full">
          <button className="h-full text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-1 font-label-caps text-label-caps px-2 opacity-80 scale-95 transition-all">
            Flowchart
          </button>
          <button className="h-full text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-caps text-label-caps px-2">
            Swimlane
          </button>
          <button className="h-full text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-caps text-label-caps px-2">
            Mindmap
          </button>
        </nav>
        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <button className="font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-variant px-4 py-2 rounded-lg transition-colors border border-outline-variant">
            Export
          </button>
          <button className="font-label-caps text-label-caps bg-primary text-on-primary hover:bg-primary-container px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Auto-Format
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14 h-screen">
        <aside className="bg-surface-container-lowest dark:bg-surface-dim border-r border-outline-variant dark:border-outline fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-sidebar-width flex flex-col p-4 z-40">
          <div className="mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Workflow Engine</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">AI Logic Extraction</p>
          </div>
          <div className="mb-6 flex-1 flex flex-col gap-4">
            <div className="relative group h-40">
              <textarea
                className="w-full h-full resize-none border-b border-outline-variant focus:border-primary focus:border-b-2 bg-transparent p-2 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all outline-none"
                placeholder="Describe your business process or paste an SOP transcript..."
              ></textarea>
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                </button>
                <button className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[16px]">attach_file</span>
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-label-caps text-label-caps text-outline mb-2">Quick Starts</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full border border-outline-variant font-mono-sm text-mono-sm text-on-surface-variant cursor-pointer hover:bg-surface-variant transition-colors">Invoice Approval</span>
                <span className="px-3 py-1 rounded-full border border-outline-variant font-mono-sm text-mono-sm text-on-surface-variant cursor-pointer hover:bg-surface-variant transition-colors">IT Ticketing</span>
                <span className="px-3 py-1 rounded-full border border-outline-variant font-mono-sm text-mono-sm text-on-surface-variant cursor-pointer hover:bg-surface-variant transition-colors">Lead Routing</span>
              </div>
            </div>
          </div>
          <button className="w-full bg-primary text-on-primary hover:bg-primary-container font-label-caps text-label-caps py-3 rounded-lg shadow-sm transition-all flex justify-center items-center gap-2 mt-auto">
            <span className="material-symbols-outlined text-[18px]">magic_button</span>
            Generate Workflow
          </button>
        </aside>

        <main className="flex-1 ml-sidebar-width relative dot-grid overflow-auto bg-[#F9FAFB]">
          <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[800px] min-w-[800px] p-20">
            {/* Empty State / Placeholder for removed diagram */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[32px]">account_tree</span>
              </div>
              <div>
                <h3 className="font-headline-md text-on-surface">No workflow active</h3>
                <p className="font-body-md text-on-surface-variant max-w-xs">Describe your process in the sidebar to generate a new flowchart.</p>
              </div>
            </div>
          </div>

          <div className="fixed bottom-6 left-1/2 translate-x-[calc(-50%+120px)] bg-white/80 backdrop-blur-md border border-outline-variant rounded-full shadow-sm px-4 py-2 flex items-center gap-4 z-50">
            <div className="flex items-center gap-2">
              <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <span className="font-mono-sm text-[12px] text-on-surface w-12 text-center">100%</span>
              <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <div className="w-px h-4 bg-outline-variant"></div>
            <button className="p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1" title="Fit to Screen">
              <span className="material-symbols-outlined text-[18px]">fit_screen</span>
            </button>
            <div className="w-px h-4 bg-outline-variant"></div>
            <div className="flex items-center gap-1">
              <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">undo</span>
              </button>
              <button className="p-1 text-outline cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">redo</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default FlowchartTab;
