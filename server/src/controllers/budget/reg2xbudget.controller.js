import { Reg2xBudgetModel } from '../../models/budget/reg2xbudget.model.js'
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import moment from 'moment';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Reg2xBudgetController {

  // Get master budget and all absorptions
  static async getBudgetData(req, res) {
    try {
      // Get master budget
    const masterBudget = await Reg2xBudgetModel.getMasterBudget();
    
      // Extract query parameters for absorptions
    const { 
        page = 1, 
        limit = 50, 
        period
    } = req.query;
    
      // Create filters object
    const filters = {};
      if (period) filters.period = period;
      
      // Get absorptions with pagination
      const absorptions = await Reg2xBudgetModel.getAllAbsorptions(
        filters, 
        parseInt(page), 
        parseInt(limit)
      );
      
      return res.status(200).json({
        success: true,
        message: 'Budget data retrieved successfully',
        data: {
          master: masterBudget,
          absorptions: absorptions.data
        },
        pagination: absorptions.pagination
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
      const result = await Reg2xBudgetModel.createOrUpdateMaster(budgetData, username);
      
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

  // Add period absorption
  static async addPeriodAbsorption(req, res) {
    try {
      const absorptionData = req.body;
      const username = req.user?.username || 'system';
      
      // Validate
      if (!absorptionData.period || !absorptionData.absorption_amount) {
        return res.status(400).json({
          success: false,
          message: 'Period and absorption amount are required'
        });
      }
      
      // Add period absorption
      const result = await Reg2xBudgetModel.addPeriodAbsorption(absorptionData, username);
      
      return res.status(200).json({
        success: true,
        message: 'Period absorption added successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in addPeriodAbsorption controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add period absorption',
        error: error.message
      });
    }
  }

  // Delete period absorption
  static async deleteAbsorption(req, res) {
    try {
      const { id } = req.params;
      const username = req.user?.username || 'system';
      
      // Delete absorption
      const result = await Reg2xBudgetModel.deleteAbsorption(parseInt(id), username);
      
      return res.status(200).json({
        success: true,
        message: 'Period absorption deleted successfully',
        data: result
      });
    } catch (error) {
      console.error(`Error in deleteAbsorption controller for ID ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete period absorption',
        error: error.message
      });
    }
  }

  // Get budget history
  static async getBudgetHistory(req, res) {
    try {
      const history = await Reg2xBudgetModel.getBudgetHistory();
      
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
      const options = await Reg2xBudgetModel.getFilterOptions();
      
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
      const summary = await Reg2xBudgetModel.getBudgetSummary();
      
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
      const mappedData = data.map((row, index) => {
        if (index === 0) {
          // First row is master budget
          return {
            total_budget: parseFloat(row['Total Budget (Contract Value)'] || row['total_budget'] || 0),
            status: row['Status'] || row['status'] || 'Active',
            remarks: row['Remarks'] || row['remarks'] || null
          };
        } else {
          // Other rows are period absorptions
          return {
            period: row['Period'] || row['period'] || null,
            absorption_amount: parseFloat(row['Absorption Amount'] || row['absorption_amount'] || 0),
            remarks: row['Remarks'] || row['remarks'] || null
          };
        }
      });
      
      // Import data to database
      const result = await Reg2xBudgetModel.importFromExcel(mappedData, username);
      
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
    const summary = await Reg2xBudgetModel.getBudgetSummary();
    if (!summary || !summary.absorptions || summary.absorptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No absorption data found to export'
      });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Sort absorption data by period
    const sortedAbsorptions = [...summary.absorptions].sort((a, b) => {
      // Try to parse period as date (if it's in a format like "September 2024")
      const getDateValue = (period) => {
        try {
          return new Date(period).getTime();
        } catch {
          return 0;
        }
      };
      
      const dateA = getDateValue(a.period);
      const dateB = getDateValue(b.period);
      
      if (dateA && dateB) {
        return dateA - dateB; // Sort by date if both are valid dates
      } else {
        // Fall back to string comparison if dates are invalid
        return a.period.localeCompare(b.period);
      }
    });
    
    // Create absorptions worksheet with fields from the reg2x_budget_absorption table only
    const absorptionData = sortedAbsorptions.map(abs => ({
      'ID': abs.id,
      'Period': abs.period,
      'Absorption Amount': parseFloat(abs.absorption_amount),
      'Remaining After': parseFloat(abs.remaining_after),
      'Remarks': abs.remarks || '',
      'Created At': new Date(abs.created_at).toLocaleString(),
      'Updated At': new Date(abs.updated_at).toLocaleString()
    }));
    
    // Handle empty absorption data (should not reach here due to the check above, but as a safeguard)
    if (absorptionData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No absorption data found to export'
      });
    }
    
    const absorptionWorksheet = XLSX.utils.json_to_sheet(absorptionData);
    
    // Add column widths for better readability
    const absorptionColWidths = [
      { wch: 5 },  // ID
      { wch: 15 }, // Period
      { wch: 20 }, // Absorption Amount
      { wch: 20 }, // Remaining After
      { wch: 30 }, // Remarks
      { wch: 20 }, // Created At
      { wch: 20 }  // Updated At
    ];
    absorptionWorksheet['!cols'] = absorptionColWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, absorptionWorksheet, 'Budget Absorptions');
    
    // Generate file name with timestamp to avoid collisions
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `budget_absorptions_export_${timestamp}.xlsx`;
    
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
      message: 'Failed to export absorption data to Excel',
      error: error.message
    });
  }
}
}

export default Reg2xBudgetController;