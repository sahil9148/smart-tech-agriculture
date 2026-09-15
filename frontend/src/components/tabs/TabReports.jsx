import { useState, useEffect } from 'react'
import { Reports } from '../../api.js'

export default function TabReports() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Reports.summary().then(d => setReport(d.report)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="center-loading"><div className="spinner" /><span>Generating your farm reports...</span></div>
  if (!report) return <div className="empty-state"><div className="icon">📊</div>Unable to load reports. Please try again.</div>

  const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  const CARDS = [
    { title: '📊 Yield Summary', rows: [
      ['Active Crops', report.yield.activeCrops],
      ['Avg Yield Forecast', report.yield.yieldForecast],
      ['Best Performing', report.yield.bestCrop],
      ['Needs Attention', report.yield.attentionNeeded],
    ]},
    { title: '💧 Water Usage', rows: [
      ['This Month', report.water.thisMonth],
      ['vs Last Month', report.water.vsPrevMonth],
      ['Optimal Target', report.water.target],
      ['Irrigation Efficiency', report.water.efficiency],
    ]},
    { title: '🌡️ Soil Health', rows: [
      ['pH Level', report.soil.ph],
      ['Nitrogen (N)', report.soil.nitrogen],
      ['Phosphorus (P)', report.soil.phosphorus],
      ['Potassium (K)', report.soil.potassium],
    ]},
    { title: '💰 Financial Overview', rows: [
      ['Input Costs (YTD)', money(report.financial.inputCosts)],
      ['Revenue (YTD)', money(report.financial.revenue)],
      ['Net Profit', money(report.financial.netProfit)],
      ['ROI', report.financial.roi],
    ]},
    { title: '🏛️ Schemes Summary', rows: [
      ['Applied Schemes', report.schemes.applied],
      ['Approved', report.schemes.approved],
      ['Pending', report.schemes.pending],
    ]},
    { title: '🛡️ Insurance Overview', rows: [
      ['Active Policies', report.insurance.activePolicies],
      ['Total Coverage', money(report.insurance.totalCoverage)],
      ['Premiums Paid', money(report.insurance.totalPremium)],
      ['Claims Filed', report.insurance.claims],
    ]},
  ]

  return (
    <>
      <div className="dash-header"><h1>Farm Reports</h1><p className="dash-sub">Analytics and insights about your farm performance</p></div>
      <div className="reports-grid">
        {CARDS.map(r => (
          <div className="report-card" key={r.title}>
            <h3>{r.title}</h3>
            {r.rows.map(([label, value]) => (
              <div className="report-row" key={label}><span className="report-label">{label}</span><span className="report-value">{value}</span></div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>📥 Download PDF Report</button>
      </div>
    </>
  )
}
