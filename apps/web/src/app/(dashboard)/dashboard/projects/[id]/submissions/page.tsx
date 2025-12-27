'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Clock,
  User,
  MessageSquare,
  Check,
  Archive,
  Trash2,
  RefreshCw,
  Inbox,
} from 'lucide-react'

interface Submission {
  _id: string
  formId: string
  data: {
    name?: string
    email?: string
    message?: string
    [key: string]: any
  }
  metadata: {
    ip?: string
    userAgent?: string
    page?: string
  }
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: string
}

export default function SubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchSubmissions()
  }, [params.id])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/forms/submit?projectId=${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedSubmission = submissions.find(s => s._id === selectedId)

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true
    return s.status === filter
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusColors = {
    new: 'bg-blue-500',
    read: 'bg-gray-500',
    replied: 'bg-green-500',
    archived: 'bg-yellow-500',
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/projects/${params.id}`}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  Form Submissions
                </h1>
                <p className="text-sm text-slate-400">
                  {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={fetchSubmissions}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'new', 'read', 'replied', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status}
              {status !== 'all' && (
                <span className="ml-2 text-xs opacity-70">
                  ({submissions.filter(s => s.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <Inbox className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No submissions yet</h2>
            <p className="text-slate-400">
              Form submissions from your deployed site will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submissions List */}
            <div className="lg:col-span-1 space-y-2">
              {filteredSubmissions.map((submission) => (
                <button
                  key={submission._id}
                  onClick={() => setSelectedId(submission._id)}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    selectedId === submission._id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusColors[submission.status]}`} />
                      <span className="font-medium text-white truncate">
                        {submission.data.name || submission.data.email || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDate(submission.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    {submission.data.email}
                  </p>
                  {submission.data.message && (
                    <p className="text-sm text-slate-500 truncate mt-1">
                      {submission.data.message.slice(0, 60)}...
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Submission Detail */}
            <div className="lg:col-span-2">
              {selectedSubmission ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">
                      Submission Details
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSubmission.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                        selectedSubmission.status === 'read' ? 'bg-gray-500/20 text-gray-400' :
                        selectedSubmission.status === 'replied' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {selectedSubmission.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <User className="w-4 h-4" />
                          Name
                        </div>
                        <p className="text-white font-medium">
                          {selectedSubmission.data.name || 'Not provided'}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                        <a
                          href={`mailto:${selectedSubmission.data.email}`}
                          className="text-blue-400 hover:underline font-medium"
                        >
                          {selectedSubmission.data.email || 'Not provided'}
                        </a>
                      </div>
                    </div>

                    {/* Message */}
                    {selectedSubmission.data.message && (
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </div>
                        <p className="text-white whitespace-pre-wrap">
                          {selectedSubmission.data.message}
                        </p>
                      </div>
                    )}

                    {/* Other Fields */}
                    {Object.entries(selectedSubmission.data)
                      .filter(([key]) => !['name', 'email', 'message'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="text-slate-400 text-sm mb-1 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <p className="text-white">{String(value)}</p>
                        </div>
                      ))}

                    {/* Metadata */}
                    <div className="border-t border-slate-800 pt-4 mt-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        Received: {new Date(selectedSubmission.createdAt).toLocaleString()}
                      </div>
                      {selectedSubmission.metadata.page && (
                        <p className="text-slate-500 text-sm">
                          From page: {selectedSubmission.metadata.page}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <a
                        href={`mailto:${selectedSubmission.data.email}?subject=Re: Your message`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                      >
                        <Mail className="w-4 h-4" />
                        Reply
                      </a>
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition">
                        <Check className="w-4 h-4" />
                        Mark as Read
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition">
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                  <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a submission to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
