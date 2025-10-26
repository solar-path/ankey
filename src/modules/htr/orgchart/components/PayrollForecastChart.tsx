/**
 * Payroll Forecast Chart Component
 * Displays 18-month payroll forecast with min/max/avg scenarios
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/lib/ui/chart";
import type { ChartConfig } from "@/lib/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface PayrollForecastData {
  months: string[];
  minPayroll: number[];
  maxPayroll: number[];
  avgPayroll: number[];
}

interface PayrollForecastChartProps {
  data: PayrollForecastData;
  currency?: string;
  title?: string;
  description?: string;
}

const chartConfig = {
  min: {
    label: "Minimum",
    color: "hsl(var(--chart-1))",
  },
  avg: {
    label: "Average",
    color: "hsl(var(--chart-2))",
  },
  max: {
    label: "Maximum",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function PayrollForecastChart({
  data,
  currency = "USD",
  title = "Payroll Forecast",
  description = "18-month payroll projection with min/max/avg scenarios",
}: PayrollForecastChartProps) {
  // Transform data for recharts
  const chartData = data.months.map((month, index) => ({
    month,
    min: data.minPayroll[index],
    avg: data.avgPayroll[index],
    max: data.maxPayroll[index],
  }));

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="min"
              type="natural"
              fill="var(--color-min)"
              fillOpacity={0.4}
              stroke="var(--color-min)"
              stackId="a"
            />
            <Area
              dataKey="avg"
              type="natural"
              fill="var(--color-avg)"
              fillOpacity={0.4}
              stroke="var(--color-avg)"
              stackId="b"
            />
            <Area
              dataKey="max"
              type="natural"
              fill="var(--color-max)"
              fillOpacity={0.4}
              stroke="var(--color-max)"
              stackId="c"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
