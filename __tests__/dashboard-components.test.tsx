import { render } from '@testing-library/react'
import { MetricsCards } from '@/components/dashboard/MetricsCards'

// Mock data for testing
const mockAnalytics = {
  today: {
    calls: 12,
    extractions: 10,
    jobs: 8,
    customers: 5
  },
  calls: {
    total: 45,
    processed: 42,
    processingRate: 93,
    avgConfidence: 78
  },
  jobs: {
    totalJobs: 25,
    completedJobs: 18,
    completionRate: 72,
    pipeline: {
      QUOTING: { count: 3, estimatedValue: 1500, actualValue: 0 },
      CONFIRMED: { count: 4, estimatedValue: 2400, actualValue: 0 }
    }
  },
  revenue: {
    totalRevenue: 45000,
    avgJobValue: 2500,
    estimatedPipelineValue: 3900
  },
  customers: {
    total: 28,
    newThisWeek: 5,
    newThisMonth: 12,
    repeatRate: 35
  }
}

describe('Dashboard Components', () => {
  test('MetricsCards renders without crashing', () => {
    expect(() => {
      render(<MetricsCards analytics={mockAnalytics} />)
    }).not.toThrow()
  })

  test('MetricsCards displays key metrics', () => {
    const { getByText } = render(<MetricsCards analytics={mockAnalytics} />)
    
    expect(getByText("Today's Calls")).toBeInTheDocument()
    expect(getByText('Active Jobs')).toBeInTheDocument()
    expect(getByText('Total Revenue')).toBeInTheDocument()
    expect(getByText('Customers')).toBeInTheDocument()
  })

  test('MetricsCards formats numbers correctly', () => {
    const { getByText } = render(<MetricsCards analytics={mockAnalytics} />)
    
    expect(getByText('12')).toBeInTheDocument() // Today's calls
    expect(getByText('$45,000')).toBeInTheDocument() // Total revenue formatted
    expect(getByText('28')).toBeInTheDocument() // Total customers
  })
})