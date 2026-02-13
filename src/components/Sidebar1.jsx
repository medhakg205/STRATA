// components/Sidebar1.jsx
export default function Sidebar({ darkMode, setDarkMode, editMode, setEditMode }) {
  const panelBg = darkMode ? "#161E2E" : "#FFFFFF";
  const btnStyle = { 
    width: "100%", padding: "12px", marginBottom: "10px", border: "none", borderRadius: "6px", cursor: "pointer", color: "white" 
  };

  return (
    <aside style={{ width: "250px", backgroundColor: panelBg, padding: "20px", borderRight: "1px solid #2D3748" }}>
      <button 
        onClick={() => setDarkMode(!darkMode)}
        style={{ ...btnStyle, backgroundColor: "#4b5563" }}
      >
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>
      
      {/* ✅ NEW EDIT BUTTON */}
      <button 
        style={{ ...btnStyle, backgroundColor: editMode ? "#D4AF37" : "#10b981", color: editMode ? "#000" : "white" }}
        onClick={() => setEditMode(!editMode)}
      >
        {editMode ? "👁️ View Mode" : "✏️ Edit Mode"}
      </button>
      
      <hr style={{ borderColor: "#2D3748", margin: "20px 0" }} />
      <button style={{ ...btnStyle, backgroundColor: "#D4AF37", color: "#000" }}>Load BIM Model</button>
      <button style={{ ...btnStyle, backgroundColor: "#3b82f6" }}>Risk Dashboard</button>
    </aside>
  );
}
