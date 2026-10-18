const ProjectTemplate = require("../models/ProjectTemplate");
const Component = require("../models/Component");

// ====================================
// GET ALL PROJECTS (Recommendation Engine)
// ====================================
const getProjects = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12));
        const search = req.query.search ? req.query.search.trim() : "";
        const category = req.query.category ? req.query.category.trim() : "";
        const difficulty = req.query.difficulty ? req.query.difficulty.trim() : "";
        const onlyAvailable = req.query.onlyAvailable;

        // Base query
        const query = { isActive: true };

        if (category && category !== "All") {
            query.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
        }

        if (difficulty && difficulty !== "All") {
            query.difficulty = difficulty;
        }

        if (search) {
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(safeSearch, "i");
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { tags: { $in: [searchRegex] } }
            ];
        }

        // Fetch matching projects with populated component inventory details
        const rawProjects = await ProjectTemplate.find(query)
            .populate("components.component", "name componentId category availableQuantity totalQuantity imageUrl location")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 })
            .lean();

        // Process real-time inventory availability for each project
        const processedProjects = rawProjects.map((project) => {
            const componentsSummary = (project.components || []).map((item) => {
                const comp = item.component;
                const hasValidComp = comp && typeof comp === "object";
                const availableQty = hasValidComp ? (comp.availableQuantity || 0) : 0;
                const requiredQty = item.quantity || 1;
                const isAvailable = availableQty >= requiredQty;

                return {
                    _id: hasValidComp ? comp._id : item._id,
                    componentId: hasValidComp ? comp.componentId : "N/A",
                    name: hasValidComp ? comp.name : "Unknown / Decommissioned Component",
                    category: hasValidComp ? comp.category : "General",
                    imageUrl: hasValidComp ? comp.imageUrl : "",
                    location: hasValidComp ? comp.location : "",
                    requiredQuantity: requiredQty,
                    availableQuantity: availableQty,
                    totalQuantity: hasValidComp ? (comp.totalQuantity || 0) : 0,
                    isAvailable,
                    missingQuantity: Math.max(0, requiredQty - availableQty)
                };
            });

            const totalComponents = componentsSummary.length;
            const availableCount = componentsSummary.filter((c) => c.isAvailable).length;
            const isAvailable = totalComponents > 0 && availableCount === totalComponents;
            const stockPercentage = totalComponents > 0 ? Math.round((availableCount / totalComponents) * 100) : 0;
            const missingComponents = componentsSummary.filter((c) => !c.isAvailable);

            return {
                ...project,
                componentsSummary,
                isAvailable,
                availableCount,
                totalComponents,
                stockPercentage,
                missingComponents
            };
        });

        // Availability filtering rule:
        // By user requirement:
        // "and based on that it checks the available components and show it to the students if components not available the project doesnt get showed to the student"
        // Students: only projects where isAvailable === true (unless explicitly asked for all via ?onlyAvailable=false)
        // Admins: see all projects by default, but can filter with ?onlyAvailable=true
        const isStudent = req.user.role !== "admin";
        let filteredProjects = processedProjects;

        if (isStudent) {
            // Default to only available projects for students unless explicitly toggled off
            const showAll = onlyAvailable === "false";
            if (!showAll) {
                filteredProjects = processedProjects.filter((p) => p.isAvailable);
            }
        } else {
            // Admin sees all by default, or can filter by onlyAvailable=true
            if (onlyAvailable === "true") {
                filteredProjects = processedProjects.filter((p) => p.isAvailable);
            }
        }

        // Summary counts for UI badges
        const totalTemplateCount = processedProjects.length;
        const availableTemplateCount = processedProjects.filter((p) => p.isAvailable).length;

        // Manual pagination on the filtered collection
        const totalItems = filteredProjects.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginatedData = filteredProjects.slice(startIndex, startIndex + limit);

        res.status(200).json({
            data: paginatedData,
            stats: {
                totalTemplates: totalTemplateCount,
                availableTemplates: availableTemplateCount,
                unavailableTemplates: totalTemplateCount - availableTemplateCount
            },
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                pageSize: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================
// GET SINGLE PROJECT BY ID
// ====================================
const getProjectById = async (req, res) => {
    try {
        const project = await ProjectTemplate.findById(req.params.id)
            .populate("components.component", "name componentId category availableQuantity totalQuantity imageUrl location")
            .populate("createdBy", "name email role")
            .lean();

        if (!project) {
            return res.status(404).json({ message: "Project template not found." });
        }

        const componentsSummary = (project.components || []).map((item) => {
            const comp = item.component;
            const hasValidComp = comp && typeof comp === "object";
            const availableQty = hasValidComp ? (comp.availableQuantity || 0) : 0;
            const requiredQty = item.quantity || 1;
            const isAvailable = availableQty >= requiredQty;

            return {
                _id: hasValidComp ? comp._id : item._id,
                componentId: hasValidComp ? comp.componentId : "N/A",
                name: hasValidComp ? comp.name : "Unknown Component",
                category: hasValidComp ? comp.category : "General",
                imageUrl: hasValidComp ? comp.imageUrl : "",
                location: hasValidComp ? comp.location : "",
                requiredQuantity: requiredQty,
                availableQuantity: availableQty,
                isAvailable,
                missingQuantity: Math.max(0, requiredQty - availableQty)
            };
        });

        const totalComponents = componentsSummary.length;
        const availableCount = componentsSummary.filter((c) => c.isAvailable).length;
        const isAvailable = totalComponents > 0 && availableCount === totalComponents;
        const stockPercentage = totalComponents > 0 ? Math.round((availableCount / totalComponents) * 100) : 0;

        res.status(200).json({
            ...project,
            componentsSummary,
            isAvailable,
            availableCount,
            totalComponents,
            stockPercentage
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================
// CREATE PROJECT TEMPLATE (Admin only)
// ====================================
const createProject = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            difficulty,
            estimatedTime,
            tags,
            imageUrl,
            documentationUrl,
            components
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Project title is required." });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({ message: "Project description is required." });
        }

        if (!Array.isArray(components) || components.length === 0) {
            return res.status(400).json({ message: "At least one required component must be selected." });
        }

        // Validate components and quantities
        const formattedComponents = [];
        for (const item of components) {
            const compId = item.component || item.componentId;
            const qty = Number(item.quantity) || 1;

            if (!compId) {
                return res.status(400).json({ message: "Invalid component entry." });
            }

            const compExists = await Component.findById(compId);
            if (!compExists) {
                return res.status(404).json({ message: `Component with ID ${compId} was not found in inventory.` });
            }

            formattedComponents.push({
                component: compExists._id,
                quantity: Math.max(1, qty)
            });
        }

        // Format tags
        let parsedTags = [];
        if (Array.isArray(tags)) {
            parsedTags = tags.map((t) => String(t).trim()).filter(Boolean);
        } else if (typeof tags === "string") {
            parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        }

        const project = await ProjectTemplate.create({
            title: title.trim(),
            description: description.trim(),
            category: category || "IoT & Smart Systems",
            difficulty: difficulty || "Beginner",
            estimatedTime: estimatedTime || "2-4 hours",
            tags: parsedTags,
            imageUrl: imageUrl ? imageUrl.trim() : "",
            documentationUrl: documentationUrl ? documentationUrl.trim() : "",
            components: formattedComponents,
            createdBy: req.user._id,
            isActive: true
        });

        const populated = await ProjectTemplate.findById(project._id)
            .populate("components.component", "name componentId category availableQuantity totalQuantity imageUrl location")
            .populate("createdBy", "name email role");

        res.status(201).json({
            message: "Project template created successfully.",
            project: populated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================
// UPDATE PROJECT TEMPLATE (Admin only)
// ====================================
const updateProject = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            difficulty,
            estimatedTime,
            tags,
            imageUrl,
            documentationUrl,
            components,
            isActive
        } = req.body;

        const project = await ProjectTemplate.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project template not found." });
        }

        if (title !== undefined) project.title = title.trim();
        if (description !== undefined) project.description = description.trim();
        if (category !== undefined) project.category = category.trim();
        if (difficulty !== undefined) project.difficulty = difficulty;
        if (estimatedTime !== undefined) project.estimatedTime = estimatedTime.trim();
        if (imageUrl !== undefined) project.imageUrl = imageUrl.trim();
        if (documentationUrl !== undefined) project.documentationUrl = documentationUrl.trim();
        if (isActive !== undefined) project.isActive = Boolean(isActive);

        if (tags !== undefined) {
            if (Array.isArray(tags)) {
                project.tags = tags.map((t) => String(t).trim()).filter(Boolean);
            } else if (typeof tags === "string") {
                project.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
            }
        }

        if (components !== undefined) {
            if (!Array.isArray(components) || components.length === 0) {
                return res.status(400).json({ message: "At least one required component must be selected." });
            }

            const formattedComponents = [];
            for (const item of components) {
                const compId = item.component || item.componentId;
                const qty = Number(item.quantity) || 1;

                if (!compId) {
                    return res.status(400).json({ message: "Invalid component entry." });
                }

                const compExists = await Component.findById(compId);
                if (!compExists) {
                    return res.status(404).json({ message: `Component with ID ${compId} was not found in inventory.` });
                }

                formattedComponents.push({
                    component: compExists._id,
                    quantity: Math.max(1, qty)
                });
            }
            project.components = formattedComponents;
        }

        await project.save();

        const updated = await ProjectTemplate.findById(project._id)
            .populate("components.component", "name componentId category availableQuantity totalQuantity imageUrl location")
            .populate("createdBy", "name email role");

        res.status(200).json({
            message: "Project template updated successfully.",
            project: updated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================
// DELETE PROJECT TEMPLATE (Admin only)
// ====================================
const deleteProject = async (req, res) => {
    try {
        const project = await ProjectTemplate.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project template not found." });
        }

        res.status(200).json({
            message: "Project template deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================
// SEED STARTER IoT PROJECTS (Admin only)
// ====================================
const seedDefaultProjects = async (req, res) => {
    try {
        // Fetch all existing components in the database
        const components = await Component.find();
        if (components.length === 0) {
            return res.status(400).json({ message: "Please add components to the inventory first." });
        }

        // Helper to find component by loose matching
        const findComp = (term) =>
            components.find((c) =>
                c.name.toLowerCase().includes(term.toLowerCase()) ||
                c.componentId.toLowerCase().includes(term.toLowerCase())
            );

        const esp32 = findComp("esp32") || components[0];
        const arduino = findComp("arduino") || components[1] || components[0];
        const gsr = findComp("gsr") || components[2] || components[0];

        const starterProjects = [
            {
                title: "IoT Biometric Stress & Emotion Monitor",
                description:
                    "Build a real-time galvanic skin response (GSR) biometric monitor connected to an ESP32 micro-controller. Reads autonomic nervous system arousal, plots emotional arousal spikes, and streams live telemetry to an IoT web dashboard.",
                category: "Wearables & Healthcare",
                difficulty: "Intermediate",
                estimatedTime: "3-4 hours",
                tags: ["ESP32", "GSR Sensor", "Biometrics", "IoT Dashboard", "WebSockets"],
                imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
                documentationUrl: "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/",
                components: [
                    { component: esp32._id, quantity: 1 },
                    { component: gsr._id, quantity: 1 }
                ],
                createdBy: req.user._id
            },
            {
                title: "Smart Lab IoT Environmental Node",
                description:
                    "An IoT workstation station using an ESP32 board to collect sensor signals, monitor laboratory environment, and transmit alerts over WiFi MQTT protocol.",
                category: "IoT & Smart Systems",
                difficulty: "Beginner",
                estimatedTime: "2 hours",
                tags: ["ESP32", "MQTT", "SmartLab", "Telemetry", "WiFi"],
                imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
                documentationUrl: "https://randomnerdtutorials.com/esp32-mqtt-publish-subscribe-arduino-ide/",
                components: [
                    { component: esp32._id, quantity: 1 }
                ],
                createdBy: req.user._id
            },
            {
                title: "Arduino Autonomous Sensor Interface",
                description:
                    "Interface analog sensors with an Arduino Uno microcontroller to create a responsive physical computing node with digital serial debugging.",
                category: "Robotics & Automation",
                difficulty: "Beginner",
                estimatedTime: "2-3 hours",
                tags: ["Arduino", "Embedded C", "ADC", "Sensors"],
                imageUrl: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&auto=format&fit=crop&q=80",
                documentationUrl: "https://www.arduino.cc/en/Guide/ArduinoUno",
                components: [
                    { component: arduino._id, quantity: 1 }
                ],
                createdBy: req.user._id
            }
        ];

        // Avoid duplicate seeding if templates with same titles already exist
        const createdProjects = [];
        for (const proj of starterProjects) {
            const exists = await ProjectTemplate.findOne({ title: proj.title });
            if (!exists) {
                const created = await ProjectTemplate.create(proj);
                createdProjects.push(created);
            }
        }

        res.status(200).json({
            message: `Seed operation completed. Created ${createdProjects.length} new starter project template(s).`,
            count: createdProjects.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    seedDefaultProjects
};
