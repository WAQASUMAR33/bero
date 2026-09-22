'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Database, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Users, 
  Activity, 
  ShieldAlert, 
  FileText, 
  AlertTriangle, 
  HeartHandshake, 
  PoundSterling, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

const AREA_META = [
  {
    name: 'Occupancy',
    icon: Users,
    color: 'from-blue-600 to-indigo-600',
    description: 'Percentage of total operational beds / placement capacity currently filled by active service seekers.',
    whatToCollate: 'Live service user count divided by nominal home capacity (e.g. 17 beds), factoring in hospital holds and planned admissions.',
    sourceModule: 'Service Users & Admissions',
    linkPath: '/admin/service-users'
  },
  {
    name: 'Live Enquiries',
    icon: Activity,
    color: 'from-indigo-600 to-violet-600',
    description: 'Total active referrals and placement enquiries currently in the assessment, costing, or pre-admission pipeline.',
    whatToCollate: 'Count of enquiries with status "LIVE", referral routes (Local Authority, CHC, Private), and conversion timeline.',
    sourceModule: 'Enquiries & Referrals',
    linkPath: '/admin/enquiries'
  },
  {
    name: 'Safeguardings',
    icon: ShieldAlert,
    color: 'from-rose-600 to-pink-600',
    description: 'Statutory safeguarding adult alerts or allegations raised with local authority safeguarding teams.',
    whatToCollate: 'All safeguarding alerts logged during the month, investigating status, Section 42 enquiry outcomes, and lessons learnt.',
    sourceModule: 'Governance & Trackers (Safeguarding)',
    linkPath: '/admin/governance?tab=safeguarding'
  },
  {
    name: 'CQC Notifications',
    icon: FileText,
    color: 'from-amber-600 to-orange-600',
    description: 'Statutory notifications submitted to Care Quality Commission under Regulations 16 to 18.',
    whatToCollate: 'Serious injuries, deaths of service users, police incidents, deprivation of liberty authorisations submitted within required timescales.',
    sourceModule: 'CQC Statutory Notifications',
    linkPath: '/admin/governance?tab=cqc'
  },
  {
    name: 'RIDDOR Reports',
    icon: AlertTriangle,
    color: 'from-red-600 to-rose-700',
    description: 'Health and Safety Executive (HSE) reportable workplace incidents and dangerous occurrences.',
    whatToCollate: 'Occupational fractures, over-7-day incapacitated staff injuries, and hospitalizations reported to HSE.',
    sourceModule: 'HSE RIDDOR Tracker',
    linkPath: '/admin/governance?tab=riddor'
  },
  {
    name: 'Accidents',
    icon: Activity,
    color: 'from-orange-600 to-amber-600',
    description: 'Recorded falls, skin tears, or accidental occurrences involving residents, staff, or visitors.',
    whatToCollate: 'Total accident reports, clinical triage completed, neurological checks logged, and equipment environmental reviews.',
    sourceModule: 'Internal Investigations (Accidents)',
    linkPath: '/admin/investigations'
  },
  {
    name: 'Incidents',
    icon: Layers,
    color: 'from-purple-600 to-indigo-600',
    description: 'Adverse behavioral, clinical, or operational events logged on shift runs.',
    whatToCollate: 'Challenging behavior incidents, medication discrepancies, property damage, and multi-disciplinary follow-ups.',
    sourceModule: 'Internal Investigations (Incidents)',
    linkPath: '/admin/investigations'
  },
  {
    name: 'Near Misses',
    icon: ShieldAlert,
    color: 'from-emerald-600 to-teal-600',
    description: 'Proactively identified safety concerns or hazard reports that did not cause harm.',
    whatToCollate: 'Trip hazards, medication near-miss catches, equipment faults reported before resident impact.',
    sourceModule: 'Investigations & Governance',
    linkPath: '/admin/investigations'
  },
  {
    name: 'Complaints',
    icon: AlertTriangle,
    color: 'from-amber-600 to-yellow-600',
    description: 'Formal and informal dissatisfaction expressed by service seekers, relatives, or external stakeholders.',
    whatToCollate: 'Stage 1 and Stage 2 complaints logged, investigation timeline, formal response letter date, and corrective remedies.',
    sourceModule: 'Quality Assurance (Feedback Monitoring)',
    linkPath: '/admin/quality-assurance'
  },
  {
    name: 'Compliments',
    icon: HeartHandshake,
    color: 'from-pink-600 to-rose-600',
    description: 'Letters, cards, verbal commendations, and positive external reviews received.',
    whatToCollate: 'Count of written/verbal compliments, care worker commendations, and feedback across care standards.',
    sourceModule: 'Quality Assurance (Compliments)',
    linkPath: '/admin/quality-assurance'
  },
  {
    name: 'P&L',
    icon: PoundSterling,
    color: 'from-emerald-600 to-green-700',
    description: 'Profit and loss financial margin, operational spending, and funder revenue balances.',
    whatToCollate: 'Total funder fee collections vs agency staffing spend, shift run overtime, and net monthly surplus/deficit.',
    sourceModule: 'Funder & Rota Financials',
    linkPath: '/admin/funder-management'
  },
  {
    name: 'Sickness',
    icon: Clock,
    color: 'from-sky-600 to-blue-700',
    description: 'Staff absenteeism rate, sick leave days lost, and return-to-work compliance.',
    whatToCollate: 'Total unplanned sickness shifts, absence percentage against workforce roster, and occupational health referrals.',
    sourceModule: 'Staff Management & Leave / Rota',
    linkPath: '/admin/holidays'
  }
];

export default function KpiCollationHub({ onApplyCollation, activePeriod = '2026-08' }) {
  const router = useRouter();
  const [collatedData, setCollatedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCollation = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/kpi/collate?period=${activePeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCollatedData(data.collatedData);
      }
    } catch (err) {
      console.error('Error fetching live collation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollation();
  }, [activePeriod]);

  return (
    <div className="space-y-6">
      {/* Collation Hub Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#224fa6]" />
            KPI Data Collation Engine & Information Specifications
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            This tracker defines precisely what data is collated across all 12 key performance areas, linking live system database registers directly into your monthly evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCollation}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Data</span>
          </button>

          {onApplyCollation && collatedData && (
            <button
              type="button"
              onClick={() => onApplyCollation(collatedData)}
              className="px-4 py-2.5 bg-[#224fa6] hover:bg-[#1b3f85] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply to Current Evaluation</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of 12 Collation Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AREA_META.map((item, idx) => {
          const Icon = item.icon;
          const liveCollation = collatedData?.areas?.[item.name];

          return (
            <div 
              key={item.name}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">KPI Area #{idx + 1}</span>
                      <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                    </div>
                  </div>

                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Auto-Link
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 mb-3 font-medium leading-relaxed">
                  {item.description}
                </p>

                {/* What needs to be collated */}
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 mb-3">
                  <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#224fa6]" />
                    What Information Needs to be Collated
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">
                    {item.whatToCollate}
                  </p>
                </div>

                {/* Current Live Collated Value */}
                {liveCollation && (
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 mb-3">
                    <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Current System Value ({activePeriod})</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-sm font-extrabold text-[#224fa6]">
                      {liveCollation.data}
                    </div>
                  </div>
                )}
              </div>

              {/* Source Link */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium truncate max-w-[170px]">
                  {item.sourceModule}
                </span>

                <button
                  type="button"
                  onClick={() => router.push(item.linkPath)}
                  className="inline-flex items-center gap-1 text-[#224fa6] hover:text-[#1b3f85] font-bold hover:underline cursor-pointer"
                >
                  <span>Open Module</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
