/**
 * User Guide Page
 * 
 * Static content explaining SiroMix features and workflow.
 */

import { PageContainer } from '@/components/layout/PageContainer';

export default function UserGuidePage() {
  return (
    <PageContainer
      title="User Guide"
      subtitle="Learn how to use SiroMix to create randomized exam versions"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'User Guide' },
      ]}
      maxWidth="lg"
    >
      <div className="prose prose-blue max-w-none">
        {/* Overview */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            SiroMix is an exam processing platform that helps professors create multiple randomized 
            versions of exams from a single source document. The system extracts questions from 
            Word documents, shuffles question and answer orders, and generates multiple versions 
            to maintain academic integrity.
          </p>
        </section>

        {/* Getting Started */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-3">1. Sign In</h3>
          <p className="text-gray-700 mb-4">
            Click the "Sign in with Google" button in the navigation bar to authenticate with 
            your university Google account. This simulates the OAuth flow that will be used in 
            the production version.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">2. Prepare Your Exam Document</h3>
          <p className="text-gray-700 mb-2">
            Your exam document should be in Word format (.doc or .docx) with the following structure:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>Multiple choice questions with 4 options (A, B, C, D)</li>
            <li>Clear indication of the correct answer for each question</li>
            <li>Optional learning objectives for each question</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">3. Create a New Exam</h3>
          <p className="text-gray-700 mb-4">
            Click "Create New Exam" and fill out the metadata form with:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li><strong>Academic Year</strong>: Format YYYY-YYYY (e.g., 2023-2024)</li>
            <li><strong>Exam Name</strong>: Descriptive name (e.g., "Midterm Exam")</li>
            <li><strong>Subject</strong>: Course name or code</li>
            <li><strong>Duration</strong>: Exam duration in minutes (1-300)</li>
            <li><strong>Number of Versions</strong>: How many randomized versions to generate (1-10)</li>
            <li><strong>Notes</strong>: Optional additional information</li>
            <li><strong>File Upload</strong>: Select your exam document (.doc or .docx, max 10MB)</li>
          </ul>
        </section>

        {/* Processing Workflow */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Workflow</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Extracting (12%)</h4>
                <p className="text-sm text-gray-600">
                  The system extracts question text and options from your document.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Understanding (37%)</h4>
                <p className="text-sm text-gray-600">
                  AI analyzes the question structure to identify correct answers and learning objectives.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Awaiting Confirmation (50%)</h4>
                <p className="text-sm text-gray-600">
                  Review the extracted questions and confirm accuracy before proceeding.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Shuffling (62%)</h4>
                <p className="text-sm text-gray-600">
                  Questions and answer options are randomized to create different versions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                5
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Generating (87%)</h4>
                <p className="text-sm text-gray-600">
                  Multiple exam versions are generated with answer keys.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Completed (100%)</h4>
                <p className="text-sm text-gray-600">
                  Your exam versions are ready to download and distribute.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Task Management */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Management</h2>
          <p className="text-gray-700 mb-4">
            Navigate to the "Tasks" page to view all your exam processing tasks. You can:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>View task status and progress in real-time</li>
            <li>Click on a task to view detailed information</li>
            <li>Retry failed tasks (up to 2 retries per task)</li>
            <li>Review processing logs for debugging</li>
          </ul>
        </section>

        {/* Tips & Best Practices */}
        <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tips & Best Practices</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Use clear, unambiguous question text</li>
            <li>Ensure all answer options are properly formatted</li>
            <li>Clearly mark the correct answer for each question</li>
            <li>Keep file size under 10MB for faster processing</li>
            <li>Use descriptive exam names for easy identification</li>
            <li>Generate 3-5 versions for most exam scenarios</li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Task Failed</h3>
          <p className="text-gray-700 mb-4">
            If a task fails, check the error message in the task details. Common issues include 
            invalid file format or corrupted documents. You can retry the task up to 2 times.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-2">File Upload Issues</h3>
          <p className="text-gray-700 mb-4">
            Ensure your file is in .doc or .docx format and under 10MB. If upload fails, 
            try compressing images in your document or removing unnecessary formatting.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mb-2">Questions Not Extracted</h3>
          <p className="text-gray-700">
            The AI system works best with clearly formatted questions. If questions are missing, 
            review your document structure and ensure questions follow a consistent format.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
