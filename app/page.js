
"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";

const contractAddress = "0x9d393e9ddda5d760222cc04ff74c0ee14bc978a2";
const rpcUrl = "https://testnet-rpc.monad.xyz";

export default function Home() {
  const [message, setMessage] = useState("");
  const [fee, setFee] = useState("0");
  const [account, setAccount] = useState(null);
  const [lastGreetingDay, setLastGreetingDay] = useState(null);
  const [status, setStatus] = useState("");
  const [canGreet, setCanGreet] = useState(true);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastGreetingDay !== null) {
        const nextAvailable = (lastGreetingDay + 1) * 86400 * 1000;
        const now = Date.now();
        const diff = nextAvailable - now;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`⏳ ${t.nextGreeting}: ${hours}h ${minutes}m ${seconds}s`);
          setCanGreet(false);
        } else {
          setCountdown(t.available);
          setCanGreet(true);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastGreetingDay]);

  const [contractBalance, setContractBalance] = useState("0");
  const [newFee, setNewFee] = useState("");
  const [language, setLanguage] = useState("it");

  const t = {
    it: {
      title: "Daily Greeter - Monad Testnet",
      message: "Messaggio",
      fee: "Fee richiesta",
      lastGreeting: "Ultimo saluto",
      connect: "Connetti MetaMask",
      send: "Invia Saluto",
      connected: "Account connesso",
      notConnected: "Wallet non connesso",
      isOwner: "✅ Sei l'owner del contratto",
      notOwner: "⛔ Non sei l'owner del contratto",
      admin: "🔐 Pannello Admin",
      balance: "Saldo contratto",
      withdraw: "Ritira le Fee",
      setFeeTitle: "💸 Modifica Fee di Saluto",
      setFeeBtn: "Imposta nuova fee",
      newFeePlaceholder: "Nuova fee in MON",
      langLabel: "Lingua"
    },
    en: {
      title: "Daily Greeter - Monad Testnet",
      message: "Message",
      fee: "Fee required",
      lastGreeting: "Last greeting",
      connect: "Connect MetaMask",
      send: "Send Greeting",
      connected: "Connected account",
      notConnected: "Wallet not connected",
      isOwner: "✅ You are the contract owner",
      notOwner: "⛔ You are not the contract owner",
      admin: "🔐 Admin Panel",
      balance: "Contract balance",
      withdraw: "Withdraw Fees",
      setFeeTitle: "💸 Set New Greeting Fee",
      setFeeBtn: "Set new fee",
      newFeePlaceholder: "New fee in MON",
      langLabel: "Language"
    }
  }[language];

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, abi, provider);

  useEffect(() => {
    const fetchData = async () => {
      const balance = await provider.getBalance(contractAddress);
      setContractBalance(ethers.formatEther(balance));
    };
    fetchData();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
        const contractWithSigner = contract.connect(signer);
        const lastDay = await contract.getLastGreetingDay(accounts[0]);
        setLastGreetingDay(Number(lastDay));
        const msg = await contract.getGreetingMessage();
        setMessage(msg);
        const contractFee = await contract.greetingFee();
        setFee(ethers.formatEther(contractFee));
      } catch (err) {
        console.error("Errore connessione wallet:", err);
        setStatus("Errore connessione wallet");
      }
    } else {
      alert("Installa MetaMask per connetterti");
    }
  };

  const sendGreeting = async () => {
    try {
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.greet({ value: ethers.parseEther(fee) });
      setStatus("Transazione inviata. Attendere conferma...");
      await tx.wait();
      setStatus("Saluto inviato con successo!");
    } catch (err) {
      console.error("Errore durante il saluto:", err);
      setStatus("Errore durante il saluto");
    }
  };

  const withdrawFees = async () => {
    try {
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.withdrawFees();
      setStatus("Ritiro in corso...");
      await tx.wait();
      setStatus("Fee ritirate con successo!");
    } catch (err) {
      console.error("Errore durante il ritiro delle fee:", err);
      setStatus("Errore durante il ritiro delle fee");
    }
  };

  const updateFee = async () => {
    try {
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.setGreetingFee(ethers.parseEther(newFee));
      setStatus("Modifica fee in corso...");
      await tx.wait();
      setStatus("Fee aggiornata con successo!");
    } catch (err) {
      console.error("Errore durante l'aggiornamento della fee:", err);
      setStatus("Errore durante l'aggiornamento della fee");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-center p-6 space-y-6">
      <div className="text-sm text-gray-600">
        🌐 {t.langLabel}: 
        <button onClick={() => setLanguage("it")} className="mx-2 text-blue-600 hover:underline">Italiano</button> | 
        <button onClick={() => setLanguage("en")} className="ml-2 text-blue-600 hover:underline">English</button>
      </div>
      <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
      <div className="bg-white p-4 rounded shadow-md max-w-md mx-auto space-y-2">
        <p className="text-lg">{t.message}: <span className="font-semibold">{message}</span></p>
        <p>{t.fee}: <span className="font-semibold">{fee} MON</span></p>
        <p>{t.lastGreeting}: {lastGreetingDay ? new Date(lastGreetingDay * 86400 * 1000).toLocaleDateString() : "N/D"}</p>
<p>{countdown}</p>
        <p className="text-sm">{account ? `${t.connected}: ${account}` : t.notConnected}</p>
        <p className="text-sm text-green-600">
          {account?.toLowerCase() === "0xbb7fb411857e9b993cbd2d812da689a1dec85553" ? t.isOwner : t.notOwner}
        </p>
        <div className="space-x-2">
          <button onClick={connectWallet} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t.connect}</button>
          <button onClick={sendGreeting} disabled={!account || !canGreet} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{t.send}</button>
        </div>
      </div>

      {account?.toLowerCase() === "0xbb7fb411857e9b993cbd2d812da689a1dec85553" && (
        <div className="bg-white p-6 rounded shadow-md max-w-md mx-auto space-y-4 mt-6">
          <h2 className="text-xl font-bold">{t.admin}</h2>
          <p>{t.balance}: <span className="font-semibold">{contractBalance} MON</span></p>
          <button onClick={withdrawFees} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t.withdraw}</button>
          <div>
            <h3 className="text-md font-semibold mt-4">{t.setFeeTitle}</h3>
            <input
              type="text"
              placeholder={t.newFeePlaceholder}
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              className="border px-3 py-2 rounded w-full mt-2"
            />
            <button onClick={updateFee} className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">{t.setFeeBtn}</button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-500">{status}</p>
    </div>
  );
}
