'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Phone, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react'

interface BusinessMetrics {
  revenue: {
    total: number
    growth: number
    avgPerCall: number
    recurring: number
  }
  customers: {
    total: number
    new: number
    retained: number
    churnRate: number
    satisfactionScore: number
  }
  operations: {
    callVolume: number
    conversionRate: number
    processingEfficiency: number
    aiAccuracy: number
    staffUtilization: number
  }
  growth: {
    revenueGrowth: number
    customerGrowth: number
    callVolumeGrowth: number
    marketShare: number
  }
}

interface ROIAnalysis {
  totalInvestment: number
  totalRevenue: number
  netProfit: number
  roi: number
  paybackPeriod: number
  costPerCall: number
  revenuePerCall: number
  efficiency: {
    manualVsAutomated: number
    timeSaved: number
    errorReduction: number
    customerSatisfaction: number
  }
}

interface PredictiveInsights {
  nextMonthPrediction: {
    callVolume: number
    revenue: number
    customers: number
    confidence: number
  }
  trends: {
    metric: string
    direction: 'up' | 'down' | 'stable'
    strength: 'weak' | 'moderate' | 'strong'
    prediction: string
  }[]
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    expectedImpact: string
    timeframe: string
  }[]
}

interface ExecutiveReport {
  period: string
  executiveSummary: string
  keyMetrics: BusinessMetrics
  achievements: string[]
  challenges: string[]
  priorities: string[]
  roi: ROIAnalysis
  predictions: PredictiveInsights
  actionItems: {
    item: string
    owner: string
    dueDate: string
    priority: 'high' | 'medium' | 'low'
  }[]
}

export default function BusinessIntelligenceDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [roi, setRoi] = useState<ROIAnalysis | null>(null)
  const [insights, setInsights] = useState<PredictiveInsights | null>(null)
  const [report, setReport] = useState<ExecutiveReport | null>(null)
  const [timeRange, setTimeRange] = useState<'month' | 'quarter'>('month')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchBusinessData = async () => {
    setLoading(true)
    try {
      const [metricsRes, roiRes, insightsRes, reportRes] = await Promise.all([
        fetch(`/api/monitoring/business-intelligence?type=metrics&timeRange=${timeRange}`),
        fetch(`/api/monitoring/business-intelligence?type=roi&timeRange=${timeRange}`),
        fetch(`/api/monitoring/business-intelligence?type=insights`),
        fetch(`/api/monitoring/business-intelligence?type=report&timeRange=${timeRange}`)
      ])

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data.data)
      }

      if (roiRes.ok) {
        const data = await roiRes.json()
        setRoi(data.data)
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json()
        setInsights(data.data)
      }

      if (reportRes.ok) {
        const data = await reportRes.json()
        setReport(data.data)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch business intelligence data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinessData()
  }, [timeRange])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (direction: string) => {
    return direction === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <p className="text-gray-600">Comprehensive business analytics and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter')}
            className="border rounded px-3 py-2"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Button onClick={fetchBusinessData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          {lastUpdate && (
            <p className="text-sm text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="executive">Executive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.total)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      {getTrendIcon(metrics.revenue.growth > 0 ? 'up' : 'down')}
                      <span className="ml-1">{formatPercentage(metrics.revenue.growth)} from last period</span>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.customers.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      +{metrics.customers.new} new customers
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Call Volume</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.operations.callVolume.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.operations.conversionRate.toFixed(1)}% conversion rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.operations.aiAccuracy.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.operations.processingEfficiency.toFixed(1)}% efficiency
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Satisfaction Score</span>
                      <span className="font-semibold">{metrics.customers.satisfactionScore}%</span>
                    </div>
                    <Progress value={metrics.customers.satisfactionScore} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span>Retention Rate</span>
                      <span className="font-semibold">{(100 - metrics.customers.churnRate).toFixed(1)}%</span>
                    </div>
                    <Progress value={100 - metrics.customers.churnRate} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Operational Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Processing Efficiency</span>
                      <span className="font-semibold">{metrics.operations.processingEfficiency.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.operations.processingEfficiency} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span>Staff Utilization</span>
                      <span className="font-semibold">{metrics.operations.staffUtilization}%</span>
                    </div>
                    <Progress value={metrics.operations.staffUtilization} className="h-2" />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {roi && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      ROI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-green-600">{roi.roi.toFixed(1)}%</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Investment:</span>
                        <span>{formatCurrency(roi.totalInvestment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span>{formatCurrency(roi.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Net Profit:</span>
                        <span className={roi.netProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(roi.netProfit)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Cost per Call</span>
                        <span className="font-semibold">{formatCurrency(roi.costPerCall)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue per Call</span>
                        <span className="font-semibold">{formatCurrency(roi.revenuePerCall)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payback Period</span>
                        <span className="font-semibold">{roi.paybackPeriod.toFixed(1)} months</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Efficiency Gains</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">vs Manual Process</span>
                          <span className="text-sm font-semibold">{roi.efficiency.manualVsAutomated}% faster</span>
                        </div>
                        <Progress value={roi.efficiency.manualVsAutomated} className="h-2" />
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Time Saved:</span>
                          <span>{roi.efficiency.timeSaved} hrs/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Reduction:</span>
                          <span>{roi.efficiency.errorReduction}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {metrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Operational Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>AI Accuracy</span>
                          <span className="font-semibold">{metrics.operations.aiAccuracy.toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.operations.aiAccuracy} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Conversion Rate</span>
                          <span className="font-semibold">{metrics.operations.conversionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.operations.conversionRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Processing Efficiency</span>
                          <span className="font-semibold">{metrics.operations.processingEfficiency.toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.operations.processingEfficiency} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Growth Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          +{metrics.growth.callVolumeGrowth}%
                        </div>
                        <div className="text-sm text-muted-foreground">Call Volume</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          +{metrics.customers.new}
                        </div>
                        <div className="text-sm text-muted-foreground">New Customers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {metrics.growth.marketShare}%
                        </div>
                        <div className="text-sm text-muted-foreground">Market Share</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {formatPercentage(metrics.revenue.growth)}
                        </div>
                        <div className="text-sm text-muted-foreground">Revenue Growth</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {insights && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Next Month Forecast
                    </CardTitle>
                    <CardDescription>
                      {insights.nextMonthPrediction.confidence}% confidence
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Call Volume</span>
                        <span className="font-semibold">
                          {insights.nextMonthPrediction.callVolume.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue</span>
                        <span className="font-semibold">
                          {formatCurrency(insights.nextMonthPrediction.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Customers</span>
                        <span className="font-semibold">
                          {insights.nextMonthPrediction.customers}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Market Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.trends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            {getTrendIcon(trend.direction)}
                            <div>
                              <div className="font-medium">{trend.metric}</div>
                              <div className="text-sm text-muted-foreground">{trend.prediction}</div>
                            </div>
                          </div>
                          <Badge variant={trend.strength === 'strong' ? 'default' : 'secondary'}>
                            {trend.strength}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Strategic Recommendations</CardTitle>
                  <CardDescription>AI-powered insights for business optimization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{rec.category}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{rec.timeframe}</span>
                        </div>
                        <h4 className="font-medium mb-1">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <p className="text-sm font-medium text-green-600">{rec.expectedImpact}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="executive" className="space-y-6">
          {report && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Executive Summary - {report.period}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {report.executiveSummary}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Key Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.achievements.map((achievement, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      Current Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.challenges.length > 0 ? (
                      <ul className="space-y-2">
                        {report.challenges.map((challenge, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No significant challenges identified</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Target className="h-5 w-5" />
                      Strategic Priorities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.priorities.map((priority, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          {priority}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.actionItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.item}</div>
                          <div className="text-sm text-muted-foreground">
                            Owner: {item.owner} • Due: {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}