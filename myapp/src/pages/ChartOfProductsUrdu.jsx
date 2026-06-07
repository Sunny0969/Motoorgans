import React, { useState } from 'react';

const ChartsOfProductsUrdu = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [timeRange, setTimeRange] = useState('monthly');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sample data for charts
  const chartData = {
    sales: {
      labels: ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون'],
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      backgroundColor: '#3498db'
    },
    revenue: {
      labels: ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون'],
      data: [45000, 52000, 48000, 62000, 58000, 75000],
      backgroundColor: '#27ae60'
    },
    products: {
      labels: ['ٹی شرٹ', 'جینز', 'جیکٹ', 'جوتے', 'بیگز'],
      data: [150, 200, 80, 120, 60],
      backgroundColor: '#e74c3c'
    },
    categories: {
      labels: ['مردانہ', 'زنانہ', 'بچوں', 'اسپورٹس'],
      data: [35, 40, 15, 10],
      backgroundColor: ['#3498db', '#e74c3c', '#f39c12', '#9b59b6']
    }
  };

  const topProducts = [
    { id: 1, name: 'مینز ٹی شرٹ', sales: 150, revenue: 75000, growth: '+15%' },
    { id: 2, name: 'ویمنز جینز', sales: 120, revenue: 84000, growth: '+8%' },
    { id: 3, name: 'اسپورٹس شوز', sales: 80, revenue: 64000, growth: '+22%' },
    { id: 4, name: 'ونٹر جیکٹ', sales: 45, revenue: 135000, growth: '+5%' },
    { id: 5, name: 'کیژل بیگز', sales: 60, revenue: 42000, growth: '+12%' }
  ];

  const categories = [
    { id: 1, name: 'مردانہ', count: 45, revenue: 450000 },
    { id: 2, name: 'زنانہ', count: 52, revenue: 520000 },
    { id: 3, name: 'بچوں', count: 28, revenue: 168000 },
    { id: 4, name: 'اسپورٹس', count: 35, revenue: 280000 }
  ];

  // Styles objects
  const containerStyle = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    padding: '0',
    margin: '0',
    direction: 'rtl'
  };

  const wrapperStyle = {
    backgroundColor: 'white',
    margin: '0',
    padding: '0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  const headerStyle = {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid #3498db'
  };

  const headerTitleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  };

  const headerControlsStyle = {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  };

  const timeFilterStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  };

  const filterLabelStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white'
  };

  const filterSelectStyle = {
    padding: '8px 15px',
    border: '1px solid #bdc3c7',
    borderRadius: '6px',
    backgroundColor: 'white',
    fontSize: '14px',
    fontWeight: '500'
  };

  const mainContentStyle = {
    padding: '25px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '10px'
  };

  const statCardStyle = {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    borderLeft: '5px solid #3498db',
    textAlign: 'center'
  };

  const statCardPrimaryStyle = {
    borderLeftColor: '#3498db'
  };

  const statCardSuccessStyle = {
    borderLeftColor: '#27ae60'
  };

  const statCardWarningStyle = {
    borderLeftColor: '#f39c12'
  };

  const statCardDangerStyle = {
    borderLeftColor: '#e74c3c'
  };

  const statValueStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '10px 0',
    color: '#2c3e50'
  };

  const statLabelStyle = {
    fontSize: '16px',
    color: '#7f8c8d',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const statTrendStyle = {
    fontSize: '14px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '12px',
    display: 'inline-block'
  };

  const trendUpStyle = {
    backgroundColor: '#d5f4e6',
    color: '#27ae60'
  };

  const trendDownStyle = {
    backgroundColor: '#fadbd8',
    color: '#e74c3c'
  };

  const tabsContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  };

  const tabsHeaderStyle = {
    display: 'flex',
    backgroundColor: '#ecf0f1',
    borderBottom: '1px solid #bdc3c7'
  };

  const tabStyle = {
    padding: '15px 25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const activeTabStyle = {
    backgroundColor: '#3498db',
    color: 'white'
  };

  const tabContentStyle = {
    padding: '25px',
    minHeight: '400px'
  };

  const chartsGridStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '25px',
    alignItems: 'start'
  };

  const mainChartStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    height: '400px'
  };

  const chartTitleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const sidePanelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  };

  const topProductsStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '10px',
    borderBottom: '2px solid #ecf0f1'
  };

  const productListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const productItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  };

  const productInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const productNameStyle = {
    fontWeight: '600',
    color: '#2c3e50'
  };

  const productStatsStyle = {
    fontSize: '12px',
    color: '#7f8c8d',
    display: 'flex',
    gap: '10px'
  };

  const categoriesGridStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };

  const categoryListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  };

  const categoryItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #3498db'
  };

  const categoryInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  };

  const categoryNameStyle = {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '16px'
  };

  const categoryCountStyle = {
    fontSize: '14px',
    color: '#7f8c8d'
  };

  const categoryRevenueStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#27ae60'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '20px'
  };

  const btnStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  };

  const btnPrimaryStyle = {
    backgroundColor: '#3498db',
    color: 'white'
  };

  const btnSecondaryStyle = {
    backgroundColor: '#95a5a6',
    color: 'white'
  };

  // Bar Chart Styles
  const barChartStyle = {
    height: '300px',
    display: 'flex',
    alignItems: 'end',
    gap: '15px',
    justifyContent: 'center',
    padding: '20px'
  };

  const barContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  };

  const barStyle = {
    width: '40px',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const barLabelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#2c3e50'
  };

  // Pie Chart Styles
  const pieChartStyle = {
    height: '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  };

  const pieContainerStyle = {
    width: '200px',
    height: '200px',
    position: 'relative',
    borderRadius: '50%',
    overflow: 'hidden'
  };

  const pieSegmentStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)',
    transformOrigin: 'center'
  };

  const pieLabelStyle = {
    position: 'absolute',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2c3e50',
    transform: 'translate(-50%, -50%)'
  };

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data, color }) => {
    const maxValue = Math.max(...data.data);
    
    return (
      <div style={barChartStyle}>
        {data.labels.map((label, index) => (
          <div key={`bar-${index}`} style={barContainerStyle}>
            <div
              style={{
                ...barStyle,
                height: `${(data.data[index] / maxValue) * 200}px`,
                backgroundColor: color || data.backgroundColor
              }}
              title={`${label}: ${data.data[index].toLocaleString()}`}
            />
            <div style={barLabelStyle}>{label}</div>
          </div>
        ))}
      </div>
    );
  };

  // Simple Pie Chart Component
  const SimplePieChart = ({ data }) => {
    const total = data.data.reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;

    return (
      <div style={pieChartStyle}>
        <div style={pieContainerStyle}>
          {data.data.map((value, index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            
            const segmentStyle = {
              ...pieSegmentStyle,
              backgroundColor: data.backgroundColor[index],
              transform: `rotate(${currentAngle}deg)`
            };
            
            const labelAngle = currentAngle + angle / 2;
            const radius = 70;
            const labelX = 100 + Math.cos((labelAngle - 90) * (Math.PI / 180)) * radius;
            const labelY = 100 + Math.sin((labelAngle - 90) * (Math.PI / 180)) * radius;
            
            currentAngle += angle;
            
            return (
              <React.Fragment key={`pie-${index}`}>
                <div style={segmentStyle} />
                <div
                  style={{
                    ...pieLabelStyle,
                    left: `${labelX}px`,
                    top: `${labelY}px`
                  }}
                >
                  {data.labels[index]}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Render the appropriate chart based on activeTab
  const renderChart = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <div>
            <div style={chartTitleStyle}>ماہانہ فروخت کا چارٹ</div>
            <SimpleBarChart data={chartData.sales} color="#3498db" />
          </div>
        );
      case 'revenue':
        return (
          <div>
            <div style={chartTitleStyle}>ماہانہ آمدنی کا چارٹ</div>
            <SimpleBarChart data={chartData.revenue} color="#27ae60" />
          </div>
        );
      case 'products':
        return (
          <div>
            <div style={chartTitleStyle}>مصنوعات کی کارکردگی</div>
            <SimpleBarChart data={chartData.products} color="#e74c3c" />
          </div>
        );
      case 'categories':
        return (
          <div>
            <div style={chartTitleStyle}>مصنوعات کی اقسام کی تقسیم</div>
            <SimplePieChart data={chartData.categories} />
          </div>
        );
      default:
        return (
          <div>
            <div style={chartTitleStyle}>ماہانہ فروخت کا چارٹ</div>
            <SimpleBarChart data={chartData.sales} color="#3498db" />
          </div>
        );
    }
  };

  // Button click handlers
  const handleDownloadReport = () => {
    alert('رپورٹ ڈاؤن لوڈ ہو رہی ہے...');
  };

  const handlePrintChart = () => {
    alert('چارٹ پرنٹ ہو رہا ہے...');
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={headerTitleStyle}>
            📊 مصنوعات کے چارٹ
          </h1>
          <div style={headerControlsStyle}>
            <div style={timeFilterStyle}>
              <span style={filterLabelStyle}>وقت کی حد:</span>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="daily">روزانہ</option>
                <option value="weekly">ہفتہ وار</option>
                <option value="monthly">ماہانہ</option>
                <option value="yearly">سالانہ</option>
              </select>
            </div>
            <div style={timeFilterStyle}>
              <span style={filterLabelStyle}>قسم:</span>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="all">تمام اقسام</option>
                <option value="men">مردانہ</option>
                <option value="women">زنانہ</option>
                <option value="kids">بچوں</option>
                <option value="sports">اسپورٹس</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={mainContentStyle}>
          {/* Statistics Cards */}
          <div style={statsGridStyle}>
            <div style={{...statCardStyle, ...statCardPrimaryStyle}}>
              <div style={statLabelStyle}>💰 کل فروخت</div>
              <div style={statValueStyle}>₨ 245,000</div>
              <div style={{...statTrendStyle, ...trendUpStyle}}>+12% گزشتہ ماہ</div>
            </div>
            <div style={{...statCardStyle, ...statCardSuccessStyle}}>
              <div style={statLabelStyle}>📈 کل آمدنی</div>
              <div style={statValueStyle}>₨ 1,856,000</div>
              <div style={{...statTrendStyle, ...trendUpStyle}}>+8% گزشتہ ماہ</div>
            </div>
            <div style={{...statCardStyle, ...statCardWarningStyle}}>
              <div style={statLabelStyle}>🛍️ مصنوعات فروخت</div>
              <div style={statValueStyle}>1,245</div>
              <div style={{...statTrendStyle, ...trendUpStyle}}>+15% گزشتہ ماہ</div>
            </div>
            <div style={{...statCardStyle, ...statCardDangerStyle}}>
              <div style={statLabelStyle}>📦 اوسط آرڈر</div>
              <div style={statValueStyle}>₨ 2,450</div>
              <div style={{...statTrendStyle, ...trendDownStyle}}>-3% گزشتہ ماہ</div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={tabsContainerStyle}>
            <div style={tabsHeaderStyle}>
              <button 
                style={{...tabStyle, ...(activeTab === 'sales' && activeTabStyle)}}
                onClick={() => setActiveTab('sales')}
              >
                📈 فروخت کے چارٹ
              </button>
              <button 
                style={{...tabStyle, ...(activeTab === 'revenue' && activeTabStyle)}}
                onClick={() => setActiveTab('revenue')}
              >
                💰 آمدنی کے چارٹ
              </button>
              <button 
                style={{...tabStyle, ...(activeTab === 'products' && activeTabStyle)}}
                onClick={() => setActiveTab('products')}
              >
                🛍️ مصنوعات کی کارکردگی
              </button>
              <button 
                style={{...tabStyle, ...(activeTab === 'categories' && activeTabStyle)}}
                onClick={() => setActiveTab('categories')}
              >
                🗂️ اقسام کی تقسیم
              </button>
            </div>

            <div style={tabContentStyle}>
              <div style={chartsGridStyle}>
                {/* Main Chart Area */}
                <div style={mainChartStyle}>
                  {renderChart()}
                </div>

                {/* Side Panel */}
                <div style={sidePanelStyle}>
                  {/* Top Products */}
                  <div style={topProductsStyle}>
                    <div style={sectionTitleStyle}>
                      🏆 سب سے زیادہ فروخت ہونے والی مصنوعات
                    </div>
                    <div style={productListStyle}>
                      {topProducts.map(product => (
                        <div key={product.id} style={productItemStyle}>
                          <div style={productInfoStyle}>
                            <div style={productNameStyle}>{product.name}</div>
                            <div style={productStatsStyle}>
                              <span>فروخت: {product.sales}</span>
                              <span>آمدنی: ₨{product.revenue.toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{...statTrendStyle, ...trendUpStyle}}>
                            {product.growth}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categories Performance */}
                  <div style={categoriesGridStyle}>
                    <div style={sectionTitleStyle}>
                      🗂️ اقسام کی کارکردگی
                    </div>
                    <div style={categoryListStyle}>
                      {categories.map((category) => (
                        <div key={category.id} style={categoryItemStyle}>
                          <div style={categoryInfoStyle}>
                            <div style={categoryNameStyle}>{category.name}</div>
                            <div style={categoryCountStyle}>
                              {category.count} مصنوعات
                            </div>
                          </div>
                          <div style={categoryRevenueStyle}>
                            ₨{category.revenue.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={actionButtonsStyle}>
                <button 
                  style={{...btnStyle, ...btnPrimaryStyle}}
                  onClick={handleDownloadReport}
                >
                  📥 رپورٹ ڈاؤن لوڈ کریں
                </button>
                <button 
                  style={{...btnStyle, ...btnSecondaryStyle}}
                  onClick={handlePrintChart}
                >
                  🖨️ پرنٹ چارٹ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsOfProductsUrdu;