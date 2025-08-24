'use client'

interface Analytics {
  today: {
    calls: number
    extractions: number
    jobs: number
    customers: number
  }
  calls: {
    total: number
    processed: number
    processingRate: number
    avgConfidence: number
  }
  jobs: {
    totalJobs: number
    completedJobs: number
    completionRate: number
    pipeline: Record<string, { count: number; estimatedValue: number; actualValue: number }>
  }
  revenue: {
    totalRevenue: number
    avgJobValue: number
    estimatedPipelineValue: number
  }
  customers: {
    total: number
    newThisWeek: number
    newThisMonth: number
    repeatRate: number
  }
}

interface MetricsCardsProps {
  analytics: Analytics
}

export function MetricsCards({ analytics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Today's Calls",
      value: analytics.today.calls,
      subtitle: `${analytics.today.extractions} processed`,
      icon: "📞",
      color: "bg-blue-50 text-blue-600",
      trend: analytics.calls.processingRate > 0 ? `${analytics.calls.processingRate}% processing rate` : undefined
    },
    {
      title: "Active Jobs",
      value: analytics.jobs.totalJobs - analytics.jobs.completedJobs,
      subtitle: `${analytics.jobs.completedJobs} completed`,
      icon: "📋",
      color: "bg-purple-50 text-purple-600",
      trend: analytics.jobs.completionRate > 0 ? `${analytics.jobs.completionRate}% completion rate` : undefined
    },
    {
      title: "Total Revenue",
      value: `$${Math.round(analytics.revenue.totalRevenue).toLocaleString()}`,
      subtitle: `$${Math.round(analytics.revenue.avgJobValue)} avg job`,
      icon: "💰",
      color: "bg-green-50 text-green-600",
      trend: analytics.revenue.estimatedPipelineValue > 0 ? 
        `$${Math.round(analytics.revenue.estimatedPipelineValue).toLocaleString()} in pipeline` : undefined
    },
    {
      title: "Customers",
      value: analytics.customers.total,
      subtitle: `${analytics.customers.newThisWeek} new this week`,
      icon: "👥",
      color: "bg-orange-50 text-orange-600",
      trend: analytics.customers.repeatRate > 0 ? `${analytics.customers.repeatRate}% repeat customers` : undefined
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <MetricCard key={index} {...card} />
      ))}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: string
  color: string
  trend?: string
}

function MetricCard({ title, value, subtitle, icon, color, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${color} mr-3`}>
            <span className="text-lg">{icon}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        <div className="text-sm text-gray-600">
          {subtitle}
        </div>
        
        {trend && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}