import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as CapacitorApp } from '@capacitor/app'
import './index.css'
import App from './App.tsx'

const bootstrap = async () => {
  try {
    const info = await CapacitorApp.getInfo();
    const currentVersion = info.version;
    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion && storedVersion !== currentVersion) {
      console.log(`Version changed from ${storedVersion} to ${currentVersion}. Resetting storage...`);

      // Clear all storage BEFORE React loads
      localStorage.clear();
      sessionStorage.clear();

      // Set new version
      localStorage.setItem("app_version", currentVersion);

      // Reload once
      window.location.reload();
      return;
    } else if (!storedVersion) {
      // First launch - just set the version
      localStorage.setItem("app_version", currentVersion);
    }
  } catch (error) {
    console.error("Failed to check app version:", error);
  }

  // If version matches or check failed, render app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

bootstrap();
