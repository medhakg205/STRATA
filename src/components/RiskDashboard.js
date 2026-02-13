import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function RiskDashboard({ data }) {
  return (
    <div style={{ height: "250px", width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
          <YAxis stroke="#94A3B8" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#161E2E", border: "1px solid #2D3748" }}
            itemStyle={{ color: "#F8FAFC" }}
          />
          <Bar dataKey="riskScore" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p style={{ color: "#94A3B8", fontSize: "0.8rem", marginTop: "10px" }}>
        
      </p>
    </div>
  );
}