export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SiroMix V2</h1>
        <p className="text-xl text-gray-600 mb-8">MVP Foundation</p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">✅ Phase 1: Setup Complete</p>
          <p className="text-sm mt-2">
            Frontend and Backend are running successfully.
          </p>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>Phase 2: Foundational layer in progress...</p>
          <p className="mt-2">
            Backend API: <a href="http://localhost:8000/docs" className="text-blue-600 hover:underline" target="_blank">http://localhost:8000/docs</a>
          </p>
        </div>
      </div>
    </main>
  );
}
