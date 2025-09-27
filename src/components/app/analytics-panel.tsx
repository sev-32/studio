'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { BarChart, Grid3x3 } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';

const chartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
  { month: 'April', desktop: 73 },
  { month: 'May', desktop: 209 },
  { month: 'June', desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: 'Pixels',
    color: 'hsl(var(--primary))',
  },
};

export function AnalyticsPanel() {
  return (
    <Card className="mt-4 md:mt-6">
      <CardHeader>
        <CardTitle className="font-headline">Visual Analytics Panel</CardTitle>
        <CardDescription>
          Intermediate states and final outputs of algorithms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="histogram">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="histogram">
              <BarChart className="mr-2" />
              Histogram
            </TabsTrigger>
            <TabsTrigger value="pixel-grid">
              <Grid3x3 className="mr-2" />
              Pixel Grid
            </TabsTrigger>
          </TabsList>
          <TabsContent value="histogram" className="mt-4">
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <RechartsBarChart accessibilityLayer data={chartData}>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="pixel-grid" className="mt-4">
            <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed bg-secondary text-center">
              <p className="text-muted-foreground">
                Pixel Grid visualization will appear here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
