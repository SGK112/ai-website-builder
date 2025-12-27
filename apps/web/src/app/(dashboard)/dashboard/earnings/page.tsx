'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  Download,
  CreditCard,
  Clock,
  CheckCircle2,
  Users,
  Code2,
  Zap,
  Star,
  Gift,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock earnings data
const earningsData = {
  totalEarnings: 4250.00,
  pendingPayout: 850.00,
  thisMonth: 1250.00,
  lastMonth: 980.00,
  growth: 27.5,
  referrals: 12,
  templateSales: 8,
  affiliateEarnings: 420.00,
}

const recentTransactions = [
  { id: 1, type: 'Template Sale', description: 'Modern SaaS Template', amount: 29.00, date: '2024-12-26', status: 'completed' },
  { id: 2, type: 'Referral Bonus', description: 'New user signup: john@example.com', amount: 10.00, date: '2024-12-25', status: 'completed' },
  { id: 3, type: 'Template Sale', description: 'Restaurant Pro Template', amount: 49.00, date: '2024-12-24', status: 'completed' },
  { id: 4, type: 'Affiliate Commission', description: 'Pro subscription conversion', amount: 25.00, date: '2024-12-23', status: 'pending' },
  { id: 5, type: 'Template Sale', description: 'E-commerce Starter', amount: 19.00, date: '2024-12-22', status: 'completed' },
  { id: 6, type: 'Referral Bonus', description: 'New user signup: sarah@example.com', amount: 10.00, date: '2024-12-21', status: 'completed' },
]

const payoutMethods = [
  { id: 'paypal', name: 'PayPal', icon: '💳', connected: true, email: 'user@example.com' },
  { id: 'stripe', name: 'Stripe', icon: '💎', connected: false, email: '' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', connected: false, email: '' },
]

export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payouts'>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Earnings</h1>
            <p className="text-slate-400 text-sm">
              Track your revenue from templates, referrals, and affiliate commissions
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 mb-8 rounded-xl bg-white/[0.02] border border-white/[0.06] w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'transactions', label: 'Transactions', icon: Clock },
          { id: 'payouts', label: 'Payouts', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
              activeTab === tab.id
                ? 'bg-white/[0.1] text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  {earningsData.growth}%
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-white">${earningsData.totalEarnings.toFixed(2)}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-1">Pending Payout</p>
              <p className="text-2xl font-bold text-white">${earningsData.pendingPayout.toFixed(2)}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-1">Referrals</p>
              <p className="text-2xl font-bold text-white">{earningsData.referrals}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-1">Template Sales</p>
              <p className="text-2xl font-bold text-white">{earningsData.templateSales}</p>
            </motion.div>
          </div>

          {/* Earning Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earning Breakdown */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white mb-6">Earning Sources</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-white">Template Sales</span>
                  </div>
                  <span className="font-semibold text-white">$2,850</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm text-white">Referral Bonuses</span>
                  </div>
                  <span className="font-semibold text-white">$980</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm text-white">Affiliate Commissions</span>
                  </div>
                  <span className="font-semibold text-white">${earningsData.affiliateEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white mb-6">Grow Your Earnings</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/10 border border-purple-500/20 hover:border-purple-500/40 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Publish a Template</p>
                      <p className="text-xs text-slate-400">Earn 70% on every sale</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Refer a Friend</p>
                      <p className="text-xs text-slate-400">Earn $10 per signup</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-green-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Join Affiliate Program</p>
                      <p className="text-xs text-slate-400">25% lifetime commission</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.1] text-slate-300 hover:bg-white/[0.06] transition text-sm">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Description</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        tx.type === 'Template Sale' && "bg-blue-500/20 text-blue-400",
                        tx.type === 'Referral Bonus' && "bg-purple-500/20 text-purple-400",
                        tx.type === 'Affiliate Commission' && "bg-green-500/20 text-green-400"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white">{tx.description}</td>
                    <td className="p-4 text-sm text-slate-400">{tx.date}</td>
                    <td className="p-4">
                      <span className={cn(
                        "flex items-center gap-1 text-xs",
                        tx.status === 'completed' ? "text-green-400" : "text-amber-400"
                      )}>
                        {tx.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-green-400">+${tx.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Payout Balance */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Available for Payout</p>
                <p className="text-3xl font-bold text-white">${earningsData.pendingPayout.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-2">Minimum payout: $50.00</p>
              </div>
              <button
                disabled={earningsData.pendingPayout < 50}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition"
              >
                Request Payout
              </button>
            </div>
          </div>

          {/* Payout Methods */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white mb-6">Payout Methods</h3>
            <div className="space-y-3">
              {payoutMethods.map((method) => (
                <div
                  key={method.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition",
                    method.connected
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-medium text-white">{method.name}</p>
                      {method.connected && (
                        <p className="text-xs text-slate-400">{method.email}</p>
                      )}
                    </div>
                  </div>
                  {method.connected ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <button className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm font-medium transition">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payout History */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white mb-6">Payout History</h3>
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No payouts yet</p>
              <p className="text-xs text-slate-500 mt-1">Your payout history will appear here</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
