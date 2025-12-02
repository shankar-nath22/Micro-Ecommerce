import { useState } from "react";
import api from "../api/axios";

export default function Signup() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function handleSignup(e: React.FormEvent) {
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
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Signup</button>
      </form>
    </div>
  );
}
