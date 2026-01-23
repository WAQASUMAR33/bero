'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const fileInputRef = useRef(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user'); // Fallback/Initial ID source
            let userId = storedUser ? JSON.parse(storedUser).id : null;

            if (!token || !userId) {
                setError("Authentication missing");
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
                // Update local storage to keep sync
                localStorage.setItem('user', JSON.stringify(data));
            } else {
                setError("Failed to load profile");
            }
        } catch (err) {
            console.error(err);
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Validate file size/type if needed
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert("File is too large (max 10MB)");
            return;
        }

        setUploading(true);
        try {
            // 2. Convert to Base64
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            const token = localStorage.getItem('token');

            // 3. Upload to /api/upload
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ file: base64Data })
            });

            const uploadResult = await uploadRes.json();

            if (!uploadRes.ok || !uploadResult.success) {
                throw new Error(uploadResult.error || "Failed to upload image");
            }

            const newPhotoUrl = uploadResult.fileUrl;

            // 4. Update User Profile with new URL
            const updateRes = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ profilePic: newPhotoUrl })
            });

            if (updateRes.ok) {
                fetchProfile(); // Refresh data
            } else {
                alert("Failed to update profile photo");
            }

        } catch (err) {
            console.error(err);
            alert(err.message || "Error uploading photo");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#224fa6]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center">
                {error}
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header Card with Photo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-[#224fa6] to-blue-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-4 flex justify-between items-end">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-md bg-gray-100 overflow-hidden">
                                {user.profilePic ? (
                                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-blue-50 text-[#224fa6]">
                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                    </div>
                                )}

                                {/* Upload Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    onClick={() => !uploading && fileInputRef.current?.click()}>
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                                    ) : (
                                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    disabled={uploading}
                                />
                            </div>
                        </div>
                        <div className="flex-1 ml-4 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                            <p className="text-gray-500 font-medium">{user.role?.displayName || 'Care Worker'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Info</h3>
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">📧</span>
                                <span className="flex-1 truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">📱</span>
                                <span className="flex-1">{user.phoneNo || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">📍</span>
                                <span className="flex-1">{user.postalCode || 'No Address'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Employment</h3>
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">🆔</span>
                                <span className="flex-1 flex flex-col">
                                    <span className="text-xs text-gray-400">Employee ID</span>
                                    <span>{user.employeeNumber || 'N/A'}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">🏢</span>
                                <span className="flex-1 flex flex-col">
                                    <span className="text-xs text-gray-400">Region</span>
                                    <span>{user.region?.name || 'Unassigned'}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">📅</span>
                                <span className="flex-1 flex flex-col">
                                    <span className="text-xs text-gray-400">Start Date</span>
                                    <span>{user.startDate ? new Date(user.startDate).toLocaleDateString() : 'N/A'}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-red-500">🚑</span> Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <div>
                        <p className="text-xs font-bold text-red-400 uppercase">Name</p>
                        <p className="text-gray-900 font-semibold">{user.emergencyName || 'Not Set'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-red-400 uppercase">Phone</p>
                        <p className="text-gray-900 font-semibold">{user.emergencyContact || 'Not Set'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
