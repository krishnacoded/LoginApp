const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

// Helper to get employee ID by User ID
const getEmployeeId = async (userId) => {
  const { rows } = await query('SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL', [userId]);
  return rows[0]?.id || null;
};

// Helper to convert data rows to CSV
const convertToCSV = (columns, rows) => {
  const headers = columns.map(col => col.header);
  const keys = columns.map(col => col.key);
  
  const csvHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const csvRows = rows.map(row => {
    return keys.map(key => {
      let val = row[key];
      if (val instanceof Date) {
        val = format(val, 'yyyy-MM-dd HH:mm:ss');
      } else if (val === null || val === undefined) {
        val = '';
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\r\n');
};

class ReportService {
  /**
   * Helper to apply Manager role scope filtering
   */
  async applyScopeFilters(user, sqlFilters, params, employeeJoinAlias = 'e') {
    if (user.role_name === 'manager') {
      const managerEmployeeId = await getEmployeeId(user.id);
      if (!managerEmployeeId) {
        // Manager doesn't have an employee profile, restrict results to none
        sqlFilters.push(`1=0`);
      } else {
        // Manager can see their own records or direct reports' records
        params.push(managerEmployeeId);
        sqlFilters.push(`(${employeeJoinAlias}.manager_id = $${params.length} OR ${employeeJoinAlias}.id = $${params.length})`);
      }
    }
  }

  /**
   * Fetch leave report data based on filters
   */
  async getLeaveReportData(filters, user) {
    const sqlFilters = [];
    const params = [];

    if (filters.departmentId) {
      params.push(filters.departmentId);
      sqlFilters.push(`e.department_id = $${params.length}`);
    }

    if (filters.employeeId) {
      params.push(filters.employeeId);
      sqlFilters.push(`lr.employee_id = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      sqlFilters.push(`lr.status = $${params.length}`);
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      sqlFilters.push(`lr.start_date >= $${params.length}`);
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      sqlFilters.push(`lr.end_date <= $${params.length}`);
    }

    await this.applyScopeFilters(user, sqlFilters, params, 'e');

    const filterClause = sqlFilters.length > 0 ? 'WHERE ' + sqlFilters.join(' AND ') : '';

    const sql = `
      SELECT 
        e.employee_code,
        e.first_name || ' ' || e.last_name AS employee_name,
        d.name AS department_name,
        lt.name AS leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.status,
        lr.created_at AS applied_at,
        lr.reason,
        m.first_name || ' ' || m.last_name AS manager_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN employees m ON e.manager_id = m.id
      ${filterClause}
      ORDER BY lr.created_at DESC
    `;

    const { rows } = await query(sql, params);
    return rows;
  }

  /**
   * Fetch attendance report data based on filters
   */
  async getAttendanceReportData(filters, user) {
    const sqlFilters = [];
    const params = [];

    if (filters.departmentId) {
      params.push(filters.departmentId);
      sqlFilters.push(`e.department_id = $${params.length}`);
    }

    if (filters.employeeId) {
      params.push(filters.employeeId);
      sqlFilters.push(`a.employee_id = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      sqlFilters.push(`a.status = $${params.length}`);
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      sqlFilters.push(`a.date >= $${params.length}`);
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      sqlFilters.push(`a.date <= $${params.length}`);
    }

    await this.applyScopeFilters(user, sqlFilters, params, 'e');

    const filterClause = sqlFilters.length > 0 ? 'WHERE ' + sqlFilters.join(' AND ') : '';

    const sql = `
      SELECT 
        e.employee_code,
        e.first_name || ' ' || e.last_name AS employee_name,
        d.name AS department_name,
        a.date,
        a.clock_in,
        a.clock_out,
        a.work_hours,
        a.status
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${filterClause}
      ORDER BY a.date DESC, e.last_name ASC, e.first_name ASC
    `;

    const { rows } = await query(sql, params);
    return rows;
  }

  /**
   * Fetch assets report data based on filters
   */
  async getAssetReportData(filters, user) {
    const sqlFilters = [];
    const params = [];

    if (filters.assetType) {
      params.push(filters.assetType);
      sqlFilters.push(`a.asset_type = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      sqlFilters.push(`a.status = $${params.length}`);
    }

    if (filters.employeeId) {
      params.push(filters.employeeId);
      sqlFilters.push(`al.employee_id = $${params.length}`);
    }

    // Asset assignments scope checking: Managers can see assets allocated to team
    if (user.role_name === 'manager') {
      const managerEmployeeId = await getEmployeeId(user.id);
      if (!managerEmployeeId) {
        sqlFilters.push(`1=0`);
      } else {
        params.push(managerEmployeeId);
        sqlFilters.push(`(e.manager_id = $${params.length} OR e.id = $${params.length})`);
      }
    }

    const filterClause = sqlFilters.length > 0 ? 'WHERE ' + sqlFilters.join(' AND ') : '';

    const sql = `
      SELECT 
        a.name AS asset_name,
        a.serial_number,
        a.asset_type,
        a.status AS asset_status,
        e.employee_code AS allocated_to_code,
        e.first_name || ' ' || e.last_name AS allocated_to_name,
        al.allocated_at,
        al.notes
      FROM assets a
      LEFT JOIN asset_allocations al ON a.id = al.asset_id AND al.returned_at IS NULL
      LEFT JOIN employees e ON al.employee_id = e.id
      ${filterClause}
      ORDER BY a.name ASC
    `;

    const { rows } = await query(sql, params);
    return rows;
  }

  /**
   * Generate native Excel report buffer using exceljs
   */
  async generateExcel(title, columns, rows) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title.substring(0, 31)); // excel sheet title limit is 31 chars

    // Title Row
    worksheet.mergeCells('A1', String.fromCharCode(65 + columns.length - 1) + '1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1A365D' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // Subheader Row (Metadata)
    worksheet.mergeCells('A2', String.fromCharCode(65 + columns.length - 1) + '2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} | Total Records: ${rows.length}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '718096' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]); // Blank spacer row

    // Setup Columns
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 15
    }));

    // Header Row styling
    const headerRow = worksheet.getRow(4);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2C3E50' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: '1A252F' } }
      };
    });

    // Add data rows & styling
    rows.forEach((rowData, idx) => {
      const formattedRow = {};
      columns.forEach(col => {
        let val = rowData[col.key];
        if (val instanceof Date) {
          formattedRow[col.key] = format(val, col.dateFormat || 'yyyy-MM-dd');
        } else if (val === null || val === undefined) {
          formattedRow[col.key] = '-';
        } else {
          formattedRow[col.key] = val;
        }
      });

      const row = worksheet.addRow(formattedRow);
      row.height = 22;
      
      // Zebra striping
      const isEven = idx % 2 === 0;
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
        if (!isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F7FAFC' }
          };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Generate premium custom branded PDF using pdfkit
   */
  async generatePDF(res, title, columns, rows, filterSummary = {}) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape', // Landscape is better for reports with multiple columns
        margin: 40,
        bufferPages: true
      });

      // Stream PDF directly to response
      doc.pipe(res);

      const drawHeader = () => {
        // Primary deep navy band
        doc.rect(40, 40, 762, 50).fill('#1A365D');

        // Brand logo/text
        doc.fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .fontSize(18)
           .text('PeopleFlow Enterprise', 55, 50);

        doc.font('Helvetica')
           .fontSize(10)
           .text('Human Resource Management Suite', 55, 70);

        // Report Title
        doc.font('Helvetica-Bold')
           .fontSize(16)
           .text(title.toUpperCase(), 40, 110, { align: 'left' });

        // Metadata box
        doc.rect(40, 135, 762, 40).fill('#F7FAFC');
        doc.rect(40, 135, 762, 40).stroke('#E2E8F0');

        doc.fillColor('#4A5568')
           .font('Helvetica')
           .fontSize(9);

        // Print active filters
        const filterStr = Object.entries(filterSummary)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ') || 'None';

        doc.text(`Active Filters: ${filterStr}`, 50, 145);
        doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} | Total Records: ${rows.length}`, 50, 160);
      };

      drawHeader();

      // Print Table headers
      const tableTop = 195;
      const colWidths = columns.map(c => c.width ? c.width * 5.5 : 100); // Scale widths for PDF
      
      const drawTableHeaders = (y) => {
        doc.rect(40, y, 762, 22).fill('#2D3748');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
        
        let currentX = 45;
        columns.forEach((col, idx) => {
          doc.text(col.header, currentX, y + 6, {
            width: colWidths[idx] - 10,
            ellipsis: true
          });
          currentX += colWidths[idx];
        });
      };

      drawTableHeaders(tableTop);

      let currentY = tableTop + 22;
      const rowHeight = 22;

      rows.forEach((row, rowIndex) => {
        // Check page overflow
        if (currentY + rowHeight > 530) {
          doc.addPage();
          drawHeader();
          drawTableHeaders(195);
          currentY = 195 + 22;
        }

        // Draw background zebra color
        if (rowIndex % 2 === 1) {
          doc.rect(40, currentY, 762, rowHeight).fill('#F7FAFC');
        }

        // Draw bottom border line
        doc.rect(40, currentY + rowHeight - 1, 762, 1).fill('#E2E8F0');

        // Draw row cells
        doc.fillColor('#2D3748').font('Helvetica').fontSize(8.5);
        let currentX = 45;
        
        columns.forEach((col, colIdx) => {
          let val = row[col.key];
          if (val instanceof Date) {
            val = format(val, col.dateFormat || 'yyyy-MM-dd');
          } else if (val === null || val === undefined) {
            val = '-';
          } else {
            val = String(val);
          }

          doc.text(val, currentX, currentY + 6, {
            width: colWidths[colIdx] - 10,
            ellipsis: true
          });
          currentX += colWidths[colIdx];
        });

        currentY += rowHeight;
      });

      // Double-pass to draw footers with correct page numbers
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        // Draw page footer
        doc.rect(40, 550, 762, 1).fill('#CBD5E0');
        doc.fillColor('#718096')
           .font('Helvetica')
           .fontSize(8)
           .text('Confidential - Internal HR Use Only', 40, 560)
           .text(`Page ${i + 1} of ${range.count}`, 730, 560, { align: 'right' });
      }

      doc.end();
      resolve();
    });
  }
}

module.exports = new ReportService();
