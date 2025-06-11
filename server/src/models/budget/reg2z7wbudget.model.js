import pool from "../../config/db.js";
import fs from 'fs';

export class Reg2z7wBudgetModel {
  // Initialize tables if they don't exist
  static async initTable() {
    try {
      // Check if master table exists
      const masterTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'reg2z7w_budget_master'
        );
      `);
      
      // If table doesn't exist, create all required tables
      if (!masterTableCheck.rows[0].exists) {
        await pool.query(`
          CREATE TABLE reg2z7w_budget_master (
            id SERIAL PRIMARY KEY,
            total_budget DECIMAL(15, 2) NOT NULL,
            current_remaining DECIMAL(15, 2) NOT NULL,
            total_termin1 DECIMAL(15, 2) DEFAULT 0,
            total_termin2 DECIMAL(15, 2) DEFAULT 0,
            total_termin3 DECIMAL(15, 2) DEFAULT 0,
            total_termin4 DECIMAL(15, 2) DEFAULT 0,
            total_termin5 DECIMAL(15, 2) DEFAULT 0,
            total_termin6 DECIMAL(15, 2) DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Active',
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS reg2z7w_budget_project (
            id SERIAL PRIMARY KEY,
            project_name VARCHAR(255) NOT NULL,
            total_budget DECIMAL(15, 2) NOT NULL,
            termin1 DECIMAL(15, 2) DEFAULT 0,
            termin2 DECIMAL(15, 2) DEFAULT 0,
            termin3 DECIMAL(15, 2) DEFAULT 0,
            termin4 DECIMAL(15, 2) DEFAULT 0,
            termin5 DECIMAL(15, 2) DEFAULT 0,
            termin6 DECIMAL(15, 2) DEFAULT 0,
            total_actualization DECIMAL(15, 2) DEFAULT 0,
            budget_remaining DECIMAL(15, 2) NOT NULL,
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS reg2z7w_budget_history (
            id SERIAL PRIMARY KEY,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INT NOT NULL,
            field_changed VARCHAR(50),
            old_value TEXT,
            new_value TEXT,
            changed_by VARCHAR(100),
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_reg2z7w_budget_project_name ON reg2z7w_budget_project(project_name);
        `);
        console.log('Reg2Z7W Budget tables created successfully');
      }
    } catch (error) {
      console.error('Error initializing reg2z7w_budget tables:', error);
      throw error;
    }
  }

  // Create or update master budget
  static async createOrUpdateMaster(budgetData, username = 'system') {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Check if master budget already exists
        const checkQuery = `SELECT * FROM reg2z7w_budget_master`;
        const checkResult = await client.query(checkQuery);
        
        let result;
        
        if (checkResult.rows.length === 0) {
          // Create new master budget
          const insertQuery = `
            INSERT INTO reg2z7w_budget_master (
              total_budget, current_remaining, total_termin1, total_termin2, total_termin3, 
              total_termin4, total_termin5, total_termin6, status, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
          `;
          
          const values = [
            budgetData.total_budget,
            budgetData.current_remaining || budgetData.total_budget,
            budgetData.total_termin1 || 0,
            budgetData.total_termin2 || 0,
            budgetData.total_termin3 || 0,
            budgetData.total_termin4 || 0,
            budgetData.total_termin5 || 0,
            budgetData.total_termin6 || 0,
            budgetData.status || 'Active',
            budgetData.remarks || null
          ];
          
          result = await client.query(insertQuery, values);
        } else {
          // Update existing master budget
          const existingBudget = checkResult.rows[0];
          const oldTotalBudget = parseFloat(existingBudget.total_budget);
          const newTotalBudget = parseFloat(budgetData.total_budget);
          
          const updateQuery = `
            UPDATE reg2z7w_budget_master SET
              total_budget = $1,
              current_remaining = $2,
              total_termin1 = $3,
              total_termin2 = $4,
              total_termin3 = $5,
              total_termin4 = $6,
              total_termin5 = $7,
              total_termin6 = $8,
              status = $9,
              remarks = $10,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
            RETURNING *
          `;
          
          const values = [
            newTotalBudget,
            budgetData.current_remaining || newTotalBudget,
            budgetData.total_termin1 || existingBudget.total_termin1,
            budgetData.total_termin2 || existingBudget.total_termin2,
            budgetData.total_termin3 || existingBudget.total_termin3,
            budgetData.total_termin4 || existingBudget.total_termin4,
            budgetData.total_termin5 || existingBudget.total_termin5,
            budgetData.total_termin6 || existingBudget.total_termin6,
            budgetData.status || existingBudget.status,
            budgetData.remarks || existingBudget.remarks,
            existingBudget.id
          ];
          
          result = await client.query(updateQuery, values);
          
          // Record history
          if (oldTotalBudget !== newTotalBudget) {
            await client.query(`
              INSERT INTO reg2z7w_budget_history (
                entity_type, entity_id, field_changed, old_value, new_value, changed_by
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              'master',
              existingBudget.id,
              'total_budget',
              oldTotalBudget,
              newTotalBudget,
              username
            ]);
          }
        }
        
        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating/updating master budget:', error);
      throw error;
    }
  }

  // Add or update project budget
  static async addOrUpdateProject(projectData, username = 'system') {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Calculate total actualization and budget remaining
        const termin1 = parseFloat(projectData.termin1 || 0);
        const termin2 = parseFloat(projectData.termin2 || 0);
        const termin3 = parseFloat(projectData.termin3 || 0);
        const termin4 = parseFloat(projectData.termin4 || 0);
        const termin5 = parseFloat(projectData.termin5 || 0);
        const termin6 = parseFloat(projectData.termin6 || 0);
        const totalBudget = parseFloat(projectData.total_budget || 0);
        
        const totalActualization = termin1 + termin2 + termin3 + termin4 + termin5 + termin6;
        const budgetRemaining = totalBudget - totalActualization;
        
        // Check if project already exists
        const projectCheckQuery = `
          SELECT * FROM reg2z7w_budget_project WHERE ${projectData.id ? 'id = $1' : 'project_name = $1'}
        `;
        const projectCheckResult = await client.query(
          projectCheckQuery, 
          [projectData.id || projectData.project_name]
        );
        
        let result;
        
        if (projectCheckResult.rows.length === 0) {
          // Insert new project
          const insertQuery = `
            INSERT INTO reg2z7w_budget_project (
              project_name, total_budget, termin1, termin2, termin3, termin4, termin5, termin6, 
              total_actualization, budget_remaining, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `;
          
          const values = [
            projectData.project_name,
            totalBudget,
            termin1,
            termin2,
            termin3,
            termin4,
            termin5,
            termin6,
            totalActualization,
            budgetRemaining,
            projectData.remarks || null
          ];
          
          result = await client.query(insertQuery, values);
        } else {
          // Update existing project
          const existingProject = projectCheckResult.rows[0];
          
          const updateQuery = `
            UPDATE reg2z7w_budget_project SET
              project_name = $1,
              total_budget = $2,
              termin1 = $3,
              termin2 = $4,
              termin3 = $5,
              termin4 = $6,
              termin5 = $7,
              termin6 = $8,
              total_actualization = $9,
              budget_remaining = $10,
              remarks = $11,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *
          `;
          
          const values = [
            projectData.project_name,
            totalBudget,
            termin1,
            termin2,
            termin3,
            termin4,
            termin5,
            termin6,
            totalActualization,
            budgetRemaining,
            projectData.remarks || existingProject.remarks,
            existingProject.id
          ];
          
          result = await client.query(updateQuery, values);
          
          // Record history for significant changes
          if (parseFloat(existingProject.total_budget) !== totalBudget) {
            await client.query(`
              INSERT INTO reg2z7w_budget_history (
                entity_type, entity_id, field_changed, old_value, new_value, changed_by
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              'project',
              existingProject.id,
              'total_budget',
              existingProject.total_budget,
              totalBudget,
              username
            ]);
          }
        }
        
        // Update master budget with recalculated totals
        await this.updateMasterBudgetTotals(client);
        
        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error adding/updating project budget:', error);
      throw error;
    }
  }

  // Update master budget totals based on all projects
  static async updateMasterBudgetTotals(client) {
    // Get totals from all projects
    const projectsQuery = `
      SELECT 
        SUM(total_budget) as total_budget,
        SUM(termin1) as total_termin1,
        SUM(termin2) as total_termin2,
        SUM(termin3) as total_termin3,
        SUM(termin4) as total_termin4,
        SUM(termin5) as total_termin5,
        SUM(termin6) as total_termin6,
        SUM(total_actualization) as total_actualization,
        SUM(budget_remaining) as total_remaining
      FROM reg2z7w_budget_project
    `;
    
    const projectsResult = await client.query(projectsQuery);
    const totals = projectsResult.rows[0];
    
    // Get master budget
    const masterQuery = `SELECT * FROM reg2z7w_budget_master`;
    const masterResult = await client.query(masterQuery);
    
    if (masterResult.rows.length === 0) {
      // Create master budget if it doesn't exist
      await client.query(`
        INSERT INTO reg2z7w_budget_master (
          total_budget, current_remaining, total_termin1, total_termin2, 
          total_termin3, total_termin4, total_termin5, total_termin6, status, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        totals.total_budget || 0,
        totals.total_remaining || 0,
        totals.total_termin1 || 0,
        totals.total_termin2 || 0,
        totals.total_termin3 || 0,
        totals.total_termin4 || 0,
        totals.total_termin5 || 0,
        totals.total_termin6 || 0,
        'Active',
        'Automatically calculated from projects'
      ]);
    } else {
      // Update existing master budget
      await client.query(`
        UPDATE reg2z7w_budget_master SET
          total_budget = $1,
          current_remaining = $2,
          total_termin1 = $3,
          total_termin2 = $4,
          total_termin3 = $5,
          total_termin4 = $6,
          total_termin5 = $7,
          total_termin6 = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `, [
        totals.total_budget || 0,
        totals.total_remaining || 0,
        totals.total_termin1 || 0,
        totals.total_termin2 || 0,
        totals.total_termin3 || 0,
        totals.total_termin4 || 0,
        totals.total_termin5 || 0,
        totals.total_termin6 || 0,
        masterResult.rows[0].id
      ]);
    }
  }

  // Get master budget
  static async getMasterBudget() {
    try {
      const query = `SELECT * FROM reg2z7w_budget_master`;
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting master budget:', error);
      throw error;
    }
  }

  // Get all projects with optional filtering
  static async getAllProjects(filters = {}, page = 1, limit = 50) {
    try {
      let query = `SELECT * FROM reg2z7w_budget_project WHERE 1=1`;
      const values = [];
      let paramCount = 1;
      
      // Apply filters if provided
      if (filters.project_name) {
        query += ` AND project_name ILIKE $${paramCount}`;
        values.push(`%${filters.project_name}%`);
        paramCount++;
      }
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);
      
      const result = await pool.query(query, values);
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) FROM reg2z7w_budget_project WHERE 1=1`;
      let countValues = [];
      let countParamIndex = 1;
      
      if (filters.project_name) {
        countQuery += ` AND project_name ILIKE $${countParamIndex}`;
        countValues.push(`%${filters.project_name}%`);
        countParamIndex++;
      }
      
      const countResult = await pool.query(countQuery, countValues);
      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: result.rows,
        pagination: {
          total: totalCount,
          page: page,
          limit: limit,
          totalPages: totalPages
        }
      };
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  // Delete project
  static async deleteProject(id, username = 'system') {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get the project to be deleted
        const projectQuery = `SELECT * FROM reg2z7w_budget_project WHERE id = $1`;
        const projectResult = await client.query(projectQuery, [id]);
        
        if (projectResult.rows.length === 0) {
          throw new Error(`Project with ID ${id} not found`);
        }
        
        const project = projectResult.rows[0];
        
        // Delete the project
        const deleteQuery = `DELETE FROM reg2z7w_budget_project WHERE id = $1 RETURNING *`;
        const deleteResult = await client.query(deleteQuery, [id]);
        
        // Record deletion in history
        await client.query(`
          INSERT INTO reg2z7w_budget_history (
            entity_type, entity_id, field_changed, old_value, new_value, changed_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'project',
          id,
          'delete',
          JSON.stringify(project),
          null,
          username
        ]);
        
        // Update master budget totals
        await this.updateMasterBudgetTotals(client);
        
        await client.query('COMMIT');
        
        return {
          deleted: deleteResult.rows[0]
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error deleting project with ID ${id}:`, error);
      throw error;
    }
  }

  // Get budget history
  static async getBudgetHistory() {
    try {
      const query = `
        SELECT * FROM reg2z7w_budget_history 
        ORDER BY changed_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting budget history:', error);
      throw error;
    }
  }

  // Get unique project names for filters
  static async getFilterOptions() {
    try {
      const projectNameQuery = `SELECT DISTINCT project_name FROM reg2z7w_budget_project ORDER BY project_name`;
      const projectNames = await pool.query(projectNameQuery);
      
      return {
        project_names: projectNames.rows.map(row => row.project_name)
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      throw error;
    }
  }

  // Get budget summary
  static async getBudgetSummary() {
    try {
      // Get master budget
      const masterQuery = `SELECT * FROM reg2z7w_budget_master`;
      const masterResult = await pool.query(masterQuery);
      
      // Get all projects
      const projectsQuery = `SELECT * FROM reg2z7w_budget_project ORDER BY created_at`;
      const projectsResult = await pool.query(projectsQuery);
      
      const master = masterResult.rows.length > 0 ? masterResult.rows[0] : null;
      const projects = projectsResult.rows;
      
      // Calculate totals if master doesn't exist yet
      let summary = {
        total_budget: 0,
        total_termin1: 0,
        total_termin2: 0,
        total_termin3: 0,
        total_termin4: 0,
        total_termin5: 0,
        total_termin6: 0,
        total_actualization: 0,
        current_remaining: 0
      };
      
      if (master) {
        summary = {
          total_budget: parseFloat(master.total_budget) || 0,
          total_termin1: parseFloat(master.total_termin1) || 0,
          total_termin2: parseFloat(master.total_termin2) || 0,
          total_termin3: parseFloat(master.total_termin3) || 0,
          total_termin4: parseFloat(master.total_termin4) || 0,
          total_termin5: parseFloat(master.total_termin5) || 0,
          total_termin6: parseFloat(master.total_termin6) || 0,
          total_actualization: 
            parseFloat(master.total_termin1 || 0) + 
            parseFloat(master.total_termin2 || 0) + 
            parseFloat(master.total_termin3 || 0) + 
            parseFloat(master.total_termin4 || 0) +
            parseFloat(master.total_termin5 || 0) +
            parseFloat(master.total_termin6 || 0),
          current_remaining: parseFloat(master.current_remaining) || 0
        };
      } else if (projects.length > 0) {
        // Calculate from projects if master doesn't exist
        projects.forEach(project => {
          summary.total_budget += parseFloat(project.total_budget) || 0;
          summary.total_termin1 += parseFloat(project.termin1) || 0;
          summary.total_termin2 += parseFloat(project.termin2) || 0;
          summary.total_termin3 += parseFloat(project.termin3) || 0;
          summary.total_termin4 += parseFloat(project.termin4) || 0;
          summary.total_termin5 += parseFloat(project.termin5) || 0;
          summary.total_termin6 += parseFloat(project.termin6) || 0;
          summary.current_remaining += parseFloat(project.budget_remaining) || 0;
        });
        
        summary.total_actualization = 
          summary.total_termin1 + 
          summary.total_termin2 + 
          summary.total_termin3 + 
          summary.total_termin4 +
          summary.total_termin5 +
          summary.total_termin6;
      }
      
      return {
        master,
        projects,
        summary
      };
    } catch (error) {
      console.error('Error getting budget summary:', error);
      throw error;
    }
  }

  // Import data from Excel
  static async importFromExcel(data, username = 'system') {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        let projectsCount = 0;
        
        // Process each row as a project
        for (const row of data) {
          if (!row.project_name || !row.total_budget) {
            continue; // Skip invalid rows
          }
          
          const termin1 = parseFloat(row.termin1 || 0);
          const termin2 = parseFloat(row.termin2 || 0);
          const termin3 = parseFloat(row.termin3 || 0);
          const termin4 = parseFloat(row.termin4 || 0);
          const termin5 = parseFloat(row.termin5 || 0);
          const termin6 = parseFloat(row.termin6 || 0);
          const totalBudget = parseFloat(row.total_budget);
          
          const totalActualization = termin1 + termin2 + termin3 + termin4 + termin5 + termin6;
          const budgetRemaining = totalBudget - totalActualization;
          
          // Check if project already exists
          const projectCheckQuery = `
            SELECT * FROM reg2z7w_budget_project WHERE project_name = $1
          `;
          const projectCheckResult = await client.query(projectCheckQuery, [row.project_name]);
          
          if (projectCheckResult.rows.length === 0) {
            // Insert new project
            await client.query(`
              INSERT INTO reg2z7w_budget_project (
                project_name, total_budget, termin1, termin2, termin3, termin4, termin5, termin6,
                total_actualization, budget_remaining, remarks
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              row.project_name,
              totalBudget,
              termin1,
              termin2,
              termin3,
              termin4,
              termin5,
              termin6,
              totalActualization,
              budgetRemaining,
              row.remarks || null
            ]);
          } else {
            // Update existing project
            const existingProject = projectCheckResult.rows[0];
            
            await client.query(`
              UPDATE reg2z7w_budget_project SET
                total_budget = $1,
                termin1 = $2,
                termin2 = $3,
                termin3 = $4,
                termin4 = $5,
                termin5 = $6,
                termin6 = $7,
                total_actualization = $8,
                budget_remaining = $9,
                remarks = $10,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $11
            `, [
              totalBudget,
              termin1,
              termin2,
              termin3,
              termin4,
              termin5,
              termin6,
              totalActualization,
              budgetRemaining,
              row.remarks || existingProject.remarks,
              existingProject.id
            ]);
            
            // Record history
            if (parseFloat(existingProject.total_budget) !== totalBudget) {
              await client.query(`
                INSERT INTO reg2z7w_budget_history (
                  entity_type, entity_id, field_changed, old_value, new_value, changed_by
                ) VALUES ($1, $2, $3, $4, $5, $6)
              `, [
                'project',
                existingProject.id,
                'total_budget',
                existingProject.total_budget,
                totalBudget,
                username
              ]);
            }
          }
          
          projectsCount++;
        }
        
        // Update master budget with recalculated totals
        await this.updateMasterBudgetTotals(client);
        
        await client.query('COMMIT');
        
        return { 
          success: true, 
          count: projectsCount,
          message: 'Budget data imported successfully'
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error importing data from Excel:', error);
      throw error;
    }
  }
}

export default Reg2z7wBudgetModel;