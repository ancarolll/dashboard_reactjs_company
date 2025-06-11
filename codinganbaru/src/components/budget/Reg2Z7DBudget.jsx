import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {Table, Button, Form, Input, Select, Modal, message, Popconfirm, Space, Card, Row, Col, Statistic, Divider, Typography, Tooltip, Tabs, InputNumber} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faPlus, faTrash, faFileExport, faSync, faSearch, faHistory, faCog, faEdit} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import '../../styles/main.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * Reg2Z7DBudget Component - Displays and manages Regional 2 Z7D budget data
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.embedded - Whether component is embedded in another page
 * @param {string} props.apiUrl - API URL base path (defaults to '/api/reg2z7dbudget')
 * @param {Function} props.onDataChange - Callback when data changes
 */

const Reg2Z7DBudget = ({ 
  embedded = false, 
  apiUrl = '/api/reg2z7dbudget',
  onDataChange = null
}) => {
  // State for budget data
  const [budgetData, setBudgetData] = useState({
    master: null,
    projects: []
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // State for forms
  const [masterFormVisible, setMasterFormVisible] = useState(false);
  const [projectFormVisible, setProjectFormVisible] = useState(false);
  
  // State for filters
  const [filters, setFilters] = useState({
    project_name: ''
  });
  
  // State for filter options
  const [filterOptions, setFilterOptions] = useState({
    project_names: []
  });
  
  // State for summary data
  const [summaryData, setSummaryData] = useState({
    master: null,
    projects: [],
    summary: {
      total_budget: 0,
      total_termin1: 0,
      total_termin2: 0,
      total_termin3: 0,
      total_termin4: 0,
      total_actualization: 0,
      current_remaining: 0
    }
  });
  
  // State for history modal
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  
  // Current project for editing
  const [currentProject, setCurrentProject] = useState(null);
  
  // Form references
  const [masterForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  
  // Fetch budget data
  const fetchBudgetData = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      // Prepare query params
      const params = {
        page,
        limit: pageSize,
        ...filters
      };
      
      // Clean empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await axios.get(apiUrl, { params });
      
      if (response.data.success) {
        setBudgetData(response.data.data);
        setPagination({
          current: response.data.pagination.page,
          pageSize: response.data.pagination.limit,
          total: response.data.pagination.total
        });
        
        // If callback provided, call it with the data
        if (onDataChange) {
          onDataChange(response.data.data);
        }
      } else {
        message.error('Failed to fetch budget data');
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
      message.error('Error fetching budget data');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filters, onDataChange]);
  
  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/filters`);
      
      if (response.data.success) {
        setFilterOptions(prevOptions => ({
          ...prevOptions,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [apiUrl]);
  
  // Fetch summary data
  const fetchSummaryData = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/summary`);
      
      if (response.data.success) {
        setSummaryData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
    }
  }, [apiUrl]);
  
  // Fetch budget history
  const fetchBudgetHistory = async () => {
    try {
      const response = await axios.get(`${apiUrl}/history`);
      
      if (response.data.success) {
        setHistoryData(response.data.data);
      } else {
        message.error('Failed to fetch budget history');
      }
    } catch (error) {
      console.error('Error fetching budget history:', error);
      message.error('Error fetching budget history');
    }
  };
  
  // Load data on initial render and when dependencies change
  useEffect(() => {
    fetchBudgetData(pagination.current, pagination.pageSize);
    fetchFilterOptions();
    fetchSummaryData();
  }, [fetchBudgetData, fetchFilterOptions, fetchSummaryData, pagination.current, pagination.pageSize]);
  
  // Handle table pagination
  const handleTableChange = (pagination) => {
    fetchBudgetData(pagination.current, pagination.pageSize);
  };
  
  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchBudgetData(1, pagination.pageSize);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      project_name: ''
    });
    
    // Fetch data with reset filters
    setTimeout(() => {
      fetchBudgetData(1, pagination.pageSize);
    }, 0);
  };
  
  // Show master budget form
  const showMasterForm = () => {
    masterForm.resetFields();
    
    if (budgetData.master) {
      masterForm.setFieldsValue({
        total_budget: parseFloat(budgetData.master.total_budget),
        current_remaining: parseFloat(budgetData.master.current_remaining),
        total_termin1: parseFloat(budgetData.master.total_termin1 || 0),
        total_termin2: parseFloat(budgetData.master.total_termin2 || 0),
        total_termin3: parseFloat(budgetData.master.total_termin3 || 0),
        total_termin4: parseFloat(budgetData.master.total_termin4 || 0),
        status: budgetData.master.status,
        remarks: budgetData.master.remarks
      });
    } else {
      masterForm.setFieldsValue({
        total_budget: 0,
        current_remaining: 0,
        total_termin1: 0,
        total_termin2: 0,
        total_termin3: 0,
        total_termin4: 0,
        status: 'Active',
        remarks: ''
      });
    }
    
    setMasterFormVisible(true);
  };
  
  // Show project form for new project
  const showProjectForm = () => {
    projectForm.resetFields();
    setCurrentProject(null);
    
    projectForm.setFieldsValue({
      project_name: '',
      total_budget: 0,
      termin1: 0,
      termin2: 0,
      termin3: 0,
      termin4: 0,
      remarks: ''
    });
    
    setProjectFormVisible(true);
  };
  
  // Show project form for editing
  const showEditProjectForm = (project) => {
    projectForm.resetFields();
    setCurrentProject(project);
    
    projectForm.setFieldsValue({
      project_name: project.project_name,
      total_budget: parseFloat(project.total_budget),
      termin1: parseFloat(project.termin1 || 0),
      termin2: parseFloat(project.termin2 || 0),
      termin3: parseFloat(project.termin3 || 0),
      termin4: parseFloat(project.termin4 || 0),
      remarks: project.remarks
    });
    
    setProjectFormVisible(true);
  };
  
  // Handle master form submit
  const handleMasterFormSubmit = async () => {
    try {
      const values = await masterForm.validateFields();
      
      const response = await axios.post(`${apiUrl}/master`, values);
      
      if (response.data.success) {
        message.success('Master budget updated successfully');
        setMasterFormVisible(false);
        fetchBudgetData(pagination.current, pagination.pageSize);
        fetchSummaryData();
      } else {
        message.error('Failed to update master budget');
      }
    } catch (error) {
      console.error('Error submitting master form:', error);
    }
  };
  
  // Calculate total actualization and budget remaining for project form
  const calculateProjectTotals = () => {
    const values = projectForm.getFieldsValue();
    const termin1 = parseFloat(values.termin1 || 0);
    const termin2 = parseFloat(values.termin2 || 0);
    const termin3 = parseFloat(values.termin3 || 0);
    const termin4 = parseFloat(values.termin4 || 0);
    const totalBudget = parseFloat(values.total_budget || 0);
    
    const totalActualization = termin1 + termin2 + termin3 + termin4;
    const budgetRemaining = totalBudget - totalActualization;
    
    return {
      totalActualization,
      budgetRemaining
    };
  };
  
  // Handle project form submit
  const handleProjectFormSubmit = async () => {
    try {
      const values = await projectForm.validateFields();
      
      // Add ID if editing existing project
      if (currentProject) {
        values.id = currentProject.id;
      }
      
      const response = await axios.post(`${apiUrl}/project`, values);
      
      if (response.data.success) {
        message.success(`Project ${currentProject ? 'updated' : 'added'} successfully`);
        setProjectFormVisible(false);
        fetchBudgetData(pagination.current, pagination.pageSize);
        fetchSummaryData();
        fetchFilterOptions();
      } else {
        message.error(`Failed to ${currentProject ? 'update' : 'add'} project`);
      }
    } catch (error) {
      console.error('Error submitting project form:', error);
    }
  };
  
  // Handle delete project
  const handleDeleteProject = async (id) => {
    try {
      const response = await axios.delete(`${apiUrl}/project/${id}`);
      
      if (response.data.success) {
        message.success('Project deleted successfully');
        fetchBudgetData(pagination.current, pagination.pageSize);
        fetchSummaryData();
      } else {
        message.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      message.error('Error deleting project');
    }
  };
  
  // Show history modal
  const showHistoryModal = () => {
    fetchBudgetHistory();
    setHistoryVisible(true);
  };
  
  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      // Set loading state
      setLoading(true);
      message.loading({ content: 'Preparing budget data export...', key: 'exportMsg', duration: 0 });
      
      // Get authentication token (if you have auth in your app)
      const token = localStorage.getItem('token'); // Replace with your actual auth method
      
      // Apply current filters to export
      const queryParams = new URLSearchParams();
      if (filters.project_name) {
        queryParams.append('project_name', filters.project_name);
      }
      
      // Build export URL with filters
      const downloadUrl = `${apiUrl}/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // Use axios to handle the download with proper error handling
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'blob', // Important for file downloads
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        onDownloadProgress: (progressEvent) => {
          // Update download progress if needed
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          message.loading({ 
            content: `Downloading export file (${percentCompleted}%)...`, 
            key: 'exportMsg', 
            duration: 0 
          });
        }
      });
      
      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      
      // Get filename from headers if available, or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'regional2z7d_budget_export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Set up and trigger download
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Success message
      message.success({ content: 'Budget data exported successfully', key: 'exportMsg' });
    } catch (error) {
      console.error('Error exporting budget data:', error);
      
      // Provide helpful error messages based on error type
      if (error.response) {
        if (error.response.status === 401) {
          message.error({ content: 'Authentication error: Please log in again', key: 'exportMsg' });
        } else if (error.response.status === 404) {
          message.error({ content: 'No data found to export', key: 'exportMsg' });
        } else {
          message.error({ content: `Server error (${error.response.status}): ${error.response.data?.message || 'Failed to export data'}`, key: 'exportMsg' });
        }
      } else if (error.request) {
        message.error({ content: 'Network error: Please check your connection', key: 'exportMsg' });
      } else {
        message.error({ content: 'Failed to export budget data: ' + error.message, key: 'exportMsg' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Project table columns
  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Total Budget/Year',
      dataIndex: 'total_budget',
      key: 'total_budget',
      width: 150,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 1',
      dataIndex: 'termin1',
      key: 'termin1',
      width: 120,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 2',
      dataIndex: 'termin2',
      key: 'termin2',
      width: 120,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 3',
      dataIndex: 'termin3',
      key: 'termin3',
      width: 120,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 4',
      dataIndex: 'termin4',
      key: 'termin4',
      width: 120,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Total Actualization',
      dataIndex: 'total_actualization',
      key: 'total_actualization',
      width: 150,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Budget Remaining',
      dataIndex: 'budget_remaining',
      key: 'budget_remaining',
      width: 150,
      render: (text) => {
        const value = parseFloat(text);
        const color = value < 0 ? 'red' : value === 0 ? 'orange' : 'green';
        return <span style={{ color }}>{value.toLocaleString('en-US')}</span>;
      },
      align: 'right',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (text, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<FontAwesomeIcon icon={faEdit} />} 
            size="small" 
            onClick={() => showEditProjectForm(record)}
            title="Edit" 
          />
          <Popconfirm
            title="Are you sure you want to delete this project?"
            onConfirm={() => handleDeleteProject(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="danger" 
              icon={<FontAwesomeIcon icon={faTrash} />} 
              size="small" 
              title="Delete" 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // History columns
  const historyColumns = [
    {
      title: 'Type',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 100,
      render: (text) => text.charAt(0).toUpperCase() + text.slice(1)
    },
    {
      title: 'Field Changed',
      dataIndex: 'field_changed',
      key: 'field_changed',
      width: 150,
      render: (text) => {
        // Convert snake_case to title case
        return text
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    },
    {
      title: 'Old Value',
      dataIndex: 'old_value',
      key: 'old_value',
      width: 150,
      render: (text, record) => {
        if (record.field_changed.includes('budget') || 
            record.field_changed.includes('termin') || 
            record.field_changed.includes('remaining') ||
            record.field_changed.includes('actualization')) {
          return text ? parseFloat(text).toLocaleString('en-US') : '0';
        }
        return text || '-';
      }
    },
    {
      title: 'New Value',
      dataIndex: 'new_value',
      key: 'new_value',
      width: 150,
      render: (text, record) => {
        if (record.field_changed.includes('budget') || 
            record.field_changed.includes('termin') || 
            record.field_changed.includes('remaining') ||
            record.field_changed.includes('actualization')) {
          return text ? parseFloat(text).toLocaleString('en-US') : '0';
        }
        return text || '-';
      }
    },
    {
      title: 'Changed By',
      dataIndex: 'changed_by',
      key: 'changed_by',
      width: 120,
    },
    {
      title: 'Changed At',
      dataIndex: 'changed_at',
      key: 'changed_at',
      width: 180,
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss')
    },
  ];
  
  // Format numbers
  const formatNumber = (value) => {
    return value ? parseFloat(value).toLocaleString('en-US') : '0';
  };
  
  return (
    <div className="reg2x-budget-container" style={{ padding: embedded ? 0 : '20px' }}>
      {!embedded && (
        <Title level={2}>Regional 2 Z7D Budget Management</Title>
      )}
      
      <Tabs
        defaultActiveKey="data"
        items={[
          {
            key: 'data',
            label: 'Budget Data',
            children: (
              <>
                {/* Master Budget Card */}
                <Card 
                  title="Total Budget (Contract Value)" 
                  style={{ marginBottom: 20 }}
                  extra={
                    <Button 
                      type="primary" 
                      icon={<FontAwesomeIcon icon={faCog} />} 
                      onClick={showMasterForm}
                    >
                      Configure
                    </Button>
                  }
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Total Budget"
                        value={budgetData.master ? parseFloat(budgetData.master.total_budget) : 0}
                        precision={0}
                        formatter={(value) => `Rp ${formatNumber(value)}`}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Total Budget Remaining"
                        value={budgetData.master ? parseFloat(budgetData.master.current_remaining) : 0}
                        precision={0}
                        formatter={(value) => `Rp ${formatNumber(value)}`}
                        valueStyle={{ 
                          color: budgetData.master && parseFloat(budgetData.master.current_remaining) < 0 ? 'red' : 'green' 
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Status"
                        value={budgetData.master ? budgetData.master.status : 'Not Set'}
                      />
                    </Col>
                  </Row>
                  
                  <Divider style={{ margin: '20px 0' }} />
                  
                  <Row gutter={16}>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="Total Termin 1"
                        value={budgetData.master ? parseFloat(budgetData.master.total_termin1 || 0) : 0}
                        precision={0}
                        formatter={(value) => `Rp ${formatNumber(value)}`}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="Total Termin 2"
                        value={budgetData.master ? parseFloat(budgetData.master.total_termin2 || 0) : 0}
                        precision={0}
                        formatter={(value) => `Rp ${formatNumber(value)}`}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="Total Termin 3"
                        value={budgetData.master ? parseFloat(budgetData.master.total_termin3 || 0) : 0}
                        precision={0}
                        formatter={(value) => `Rp ${formatNumber(value)}`}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="Total Termin 4"
                        value={budgetData.master ? parseFloat(budgetData.master.total_termin4 || 0) : 0}
                        precision={0}
                        formatter={(value) => `Rp ${formatNumber(value)}`}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Project Budgets */}
                <Card 
                  title="Project Budgets" 
                  style={{ marginBottom: 20 }}
                  extra={
                    <Space>
                      <Button icon={<FontAwesomeIcon icon={faFileExport} />} onClick={handleExportExcel}>Export Excel</Button>
                      <Button icon={<FontAwesomeIcon icon={faHistory} />} onClick={showHistoryModal}>History</Button>
                      <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={showProjectForm}>Add Project</Button>
                    </Space>
                  }
                >
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label="Project Name">
                        <Select 
                          placeholder="Select project" 
                          allowClear
                          value={filters.project_name || undefined}
                          onChange={(value) => handleFilterChange('project_name', value)}
                          style={{ width: '100%' }}
                        >
                          {filterOptions.project_names?.map(name => (
                            <Option key={name} value={name}>{name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label=" " colon={false}>
                        <Space>
                          <Button icon={<FontAwesomeIcon icon={faSync} />} onClick={resetFilters}>Reset</Button>
                          <Button type="primary" icon={<FontAwesomeIcon icon={faSearch} />} onClick={applyFilters}>Apply</Button>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Table 
                    columns={projectColumns} 
                    dataSource={budgetData.projects?.map(item => ({ ...item, key: item.id })) || []} 
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    size="middle"
                    scroll={{ x: 1500 }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'summary',
            label: 'Budget Summary',
            children: (
              <Card title="Budget Summary" style={{ marginBottom: 20 }}>
                <Row gutter={20} style={{ marginBottom: 20 }}>
                  <Col xs={24} sm={12} md={8}>
                    <Statistic 
                      title="Total Budget" 
                      value={parseFloat(summaryData.summary?.total_budget || 0)} 
                      precision={0}
                      formatter={(value) => `Rp ${formatNumber(value)}`}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Statistic 
                      title="Total Actualization" 
                      value={parseFloat(summaryData.summary?.total_actualization || 0)} 
                      precision={0}
                      formatter={(value) => `Rp ${formatNumber(value)}`}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Statistic 
                      title="Current Remaining" 
                      value={parseFloat(summaryData.summary?.current_remaining || 0)} 
                      precision={0}
                      formatter={(value) => `Rp ${formatNumber(value)}`}
                      valueStyle={{ 
                        color: parseFloat(summaryData.summary?.current_remaining || 0) < 0 ? 'red' : 'green' 
                      }}
                    />
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: 20 }}>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Total Termin 1"
                      value={parseFloat(summaryData.summary?.total_termin1 || 0)}
                      precision={0}
                      formatter={(value) => `Rp ${formatNumber(value)}`}
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Total Termin 2"
                      value={parseFloat(summaryData.summary?.total_termin2 || 0)}
                      precision={0}
                      formatter={(value) => `Rp ${formatNumber(value)}`}
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Total Termin 3"
                      value={parseFloat(summaryData.summary?.total_termin3 || 0)}
                      precision={0}
                      formatter={(value) => `Rp ${formatNumber(value)}`}
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Total Termin 4"
                      value={parseFloat(summaryData.summary?.total_termin4 || 0)}
                      precision={0}
                      formatter={(value) => `Rp ${formatNumber(value)}`}
                    />
                  </Col>
                </Row>

                <Divider style={{ margin: '20px 0' }} />

                <Row>
                  <Col span={24}>
                    <Table 
                      columns={projectColumns.filter(col => col.key !== 'actions')} 
                      dataSource={summaryData.projects?.map((item, index) => ({ ...item, key: index })) || []} 
                      loading={loading}
                      pagination={false}
                      size="middle"
                      scroll={{ x: 1400 }}
                      summary={() => {
                        const totalBudget = parseFloat(summaryData.summary?.total_budget || 0);
                        const totalActualization = parseFloat(summaryData.summary?.total_actualization || 0);
                        const currentRemaining = parseFloat(summaryData.summary?.current_remaining || 0);
                        const utilizationRate = totalBudget > 0 ? (totalActualization / totalBudget * 100).toFixed(2) : 0;

                        return (
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                              <strong>{formatNumber(totalBudget)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="right">
                              <strong>{formatNumber(summaryData.summary?.total_termin1 || 0)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="right">
                              <strong>{formatNumber(summaryData.summary?.total_termin2 || 0)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4} align="right">
                              <strong>{formatNumber(summaryData.summary?.total_termin3 || 0)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} align="right">
                              <strong>{formatNumber(summaryData.summary?.total_termin4 || 0)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={6} align="right">
                              <strong>{formatNumber(totalActualization)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={7} align="right">
                              <strong style={{ 
                                color: currentRemaining < 0 ? 'red' : 
                                      currentRemaining === 0 ? 'orange' : 'green' 
                              }}>
                                {formatNumber(currentRemaining)}
                              </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={8}>
                              <strong>Utilization: {utilizationRate}%</strong>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        );
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            )
          }
        ]}
      />

      
      {/* Master Budget Form Modal */}
      <Modal
        title="Configure Master Budget"
        open={masterFormVisible}
        onCancel={() => setMasterFormVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setMasterFormVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleMasterFormSubmit}>
            Save
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={masterForm}
          layout="vertical"
        >
          <Form.Item
            name="total_budget"
            label="Total Budget (Contract Value)"
            rules={[{ required: true, message: 'Please enter total budget' }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter total budget" 
              min={0}
              disabled={true}
              title="This value is automatically calculated from projects"
            />
          </Form.Item>
          
          <Form.Item
            name="current_remaining"
            label="Current Remaining"
            rules={[{ required: true, message: 'Please enter current remaining' }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter current remaining" 
              disabled={true}
              title="This value is automatically calculated from projects"
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="total_termin1"
                label="Total Termin 1"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Enter total termin 1" 
                  min={0}
                  disabled={true}
                  title="This value is automatically calculated from projects"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="total_termin2"
                label="Total Termin 2"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Enter total termin 2" 
                  min={0}
                  disabled={true}
                  title="This value is automatically calculated from projects"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="total_termin3"
                label="Total Termin 3"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Enter total termin 3" 
                  min={0}
                  disabled={true}
                  title="This value is automatically calculated from projects"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="total_termin4"
                label="Total Termin 4"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Enter total termin 4" 
                  min={0}
                  disabled={true}
                  title="This value is automatically calculated from projects"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="Active">Active</Select.Option>
              <Select.Option value="Closed">Closed</Select.Option>
              <Select.Option value="On Hold">On Hold</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={3} placeholder="Remarks or notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Project Form Modal */}
      <Modal
        title={currentProject ? "Edit Project Budget" : "Add Project Budget"}
        open={projectFormVisible}
        onCancel={() => setProjectFormVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setProjectFormVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleProjectFormSubmit}>
            Save
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={projectForm}
          layout="vertical"
          onValuesChange={() => {
            // Recalculate totals when values change
            const { totalActualization, budgetRemaining } = calculateProjectTotals();
            // Set read-only fields
            const formEl = document.getElementById('total-actualization');
            const remainingEl = document.getElementById('budget-remaining');
            if (formEl) formEl.value = totalActualization.toLocaleString('en-US');
            if (remainingEl) {
              remainingEl.value = budgetRemaining.toLocaleString('en-US');
              remainingEl.style.color = budgetRemaining < 0 ? 'red' : budgetRemaining === 0 ? 'orange' : 'green';
            }
          }}
        >
          <Form.Item
            name="project_name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="e.g. Project XYZ" />
          </Form.Item>
          
          <Form.Item
            name="total_budget"
            label="Total Budget / Year"
            rules={[{ required: true, message: 'Please enter total budget' }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter total budget" 
              min={0}
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="termin1"
                label="Termin 1"
                initialValue={0}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Termin 1" 
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="termin2"
                label="Termin 2"
                initialValue={0}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Termin 2" 
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="termin3"
                label="Termin 3"
                initialValue={0}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Termin 3" 
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="termin4"
                label="Termin 4"
                initialValue={0}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Termin 4" 
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Total Actualization (Auto-calculated)"
              >
                <Input
                  id="total-actualization"
                  style={{ width: '100%' }}
                  disabled
                  defaultValue="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Budget Remaining (Auto-calculated)"
              >
                <Input
                  id="budget-remaining"
                  style={{ width: '100%' }}
                  disabled
                  defaultValue="0"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={3} placeholder="Remarks or notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* History Modal */}
      <Modal
        title="Budget History"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        <Table 
          columns={historyColumns} 
          dataSource={historyData.map((item, index) => ({ ...item, key: index }))} 
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Modal>
    </div>
  );
};

export default Reg2Z7DBudget;