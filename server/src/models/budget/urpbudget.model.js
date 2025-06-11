import pool from "../../config/db.js";
import fs from 'fs';

export class URPBudgetModel {
  // Initialize tables if they don't exist
  static async initTable() {
    try {
      // Check if master table exists
      const masterTableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'urp_budget_master'
        );
      `);
      
      // If table doesn't exist, create all required tables
      if (!masterTableCheck.rows[0].exists) {
        await pool.query(`
          CREATE TABLE urp_budget_master (
            id SERIAL PRIMARY KEY,
            total_budget DECIMAL(15, 2) NOT NULL,
            current_remaining DECIMAL(15, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS urp_budget_absorption (
            id SERIAL PRIMARY KEY,
            period VARCHAR(100) NOT NULL,
            absorption_amount DECIMAL(15, 2) NOT NULL,
            remaining_after DECIMAL(15, 2) NOT NULL,
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS urp_budget_history (
            id SERIAL PRIMARY KEY,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INT NOT NULL,
            field_changed VARCHAR(50),
            old_value TEXT,
            new_value TEXT,
            changed_by VARCHAR(100),
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_urp_budget_absorption_period ON urp_budget_absorption(period);
        `);
        console.log('URP Budget tables created successfully');
      }
    } catch (error) {
      console.error('Error initializing urp_budget tables:', error);
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
        const checkQuery = `SELECT * FROM urp_budget_master`;
        const checkResult = await client.query(checkQuery);
        
        let result;
        
        if (checkResult.rows.length === 0) {
          // Create new master budget
          const insertQuery = `
            INSERT INTO urp_budget_master (
              total_budget, current_remaining, status, remarks
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
          
          const values = [
            budgetData.total_budget,
            budgetData.total_budget, // Initially, remaining equals total
            budgetData.status || 'Active',
            budgetData.remarks || null
          ];
          
          result = await client.query(insertQuery, values);
        } else {
          // Update existing master budget
          const existingBudget = checkResult.rows[0];
          const oldTotalBudget = parseFloat(existingBudget.total_budget);
          const newTotalBudget = parseFloat(budgetData.total_budget);
          
          // Calculate adjustment to remaining budget
          const budgetDifference = newTotalBudget - oldTotalBudget;
          const newRemaining = parseFloat(existingBudget.current_remaining) + budgetDifference;
          
          const updateQuery = `
            UPDATE urp_budget_master SET
              total_budget = $1,
              current_remaining = $2,
              status = $3,
              remarks = $4,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
          `;
          
          const values = [
            newTotalBudget,
            newRemaining,
            budgetData.status || existingBudget.status,
            budgetData.remarks || existingBudget.remarks,
            existingBudget.id
          ];
          
          result = await client.query(updateQuery, values);
          
          // Record history
          if (oldTotalBudget !== newTotalBudget) {
            await client.query(`
              INSERT INTO urp_budget_history (
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

  // Add period absorption
  static async addPeriodAbsorption(absorptionData, username = 'system') {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get current master budget
        const masterQuery = `SELECT * FROM urp_budget_master`;
        const masterResult = await client.query(masterQuery);
        
        if (masterResult.rows.length === 0) {
          throw new Error('Master budget not found');
        }
        
        const masterBudget = masterResult.rows[0];
        const currentRemaining = parseFloat(masterBudget.current_remaining);
        const absorptionAmount = parseFloat(absorptionData.absorption_amount);
        
        // Calculate new remaining
        const newRemaining = currentRemaining - absorptionAmount;
        
        // Check if period already exists
        const periodCheckQuery = `
          SELECT * FROM urp_budget_absorption WHERE period = $1
        `;
        const periodCheckResult = await client.query(periodCheckQuery, [absorptionData.period]);
        
        let result;
        
        if (periodCheckResult.rows.length === 0) {
          // Insert new period absorption
          const insertQuery = `
            INSERT INTO urp_budget_absorption (
              period, absorption_amount, remaining_after, remarks
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
          
          const values = [
            absorptionData.period,
            absorptionAmount,
            newRemaining,
            absorptionData.remarks || null
          ];
          
          result = await client.query(insertQuery, values);
        } else {
          // Update existing period absorption
          const existingAbsorption = periodCheckResult.rows[0];
          const oldAbsorptionAmount = parseFloat(existingAbsorption.absorption_amount);
          
          // Calculate the difference and adjust master budget remaining
          const absorptionDifference = absorptionAmount - oldAbsorptionAmount;
          
          // Calculate new remaining after the adjustment
          const adjustedRemaining = currentRemaining - absorptionDifference;
          
          const updateQuery = `
            UPDATE urp_budget_absorption SET
              absorption_amount = $1,
              remaining_after = $2,
              remarks = $3,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
          `;
          
          const values = [
            absorptionAmount,
            adjustedRemaining,
            absorptionData.remarks || existingAbsorption.remarks,
            existingAbsorption.id
          ];
          
          result = await client.query(updateQuery, values);
          
          // Record history
          if (oldAbsorptionAmount !== absorptionAmount) {
            await client.query(`
              INSERT INTO urp_budget_history (
                entity_type, entity_id, field_changed, old_value, new_value, changed_by
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              'absorption',
              existingAbsorption.id,
              'absorption_amount',
              oldAbsorptionAmount,
              absorptionAmount,
              username
            ]);
          }
        }
        
        // Update master budget remaining
        await client.query(`
          UPDATE urp_budget_master SET
            current_remaining = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRemaining, masterBudget.id]);
        
        // Update all subsequent period's remaining values
        if (periodCheckResult.rows.length > 0) {
          await client.query(`
            UPDATE urp_budget_absorption
            SET remaining_after = remaining_after - $1
            WHERE created_at > $2
          `, [absorptionDifference, periodCheckResult.rows[0].created_at]);
        }
        
        await client.query('COMMIT');
        
        return {
          absorption: result.rows[0],
          master: {
            ...masterBudget,
            current_remaining: newRemaining
          }
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error adding period absorption:', error);
      throw error;
    }
  }

  // Get master budget
  static async getMasterBudget() {
    try {
      const query = `SELECT * FROM urp_budget_master`;
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

  // Get all period absorptions with optional filtering
  static async getAllAbsorptions(filters = {}, page = 1, limit = 50) {
    try {
      let query = `SELECT * FROM urp_budget_absorption WHERE 1=1`;
      const values = [];
      let paramCount = 1;
      
      // Apply filters if provided
      if (filters.period) {
        query += ` AND period ILIKE $${paramCount}`;
        values.push(`%${filters.period}%`);
        paramCount++;
      }
      
      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);
      
      const result = await pool.query(query, values);
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) FROM urp_budget_absorption WHERE 1=1`;
      let countValues = [];
      let countParamIndex = 1;
      
      if (filters.period) {
        countQuery += ` AND period ILIKE $${countParamIndex}`;
        countValues.push(`%${filters.period}%`);
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
      console.error('Error getting period absorptions:', error);
      throw error;
    }
  }

  // Delete period absorption
  static async deleteAbsorption(id, username = 'system') {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get the absorption to be deleted
        const absorptionQuery = `SELECT * FROM urp_budget_absorption WHERE id = $1`;
        const absorptionResult = await client.query(absorptionQuery, [id]);
        
        if (absorptionResult.rows.length === 0) {
          throw new Error(`Absorption with ID ${id} not found`);
        }
        
        const absorption = absorptionResult.rows[0];
        const absorptionAmount = parseFloat(absorption.absorption_amount);
        
        // Get master budget
        const masterQuery = `SELECT * FROM urp_budget_master`;
        const masterResult = await client.query(masterQuery);
        
        if (masterResult.rows.length === 0) {
          throw new Error('Master budget not found');
        }
        
        const masterBudget = masterResult.rows[0];
        const currentRemaining = parseFloat(masterBudget.current_remaining);
        
        // Calculate new remaining
        const newRemaining = currentRemaining + absorptionAmount;
        
        // Delete the absorption
        const deleteQuery = `DELETE FROM urp_budget_absorption WHERE id = $1 RETURNING *`;
        const deleteResult = await client.query(deleteQuery, [id]);
        
        // Update master budget remaining
        await client.query(`
          UPDATE urp_budget_master SET
            current_remaining = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRemaining, masterBudget.id]);
        
        // Update all subsequent period's remaining values
        await client.query(`
          UPDATE urp_budget_absorption
          SET remaining_after = remaining_after + $1
          WHERE created_at > $2
        `, [absorptionAmount, absorption.created_at]);
        
        // Record deletion in history
        await client.query(`
          INSERT INTO urp_budget_history (
            entity_type, entity_id, field_changed, old_value, new_value, changed_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'absorption',
          id,
          'delete',
          JSON.stringify(absorption),
          null,
          username
        ]);
        
        await client.query('COMMIT');
        
        return {
          deleted: deleteResult.rows[0],
          master: {
            ...masterBudget,
            current_remaining: newRemaining
          }
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error deleting absorption with ID ${id}:`, error);
      throw error;
    }
  }

  // Get budget history
  static async getBudgetHistory() {
    try {
      const query = `
        SELECT * FROM urp_budget_history 
        ORDER BY changed_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting budget history:', error);
      throw error;
    }
  }

  // Get unique periods for filters
  static async getFilterOptions() {
    try {
      const periodQuery = `SELECT DISTINCT period FROM urp_budget_absorption ORDER BY period`;
      const periods = await pool.query(periodQuery);
      
      return {
        periods: periods.rows.map(row => row.period)
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
      const masterQuery = `SELECT * FROM urp_budget_master`;
      const masterResult = await pool.query(masterQuery);
      
      // Get all period absorptions
      const absorptionsQuery = `SELECT * FROM urp_budget_absorption ORDER BY created_at`;
      const absorptionsResult = await pool.query(absorptionsQuery);
      
      const master = masterResult.rows.length > 0 ? masterResult.rows[0] : null;
      const absorptions = absorptionsResult.rows;
      
      // Calculate total absorption
      let totalAbsorption = 0;
      if (absorptions.length > 0) {
        totalAbsorption = absorptions.reduce((sum, abs) => sum + parseFloat(abs.absorption_amount), 0);
      }
      
      return {
        master,
        absorptions,
        summary: {
          total_budget: master ? parseFloat(master.total_budget) : 0,
          total_absorption: totalAbsorption,
          current_remaining: master ? parseFloat(master.current_remaining) : 0
        }
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
        
        // First row should be master budget
        if (data.length > 0) {
          const masterData = data[0];
          
          // Create/update master budget
          const masterQuery = `
            SELECT * FROM urp_budget_master
          `;
          
          const masterCheckResult = await client.query(masterQuery);
          
          if (masterCheckResult.rows.length === 0) {
            // Insert new master budget
            await client.query(`
              INSERT INTO urp_budget_master (
                total_budget, current_remaining, status, remarks
              ) VALUES ($1, $2, $3, $4)
            `, [
              parseFloat(masterData.total_budget || 0),
              parseFloat(masterData.total_budget || 0), // Initially remaining equals total
              masterData.status || 'Active',
              masterData.remarks || null
            ]);
          } else {
            // Update existing master budget
            const existingMaster = masterCheckResult.rows[0];
            const oldTotalBudget = parseFloat(existingMaster.total_budget);
            const newTotalBudget = parseFloat(masterData.total_budget || 0);
            
            // Calculate adjustment to remaining budget
            const budgetDifference = newTotalBudget - oldTotalBudget;
            const newRemaining = parseFloat(existingMaster.current_remaining) + budgetDifference;
            
            await client.query(`
              UPDATE urp_budget_master SET
                total_budget = $1,
                current_remaining = $2,
                status = $3,
                remarks = $4,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $5
            `, [
              newTotalBudget,
              newRemaining,
              masterData.status || existingMaster.status,
              masterData.remarks || existingMaster.remarks,
              existingMaster.id
            ]);
            
            // Record history
            if (oldTotalBudget !== newTotalBudget) {
              await client.query(`
                INSERT INTO urp_budget_history (
                  entity_type, entity_id, field_changed, old_value, new_value, changed_by
                ) VALUES ($1, $2, $3, $4, $5, $6)
              `, [
                'master',
                existingMaster.id,
                'total_budget',
                oldTotalBudget,
                newTotalBudget,
                username
              ]);
            }
          }
        }
        
        // Get updated master budget
        const updatedMasterResult = await client.query(`SELECT * FROM urp_budget_master`);
        if (updatedMasterResult.rows.length === 0) {
          throw new Error('Master budget not found after import');
        }
        
        const masterBudget = updatedMasterResult.rows[0];
        let currentRemaining = parseFloat(masterBudget.total_budget);
        
        // Import period absorptions (starting from second row)
        for (let i = 1; i < data.length; i++) {
          const absorptionData = data[i];
          
          if (!absorptionData.period || !absorptionData.absorption_amount) {
            continue; // Skip invalid rows
          }
          
          const absorptionAmount = parseFloat(absorptionData.absorption_amount);
          
          // Calculate new remaining
          currentRemaining -= absorptionAmount;
          
          // Check if period already exists
          const periodCheckQuery = `
            SELECT * FROM urp_budget_absorption WHERE period = $1
          `;
          const periodCheckResult = await client.query(periodCheckQuery, [absorptionData.period]);
          
          if (periodCheckResult.rows.length === 0) {
            // Insert new period absorption
            await client.query(`
              INSERT INTO urp_budget_absorption (
                period, absorption_amount, remaining_after, remarks
              ) VALUES ($1, $2, $3, $4)
            `, [
              absorptionData.period,
              absorptionAmount,
              currentRemaining,
              absorptionData.remarks || null
            ]);
          } else {
            // Update existing period absorption
            const existingAbsorption = periodCheckResult.rows[0];
            const oldAbsorptionAmount = parseFloat(existingAbsorption.absorption_amount);
            
            // Update the absorption
            await client.query(`
              UPDATE urp_budget_absorption SET
                absorption_amount = $1,
                remaining_after = $2,
                remarks = $3,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $4
            `, [
              absorptionAmount,
              currentRemaining,
              absorptionData.remarks || existingAbsorption.remarks,
              existingAbsorption.id
            ]);
            
            // Record history
            if (oldAbsorptionAmount !== absorptionAmount) {
              await client.query(`
                INSERT INTO urp_budget_history (
                  entity_type, entity_id, field_changed, old_value, new_value, changed_by
                ) VALUES ($1, $2, $3, $4, $5, $6)
              `, [
                'absorption',
                existingAbsorption.id,
                'absorption_amount',
                oldAbsorptionAmount,
                absorptionAmount,
                username
              ]);
            }
          }
        }
        
        // Update master budget with final remaining
        await client.query(`
          UPDATE urp_budget_master SET
            current_remaining = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [currentRemaining, masterBudget.id]);
        
        await client.query('COMMIT');
        
        return { 
          success: true, 
          count: data.length,
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

export default URPBudgetModel;