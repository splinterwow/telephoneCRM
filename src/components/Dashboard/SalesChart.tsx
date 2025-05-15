
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { useTranslation } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";

// Sample data
const data = [
  { name: '1', sales: 3400 },
  { name: '2', sales: 2800 },
  { name: '3', sales: 4300 },
  { name: '4', sales: 3900 },
  { name: '5', sales: 5000 },
  { name: '6', sales: 4800 },
  { name: '7', sales: 6000 },
  { name: '8', sales: 5500 },
  { name: '9', sales: 4700 },
  { name: '10', sales: 5200 },
  { name: '11', sales: 5800 },
  { name: '12', sales: 7000 },
  { name: '13', sales: 6800 },
  { name: '14', sales: 6500 },
  { name: '15', sales: 5900 },
  { name: '16', sales: 6200 },
  { name: '17', sales: 7400 },
  { name: '18', sales: 6700 },
  { name: '19', sales: 7500 },
  { name: '20', sales: 8000 },
  { name: '21', sales: 7800 },
  { name: '22', sales: 7200 },
  { name: '23', sales: 8300 },
  { name: '24', sales: 8800 },
  { name: '25', sales: 9000 },
  { name: '26', sales: 8500 },
  { name: '27', sales: 8700 },
  { name: '28', sales: 9200 },
  { name: '29', sales: 9500 },
  { name: '30', sales: 10000 },
];

interface SalesChartProps {
  title: string;
}

export function SalesChart({ title }: SalesChartProps) {
  // const { t } = useTranslation();
  const { isDarkMode } = useApp();

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6E59A5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6E59A5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} 
              />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                stroke={isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} 
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke={isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()}`,]} 
                labelFormatter={(label) => `${("day")} ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#6E59A5" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
