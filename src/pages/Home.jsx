// pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header1";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:8000/categories/");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchModels = async (category) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/models/${category}`);
      const data = await res.json();
      setModels(data);
      setSelectedCategory(category);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadModel = (model) => {
    navigate("/project", { state: { modelId: model.id, glbUrl: model.glb_url } });
  };

  return (
    <div>
      <Header />
      <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>BIM Model Library</h2>
          <p>Select a category to browse available 3D models</p>
        </div>

        <div style={{ display: "flex", gap: "20px", marginBottom: "40px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => fetchModels(cat.name)}
              style={{
                padding: "12px 24px",
                backgroundColor: selectedCategory === cat.name ? "#D4AF37" : "#3b82f6",
                color: selectedCategory === cat.name ? "#000" : "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading models...</p>
        ) : models.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {models.map((model) => (
              <div
                key={model.id}
                style={{
                  border: "2px solid #2D3748",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onClick={() => loadModel(model)}
                onMouseEnter={(e) => e.target.style.borderColor = "#D4AF37"}
                onMouseLeave={(e) => e.target.style.borderColor = "#2D3748"}
              >
                <h3 style={{ marginBottom: "10px", color: "#D4AF37" }}>{model.name}</h3>
                <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>Category: {selectedCategory}</p>
                <button
                  style={{
                    width: "100%",
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#D4AF37",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold"
                  }}
                >
                  Load Model →
                </button>
              </div>
            ))}
          </div>
        ) : selectedCategory && (
          <p>No models found in {selectedCategory}</p>
        )}
      </main>
    </div>
  );
}
