'use client'
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { alertSuccess, alertError } from '@/components/Alertmodal';
import { useRouter } from "next/navigation";


function SecurityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function SettingsPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userFirstName, setUserFirstName] = useState<string | null>(null);
    const [userLastName, setUserLastName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const [activeSection, setActiveSection] = useState<"profile" | "security">("profile");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const loadUserData = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            setUserId(user.userid);
            setUserFirstName(user.firstname);
            setUserLastName(user.lastname);
            setUserEmail(user.email);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nameRegex = /^[\p{L}\s]+$/u;
        if (firstName && !nameRegex.test(firstName)) {
            alertError("Incomplete Form", { message: "First name: Only letters are allowed."});
            return;
        }
        if (lastName && !nameRegex.test(lastName)) {
            alertError("Incomplete Form", { message: "Last name: Only letters are allowed."});
            return;
        }
        if (!firstName && !lastName) {
            alertError("Incomplete Form", { message: "Please fill in at least one field."});
            return;
        }
        try {
            await api.put(`/users/${userId}/changename/`, { firstName, lastName });
            const userString = localStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                user.firstname = firstName || user.firstname;
                user.lastname = lastName || user.lastname;
                localStorage.setItem('user', JSON.stringify(user));
            }
            setFirstName("");
            setLastName("");
            loadUserData();
            alertSuccess("Saved Successfully", { message: "Changes have been saved." });
        }catch (err) {
            console.error('Failed to update Name', err);
        }
    };

    const handlePassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim().length === 0) {
            alertError("Invalid Password", { message: "Password cannot be empty."});
            return;
        }
        if (confirmPassword.trim().length === 0) {
            alertError("Invalid Password", { message: "confirmPassword cannot be empty."});
            return;
        }

        if (password !== confirmPassword) {
            alertError("Invalid Password", { message: "Passwords do not match."});
            return;
        }
        if (password.length < 8) {
            alertError("Invalid Password", { message: "Password must be at least 8 characters."});
            return;
        }
        if (password.length > 50) {
            alertError("Invalid Password", { message: "Password must not exceed 50 characters."});
            return;
        }
        const alphanumericRegex = /^[a-zA-Z0-9]+$/; // เฉพาะภาษาอังกฤษ (A-Z, a-z) และตัวเลข (0-9)
        if (!alphanumericRegex.test(password)) {
            alertError("Invalid Password", { message: "Password can only contain English letters and numbers."});
            return;
        }

        const isRepeating = /^(.)\1+$/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasMixed = hasLower && hasUpper && hasNumber;

        if (isRepeating || !hasMixed) { //strength 4
            alertError("Invalid Password", { message: "Password must contain uppercase, lowercase letters and numbers."});
            return;
        }
        try {
            await api.put(`/users/${userId}/newpassword/`, { password });
            alertSuccess("Saved Successfully", { message: "Changes have been saved." });
            setPassword("");
            setConfirmPassword("");
        }catch (err) {
            console.error('Failed to update Password', err);
        }
    };


    

    return (
        <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Manage your account preferences</p>
            <div className="max-w-8xl mx-0 mt-6">
                {userRole !== "0" ? (
                <>
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
                        <button
                            onClick={() => setActiveSection("profile")}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${ activeSection === "profile"
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-2"><ProfileIcon className="w-4 h-4" /> Profile</div>
                        </button>
                        <button
                            onClick={() => setActiveSection("security")}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${ activeSection === "security"
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-2"><SecurityIcon className="w-4 h-4" /> Security</div>
                        </button>
                    </div>

                    {/* Info Card */}
                        <div className="mb-8 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl shadow-lg overflow-hidden">
                            <div className="px-8 pt-7 pb-5">
                                <h2 className="text-xl font-semibold">Account Details</h2>
                                <p className="text-xs mt-1">Your account information</p>
                            </div>
                            <div className="px-8 pb-7 grid grid-cols-3 gap-6">
                                <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Full Name</span>
                                <span className="text-sm font-medium">{userFirstName} {userLastName || "-"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Email</span>
                                <span className="text-sm font-medium">{userEmail || "-"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Role</span>
                                <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                                    {userRole || "-"}
                                </span>
                                </div>
                            </div>
                        </div>


                    {/* Profile Tab */}
                    {activeSection === "profile" && (
                    <div className="space-y-4">
                        {/* Name Card */}
                        <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-8 pt-7 pb-5">
                            <h2 className="text-xl font-semibold">Personal Information</h2>
                            <p className="text-xs mt-1">Update your first and last name</p>
                        </div>
                        <div className="px-8 mb-7">
                            <form onSubmit={handleNameSubmit}>
                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium uppercase tracking-wide">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Enter first name"
                                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 dark:text-white transition-all"
                                />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium uppercase tracking-wide">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Enter last name"
                                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 dark:text-white transition-all"
                                />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-50 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                            >
                                Save Changes
                            </button>
                            </form>
                        </div>
                        </div>
                    </div>
                    )}

                    {/* Security Tab */}
                    {activeSection === "security" && (
                    <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-8 pt-7 pb-5">
                        <h2 className="text-xl font-semibold">Change Password</h2>
                        <p className="text-xs mt-1">Choose a strong password with at least 8 characters</p>
                        </div>
                        <div className="px-8 mb-7">
                        <form onSubmit={handlePassSubmit}>
                            <div className="grid grid-cols-2 gap-4 mb-5">

                            {/* New Password */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium uppercase tracking-wide">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                        className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 dark:text-white transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a09c96] hover:text-[#5a5650] transition-colors"
                                    >
                                        {showPass ? (
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                        </svg>
                                        ) : (
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Strength Bar */}
                                {/* {password && (
                                    <div className="flex gap-1 mt-0.5">
                                        {[1, 2, 3, 4].map((i) => {
                                            const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(password); //(a-z, A-Z, 0-9) only
                                            let strength = 0;
                                            if (!isAlphanumeric || password.length > 50) { // ไม่เกิน 50 ตัว ไม่ใช้อักขระพิเศษ
                                                strength = 0;
                                            } else { 
                                                if (password.length >= 12) strength = 4; // 12 ตัวขึ้นไป เขียว
                                                else if (password.length >= 10) strength = 3;
                                                else if (password.length >= 8) strength = 2; 
                                                else if (password.length >= 1) strength = 1;
                                            }
                                            const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];
                                            return (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                        i <= strength ? colors[strength - 1] : "bg-[#e8e5e0]"
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>
                                )} */}
                                {password && (
                                    <div className="flex gap-0.5 mt-2">
                                        {[1, 2, 3, 4].map((i) => {
                                            const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(password); // อนุญาตเฉพาะ a-z, A-Z, 0-9
                                            const isRepeating = /^(.)\1+$/.test(password);           // ตรวจสอบตัวอักษรซ้ำทั้งหมด เช่น 111111, aaaaaa
                                            const hasLower = /[a-z]/.test(password);                 // มีตัวพิมพ์เล็ก
                                            const hasUpper = /[A-Z]/.test(password);                 // มีตัวพิมพ์ใหญ่
                                            const hasNumber = /[0-9]/.test(password);                // มีตัวเลข
                                            const hasMixed = hasLower && hasUpper && hasNumber;         // ครบทั้ง 3 ประเภท (lower + upper + number)
                                            const hasOnlyOneType = [hasLower, hasUpper, hasNumber].filter(Boolean).length === 1; // มีแค่ประเภทเดียว (ตัวเลขล้วน หรือ ตัวอักษรล้วน)
                                            const hasNumberWithLetter = hasNumber && (hasLower || hasUpper); // มีตัวเลข + ตัวอักษร (lower หรือ upper อย่างใดอย่างหนึ่ง)

                                            let strength = 0;

                                            if (!isAlphanumeric || password.length > 50 || (password.length >= 1 && password.length < 8)) {
                                                strength = 0; // มีอักขระพิเศษ หรือ เกิน 50 ตัว
                                            } else if (isRepeating) {
                                                strength = 1; // ตัวอักษร/ตัวเลขซ้ำทั้งหมด
                                            } else if (password.length >= 8 && hasMixed) {
                                                strength = 4; // 8+ ตัว + lower + upper + number ครบ = ปลอดภัย
                                            } else {
                                                if (hasOnlyOneType) strength = 2;                                      // ตัวเลขล้วน หรือ ตัวอักษรล้วน
                                                else if (password.length >= 8 && hasNumberWithLetter) strength = 3; // 8+ ตัว + number + lower/upper
                                                else if (password.length >= 8) strength = 2;                        // 8+ ตัว แต่ไม่ครบเงื่อนไข
                                                else if (password.length >= 1) strength = 1;                        // 1-7 ตัว
                                            }

                                            const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];
                                            return (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                        i <= strength ? colors[strength - 1] : "bg-[#e8e5e0]"
                                                    }`}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium uppercase tracking-wide">Confirm Password</label>
                                <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 dark:text-white transition-all"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a09c96] hover:text-[#5a5650] transition-colors"
                                >
                                    {showConfirm ? (
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                    </svg>
                                    ) : (
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                    )}
                                </button>
                                </div>
                            </div>
                            </div>

                            <button
                            type="submit"
                            className="w-50 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                            >
                            Update Password
                            </button>
                        </form>

                        </div>
                    </div>
                    )}
                </>
                ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#e8e5e0] shadow-sm px-8 py-16 text-center">
                    <div className="w-14 h-14 bg-[#f0ede8] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#a09c96]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                    </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-[#1a1816] mb-1">Settings Coming Soon</h2>
                </div>
                )}
            </div>
        </div>

    );
}



// export default function SettingsPage() {
//     return (
//         <div>
//             <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
//             <p className="text-gray-600">Settings coming soon...</p>
//         </div>
//     );
// }