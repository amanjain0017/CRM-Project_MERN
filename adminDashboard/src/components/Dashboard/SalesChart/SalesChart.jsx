import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDailyClosedLeads } from "../../../redux/slices/dashboardSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./SalesChartStyle.css";

const SalesChart = () => {
  const dispatch = useDispatch();
  const { dailyClosedLeads, isLoading, error } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchDailyClosedLeads());
  }, [dispatch]);

  // 'date' is a string and 'count' is number
  const chartData = dailyClosedLeads.map((item) => ({
    date: item.date,
    count: item.count,
  }));

  if (isLoading && dailyClosedLeads.length === 0) {
    return (
      <div className="sales-chart-container">
        <h3 className="dashboard-section-title">Sales Analytics</h3>
        <div className="chart-placeholder">
          <p>Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error && dailyClosedLeads.length === 0) {
    return (
      <div className="sales-chart-container">
        <h3 className="dashboard-section-title">Sales Analytics</h3>
        <div className="chart-placeholder error-message">
          <p>Error loading sales data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-chart-container">
      <h3 className="dashboard-section-title">Sales Analytics</h3>
      <div className="chart-wrapper">
        {/* Added a wrapper for ResponsiveContainer */}
        {dailyClosedLeads.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />

              <Tooltip />
              <Bar
                dataKey="count"
                fill="#d9d9d9" // Bar color
                barSize={30} // Adjust bar width
                radius={[5, 5, 0, 0]} // Rounded top corners
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">
            <p>No closed leads data available for the last 14 days.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesChart;
