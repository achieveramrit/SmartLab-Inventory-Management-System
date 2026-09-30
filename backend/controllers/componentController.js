const Component = require("../models/Component");

// ==========================
// GET ALL COMPONENTS (with Search, Category Filter, and Pagination)
// ==========================
const getComponents = async (req, res) => {
    try {
        const page     = Math.max(1, parseInt(req.query.page)  || 1);
        const limit    = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        const search   = req.query.search ? req.query.search.trim() : "";
        const category = req.query.category ? req.query.category.trim() : "";
        const skip     = (page - 1) * limit;

        // Build query filter
        const filter = {};

        // Filter by category if specified and not "All"
        if (category && category !== "All") {
            filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
        }

        // Search across multiple fields
        if (search) {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(safeSearch, "i");
            filter.$or = [
                { name: searchRegex },
                { componentId: searchRegex },
                { category: searchRegex },
                { description: searchRegex },
                { location: searchRegex }
            ];
        }

        // Run count and query in parallel using lean() for maximum speed
        const [totalItems, components] = await Promise.all([
            Component.countDocuments(filter),
            Component.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        res.status(200).json({
            data: components,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit) || 1,
                currentPage: page,
                pageSize: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================
// GET SINGLE COMPONENT
// ==========================
const getComponent = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id).lean();
        if (!component) {
            return res.status(404).json({
                message: "Component not found."
            });
        }
        res.status(200).json(component);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ==========================
// ADD COMPONENT
// ==========================
const addComponent = async (req, res) => {
    try {
        const {
            name,
            componentId,
            category,
            description,
            imageUrl,
            totalQuantity,
            location,
            lowStockLimit
        } = req.body;

        if (!name || !componentId || !category || totalQuantity === undefined) {
            return res.status(400).json({
                message: "Required fields are missing (name, componentId, category, totalQuantity)."
            });
        }

        const existingComponent = await Component.findOne({ componentId });
        if (existingComponent) {
            return res.status(400).json({
                message: "Component ID already exists."
            });
        }

        const component = await Component.create({
            name,
            componentId,
            category,
            description: description || "",
            imageUrl: imageUrl || "",
            totalQuantity,
            availableQuantity: totalQuantity,
            location: location || "",
            lowStockLimit: lowStockLimit !== undefined ? Number(lowStockLimit) : 2
        });

        res.status(201).json({
            message: "Component added successfully.",
            component
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ==========================
// UPDATE COMPONENT
// ==========================
const updateComponent = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id);
        if (!component) {
            return res.status(404).json({
                message: "Component not found."
            });
        }

        const {
            name,
            category,
            description,
            imageUrl,
            totalQuantity,
            location,
            lowStockLimit
        } = req.body;

        if (name !== undefined) component.name = name;
        if (category !== undefined) component.category = category;
        if (description !== undefined) component.description = description;
        if (imageUrl !== undefined) component.imageUrl = imageUrl;
        if (location !== undefined) component.location = location;
        if (lowStockLimit !== undefined) component.lowStockLimit = lowStockLimit;

        if (totalQuantity !== undefined) {
            const difference = totalQuantity - component.totalQuantity;
            component.totalQuantity = totalQuantity;
            component.availableQuantity += difference;
            if (component.availableQuantity < 0) {
                component.availableQuantity = 0;
            }
        }

        await component.save();
        res.status(200).json({
            message: "Component updated successfully.",
            component
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ==========================
// DELETE COMPONENT
// ==========================
const deleteComponent = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id);
        if (!component) {
            return res.status(404).json({
                message: "Component not found."
            });
        }
        await component.deleteOne();
        res.status(200).json({
            message: "Component deleted successfully."
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ==========================
// ADD MANUAL HISTORY ENTRY (ADMIN)
// ==========================
const addManualHistory = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id);
        if (!component) {
            return res.status(404).json({ message: "Component not found." });
        }

        const { title, description, eventDate, type } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "A title is required for the history entry." });
        }

        const entry = {
            title: title.trim(),
            description: description ? description.trim() : "",
            eventDate: eventDate ? new Date(eventDate) : new Date(),
            type: type || "note",
            createdAt: new Date()
        };

        component.manualHistory.push(entry);
        // Keep newest entries first
        component.manualHistory.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
        await component.save();

        res.status(201).json({
            message: "History entry added successfully.",
            manualHistory: component.manualHistory
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================
// DELETE MANUAL HISTORY ENTRY (ADMIN)
// ==========================
const deleteManualHistory = async (req, res) => {
    try {
        const component = await Component.findById(req.params.id);
        if (!component) {
            return res.status(404).json({ message: "Component not found." });
        }

        const entryId = req.params.entryId;
        const idx = component.manualHistory.findIndex(e => e._id.toString() === entryId);
        if (idx === -1) {
            return res.status(404).json({ message: "History entry not found." });
        }

        component.manualHistory.splice(idx, 1);
        await component.save();

        res.status(200).json({
            message: "History entry deleted.",
            manualHistory: component.manualHistory
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getComponents,
    getComponent,
    addComponent,
    updateComponent,
    deleteComponent,
    addManualHistory,
    deleteManualHistory
};