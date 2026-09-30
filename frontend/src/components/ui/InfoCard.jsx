/**
 * InfoCard
 * Simple titled info card used on the Auth module page.
 * Props:
 *   title {string}
 *   text  {string}
 */
function InfoCard({ title, text }) {
  return (
    <div className="info-card">
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

export default InfoCard;
