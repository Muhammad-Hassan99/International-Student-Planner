"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const acceptanceData = [
  { name: 'USA', rate: 35 },
  { name: 'UK', rate: 45 },
  { name: 'Canada', rate: 55 },
  { name: 'Germany', rate: 65 },
  { name: 'Australia', rate: 50 },
];

const courseData = [
  { name: 'Computer Science', value: 400 },
  { name: 'Business', value: 300 },
  { name: 'Engineering', value: 300 },
  { name: 'Medicine', value: 200 },
  { name: 'Arts', value: 100 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-600">
            Global Admissions Trends
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Discover data-driven insights into international education. Explore acceptance rates and trending fields of study to make informed decisions for your future.
          </p>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Bar Chart: Acceptance Rates */}
          <div className="min-w-0 bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
              Average Acceptance Rates by Country
            </h2>
            <div className="h-[min(60vw,400px)] min-h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={acceptanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(value) => `${value}%`} />
                  <RechartsTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="rate" 
                    name="Acceptance Rate (%)" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Popular Courses */}
          <div className="min-w-0 bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
              Most Popular Fields of Study
            </h2>
            <div className="h-[min(60vw,400px)] min-h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {courseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold opacity-90">Highest Growth</h3>
            <p className="text-3xl font-bold mt-2">Germany (+15%)</p>
            <p className="text-sm mt-2 opacity-80">Year-over-year increase in international enrollments.</p>
          </div>
          <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold opacity-90">Top Emerging Field</h3>
            <p className="text-3xl font-bold mt-2">Data Science</p>
            <p className="text-sm mt-2 opacity-80">Seeing a massive 40% surge in applications.</p>
          </div>
          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold opacity-90">Visa Success</h3>
            <p className="text-3xl font-bold mt-2">Canada (85%)</p>
            <p className="text-sm mt-2 opacity-80">Currently holds the highest student visa approval rate.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
