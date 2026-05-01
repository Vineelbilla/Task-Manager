const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <p>{label}</p>
    <h3>{value}</h3>
  </div>
);

export default StatCard;
