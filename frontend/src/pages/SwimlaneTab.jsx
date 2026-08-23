import { useNavigate } from 'react-router-dom';

export default function SwimlaneTab() {
  const navigate = useNavigate();

  return (
    <>
      {/* TopNavBar */}
      <header className="bg-surface-container-lowest dark:bg-surface-dim border-b border-outline-variant dark:border-outline flex justify-between items-center h-14 px-6 w-full fixed top-0 z-50">
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
        
        {/* Navigation Tabs using useNavigate */}
        <nav className="hidden md:flex items-center gap-6 h-full">
          <button 
            onClick={() => navigate('/flowchart')}
            className="h-full text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-caps text-label-caps px-2"
          >
            Flowchart
          </button>
          <button 
            onClick={() => navigate('/swimlane')}
            className="h-full text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-1 font-label-caps text-label-caps px-2 opacity-80 scale-95 transition-all"
          >
            Swimlane
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

      <div className="flex flex-1 pt-14 h-full relative">
        {/* SideNavBar */}
        <aside className="bg-surface-container-lowest dark:bg-surface-dim border-r border-outline-variant dark:border-outline fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-60 flex flex-col p-4 z-40">
          <div className="mb-8">
            <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim">Workflow Engine</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">AI Logic Extraction</p>
          </div>
          <nav className="flex-1 flex flex-col gap-2">
            <a className="flex items-center gap-3 p-3 bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-bold rounded-lg scale-[0.98] transition-transform" href="#">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="font-label-caps text-label-caps">New Workflow</span>
            </a>
            <a className="flex items-center gap-3 p-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant rounded-lg transition-colors" href="#">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>account_tree</span>
              <span className="font-label-caps text-label-caps">Saved Logic</span>
            </a>
            <a className="flex items-center gap-3 p-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant rounded-lg transition-colors" href="#">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>dashboard_customize</span>
              <span className="font-label-caps text-label-caps">Templates</span>
            </a>
          </nav>
        </aside>

        {/* Main Workspace: Swimlane Canvas */}
        <main className="flex-1 ml-[240px] bg-background relative overflow-auto p-8">
          <div className="max-w-[1200px] mx-auto bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="border-b border-outline-variant p-6 bg-surface-container-lowest flex justify-between items-center">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Employee Onboarding SOP</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Extracted via GPT-4 Turbo</p>
              </div>
              <span className="px-3 py-1 bg-surface-container font-mono-sm text-on-surface-variant rounded-full border border-outline-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Validated
              </span>
            </div>

            {/* Swimlanes Container */}
            <div className="flex-1 flex flex-col relative overflow-x-auto p-6 gap-6">
              {/* HR Manager Lane */}
              <div className="flex w-full min-w-[800px] relative border border-outline-variant rounded-lg bg-surface-bright bg-opacity-50">
                <div className="w-48 border-r border-outline-variant bg-surface-container-lowest p-4 flex flex-col justify-center items-start shrink-0 rounded-l-lg">
                  <span className="font-label-caps text-primary uppercase tracking-wider">Lane 1</span>
                  <span className="font-headline-md text-on-surface mt-1">HR Manager</span>
                </div>
                <div className="flex-1 p-6 relative flex items-center gap-12">
                  <div className="w-64 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm relative z-10 hover:shadow-md transition-shadow cursor-pointer hover:border-primary">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant rounded text-xs">Manual Step</span>
                    </div>
                    <h3 className="font-headline-md text-on-surface mb-2">Document Review</h3>
                    <p className="text-xs text-on-surface-variant">Verify I-9 and W-4 submissions from candidate portal.</p>
                  </div>
                </div>
              </div>

              {/* IT Department Lane */}
              <div className="flex w-full min-w-[800px] relative border border-outline-variant rounded-lg bg-surface-bright bg-opacity-50">
                <div className="w-48 border-r border-outline-variant bg-surface-container-lowest p-4 flex flex-col justify-center items-start shrink-0 rounded-l-lg">
                  <span className="font-label-caps text-secondary uppercase tracking-wider">Lane 2</span>
                  <span className="font-headline-md text-on-surface mt-1">IT Department</span>
                </div>
                <div className="flex-1 p-6 relative flex items-center pl-[320px] gap-12">
                  <div className="w-64 bg-surface-container-lowest border border-primary rounded-lg p-4 shadow-md relative z-10 cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-primary-container text-on-primary-container rounded text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">smart_toy</span> Automated
                      </span>
                    </div>
                    <h3 className="font-headline-md text-on-surface mb-2">Finalize Setup</h3>
                    <p className="text-xs text-on-surface-variant">Provision Google Workspace and Slack accounts via API.</p>
                  </div>
                </div>
              </div>

              {/* Employee Lane */}
              <div className="flex w-full min-w-[800px] relative border border-outline-variant rounded-lg bg-surface-bright bg-opacity-50">
                <div className="w-48 border-r border-outline-variant bg-surface-container-lowest p-4 flex flex-col justify-center items-start shrink-0 rounded-l-lg">
                  <span className="font-label-caps text-tertiary uppercase tracking-wider">Lane 3</span>
                  <span className="font-headline-md text-on-surface mt-1">Employee</span>
                </div>
                <div className="flex-1 p-6 relative flex items-center pl-[640px] gap-12">
                  <div className="w-64 bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm relative z-10 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant rounded text-xs">User Action</span>
                    </div>
                    <h3 className="font-headline-md text-on-surface mb-2">Login & Orientation</h3>
                    <p className="text-xs text-on-surface-variant">First login and complete security training modules.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
