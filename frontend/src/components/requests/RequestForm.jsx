import { useState } from "react";

const EMPTY_FORM = { componentId: "", quantity: 1, purpose: "" };

/**
 * RequestForm
 * Student-only form panel to submit a new component request.
 * Props:
 *   components {Array}    — available components (availableQuantity > 0)
 *   onSubmit   {(form: object) => Promise<void>}
 */
function RequestForm({ components, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const patch = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setForm(EMPTY_FORM);
  };

  const available = components.filter((c) => c.availableQuantity > 0);

  return (
    <div className="panel request-form">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Student</span>
          <h3>Request a component</h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="two-col-form">
        <label>Component
          <select required value={form.componentId} onChange={patch("componentId")}>
            <option value="">Select component</option>
            {available.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} — {c.availableQuantity} available
              </option>
            ))}
          </select>
        </label>

        <label>Quantity
          <input
            type="number"
            min="1"
            required
            value={form.quantity}
            onChange={patch("quantity")}
          />
        </label>

        <label className="span-2">Purpose
          <textarea
            required
            value={form.purpose}
            onChange={patch("purpose")}
            placeholder="Why do you need this component?"
          />
        </label>

        <button className="primary">Submit request</button>
      </form>
    </div>
  );
}

export default RequestForm;
