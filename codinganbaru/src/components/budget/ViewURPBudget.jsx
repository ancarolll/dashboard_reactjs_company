import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, Card, Row, Col, Statistic, Divider, Typography } from 'antd';
import moment from 'moment';
import '../../styles/main.css';

const { Title } = Typography;

/**
 * ViewURPBudget Component - Displays URP budget summary data
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.embedded - Whether component is embedded in another page
 * @param {string} props.apiUrl - API URL base path (defaults to '/api/urpbudget')
 * @param {Function} props.onDataChange - Callback when data changes
 */

const ViewURPBudget = ({ 
  embedded = false, 
  apiUrl = '/api/urpbudget',
  onDataChange = null
}) => {
  // State for loading
  const [loading, setLoading] = useState(false);
  
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
  
  // Absorption table columns (simplified for summary view)
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
    }
  ];
  
  return (
    <div className="reg2x-budget-container" style={{ padding: embedded ? 0 : '20px' }}>
      {!embedded && (
        <Title level={2}>URP Budget Summary</Title>
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
              columns={absorptionColumns} 
              dataSource={summaryData.absorptions ? summaryData.absorptions.map((item, index) => ({ ...item, key: index })) : []} 
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
    </div>
  );
};

export default ViewURPBudget;