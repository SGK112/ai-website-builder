'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Bell,
  Shield,
  Palette,
  Globe,
  LogOut,
  Save,
  Loader2,
  Check,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface UserSettings {
  name: string
  email: string
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
  }
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [settings, setSettings] = useState<UserSettings>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
    preferences: {
      theme: 'dark',
      language: 'en',
    },
  })

  useEffect(() => {
    if (session?.user) {
      setSettings(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }))
    }
  }, [session])

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400 text-sm">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>

                <div className="flex items-start gap-6 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
                    {settings.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">{settings.name || 'User'}</h3>
                    <p className="text-sm text-slate-400 mb-3">{settings.email}</p>
                    <button className="text-sm text-purple-400 hover:text-purple-300">
                      Change avatar
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      disabled
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', description: 'Receive updates about your projects via email' },
                  { key: 'push', label: 'Push Notifications', description: 'Get notified in your browser when something happens' },
                  { key: 'marketing', label: 'Marketing Emails', description: 'Receive news, tips, and special offers' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          [item.key]: !prev.notifications[item.key as keyof typeof prev.notifications]
                        }
                      }))}
                      className={cn(
                        'w-12 h-7 rounded-full transition-colors relative',
                        settings.notifications[item.key as keyof typeof settings.notifications]
                          ? 'bg-purple-500'
                          : 'bg-slate-600'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                        settings.notifications[item.key as keyof typeof settings.notifications]
                          ? 'left-6'
                          : 'left-1'
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <h2 className="text-lg font-semibold text-white mb-6">Appearance & Preferences</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Smartphone },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, theme: theme.value as any }
                        }))}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition',
                          settings.preferences.theme === theme.value
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.1]'
                        )}
                      >
                        <theme.icon className="w-4 h-4" />
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, language: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h2 className="text-lg font-semibold text-white mb-6">Security Settings</h2>

                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">Change Password</p>
                        <p className="text-sm text-slate-400">Update your account password</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-400">Add an extra layer of security</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>

                <div className="mt-4 pt-4 border-t border-red-500/20">
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded-xl transition">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                  <p className="text-xs text-red-400/60 mt-2">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Current Plan</h2>
                  <Link href="/upgrade">
                    <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition">
                      Upgrade Plan
                    </button>
                  </Link>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent border border-white/[0.06]">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Free Plan</p>
                    <p className="text-sm text-slate-400">3 projects, 100 credits/month</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h3 className="font-semibold text-white mb-4">Billing History</h3>
                <div className="text-center py-8">
                  <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No billing history yet</p>
                  <p className="text-sm text-slate-500">Your invoices will appear here</p>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}
