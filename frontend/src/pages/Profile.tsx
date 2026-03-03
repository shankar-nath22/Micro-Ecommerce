import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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
    const { token, logout } = useUserStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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
            const response = await api.get("/auth/profile");
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
            await api.put("/auth/profile", {
                name: profile.name,
                age: profile.age,
                gender: profile.gender,
                phone: profile.phone,
                address: profile.address,
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile", error);
            toast.error("Failed to update profile.");
        } finally {
            setSaving(false);
            setIsEditing(false);
        }
    };

    const handleDeleteAccount = async () => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone and will permanently delete your account!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#3b82f6",
            confirmButtonText: "Yes, delete it!",
            customClass: {
                popup: 'swal-premium'
            }
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await api.delete("/auth/profile");
            toast.success("Account deleted successfully.");
            logout();
            navigate("/");
        } catch (error) {
            console.error("Error deleting account", error);
            toast.error("Failed to delete account. Please try again.");
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
        <div className="profile-container auth-page">
            <div className="profile-card premium-card glass-morphism">
                <div className="profile-header">
                    <div className="avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : "U"}</div>
                    <h2>My Profile</h2>
                    <p className="email-display">{profile.email}</p>
                </div>

                {!isEditing ? (
                    <div className="profile-details">
                        <div className="detail-row">
                            <span className="detail-label">Full Name</span>
                            <span className="detail-value">{profile.name || "-"}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Age</span>
                            <span className="detail-value">{profile.age || "-"}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Gender</span>
                            <span className="detail-value">{profile.gender || "-"}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{profile.phone || "-"}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Address</span>
                            <span className="detail-value">{profile.address || "-"}</span>
                        </div>

                        <div className="view-actions">
                            <button className="btn-edit" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </button>
                            <button className="btn-delete" onClick={handleDeleteAccount}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                className="auth-input"
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
                                    className="auth-input"
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
                                <select className="auth-input" id="gender" name="gender" value={profile.gender} onChange={handleChange}>
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
                                className="auth-input"
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
                                className="auth-input"
                                id="address"
                                name="address"
                                placeholder="Enter your full address"
                                rows={3}
                                value={profile.address}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="auth-submit btn-save" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
