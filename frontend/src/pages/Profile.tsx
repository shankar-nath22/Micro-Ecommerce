import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/userStore";
import "./Profile.css";

interface UserProfile {
    email: string;
    name: string;
    age: number | "";
    gender: string;
    phone: string;
    address: string;
}

export default function Profile() {
    const { token } = useUserStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        email: "",
        name: "",
        age: "",
        gender: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get("http://localhost:8080/auth/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;
            setProfile({
                email: data.email || "",
                name: data.name || "",
                age: data.age || "",
                gender: data.gender || "",
                phone: data.phone || "",
                address: data.address || "",
            });
        } catch (error) {
            console.error("Error fetching profile", error);
            toast.error("Failed to load profile parameters.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: name === "age" ? (value === "" ? "" : Number(value)) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(
                "http://localhost:8080/auth/profile",
                {
                    name: profile.name,
                    age: profile.age,
                    gender: profile.gender,
                    phone: profile.phone,
                    address: profile.address,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile", error);
            toast.error("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-container loading">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : "U"}</div>
                    <h2>My Profile</h2>
                    <p className="email-display">{profile.email}</p>
                </div>

                <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Enter your full name"
                            value={profile.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="age">Age</label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                placeholder="Age"
                                min="0"
                                max="120"
                                value={profile.age}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group half">
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" value={profile.gender} onChange={handleChange}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            placeholder="Enter phone number"
                            value={profile.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <textarea
                            id="address"
                            name="address"
                            placeholder="Enter your full address"
                            rows={3}
                            value={profile.address}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
