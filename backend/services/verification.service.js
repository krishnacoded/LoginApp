const { query } = require('../config/database');

const createRequest = async (type, employeeId, data) => {
  if (type === 'skill') {
    const { skillId, proficiencyLevel, yearsExperience, isPrimary, proofUrl } = data;
    // Check if duplicate pending or verified skill exists
    const { rows: existing } = await query(
      'SELECT id, status FROM employee_skills WHERE employee_id = $1 AND skill_id = $2',
      [employeeId, skillId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'Pending Verification') {
        throw { statusCode: 400, message: 'A verification request for this skill is already pending' };
      }
      // Update existing verified skill to pending with new levels
      const { rows } = await query(
        `UPDATE employee_skills 
         SET proficiency_level = $1, years_experience = $2, is_primary = $3, 
             proof_url = $4, status = 'Pending Verification', rejection_reason = NULL,
             updated_at = NOW()
         WHERE employee_id = $5 AND skill_id = $6 RETURNING *`,
        [proficiencyLevel || 3, yearsExperience || 0, isPrimary || false, proofUrl || null, employeeId, skillId]
      );
      return rows[0];
    }

    // Insert new pending skill
    const { rows } = await query(
      `INSERT INTO employee_skills (employee_id, skill_id, proficiency_level, years_experience, is_primary, proof_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending Verification') RETURNING *`,
      [employeeId, skillId, proficiencyLevel || 3, yearsExperience || 0, isPrimary || false, proofUrl || null]
    );
    return rows[0];

  } else if (type === 'certification') {
    const { name, issuingOrganization, issueDate, expiryDate, credentialId, credentialUrl, proofUrl } = data;
    const { rows } = await query(
      `INSERT INTO employee_certifications 
        (employee_id, name, issuing_organization, issue_date, expiry_date, credential_id, credential_url, proof_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending Verification') RETURNING *`,
      [employeeId, name, issuingOrganization, issueDate || null, expiryDate || null, credentialId || null, credentialUrl || null, proofUrl || null]
    );
    return rows[0];

  } else if (type === 'education') {
    const { institution, degree, fieldOfStudy, startDate, endDate, grade, proofUrl } = data;
    const { rows } = await query(
      `INSERT INTO employee_education 
        (employee_id, institution, degree, field_of_study, start_date, end_date, grade, proof_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending Verification') RETURNING *`,
      [employeeId, institution, degree, fieldOfStudy || null, startDate || null, endDate || null, grade || null, proofUrl || null]
    );
    return rows[0];

  } else if (type === 'license') {
    const { name, licenseNumber, issuingState, issueDate, expiryDate, proofUrl } = data;
    const { rows } = await query(
      `INSERT INTO employee_licenses 
        (employee_id, name, license_number, issuing_state, issue_date, expiry_date, proof_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending Verification') RETURNING *`,
      [employeeId, name, licenseNumber || null, issuingState || null, issueDate || null, expiryDate || null, proofUrl || null]
    );
    return rows[0];
  }

  throw { statusCode: 400, message: 'Invalid verification type' };
};

const getPendingRequests = async (managerEmployeeId = null) => {
  let queryParams = [];
  let filterSql = '';

  if (managerEmployeeId) {
    // Managers only review their direct reports
    filterSql = ' WHERE e.manager_id = $1';
    queryParams.push(managerEmployeeId);
  }

  // Fetch pending skills
  const { rows: skills } = await query(
    `SELECT es.id, 'skill' as type, es.employee_id, es.created_at, es.proof_url,
            e.first_name || ' ' || e.last_name as employee_name, e.employee_code,
            s.name as credential_name,
            json_build_object('proficiency_level', es.proficiency_level, 'years_experience', es.years_experience) as metadata
     FROM employee_skills es
     JOIN employees e ON es.employee_id = e.id
     JOIN skills s ON es.skill_id = s.id
     WHERE es.status = 'Pending Verification' ${managerEmployeeId ? ' AND e.manager_id = $1' : ''}`,
    queryParams
  );

  // Fetch pending certifications
  const { rows: certifications } = await query(
    `SELECT ec.id, 'certification' as type, ec.employee_id, ec.created_at, ec.proof_url,
            e.first_name || ' ' || e.last_name as employee_name, e.employee_code,
            ec.name as credential_name,
            json_build_object('issuing_organization', ec.issuing_organization, 'issue_date', ec.issue_date, 'expiry_date', ec.expiry_date) as metadata
     FROM employee_certifications ec
     JOIN employees e ON ec.employee_id = e.id
     WHERE ec.status = 'Pending Verification' ${managerEmployeeId ? ' AND e.manager_id = $1' : ''}`,
    queryParams
  );

  // Fetch pending education
  const { rows: education } = await query(
    `SELECT ed.id, 'education' as type, ed.employee_id, ed.created_at, ed.proof_url,
            e.first_name || ' ' || e.last_name as employee_name, e.employee_code,
            ed.degree || ' in ' || ed.field_of_study as credential_name,
            json_build_object('institution', ed.institution, 'grade', ed.grade, 'end_date', ed.end_date) as metadata
     FROM employee_education ed
     JOIN employees e ON ed.employee_id = e.id
     WHERE ed.status = 'Pending Verification' ${managerEmployeeId ? ' AND e.manager_id = $1' : ''}`,
    queryParams
  );

  // Fetch pending licenses
  const { rows: licenses } = await query(
    `SELECT el.id, 'license' as type, el.employee_id, el.created_at, el.proof_url,
            e.first_name || ' ' || e.last_name as employee_name, e.employee_code,
            el.name as credential_name,
            json_build_object('license_number', el.license_number, 'issuing_state', el.issuing_state, 'expiry_date', el.expiry_date) as metadata
     FROM employee_licenses el
     JOIN employees e ON el.employee_id = e.id
     WHERE el.status = 'Pending Verification' ${managerEmployeeId ? ' AND e.manager_id = $1' : ''}`,
    queryParams
  );

  // Combine and sort by date descending
  return [...skills, ...certifications, ...education, ...licenses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const actionRequest = async (type, id, action, reviewerUserId, comment = null) => {
  const status = action === 'approve' ? 'Verified' : 'Rejected';
  let table = '';

  if (type === 'skill') table = 'employee_skills';
  else if (type === 'certification') table = 'employee_certifications';
  else if (type === 'education') table = 'employee_education';
  else if (type === 'license') table = 'employee_licenses';
  else throw { statusCode: 400, message: 'Invalid verification type' };

  // Fetch the record to notify
  const { rows: records } = await query(`SELECT employee_id FROM ${table} WHERE id = $1`, [id]);
  if (records.length === 0) throw { statusCode: 404, message: 'Verification record not found' };
  const employeeId = records[0].employee_id;

  // Update status
  const { rows } = await query(
    `UPDATE ${table} 
     SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [status, comment || null, reviewerUserId, id]
  );

  // Send notification to employee
  try {
    const { rows: empUser } = await query('SELECT user_id FROM employees WHERE id = $1', [employeeId]);
    if (empUser.length > 0 && empUser[0].user_id) {
      const notificationService = require('./notification.service');
      const title = `Verification Request ${status}`;
      const message = `Your request to add or update a ${type} has been ${status.toLowerCase()}${comment ? `: "${comment}"` : '.'}`;
      await notificationService.create(empUser[0].user_id, 'verification_update', title, message, { type, id }, `/profile`);
    }
  } catch (err) {
    console.error('Error creating verification notification:', err);
  }

  return rows[0];
};

module.exports = { createRequest, getPendingRequests, actionRequest };
