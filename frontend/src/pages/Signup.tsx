import { useState } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import toast from "react-hot-toast";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  // Interfaces for decoding the login token
  interface LoginResponse {
    token: string;
    email: string;
    name: string;
    role: string;
  }

  interface JwtPayload {
    sub: string;
    role: string;
    userId: string;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/signup", {
        email,
        password,
        name,
        age: age === "" ? null : Number(age),
        gender,
        phone,
        address,
        role: isAdmin ? "ADMIN" : "USER"
      });

      // Auto-authenticate right after signup
      const loginRes = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      const token = loginRes.data.token;
      if (!token) throw new Error("Auto-authentication failed");

      const decoded = jwtDecode<JwtPayload>(token);
      localStorage.setItem("userId", decoded.userId);
      setUser(token, loginRes.data.role, loginRes.data.email, loginRes.data.name);

      toast.success("Account created and you are now logged in!");
      navigate("/products");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card premium-card glass-morphism">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us and start shopping in minutes</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              className="auth-input"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Age</label>
              <input
                className="auth-input"
                type="number"
                placeholder="25"
                min="0"
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Gender</label>
              <select
                className="auth-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{ appearance: 'auto' }}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              className="auth-input"
              type="tel"
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              className="auth-input"
              type="text"
              placeholder="123 Main St, City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-container">
              <input
                className="auth-input password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-container">
              <input
                className="auth-input password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <span>Sign up as Administrator</span>
            </label>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
