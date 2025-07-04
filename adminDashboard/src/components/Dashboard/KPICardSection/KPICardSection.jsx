import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOverallSummary } from "../../../redux/slices/dashboardSlice";

import "./KPICardSectionStyle.css";

const KPICard = ({ title, value, description }) => (
  <div className="kpi-card">
    <h4 className="kpi-title">{title}</h4>
    <p className="kpi-value">{value}</p>
    <p className="kpi-description">{description}</p>
  </div>
);

const KPICardSection = () => {
  const dispatch = useDispatch();
  const { summary, isLoading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchOverallSummary());
  }, [dispatch]);

  if (isLoading && !summary) {
    return <div className="loading-message">Loading KPIs...</div>;
  }

  if (error && !summary) {
    return <div className="error-message">Error loading KPIs: {error}</div>;
  }

  // KPIs to display
  const selectedKpis = summary
    ? [
        {
          title: "Unassigned Leads",
          value: summary.unassignedLeads,
          description: "Leads without an assigned employee",
        },
        {
          title: "Leads Assigned (Week)",
          value: summary.leadsAssignedLastWeek,
          description: "Leads assigned in last 7 days",
        },
        {
          title: "Active Employees",
          value: summary.activeEmployees,
          description: "Currently active/online employees",
        },
        {
          title: "Overall Conversion Rate",
          value: `${summary.conversionRate}%`,
          description: "Converted leads / Total leads",
        },
      ]
    : [
        // Fallback placeholders
        { title: "Unassigned Leads", value: "N/A", description: "Loading..." },
        {
          title: "Leads Assigned this Week",
          value: "N/A",
          description: "Loading...",
        },
        { title: "Active Employees", value: "N/A", description: "Loading..." },
        {
          title: "Overall Conversion Rate",
          value: "N/A",
          description: "Loading...",
        },
      ];

  return (
    <div className="kpi-cards-container">
      {selectedKpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
};

export default KPICardSection;
