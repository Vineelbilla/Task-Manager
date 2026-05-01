const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="loading-state">
    <div className="spinner" />
    <p>{text}</p>
  </div>
);

export default LoadingSpinner;
