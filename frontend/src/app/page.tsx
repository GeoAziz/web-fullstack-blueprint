import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">AI Blueprint</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Build Faster with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A PRD-driven, AI-orchestrated blueprint for building scalable full-stack web applications
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/blog"
              className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'PRD-Driven Development',
                description: 'Product requirements drive all technical decisions',
              },
              {
                title: 'AI-Orchestrated',
                description: 'Multiple specialized agents working in parallel',
              },
              {
                title: '13X Velocity',
                description: 'Accelerated development through automation and patterns',
              },
              {
                title: 'Production Ready',
                description: 'Enterprise-grade quality from day one',
              },
              {
                title: 'Type Safe',
                description: 'Full TypeScript support for frontend and backend',
              },
              {
                title: 'Quality Gates',
                description: 'Automated validation for performance, security, accessibility',
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            © 2026 AI Web Full-Stack Blueprint. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
