import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, Card, Row, Col, Statistic, Divider, Typography } from 'antd';
import moment from 'moment';
import '../../styles/main.css';

const { Title } = Typography;

/**
 * View2Z7WBudget Component - Displays Regional 2 Z7W budget summary data
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.embedded - Whether component is embedded in another page
 * @param {string} props.apiUrl - API URL base path (defaults to '/api/reg2z7wbudget')
 * @param {Function} props.onDataChange - Callback when data changes
 */

const View2Z7WBudget = ({ 
  embedded = false, 
  apiUrl = '/api/reg2z7wbudget',
  onDataChange = null
}) => {
  // State for loading
  const [loading, setLoading] = useState(false);
  
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
      total_termin5: 0,
      total_termin6: 0,
      total_actualization: 0,
      current_remaining: 0
    }
  });
  
  // Fetch summary data
  const fetchSummaryData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/summary`);
      
      if (response.data.success) {
        setSummaryData(response.data.data);
        
        // If callback provided, call it with the data
        if (onDataChange) {
          onDataChange(response.data.data);
        }
      } else {
        console.error('Failed to fetch budget summary data');
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, onDataChange]);
  
  // Load data on initial render and when dependencies change
  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);
  
  // Format numbers
  const formatNumber = (value) => {
    return value ? parseFloat(value).toLocaleString('en-US') : '0';
  };
  
  // Project table columns (simplified for summary view - no actions column)
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
      width: 100,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 2',
      dataIndex: 'termin2',
      key: 'termin2',
      width: 100,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 3',
      dataIndex: 'termin3',
      key: 'termin3',
      width: 100,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 4',
      dataIndex: 'termin4',
      key: 'termin4',
      width: 100,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 5',
      dataIndex: 'termin5',
      key: 'termin5',
      width: 100,
      render: (text) => text ? parseFloat(text).toLocaleString('en-US') : '0',
      align: 'right',
    },
    {
      title: 'Termin 6',
      dataIndex: 'termin6',
      key: 'termin6',
      width: 100,
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
    }
  ];
  
  return (
    <div className="reg2x-budget-container" style={{ padding: embedded ? 0 : '20px' }}>
      {!embedded && (
        <Title level={2}>Regional 2 Z7W Budget Summary</Title>
      )}
      
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
          <Col xs={24} sm={4}>
            <Statistic
              title="Total Termin 1"
              value={parseFloat(summaryData.summary?.total_termin1 || 0)}
              precision={0}
              formatter={(value) => `Rp ${formatNumber(value)}`}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Statistic
              title="Total Termin 2"
              value={parseFloat(summaryData.summary?.total_termin2 || 0)}
              precision={0}
              formatter={(value) => `Rp ${formatNumber(value)}`}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Statistic
              title="Total Termin 3"
              value={parseFloat(summaryData.summary?.total_termin3 || 0)}
              precision={0}
              formatter={(value) => `Rp ${formatNumber(value)}`}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Statistic
              title="Total Termin 4"
              value={parseFloat(summaryData.summary?.total_termin4 || 0)}
              precision={0}
              formatter={(value) => `Rp ${formatNumber(value)}`}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Statistic
              title="Total Termin 5"
              value={parseFloat(summaryData.summary?.total_termin5 || 0)}
              precision={0}
              formatter={(value) => `Rp ${formatNumber(value)}`}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Statistic
              title="Total Termin 6"
              value={parseFloat(summaryData.summary?.total_termin6 || 0)}
              precision={0}
              formatter={(value) => `Rp ${formatNumber(value)}`}
            />
          </Col>
        </Row>

        <Divider style={{ margin: '20px 0' }} />

        <Row>
          <Col span={24}>
            <Table 
              columns={projectColumns} 
              dataSource={summaryData.projects ? summaryData.projects.map((item, index) => ({ ...item, key: index })) : []} 
              loading={loading}
              pagination={false}
              size="middle"
              scroll={{ x: 1700 }}
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
                      <strong>{formatNumber(summaryData.summary?.total_termin5 || 0)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      <strong>{formatNumber(summaryData.summary?.total_termin6 || 0)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      <strong>{formatNumber(totalActualization)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">
                      <strong style={{ 
                        color: currentRemaining < 0 ? 'red' : 
                              currentRemaining === 0 ? 'orange' : 'green' 
                      }}>
                        {formatNumber(currentRemaining)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={10}>
                      <strong>Utilization: {utilizationRate}%</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default View2Z7WBudget;