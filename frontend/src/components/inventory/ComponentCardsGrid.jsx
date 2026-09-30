import ComponentCard from "./ComponentCard";
import { ChipIcon } from "../ui/Icons";

/**
 * ComponentCardsGrid
 * Renders a responsive multi-column grid of ComponentCard components.
 * Props:
 *   components  {Array}
 *   isAdmin     {boolean}
 *   onSelect    {(comp: object) => void}
 *   onRequest   {(comp: object) => void}
 *   onHistory   {(comp: object) => void}
 *   onDelete    {(id: string) => void}
 */
function ComponentCardsGrid({
  components,
  isAdmin,
  onSelect,
  onRequest,
  onHistory,
  onDelete,
}) {
  if (!components || components.length === 0) {
    return (
      <div className="cards-empty-state">
        <div className="empty-icon-wrap">
          <ChipIcon size={36} />
        </div>
        <h4>No components found</h4>
        <p>Try adjusting your search keywords or category filters.</p>
      </div>
    );
  }

  return (
    <div className="comp-cards-grid">
      {components.map((comp) => (
        <ComponentCard
          key={comp._id}
          component={comp}
          isAdmin={isAdmin}
          onSelect={onSelect}
          onRequest={onRequest}
          onHistory={onHistory}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default ComponentCardsGrid;
