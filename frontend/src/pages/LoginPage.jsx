import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => {
    setShowPassword((current) => !current);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Temporary bypass: navigates straight to your dashboard/flowchart page
    navigate("/dashboard"); // Change "/dashboard" to whatever your main flowchart route path is
  };

  return (
    <>
      {/* TopAppBar (Transactional - Hidden Navigation Shell, only brand) */}
      <header className="bg-surface w-full top-0 sticky border-b border-outline-variant flex items-center justify-between px-margin-desktop h-16 z-50">
        <div className="flex items-center gap-2">
          <span className="font-headline-md text-headline-md font-bold text-primary">LogicFlow AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined" data-icon="help_outline">help_outline</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0"></div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg w-full max-w-md shadow-sm p-8 z-10 relative">
          <div className="text-center mb-8">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Sign In</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Welcome back to your workspace</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" data-icon="mail">mail</span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border-b border-outline-variant focus:border-b-2 focus:border-primary focus:outline-none transition-all rounded-t-lg bg-surface-container-low hover:bg-surface-container transition-colors font-body-md text-body-md text-on-surface"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase" htmlFor="password">Password</label>
                <a className="font-body-md text-body-md text-primary hover:text-primary-container transition-colors" href="#">Forgot Password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" data-icon="lock">lock</span>
                <input
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-lowest border-b border-outline-variant focus:border-b-2 focus:border-primary focus:outline-none transition-all rounded-t-lg bg-surface-container-low hover:bg-surface-container transition-colors font-body-md text-body-md text-on-surface"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant focus:outline-none"
                  onClick={togglePassword}
                  type="button"
                >
                  <span className="material-symbols-outlined" data-icon={showPassword ? "visibility_off" : "visibility"} id="visibility-icon">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="w-full bg-primary-container text-on-primary py-3 px-4 rounded-lg font-body-md text-body-md font-semibold hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex justify-center items-center gap-2"
              type="submit"
            >
              Sign In
              <span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don't have an account? <a className="text-primary hover:text-primary-container font-semibold transition-colors" href="#">Sign up</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface w-full bottom-0 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between px-margin-desktop py-6 mt-auto z-50">
        <div className="font-headline-md text-headline-md font-bold text-primary mb-4 md:mb-0">
          LogicFlow AI
        </div>
        <div className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
          <a className="font-label-caps text-label-caps text-on-surface-variant opacity-70 hover:text-primary transition-colors cursor-pointer" href="#">Privacy Policy</a>
          <a className="font-label-caps text-label-caps text-on-surface-variant opacity-70 hover:text-primary transition-colors cursor-pointer" href="#">Terms of Service</a>
          <a className="font-label-caps text-label-caps text-on-surface-variant opacity-70 hover:text-primary transition-colors cursor-pointer" href="#">Contact Support</a>
        </div>
        <div className="font-label-caps text-label-caps text-on-surface-variant opacity-70 text-center md:text-right">
          © 2024 LogicFlow AI. All rights reserved.
        </div>
      </footer>
    </>
  );
}

export default LoginPage;
