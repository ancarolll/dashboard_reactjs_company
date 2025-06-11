import { Reg2z7wBudgetModel } from '../../models/budget/reg2z7wbudget.model.js'
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import moment from 'moment';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Reg2z7wBudgetController {
  // Get master budget and all projects
  static async getBudgetData(req, res) {
    try {
      // Get master budget
      const masterBudget = await Reg2z7wBudgetModel.getMasterBudget();
      
      // Extract query parameters for projects
      const { 
        page = 1, 
        limit = 50, 
        project_name
      } = req.query;
      
      // Create filters object
      const filters = {};
      if (project_name) filters.project_name = project_name;
      
      // Get projects with pagination
      const projects = await Reg2z7wBudgetModel.getAllProjects(
        filters, 
        parseInt(page), 
        parseInt(limit)
      );
      
      return res.status(200).json({
        success: true,
        message: 'Budget data retrieved successfully',
        data: {
          master: masterBudget,
          projects: projects.data
        },
        pagination: projects.pagination
      });
    } catch (error) {
      console.error('Error in getBudgetData controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve budget data',
        error: error.message
      });
    }
  }

  // Create or update master budget
  static async createOrUpdateMaster(req, res) {
    try {
      const budgetData = req.body;
      const username = req.user?.username || 'system';
      
      // Validate
      if (!budgetData.total_budget) {
        return res.status(400).json({
          success: false,
          message: 'Total budget is required'
        });
      }
      
      // Create or update master budget
      const result = await Reg2z7wBudgetModel.createOrUpdateMaster(budgetData, username);
      
      return res.status(200).json({
        success: true,
        message: 'Master budget updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in createOrUpdateMaster controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update master budget',
        error: error.message
      });
    }
  }

  // Add or update project
  static async addOrUpdateProject(req, res) {
    try {
      const projectData = req.body;
      const username = req.user?.username || 'system';
      
      // Validate
      if (!projectData.project_name || !projectData.total_budget) {
        return res.status(400).json({
          success: false,
          message: 'Project name and total budget are required'
        });
      }
      
      // Add or update project
      const result = await Reg2z7wBudgetModel.addOrUpdateProject(projectData, username);
      
      return res.status(200).json({
        success: true,
        message: 'Project budget updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in addOrUpdateProject controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update project budget',
        error: error.message
      });
    }
  }

  // Delete project
  static async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const username = req.user?.username || 'system';
      
      // Delete project
      const result = await Reg2z7wBudgetModel.deleteProject(parseInt(id), username);
      
      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
        data: result
      });
    } catch (error) {
      console.error(`Error in deleteProject controller for ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message
      });
    }
  }

  // Get budget history
  static async getBudgetHistory(req, res) {
    try {
      const history = await Reg2z7wBudgetModel.getBudgetHistory();
      
      return res.status(200).json({
        success: true,
        message: 'Budget history retrieved successfully',
        data: history
      });
    } catch (error) {
      console.error('Error in getBudgetHistory controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve budget history',
        error: error.message
      });
    }
  }

  // Get filter options for dropdowns
  static async getFilterOptions(req, res) {
    try {
      const options = await Reg2z7wBudgetModel.getFilterOptions();
      
      return res.status(200).json({
        success: true,
        message: 'Filter options retrieved successfully',
        data: options
      });
    } catch (error) {
      console.error('Error in getFilterOptions controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve filter options',
        error: error.message
      });
    }
  }

  // Get budget summary
  static async getBudgetSummary(req, res) {
    try {
      const summary = await Reg2z7wBudgetModel.getBudgetSummary();
      
      return res.status(200).json({
        success: true,
        message: 'Budget summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      console.error('Error in getBudgetSummary controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve budget summary',
        error: error.message
      });
    }
  }

  // Import data from Excel file
  static async importExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      const filePath = req.file.path;
      const username = req.user?.username || 'system';
      
      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      
      // Map Excel columns to expected format
      const mappedData = data.map(row => {
        return {
          project_name: row['Project Name'] || row['project_name'],
          total_budget: parseFloat(row['Total Budget/Year'] || row['total_budget'] || 0),
          termin1: parseFloat(row['Termin 1'] || row['termin1'] || 0),
          termin2: parseFloat(row['Termin 2'] || row['termin2'] || 0),
          termin3: parseFloat(row['Termin 3'] || row['termin3'] || 0),
          termin4: parseFloat(row['Termin 4'] || row['termin4'] || 0),
          termin5: parseFloat(row['Termin 5'] || row['termin5'] || 0),
          termin6: parseFloat(row['Termin 6'] || row['termin6'] || 0),
          remarks: row['Remarks'] || row['remarks'] || null
        };
      });
      
      // Import data to database
      const result = await Reg2z7wBudgetModel.importFromExcel(mappedData, username);
      
      // Clean up temporary file
      fs.unlinkSync(filePath);
      
      return res.status(200).json({
        success: true,
        message: `Budget data imported successfully`,
        data: result
      });
    } catch (error) {
      console.error('Error in importExcel controller:', error);
      
      // Clean up if file exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to import Excel data',
        error: error.message
      });
    }
  }

  // Export data to Excel
  static async exportExcel(req, res) {
    try {
        // Get all data with proper error handling
        const summary = await Reg2z7wBudgetModel.getBudgetSummary();
        if (!summary || !summary.projects || summary.projects.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No project data found to export'
          });
        }
    
        // Create workbook
        const workbook = XLSX.utils.book_new();
        
        // Create projects worksheet
        const projectData = summary.projects.map(proj => ({
          'Project Name': proj.project_name,
          'Total Budget/Year': parseFloat(proj.total_budget),
          'Termin 1': parseFloat(proj.termin1),
          'Termin 2': parseFloat(proj.termin2),
          'Termin 3': parseFloat(proj.termin3),
          'Termin 4': parseFloat(proj.termin4),
          'Termin 5': parseFloat(proj.termin5),
          'Termin 6': parseFloat(proj.termin6),
          'Total Actualization': parseFloat(proj.total_actualization),
          'Budget Remaining': parseFloat(proj.budget_remaining),
          'Remarks': proj.remarks || '',
          'Created At': new Date(proj.created_at).toLocaleString(),
          'Updated At': new Date(proj.updated_at).toLocaleString()
        }));
        
        const projectWorksheet = XLSX.utils.json_to_sheet(projectData);
        
        // Add column widths for better readability
        const projectColWidths = [
          { wch: 30 }, // Project Name
          { wch: 20 }, // Total Budget/Year
          { wch: 15 }, // Termin 1
          { wch: 15 }, // Termin 2
          { wch: 15 }, // Termin 3
          { wch: 15 }, // Termin 4
          { wch: 15 }, // Termin 5
          { wch: 15 }, // Termin 6
          { wch: 20 }, // Total Actualization
          { wch: 20 }, // Budget Remaining
          { wch: 30 }, // Remarks
          { wch: 20 }, // Created At
          { wch: 20 }  // Updated At
        ];
        projectWorksheet['!cols'] = projectColWidths;
        
        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, projectWorksheet, 'Budget Projects');
        
        // Generate file name with timestamp to avoid collisions
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `reg2z7w_budget_export_${timestamp}.xlsx`;
        
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const filePath = path.join(uploadsDir, fileName);
        
        // Write to file
        XLSX.writeFile(workbook, filePath);
        
        // Send file to client with proper headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        
        // Use file streaming for better performance with large files
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        // Delete file after sending (using event handler to avoid callback issues)
        fileStream.on('end', () => {
          try {
            fs.unlinkSync(filePath);
            console.log(`Temporary file deleted: ${filePath}`);
          } catch (err) {
            console.error('Error deleting temporary file:', err);
          }
        });
        
        // Handle stream errors
        fileStream.on('error', (err) => {
          console.error('Error streaming Excel file:', err);
          // Clean up if needed
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          // Response might already be sent, but try to handle gracefully
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error streaming the export file',
              error: err.message
            });
          }
        });
        
      } catch (error) {
        console.error('Error in exportExcel controller:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to export project data to Excel',
          error: error.message
        });
      }
    }
}

export default Reg2z7wBudgetController;