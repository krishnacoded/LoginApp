import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Award, BookOpen, FileText, Plus, Check, Loader2, Star, AlertCircle, X } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { skillService, verificationService } from '../../api'
import { getProficiencyLabel, cn, formatDate } from '../../utils'

interface EmployeeSkillsProps {
  skills: any[]
  certifications?: any[]
  education?: any[]
  licenses?: any[]
  employeeId: string
  isSelf: boolean
  onRefresh: () => void
}

const PROFICIENCY_COLORS = ['', '#94A3B8', '#38BDF8', '#307FE2', '#FFE264', '#F2A900']

export default function EmployeeSkills({
  skills,
  certifications = [],
  education = [],
  licenses = [],
  employeeId,
  isSelf,
  onRefresh
}: EmployeeSkillsProps) {
  const [activeSec, setActiveSec] = useState<'skills' | 'certs' | 'edu' | 'licenses'>('skills')
  const [showModal, setShowModal] = useState<string | null>(null) // 'skill' | 'cert' | 'edu' | 'license'

  const { data: allSkills } = useQuery({
    queryKey: ['all-skills-list'],
    queryFn: () => skillService.getAll(),
    enabled: !!showModal
  })

  // Mutation for submitting verification request
  const requestMutation = useMutation({
    mutationFn: (payload: { type: string; data: any }) =>
      verificationService.submitRequest(payload.type as any, payload.data),
    onSuccess: () => {
      toast.success('Verification request submitted successfully')
      setShowModal(null)
      onRefresh()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit request')
    }
  })

  const getStatusBadge = (status: string, reason?: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="badge badge-active text-[10px] py-0.5 px-2 flex items-center gap-1">
            <Check size={10} /> Verified
          </span>
        )
      case 'Rejected':
        return (
          <span
            className="badge badge-inactive text-[10px] py-0.5 px-2 flex items-center gap-1 cursor-help"
            title={reason ? `Rejection reason: ${reason}` : 'Rejected'}
          >
            <AlertCircle size={10} /> Rejected
          </span>
        )
      default:
        return (
          <span className="badge badge-pending text-[10px] py-0.5 px-2 flex items-center gap-1">
            Pending
          </span>
        )
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      {/* Sections Tab switcher */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {[
          { id: 'skills', label: 'Skills & Expertise', icon: Zap, count: skills.length },
          { id: 'certs', label: 'Certifications', icon: Award, count: certifications.length },
          { id: 'edu', label: 'Education', icon: BookOpen, count: education.length },
          { id: 'licenses', label: 'Licenses', icon: FileText, count: licenses.length }
        ].map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSec(sec.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeSec === sec.id
                ? 'bg-white/10 text-primary'
                : 'text-white/40 hover:text-white/60 hover:bg-white/3'
            )}
          >
            <sec.icon size={16} />
            <span>{sec.label}</span>
            <span className="text-xs bg-white/5 px-1.5 py-0.5 rounded-md text-white/30">{sec.count}</span>
          </button>
        ))}

        {isSelf && (
          <button
            onClick={() => setShowModal(activeSec === 'skills' ? 'skill' : activeSec === 'certs' ? 'cert' : activeSec === 'edu' ? 'edu' : 'license')}
            className="ml-auto btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Plus size={14} /> Add New
          </button>
        )}
      </div>

      {/* Content Rendering */}
      <div className="min-h-[200px]">
        {/* SKILLS */}
        {activeSec === 'skills' && (
          <div className="space-y-4">
            {skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <Zap size={32} className="mb-2" />
                <p className="text-sm">No skills added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map(skill => (
                  <div
                    key={skill.id}
                    className="p-4 rounded-2xl flex items-center justify-between border"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {skill.isPrimary && <Star size={12} className="text-amber-400 fill-amber-400" />}
                        <span className="text-sm font-medium text-white/80">{skill.skillName}</span>
                        {getStatusBadge(skill.status, skill.rejectionReason)}
                      </div>
                      <p className="text-xs text-white/30">{skill.categoryName || 'General'} · {skill.yearsExperience || 0} years exp</p>
                      {skill.status === 'Rejected' && skill.rejectionReason && (
                        <p className="text-[10px] text-red-400 italic">Reason: {skill.rejectionReason}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(lvl => (
                          <div
                            key={lvl}
                            className="w-2 h-4 rounded-sm"
                            style={{
                              background: lvl <= skill.proficiencyLevel
                                ? PROFICIENCY_COLORS[skill.proficiencyLevel]
                                : 'rgba(255,255,255,0.08)'
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-white/30 w-16 text-right">
                        {getProficiencyLabel(skill.proficiencyLevel)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATIONS */}
        {activeSec === 'certs' && (
          <div className="space-y-4">
            {certifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <Award size={32} className="mb-2" />
                <p className="text-sm">No certifications verified or pending</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certifications.map(cert => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-2xl border flex flex-col justify-between gap-3"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white/80">{cert.name}</span>
                        {getStatusBadge(cert.status, cert.rejectionReason)}
                      </div>
                      <p className="text-xs text-white/40">{cert.issuingOrganization}</p>
                      <p className="text-[11px] text-white/30">
                        Issued: {formatDate(cert.issueDate)} {cert.expiryDate ? `· Expires: ${formatDate(cert.expiryDate)}` : ''}
                      </p>
                      {cert.credentialId && (
                        <p className="text-[10px] font-mono text-primary">ID: {cert.credentialId}</p>
                      )}
                      {cert.status === 'Rejected' && cert.rejectionReason && (
                        <p className="text-[10px] text-red-400 italic">Reason: {cert.rejectionReason}</p>
                      )}
                    </div>
                    {cert.proofUrl && (
                      <a
                        href={cert.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline w-fit flex items-center gap-1"
                      >
                        <FileText size={12} /> View Proof Document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EDUCATION */}
        {activeSec === 'edu' && (
          <div className="space-y-4">
            {education.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <BookOpen size={32} className="mb-2" />
                <p className="text-sm">No education records added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {education.map(edu => (
                  <div
                    key={edu.id}
                    className="p-4 rounded-2xl border flex flex-col justify-between gap-3"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white/80">{edu.degree} in {edu.fieldOfStudy}</span>
                        {getStatusBadge(edu.status, edu.rejectionReason)}
                      </div>
                      <p className="text-xs text-white/40">{edu.institution}</p>
                      <p className="text-[11px] text-white/30">
                        {edu.startDate ? formatDate(edu.startDate) : ''} — {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                      </p>
                      {edu.grade && <p className="text-[11px] text-primary">Grade / GPA: {edu.grade}</p>}
                      {edu.status === 'Rejected' && edu.rejectionReason && (
                        <p className="text-[10px] text-red-400 italic">Reason: {edu.rejectionReason}</p>
                      )}
                    </div>
                    {edu.proofUrl && (
                      <a
                        href={edu.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline w-fit flex items-center gap-1"
                      >
                        <FileText size={12} /> View Proof Document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LICENSES */}
        {activeSec === 'licenses' && (
          <div className="space-y-4">
            {licenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <FileText size={32} className="mb-2" />
                <p className="text-sm">No professional licenses added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {licenses.map(lic => (
                  <div
                    key={lic.id}
                    className="p-4 rounded-2xl border flex flex-col justify-between gap-3"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white/80">{lic.name}</span>
                        {getStatusBadge(lic.status, lic.rejectionReason)}
                      </div>
                      <p className="text-xs text-white/40">State: {lic.issuingState || 'N/A'} {lic.licenseNumber ? `· License: ${lic.licenseNumber}` : ''}</p>
                      <p className="text-[11px] text-white/30">
                        Issued: {formatDate(lic.issueDate)} {lic.expiryDate ? `· Expires: ${formatDate(lic.expiryDate)}` : ''}
                      </p>
                      {lic.status === 'Rejected' && lic.rejectionReason && (
                        <p className="text-[10px] text-red-400 italic">Reason: {lic.rejectionReason}</p>
                      )}
                    </div>
                    {lic.proofUrl && (
                      <a
                        href={lic.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline w-fit flex items-center gap-1"
                      >
                        <FileText size={12} /> View Proof Document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REQUEST MODALS */}
      <AnimatePresence>
        {showModal && (
          <RequestModal
            type={showModal as any}
            allSkills={allSkills || []}
            isPending={requestMutation.isPending}
            onClose={() => setShowModal(null)}
            onSubmit={data => requestMutation.mutate({ type: showModal, data })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function RequestModal({ type, allSkills, isPending, onClose, onSubmit }: {
  type: 'skill' | 'cert' | 'edu' | 'license'
  allSkills: any[]
  isPending: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [skillId, setSkillId] = useState('')
  const [proficiency, setProficiency] = useState(3)
  const [exp, setExp] = useState(0)
  const [isPrimary, setIsPrimary] = useState(false)
  const [name, setName] = useState('')
  const [org, setOrg] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [credId, setCredId] = useState('')
  const [credUrl, setCredUrl] = useState('')
  const [institution, setInstitution] = useState('')
  const [degree, setDegree] = useState('')
  const [field, setField] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [grade, setGrade] = useState('')
  const [state, setState] = useState('')
  const [proofUrl, setProofUrl] = useState('')

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let data = {}

    if (type === 'skill') {
      if (!skillId) return toast.error('Please select a skill')
      data = { skillId, proficiencyLevel: proficiency, yearsExperience: Number(exp), isPrimary, proofUrl }
    } else if (type === 'cert') {
      if (!name) return toast.error('Name is required')
      data = { name, issuingOrganization: org, issueDate, expiryDate, credentialId: credId, credentialUrl: credUrl, proofUrl }
    } else if (type === 'edu') {
      if (!institution || !degree) return toast.error('Institution and Degree are required')
      data = { institution, degree, fieldOfStudy: field, startDate, endDate, grade, proofUrl }
    } else if (type === 'license') {
      if (!name) return toast.error('License Name is required')
      data = { name, licenseNumber: credId, issuingState: state, issueDate, expiryDate, proofUrl }
    }

    onSubmit(data)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <form
          onSubmit={handleFormSubmit}
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ background: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h3 className="font-semibold text-white/90">
              Request {type === 'skill' ? 'Skill' : type === 'cert' ? 'Certification' : type === 'edu' ? 'Education' : 'License'} Verification
            </h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <X size={18} className="text-white/40" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* SKILL FORM */}
            {type === 'skill' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Select Skill *</label>
                  <select
                    value={skillId}
                    onChange={e => setSkillId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Choose a skill...</option>
                    {allSkills.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.categoryName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Proficiency Level</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setProficiency(lvl)}
                        className={cn(
                          'w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all',
                          proficiency >= lvl
                            ? 'bg-primary text-midnight font-bold'
                            : 'bg-white/5 text-white/30 border border-white/5'
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/35 mt-1.5">{getProficiencyLabel(proficiency)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Years of Experience</label>
                  <input
                    type="number"
                    value={exp || ''}
                    onChange={e => setExp(Number(e.target.value))}
                    placeholder="e.g. 3"
                    className="input-field"
                    min="0"
                    max="60"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={e => setIsPrimary(e.target.checked)}
                    className="rounded border-white/10 text-primary focus:ring-primary/30 accent-primary"
                  />
                  Mark as Primary Competency
                </label>
              </>
            )}

            {/* CERTIFICATION FORM */}
            {type === 'cert' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Certification Name *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. AWS Certified Solutions Architect"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Issuing Organization *</label>
                  <input
                    value={org}
                    onChange={e => setOrg(e.target.value)}
                    placeholder="e.g. Amazon Web Services"
                    className="input-field"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Credential ID</label>
                  <input
                    value={credId}
                    onChange={e => setCredId(e.target.value)}
                    placeholder="e.g. AWS-SEC-12345"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Credential Verification URL</label>
                  <input
                    type="url"
                    value={credUrl}
                    onChange={e => setCredUrl(e.target.value)}
                    placeholder="https://verify.aws..."
                    className="input-field"
                  />
                </div>
              </>
            )}

            {/* EDUCATION FORM */}
            {type === 'edu' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Institution Name *</label>
                  <input
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="input-field"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Degree *</label>
                    <input
                      value={degree}
                      onChange={e => setDegree(e.target.value)}
                      placeholder="e.g. Bachelor of Science"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Field of Study</label>
                    <input
                      value={field}
                      onChange={e => setField(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">End Date (or Expected)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Grade / GPA / Percentage</label>
                  <input
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="e.g. 3.9 GPA"
                    className="input-field"
                  />
                </div>
              </>
            )}

            {/* LICENSE FORM */}
            {type === 'license' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">License Name *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. CPA (Certified Public Accountant)"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">License Number</label>
                  <input
                    value={credId}
                    onChange={e => setCredId(e.target.value)}
                    placeholder="e.g. LIC-1234567"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Issuing State / Authority</label>
                  <input
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="e.g. California State Board"
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </>
            )}

            {/* General Proof Document Field */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Proof Document / Certificate Link</label>
              <input
                type="url"
                value={proofUrl}
                onChange={e => setProofUrl(e.target.value)}
                placeholder="https://drive.google.com/file/... or document URL"
                className="input-field"
              />
              <p className="text-[10px] text-white/30 mt-1">Provide a link to a scanned copy or PDF representing your credential proof.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Check size={15} /> Submit Request</>}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}