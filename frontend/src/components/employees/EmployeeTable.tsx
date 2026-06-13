import React from 'react'
import { motion } from 'framer-motion'
import { Eye, Edit, Trash2 } from 'lucide-react'

import { Employee } from '../../types'
import {
  cn,
  getInitials,
  getStatusColor,
  getStatusLabel,
  formatDate,
  generateAvatarColor,
} from '../../utils'

interface EmployeeTableProps {
  employees: Employee[]
  canEdit: boolean
  onView: (id: string) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export default function EmployeeTable({
  employees,
  canEdit,
  onView,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {[
                'Employee',
                'Department',
                'Designation',
                'Status',
                'Joined',
                'Actions',
              ].map((header) => (
                <th
                  key={header}
                  className="table-header px-5 py-4 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, i) => {
              const avatarGrad = generateAvatarColor(
                `${emp.firstName}${emp.lastName}`
              )

              return (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group cursor-pointer transition-colors hover:bg-white/2"
                  style={{
                    borderBottom:
                      '1px solid rgba(255,255,255,0.03)',
                  }}
                  onClick={() => onView(emp.id)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0 bg-gradient-to-br',
                          avatarGrad
                        )}
                      >
                        {emp.profilePictureUrl ? (
                          <img
                            src={emp.profilePictureUrl}
                            alt={`${emp.firstName} ${emp.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(
                            emp.firstName,
                            emp.lastName
                          )
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white/80">
                          {emp.firstName} {emp.lastName}
                        </p>

                        <p className="text-xs text-white/30">
                          {emp.email || emp.employeeCode}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-sm text-white/50">
                    {emp.departmentName || '—'}
                  </td>

                  <td className="px-5 py-3.5 text-sm text-white/50">
                    {emp.designation || '—'}
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={getStatusColor(
                        emp.employmentStatus
                      )}
                    >
                      {getStatusLabel(
                        emp.employmentStatus
                      )}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-sm text-white/40">
                    {emp.joiningDate
                      ? formatDate(emp.joiningDate)
                      : '—'}
                  </td>

                  <td
                    className="px-5 py-3.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onView(emp.id)}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Eye
                          size={14}
                          className="text-white/40"
                        />
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => onEdit(emp)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Edit
                              size={14}
                              className="text-primary"
                            />
                          </button>

                          <button
                            onClick={() => onDelete(emp)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2
                              size={14}
                              className="text-red-400"
                            />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}