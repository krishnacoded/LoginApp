const reportService = require('../services/report.service');
const { auditLog } = require('../middleware/audit');
const ApiResponse = require('../utils/response');

const leaveColumns = [
  { header: 'Employee Code', key: 'employee_code', width: 15 },
  { header: 'Employee Name', key: 'employee_name', width: 25 },
  { header: 'Department', key: 'department_name', width: 20 },
  { header: 'Leave Type', key: 'leave_type', width: 15 },
  { header: 'Start Date', key: 'start_date', width: 15, dateFormat: 'yyyy-MM-dd' },
  { header: 'End Date', key: 'end_date', width: 15, dateFormat: 'yyyy-MM-dd' },
  { header: 'Total Days', key: 'total_days', width: 12 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Applied At', key: 'applied_at', width: 18, dateFormat: 'yyyy-MM-dd HH:mm' },
  { header: 'Approving Manager', key: 'manager_name', width: 25 }
];

const attendanceColumns = [
  { header: 'Employee Code', key: 'employee_code', width: 15 },
  { header: 'Employee Name', key: 'employee_name', width: 25 },
  { header: 'Department', key: 'department_name', width: 20 },
  { header: 'Date', key: 'date', width: 12, dateFormat: 'yyyy-MM-dd' },
  { header: 'Clock In', key: 'clock_in', width: 18, dateFormat: 'yyyy-MM-dd HH:mm:ss' },
  { header: 'Clock Out', key: 'clock_out', width: 18, dateFormat: 'yyyy-MM-dd HH:mm:ss' },
  { header: 'Work Hours', key: 'work_hours', width: 12 },
  { header: 'Status', key: 'status', width: 12 }
];

const assetColumns = [
  { header: 'Asset Name', key: 'asset_name', width: 25 },
  { header: 'Serial Number', key: 'serial_number', width: 20 },
  { header: 'Asset Type', key: 'asset_type', width: 15 },
  { header: 'Status', key: 'asset_status', width: 15 },
  { header: 'Allocated To Code', key: 'allocated_to_code', width: 15 },
  { header: 'Allocated To Name', key: 'allocated_to_name', width: 25 },
  { header: 'Allocated At', key: 'allocated_at', width: 18, dateFormat: 'yyyy-MM-dd HH:mm:ss' },
  { header: 'Notes', key: 'notes', width: 30 }
];

const formatFileResponse = async (res, formatType, title, columns, rows, filterSummary, performedByUserId, req) => {
  const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
  
  // Audit the export
  await auditLog(
    performedByUserId,
    'EXPORT_REPORT',
    'reports',
    null,
    null,
    { title, format: formatType, filters: filterSummary },
    req
  );

  if (formatType === 'csv') {
    const csvContent = reportService.constructor.prototype.getLeaveReportData 
      ? require('../services/report.service').constructor.prototype.getLeaveReportData 
      : null; // dummy check, actually use our custom convertToCSV helper
    
    // We imported helper at module level inside report.service.js, let's call it via service or define it locally
    const { rows: dbRows } = { rows };
    // Let's call the helper
    const csvString = require('../services/report.service').getLeaveReportData ? 
      require('../services/report.service').generateExcel ? 
      // Helper call
      require('../services/report.service').constructor.prototype.getLeaveReportData ? '' : '' : '' : '';
    
    // Let's just implement a local helper mapping in case
    const csv = require('../services/report.service').generateExcel 
      ? csvContent 
      : null;

    // Use our service functions
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    worksheet.columns = columns.map(c => ({ header: c.header, key: c.key }));
    rows.forEach(r => worksheet.addRow(r));
    const buffer = await workbook.csv.writeBuffer();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    return res.send(buffer);
  } 
  
  if (formatType === 'xlsx') {
    const buffer = await reportService.generateExcel(title, columns, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    return res.send(buffer);
  } 
  
  if (formatType === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
    await reportService.generatePDF(res, title, columns, rows, filterSummary);
    return;
  }

  return ApiResponse.badRequest(res, `Unsupported format: ${formatType}`);
};

class ReportController {
  async exportLeaves(req, res, next) {
    try {
      const formatType = req.query.format || 'xlsx';
      const rows = await reportService.getLeaveReportData(req.query, req.user);
      
      const filterSummary = {
        'Department': req.query.departmentName || req.query.departmentId,
        'Employee': req.query.employeeName || req.query.employeeId,
        'Status': req.query.status,
        'Start Date': req.query.startDate,
        'End Date': req.query.endDate
      };

      await formatFileResponse(
        res,
        formatType,
        'Leave Requests Report',
        leaveColumns,
        rows,
        filterSummary,
        req.user.id,
        req
      );
    } catch (error) {
      next(error);
    }
  }

  async exportAttendance(req, res, next) {
    try {
      const formatType = req.query.format || 'xlsx';
      const rows = await reportService.getAttendanceReportData(req.query, req.user);

      const filterSummary = {
        'Department': req.query.departmentName || req.query.departmentId,
        'Employee': req.query.employeeName || req.query.employeeId,
        'Status': req.query.status,
        'Start Date': req.query.startDate,
        'End Date': req.query.endDate
      };

      await formatFileResponse(
        res,
        formatType,
        'Attendance Log Report',
        attendanceColumns,
        rows,
        filterSummary,
        req.user.id,
        req
      );
    } catch (error) {
      next(error);
    }
  }

  async exportAssets(req, res, next) {
    try {
      const formatType = req.query.format || 'xlsx';
      const rows = await reportService.getAssetReportData(req.query, req.user);

      const filterSummary = {
        'Asset Type': req.query.assetType,
        'Status': req.query.status,
        'Allocated Employee': req.query.employeeName || req.query.employeeId
      };

      await formatFileResponse(
        res,
        formatType,
        'Asset Inventory Report',
        assetColumns,
        rows,
        filterSummary,
        req.user.id,
        req
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
