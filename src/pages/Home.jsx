import Header from "../components/Header1";
import "../index.css";

export default function Home() {
  return (
    <div>
      <Header />
      <main style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Welcome to BIM MVP</h2>
          <p>View projects, track risk, and explore 3D models.</p>
        </div>
      </main>
    </div>
  );
}
