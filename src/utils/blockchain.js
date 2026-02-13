import { ethers } from "ethers";

export const signApproval = async (elementId, riskScore) => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // In a real MVP, you'd call a Smart Contract function here.
  // For now, we simulate a 'Proof of Approval' signature.
  const message = `Approving BIM Element: ${elementId} with Risk Score: ${riskScore}%`;
  const signature = await signer.signMessage(message);
  
  return {
    address: await signer.getAddress(),
    signature,
    timestamp: new Date().toISOString()
  };
};