'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
    const router = useRouter();
    // const [formData, setFormData] = useState({ username: '', password: '' });
    
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(''); 
    const [newPassword, setNewPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
            const user = JSON.parse(savedUser);
            setUserId(user.userId);
            setUserEmail(user.email);
            setStep(3); 
        }
        else {
            setStep(1); 
        }
    
        return () => {
            setError("");
            setNewPassword("");
            setUserId("");
            setUserEmail("");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        };
    }, []); 


    const handleOtpChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return;
        const currentOtpArray = otp.padEnd(6, ' ').split(''); 
        currentOtpArray[index] = value.slice(-1);
        const combinedOtp = currentOtpArray.join('').trimEnd();
        setOtp(combinedOtp);
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
            nextInput?.focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
            prevInput?.focus();
        }
    };


    // send email
    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setError("Email is required");
            return;
        } 
        if (!emailRegex.test(email)) {
            setError("Invalid email format");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post(`/auth/forgot-password`, { email });
            setStep(2);
            setError("");
        } catch (err: any) {
            setError("User not found with this email address."); 
        } finally {
            setIsSubmitting(false);
        }
    };

    // send otp
    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpRegex = /^\d{6}$/; 
        if (!otp) {
            setError("OTP is required");
        } else if (!otpRegex.test(otp)) {
            setError("OTP must be a 6-digit number");
        } else {
            setError("");
            setIsSubmitting(true);
            try {
                const res = await api.post<{ success: boolean; userId: string; email: string; resetToken: any }>(`/auth/verify-otp`, { email, otp });
                setUserId(res.userId);
                localStorage.setItem('token', res.resetToken);
                localStorage.setItem('user', JSON.stringify({ 
                    userId: res.userId, 
                    email: res.email 
                }));
                setStep(3);
                setError("");
            } catch (err: any) {
                setError('Invalid OTP code.');
            } finally {
                setIsSubmitting(false);
            }
        } 
    };


    // set newPassword
    const handleStep3 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.trim().length === 0) {
            setError('Password cannot be empty');
            return;
        }
        if (newPassword.trim().length === 0) {
            setError('confirmPassword cannot be empty');
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (newPassword.length > 50) {
            setError("Password must not exceed 50 characters");
            return;
        }
        const alphanumericRegex = /^[a-zA-Z0-9]+$/; // เฉพาะภาษาอังกฤษ (A-Z, a-z) และตัวเลข (0-9)
        if (!alphanumericRegex.test(newPassword)) {
            setError("Password can only contain English letters and numbers");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put(`/users/${userId}/newpassword/`, { password:newPassword });
            alert('Password updated successfully');
            router.push('/login');
        } catch (err: any) {
            setError('Failed to complete.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return(
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-cyan-50 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border-2 border-white/50 relative z-10">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-gray-800 tracking-tight mb-2">Reset Password</h2>
                    <p className="text-gray-500 font-medium">Please enter your details to reset password.</p>
                </div>
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r mb-6 shadow-sm">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        </div>
                    </div>
                )}


                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 dark:bg-gray-800">
                    <div className="h-full bg-linear-to-r from-cyan-500 to-blue-600 transition-all duration-300" style={{ width: `${step * 33.33}%` }}></div>
                </div>
                    {/* STEP 1: Send Email */}
                    {step === 1 && (    
                            <form onSubmit={handleStep1} className="space-y-6">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-3 ml-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-cyan-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm font-medium"
                                        required
                                        autoFocus
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                                >
                                    Send OTP Code &rarr;
                                </button>
                            </form>
                    )}

                    {/* OTP แสดงอยู่ใน Console Backend */}
                    {step === 2 && (
                        <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-6">
                                <div className="text-left">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">
                                    Verification Code
                                    </label>
                                    
                                    <div className="flex justify-between gap-2 md:gap-4">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength={1}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="w-full h-14 md:h-16 text-center text-2xl text-black font-black bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 rounded-xl outline-none transition-all"
                                        value={otp[index] || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOtpChange(e.target.value, index)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleOtpKeyDown(e, index)}
                                        autoFocus={index === 0}
                                        />
                                    ))}
                                    </div>
                                </div>
                                
                                <p className="text-gray-400 text-sm">
                                    We sent a code to <span className="text-gray-800 font-bold">{email}</span>
                                </p>
                            </div>

                            <button
                                onClick={handleStep2}
                                disabled={isSubmitting}
                                className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                            >
                                {isSubmitting ? "Verifying..." : <>Verify Code &rarr;</>}
                            </button>
                        </div>
                    )}

                    
                    {/* STEP 3: Send NewPassword */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <form onSubmit={handleStep3} className="space-y-6">
                                <div className="relative"> 
                                    <label className="block text-gray-700 text-sm font-bold mb-3 ml-1">
                                        New Password
                                    </label>
                                    
                                    <div className="relative"> 
                                        <input
                                        type={showPass ? "text" : "password"}
                                        placeholder="Enter new password"
                                        className="w-full px-5 py-4 pr-12 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-cyan-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm font-medium"
                                        required
                                        autoFocus
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        
                                        <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a09c96] hover:text-[#5a5650] transition-colors focus:outline-none"
                                        >
                                        {showPass ? (
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
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
                                    {newPassword && (
                                        <div className="flex gap-0.5 mt-2">
                                            {[1, 2, 3, 4].map((i) => {
                                                const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(newPassword); //(a-z, A-Z, 0-9) only
                                                let strength = 0;
                                                if (!isAlphanumeric || newPassword.length > 50) { // ไม่เกิน 50 ตัว ไม่ใช้อักขระพิเศษ
                                                    strength = 0;
                                                } else { 
                                                    if (newPassword.length >= 12) strength = 4; // 12 ตัวขึ้นไป เขียว
                                                    else if (newPassword.length >= 10) strength = 3;
                                                    else if (newPassword.length >= 8) strength = 2; 
                                                    else if (newPassword.length >= 1) strength = 1;
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
                                <p className="mt-4 text-gray-400 text-sm text-center">
                                    Resetting password for <span className="text-gray-800 font-bold">{userEmail || email}</span>
                                </p>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                                >
                                    {isSubmitting ? "Processing..." : "Reset Password"}
                                </button>
                            </form>
                        </div>
                    )}


                <p className="mt-4 text-center text-gray-500 font-medium">
                    Already have an account?{' '}
                    <Link href="/login" className="text-cyan-600 font-bold hover:text-cyan-700 hover:underline transition-colors">
                        Sign In
                    </Link>
                </p>
                
            </div>
        </div>
    );
}