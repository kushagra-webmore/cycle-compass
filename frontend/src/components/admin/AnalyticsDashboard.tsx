import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardAnalytics } from '@/hooks/api/admin';
import { Loader2 } from 'lucide-react';

export function AnalyticsDashboard() {
  const [days, setDays] = useState('30');
  const { data, isLoading } = useDashboardAnalytics(parseInt(days));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">No analytics data available</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-display">Performance Metrics</h2>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="14">Last 14 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New signups over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8BA7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF8BA7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => d.slice(5)} 
                  stroke="#888" 
                  fontSize={12}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                />
                <Area type="monotone" dataKey="newUsers" stroke="#FF8BA7" fillOpacity={1} fill="url(#colorUsers)" name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chatbot Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Chatbot Engagement</CardTitle>
            <CardDescription>Messages sent per day</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => d.slice(5)} 
                  stroke="#888"
                  fontSize={12}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                />
                <Bar dataKey="messages" name="Messages" fill="#9381FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cycle Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Cycle Tracking</CardTitle>
            <CardDescription>New cycles started</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => d.slice(5)} 
                  stroke="#888"
                  fontSize={12}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="cyclesStarted" name="Cycles Started" stroke="#33C1B1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Combined activity trend</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(d) => d.slice(5)} 
                  stroke="#888"
                  fontSize={12}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                />
                <Legend />
                <Line type="monotone" dataKey="messages" name="Messages" stroke="#9381FF" strokeWidth={2} />
                <Line type="monotone" dataKey="newUsers" name="Signups" stroke="#FF8BA7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
