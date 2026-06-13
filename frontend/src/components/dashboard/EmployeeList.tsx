import { ArrowUpRight, Users } from 'lucide-react';
import { getInitials } from '../../utils';

interface EmployeeListItem {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  department_name?: string;
  departmentName?: string;
  profile_picture_url?: string;
  profilePictureUrl?: string;
}

export default function EmployeeList({ employees = [] }: { employees?: EmployeeListItem[] }) {
  const rows = employees.length
    ? employees
    : [
        { id: '1', firstName: 'Danny Liu', designation: 'Product Lead', departmentName: 'Growth' },
        { id: '2', firstName: 'Derrin Stewart', designation: 'Engineering Manager', departmentName: 'Platform' },
        { id: '3', firstName: 'Mina Patel', designation: 'People Partner', departmentName: 'Operations' },
      ];

  return (
    <section className="glass-card rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white/88">Customer List</h2>
          <p className="mt-1 text-xs text-white/34">High-signal employee records</p>
        </div>
        <Users size={17} className="text-primary" />
      </div>

      <div className="space-y-2">
        {rows.map((employee) => {
          const first = employee.firstName || employee.first_name || '';
          const last = employee.lastName || employee.last_name || '';
          return (
            <div key={employee.id} className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-white/[0.04]">
              <div className="avatar h-9 w-9 text-xs">
                {employee.profilePictureUrl || employee.profile_picture_url ? (
                  <img src={employee.profilePictureUrl || employee.profile_picture_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  getInitials(first, last)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/82">{`${first} ${last}`.trim() || 'Employee'}</p>
                <p className="truncate text-xs text-white/34">{employee.designation || employee.departmentName || employee.department_name || 'Team member'}</p>
              </div>
              <ArrowUpRight size={15} className="text-white/28" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
