import { useState } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

interface LoginResponse {
  token: string;
  email: string;
  role: string;
}

interface JwtPayload {
  sub: string;  // user email
  role: string;
  userId: string; // make sure backend adds this!
}

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      console.log("Login response:", res.data);

      const token = res.data.token;

      if (!token) {
        setError("No token in response");
        return;
      }

      localStorage.setItem("token", token); // Save token

      // decode token
      const decoded = jwtDecode<JwtPayload>(token);

      // save userId in storage
      localStorage.setItem("userId", decoded.userId);
      
      window.location.href = "/products";   // Redirect
    } catch (err) {
      console.error(err);
      setError("Login failed. Invalid credentials.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
