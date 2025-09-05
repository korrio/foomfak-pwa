import { useState, useEffect } from 'react';

function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      console.log("beforeinstallprompt fired");
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
  };

  if (!supportsPWA) {
    return null;
  }

  return (
    <button
      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:from-purple-600 hover:to-indigo-600 transition-all font-medium"
      id="setup_button"
      aria-label="ติดตั้งแอ๊พบนเครื่อง"
      title="ติดตั้งแอ๊พบนเครื่อง"
      onClick={onClick}
    >
      📱 ติดตั้งแอ๊พบนเครื่อง
    </button>
  );
}

export default InstallPWA;