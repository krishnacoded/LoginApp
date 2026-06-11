import { Employee } from '../../types';

interface EmployeeCard {
  employee: Employee;
  canEdit: boolean;
  onView: (id: string) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export default function EmployeeCard(_: EmployeeCard) {
  return <div>Employee Card</div>;
}