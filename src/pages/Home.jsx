// pages/Home.jsx - Updated to handle Supabase response wrapper
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header1";

export default function Home() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicModels();
  }, []);

  const fetchPublicModels = async () => {
    setLoading(true);
    try {
      console.log("🌐 Fetching models...");
      const res = await fetch("http://localhost:8000/public_glb_models/");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("RAW data from API:", data);

      // Handle Supabase wrapper { data: [...], error: null } or direct array
      const modelsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      // Filter only models with valid public glb_url
      const filteredModels = modelsArray.filter(
        (m) => m.glb_url && m.glb_url.trim() !== ""
      );

      console.log("✅ Models loaded:", filteredModels.length);
      setModels(filteredModels);
    } catch (error) {
      console.error("💥 Fetch failed:", error);
      setModels([]); // Clear models on error
    } finally {
      setLoading(false);
    }
  };

  const loadModel = (model) => {
    console.log("🚀 LOADING MODEL:", model);
    navigate("/project", {
      state: {
        modelId: model.id,
        glbUrl: model.glb_url,
        modelName: model.name,
      },
    });
  };

  return (
    <div>
      <Header />
      <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
            Public GLB Models
          </h2>
          <p>Real 3D models from public sources - click to edit & analyze</p>
        </div>

        {loading ? (
          <p>Loading public models...</p>
        ) : models.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {models.map((model) => (
              <div
                key={model.id}
                style={{
                  border: "2px solid #2D3748",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => loadModel(model)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D4AF37")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2D3748")}
              >
                <h3 style={{ marginBottom: "10px", color: "#D4AF37" }}>{model.name}</h3>
                <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>Public GLB Model</p>
                <button
                  style={{
                    width: "100%",
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#D4AF37",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  Load Model →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No public models available</p>
        )}
      </main>
    </div>
  );
}
