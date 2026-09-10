const designSystemRootElement = document.getElementById("root");
if (!designSystemRootElement) throw new Error("Missing #root element for Design System.");
ReactDOM.createRoot(designSystemRootElement).render(<DesignSystemPage />);
