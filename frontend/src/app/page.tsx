import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-gray-800 dark:text-white">
          Welcome to <span className="text-blue-600">PM2</span>
        </h1>

        <p className="mt-3 text-2xl text-gray-600 dark:text-gray-300">
          Project Management System
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition duration-300 shadow-lg"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 dark:hover:bg-gray-800 transition duration-300"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
