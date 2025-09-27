import { useState, useEffect } from "react";
import Web3 from "web3";
import CeloClickerABI from "../CeloClicker.json";

export const NETWORKS = {
  mainnet: {
    chainId: "0xa4ec",
    chainName: "Celo Mainnet",
    rpcUrls: ["https://forno.celo.org"],
    contractAddress: "0x8e1198805653809F72dA42b8CF049f6337EE65Ed",
  },
  sepolia: {
    chainId: "0xAA044C",
    chainName: "Celo Sepolia Testnet",
    rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org/"],
    contractAddress: "0xfd897a7523f99122ae3ca9b118cf7628dd9c471d",
  },
};

export default function useWeb3(defaultNetwork = "mainnet") {
  const [account, setAccount] = useState(null);
  const [shortAddress, setShortAddress] = useState("");
  const [contract, setContract] = useState(null);
  const [network, setNetwork] = useState(defaultNetwork);

  const switchNetwork = async (net) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORKS[net].chainId }] });
    } catch (e) {
      if (e.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [NETWORKS[net]] });
      else console.error(e);
    }
  };

 const connectWallet = async () => {
  if (!window.ethereum) return alert("Veuillez installer un wallet");
  
  try {
    await switchNetwork(network);

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const web3 = new Web3(window.ethereum);

    setAccount(accounts[0]);
    setShortAddress(accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4));
    setContract(new web3.eth.Contract(CeloClickerABI, NETWORKS[network].contractAddress));

    localStorage.setItem("connectedAccount", accounts[0]);
  } catch (e) {
    if (e.code !== 4001) console.error(e);
  }
};


  const disconnectWallet = () => {
    setAccount(null);
    setShortAddress("");
    setContract(null);
    localStorage.removeItem("connectedAccount");
  };

  useEffect(() => {
    const storedAccount = localStorage.getItem("connectedAccount");
    if (storedAccount && window.ethereum) {
      setAccount(storedAccount);
      setShortAddress(storedAccount.slice(0,6) + "..." + storedAccount.slice(-4));
      const web3 = new Web3(window.ethereum);
      setContract(new web3.eth.Contract(CeloClickerABI, NETWORKS[defaultNetwork].contractAddress));
    }
  }, []);

  return { account, shortAddress, contract, network, switchNetwork, connectWallet, disconnectWallet, setNetwork };
}
