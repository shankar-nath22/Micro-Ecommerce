import { useState } from "react";
import api from "../api/axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    try {
      await api.post("/auth/signup", { email, password });
      alert("Signup successful!");
      window.location.href = "/login";
    } catch (err) {
      alert("Signup failed");
    }
  }

  return (
    <div>
      <h1>Signup</h1>
      <form onSubmit={handleSignup}>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
        <button>Signup</button>
      </form>
    </div>
  );
}
