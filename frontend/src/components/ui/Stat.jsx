/**
 * Stat
 * Single statistic card used in the stats row.
 * Props:
 *   label {string}
 *   value {number | string}
 */
function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Stat;
