import { useEffect, useState } from "react";
import api from "../../api/axios";
import { CloseIcon, PlusIcon, TrashIcon, ChipIcon, RocketIcon } from "../ui/Icons";

const PRESET_PROJECT_CATEGORIES = [
  "IoT & Smart Systems",
  "Robotics & Automation",
  "Wearables & Healthcare",
  "Home Automation",
  "Agriculture & Environment",
  "Security & Surveillance",
  "General",
];

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

/**
 * CreateProjectModal
 * Admin modal for creating or updating IoT Project Templates with component kits.
 */
function CreateProjectModal({ project = null, token, onClose, onSuccess }) {
  const headers = { Authorization: `Bearer ${token}` };
  const isEditing = Boolean(project);

  // Form states
  const [title, setTitle] = useState(project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [category, setCategory] = useState(project?.category || "IoT & Smart Systems");
  const [difficulty, setDifficulty] = useState(project?.difficulty || "Beginner");
  const [estimatedTime, setEstimatedTime] = useState(project?.estimatedTime || "2-4 hours");
  const [imageUrl, setImageUrl] = useState(project?.imageUrl || "");
  const [documentationUrl, setDocumentationUrl] = useState(project?.documentationUrl || "");
  const [tagsInput, setTagsInput] = useState(project?.tags?.join(", ") || "");

  // Dynamic component kit list: [{ componentId: "", quantity: 1 }]
  const [selectedComponents, setSelectedComponents] = useState(() => {
    if (project?.components && project.components.length > 0) {
      return project.components.map((item) => ({
        componentId: item.component?._id || item.component,
        quantity: item.quantity || 1,
      }));
    }
    return [{ componentId: "", quantity: 1 }];
  });

  // All components fetched from inventory for the dropdown
  const [allInventory, setAllInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load inventory catalog for dropdown selection
  useEffect(() => {
    let active = true;
    const fetchComponents = async () => {
      try {
        const res = await api.get("/components?limit=100", { headers });
        if (active) {
          setAllInventory(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load components for project template:", err);
      } finally {
        if (active) setInvLoading(false);
      }
    };
    fetchComponents();
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddComponentRow = () => {
    setSelectedComponents((prev) => [...prev, { componentId: "", quantity: 1 }]);
  };

  const handleRemoveComponentRow = (index) => {
    setSelectedComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index, field, value) => {
    setSelectedComponents((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Project description is required.");
      return;
    }

    const validComponents = selectedComponents.filter((c) => Boolean(c.componentId));
    if (validComponents.length === 0) {
      setError("Please select at least one component required for this project.");
      return;
    }

    // Check for duplicate component rows
    const ids = validComponents.map((c) => c.componentId);
    if (new Set(ids).size !== ids.length) {
      setError("Each component should only be listed once. Adjust the quantity instead of adding duplicate rows.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        estimatedTime: estimatedTime.trim(),
        imageUrl: imageUrl.trim(),
        documentationUrl: documentationUrl.trim(),
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        components: validComponents.map((c) => ({
          componentId: c.componentId,
          quantity: Math.max(1, Number(c.quantity) || 1),
        })),
      };

      if (isEditing) {
        await api.put(`/projects/${project._id}`, payload, { headers });
        if (onSuccess) onSuccess("Project template updated successfully!");
      } else {
        await api.post("/projects", payload, { headers });
        if (onSuccess) onSuccess("Project template created successfully!");
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save project template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Edit Project Template" : "Create Project Template"}
    >
      <div
        className="relative w-full max-w-2xl my-6 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 bg-white dark:bg-[#14213d] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10"
        style={{ borderTop: "4px solid #fca311" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fca311]/15 text-[#fca311] flex items-center justify-center border border-[#fca311]/30">
              <RocketIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#fca311]">
                Admin Project Management
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {isEditing ? "Edit Project Template" : "Add IoT Project Template"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
              {error}
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart IoT Soil Moisture & Irrigation System"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
            />
          </div>

          {/* Category, Difficulty & Estimated Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
              >
                {PRESET_PROJECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
              >
                {DIFFICULTY_LEVELS.map((diff) => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Build Time
              </label>
              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 2-3 hours"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Description & Guide <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project objective, key features, and what the student will learn..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
            />
          </div>

          {/* URLs & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Documentation / Wiring URL (Optional)
              </label>
              <input
                type="url"
                value={documentationUrl}
                onChange={(e) => setDocumentationUrl(e.target.value)}
                placeholder="e.g. GitHub repo or PDF guide"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. ESP32, MQTT, Sensors, WiFi, OLED"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
            />
          </div>

          {/* ── REQUIRED COMPONENTS KIT BUILDER ── */}
          <div className="rounded-xl p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ChipIcon size={15} className="text-[#fca311]" />
                  Required Components for this Project
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select the components and quantities needed. The system will automatically check live inventory before recommending this to students!
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddComponentRow}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#fca311]/15 text-[#fca311] hover:bg-[#fca311]/25 border border-[#fca311]/30 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <PlusIcon size={12} /> Add Component
              </button>
            </div>

            {invLoading ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Loading inventory components...
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedComponents.map((row, index) => {
                  const compObj = allInventory.find((c) => c._id === row.componentId);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1a2b4c] border border-slate-200 dark:border-white/5"
                    >
                      {/* Component Selector */}
                      <div className="flex-1">
                        <select
                          required
                          value={row.componentId}
                          onChange={(e) => handleComponentChange(index, "componentId", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#14213d] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
                        >
                          <option value="">-- Choose Component from Lab Inventory --</option>
                          {allInventory.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({c.componentId}) — [{c.availableQuantity} in stock]
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={row.quantity}
                          onChange={(e) => handleComponentChange(index, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#14213d] text-slate-900 dark:text-white text-center focus:outline-none focus:border-[#fca311]"
                        />
                      </div>

                      {/* Stock badge indicator */}
                      {compObj && (
                        <div className="text-[10px] hidden sm:block whitespace-nowrap px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                          Stock: {compObj.availableQuantity}
                        </div>
                      )}

                      {/* Remove Button */}
                      {selectedComponents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveComponentRow(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Remove component"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-extrabold rounded-xl bg-[#fca311] hover:bg-[#e0920f] text-black shadow-gold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RocketIcon size={14} />
              {loading ? "Saving Template..." : isEditing ? "Update Template" : "Create Project Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;
