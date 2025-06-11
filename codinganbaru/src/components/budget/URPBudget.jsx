import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {Table,Button,Form,Input,Select,Modal,message,Popconfirm,Space,Card,Row,Col,Statistic,Divider,Typography,Tooltip,Tabs,InputNumber} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faPlus,faTrash,faFileExport,faSync,faSearch,faHistory,faCog} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import '../../styles/main.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * URPBudget Component - Displays and manages URP budget data
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.embedded - Whether component is embedded in another page
 * @param {string} props.apiUrl - API URL base path (defaults to '/api/urpbudget')
 * @param {Function} props.onDataChange - Callback when data changes
 */

const URPBudget = ({ 
  embedded = false, 
  apiUrl = '/api/urpbudget',
  onDataChange = null
}) => {
  // State for budget data
  const [budgetData, setBudgetData] = useState({
    master: null,
    absorptions: []
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // State for forms
  const [masterFormVisible, setMasterFormVisible] = useState(false);
  const [absorptionFormVisible, setAbsorptionFormVisible] = useState(false);
  
  // State for filters
  const [filters, setFilters] = useState({
    period: ''
  });
  
  // State for filter options
  const [filterOptions, setFilterOptions] = useState({
    periods: []
  });
  
  // State for summary data
  const [summaryData, setSummaryData] = useState({
    master: null,
    absorptions: [],
    summary: {
      total_budget: 0,
      total_absorption: 0,
      current_remaining: 0
    }
  });
  
  // State for history modal
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  
  // Form references
  const [masterForm] = Form.useForm();
  const [absorptionForm] = Form.useForm();
  
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
      period: ''
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
        status: budgetData.master.status,
        remarks: budgetData.master.remarks
      });
    } else {
      masterForm.setFieldsValue({
        total_budget: 0,
        status: 'Active',
        remarks: ''
      });
    }
    
    setMasterFormVisible(true);
  };
  
  // Show absorption form
  const showAbsorptionForm = () => {
    // Check if master budget exists
    if (!budgetData.master) {
      message.error('Please set up the master budget first');
      return;
    }
    
    absorptionForm.resetFields();
    absorptionForm.setFieldsValue({
      period: '',
      absorption_amount: 0,
      remarks: ''
    });
    
    setAbsorptionFormVisible(true);
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
  
  // Handle absorption form submit
  const handleAbsorptionFormSubmit = async () => {
    try {
      const values = await absorptionForm.validateFields();
      
      const response = await axios.post(`${apiUrl}/absorption`, values);
      
      if (response.data.success) {
        message.success('Period absorption added successfully');
        setAbsorptionFormVisible(false);
        fetchBudgetData(pagination.current, pagination.pageSize);
        fetchSummaryData();
        fetchFilterOptions();
      } else {
        message.error('Failed to add period absorption');
      }
    } catch (error) {
      console.error('Error submitting absorption form:', error);
    }
  };
  
  // Handle delete absorption
  const handleDeleteAbsorption = async (id) => {
    try {
      const response = await axios.delete(`${apiUrl}/absorption/${id}`);
      
      if (response.data.success) {
        message.success('Period absorption deleted successfully');
        fetchBudgetData(pagination.current, pagination.pageSize);
        fetchSummaryData();
      } else {
        message.error('Failed to delete period absorption');
      }
    } catch (error) {
      console.error('Error deleting period absorption:', error);
      message.error('Error deleting period absorption');
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
      if (filters.period) {
        queryParams.append('period', filters.period);
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
      let filename = 'urp_budget_export.xlsx';
      
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
  
  // Handle Excel import
  const handleImportExcel = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    
    if (info.file.status === 'done') {
      if (info.file.response.success) {
        message.success(`${info.file.name} imported successfully`);
        fetchBudgetData(1, pagination.pageSize);
        fetchSummaryData();
        fetchFilterOptions();
      } else {
        message.error(`${info.file.name} import failed: ${info.file.response.message}`);
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} import failed`);
    }
  };
  
  // Absorption table columns
  const absorptionColumns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      width: 150,
    },
    {
      title: 'Absorption Amount',
      dataIndex: 'absorption_amount',
      key: 'absorption_amount',
      width: 200,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Remaining After',
      dataIndex: 'remaining_after',
      key: 'remaining_after',
      width: 200,
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
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (text, record) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure you want to delete this absorption?"
            onConfirm={() => handleDeleteAbsorption(record.id)}
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
            record.field_changed.includes('amount') || 
            record.field_changed.includes('remaining')) {
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
            record.field_changed.includes('amount') || 
            record.field_changed.includes('remaining')) {
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
  
  // Import Excel props
  const importProps = {
    name: 'excelFile',
    action: `${apiUrl}/import`,
    headers: {
      authorization: 'authorization-text',
    },
    onChange: handleImportExcel,
    accept: '.xlsx,.xls',
    showUploadList: false,
  };
  
  // Format numbers
  const formatNumber = (value) => {
    return value ? parseFloat(value).toLocaleString('en-US') : '0';
  };
  
  return (
    <div className="reg2x-budget-container" style={{ padding: embedded ? 0 : '20px' }}>
      {!embedded && (
        <Title level={2}>URP Budget Management</Title>
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
                        title="Current Remaining"
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
                </Card>

                {/* Period Absorption */}
                <Card 
                  title="Period Absorption" 
                  style={{ marginBottom: 20 }}
                  extra={
                    <Space>
                      <Button icon={<FontAwesomeIcon icon={faFileExport} />} onClick={handleExportExcel}>Export Excel</Button>
                      <Button icon={<FontAwesomeIcon icon={faHistory} />} onClick={showHistoryModal}>History</Button>
                      <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={showAbsorptionForm}>Add Absorption</Button>
                    </Space>
                  }
                >
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label="Period">
                        <Select 
                          placeholder="Select period" 
                          allowClear
                          value={filters.period || undefined}
                          onChange={(value) => handleFilterChange('period', value)}
                          style={{ width: '100%' }}
                        >
                          {filterOptions.periods?.map(period => (
                            <Option key={period} value={period}>{period}</Option>
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
                    columns={absorptionColumns} 
                    dataSource={budgetData.absorptions?.map(item => ({ ...item, key: item.id })) || []} 
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    size="middle"
                    scroll={{ x: 1100 }}
                  />
                </Card>
              </>
            )
          },
          {
            key: 'summary',
            label: 'Summary',
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
                      title="Total Absorption" 
                      value={parseFloat(summaryData.summary?.total_absorption || 0)} 
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

                <Divider style={{ margin: '20px 0' }} />

                <Row>
                  <Col span={24}>
                    <Table 
                      columns={absorptionColumns.filter(col => col.key !== 'actions')} 
                      dataSource={summaryData.absorptions?.map((item, index) => ({ ...item, key: index })) || []} 
                      loading={loading}
                      pagination={false}
                      size="middle"
                      summary={() => {
                        const totalBudget = parseFloat(summaryData.summary?.total_budget || 0);
                        const totalAbsorption = parseFloat(summaryData.summary?.total_absorption || 0);
                        const currentRemaining = parseFloat(summaryData.summary?.current_remaining || 0);
                        const utilizationRate = totalBudget > 0 ? (totalAbsorption / totalBudget * 100).toFixed(2) : 0;

                        return (
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                              <strong>{formatNumber(totalAbsorption)}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="right">
                              <strong style={{ 
                                color: currentRemaining < 0 ? 'red' : 
                                      currentRemaining === 0 ? 'orange' : 'green' 
                              }}>
                                {formatNumber(currentRemaining)}
                              </strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3}>
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
            />
          </Form.Item>
          
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

      {/* Period Absorption Form Modal */}
      <Modal
        title="Add Period Absorption"
        open={absorptionFormVisible}
        onCancel={() => setAbsorptionFormVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAbsorptionFormVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleAbsorptionFormSubmit}>
            Save
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={absorptionForm}
          layout="vertical"
        >
          <Form.Item
            name="period"
            label="Period"
            rules={[{ required: true, message: 'Please enter period' }]}
          >
            <Input placeholder="e.g. September 2024" />
          </Form.Item>
          
          <Form.Item
            name="absorption_amount"
            label="Absorption Amount"
            rules={[{ required: true, message: 'Please enter absorption amount' }]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter absorption amount" 
              min={0}
            />
          </Form.Item>
          
          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <Input.TextArea rows={3} placeholder="Remarks or notes" />
          </Form.Item>
          
          {budgetData.master && (
            <div className="budget-info">
              <Divider />
              <p><strong>Current Budget Information:</strong></p>
              <p>Total Budget: Rp {formatNumber(budgetData.master.total_budget)}</p>
              <p>Current Remaining: Rp {formatNumber(budgetData.master.current_remaining)}</p>
            </div>
          )}
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

export default URPBudget;