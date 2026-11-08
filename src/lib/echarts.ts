// Registers only the ECharts parts the app draws with, so the bundle leaves out every other chart type.
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, TitleComponent, ToolboxComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, BarChart, GridComponent, TitleComponent, TooltipComponent, ToolboxComponent, DataZoomComponent, CanvasRenderer]);

export default echarts;
