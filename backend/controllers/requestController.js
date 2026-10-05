const Request = require("../models/Request");
const Component = require("../models/Component");
const LabSettings = require("../models/LabSettings");
const { sendOverdueEmail } = require("../services/emailService");
// STUDENT CREATES REQUEST
// ====================================
const createRequest = async (req, res) => {
    try {
        const { componentId, quantity, purpose, expectedReturnDate } = req.body;
        if (!componentId || !quantity || !purpose) {
            return res.status(400).json({
                message: "Component, quantity and purpose are required."
            });
        }
        const component = await Component.findById(componentId);
        if (!component) {
            return res.status(404).json({ message: "Component not found." });
        }
        if (quantity > component.availableQuantity) {
            return res.status(400).json({
                message: "Requested quantity is not available."
            });
        }

        const settings = await LabSettings.getSettings();
        const issueDays = settings.standardIssueDays || 7;
        const calculatedDueDate = expectedReturnDate
            ? new Date(expectedReturnDate)
            : new Date(Date.now() + issueDays * 86_400_000);

        const request = await Request.create({
            student: req.user._id,
            component: component._id,
            quantity,
            purpose,
            expectedReturnDate: calculatedDueDate,
            status: "pending"
        });
        const populatedRequest = await Request.findById(request._id)
            .populate("student", "name email studentId department phone")
            .populate("component", "name componentId category");
        res.status(201).json({
            message: "Component request submitted successfully.",
            request: populatedRequest
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ====================================
// STUDENT CREATES BATCH REQUESTS (multi-component)
// ====================================
const createBatchRequest = async (req, res) => {
    try {
        const { items, purpose } = req.body;
        // items: [{ componentId, quantity }]
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "At least one component item is required." });
        }
        if (!purpose || !purpose.trim()) {
            return res.status(400).json({ message: "Purpose is required." });
        }
        if (items.length > 10) {
            return res.status(400).json({ message: "You can issue at most 10 different components at once." });
        }

        const settings = await LabSettings.getSettings();
        const issueDays = settings.standardIssueDays || 7;
        const dueDate = new Date(Date.now() + issueDays * 86_400_000);

        const results = [];
        const errors = [];

        for (const item of items) {
            const { componentId, quantity } = item;
            if (!componentId || !quantity || quantity < 1) {
                errors.push({ componentId, reason: "Invalid item â€” missing componentId or quantity." });
                continue;
            }

            const component = await Component.findById(componentId);
            if (!component) {
                errors.push({ componentId, reason: "Component not found." });
                continue;
            }
            if (quantity > component.availableQuantity) {
                errors.push({ componentId, name: component.name, reason: `Only ${component.availableQuantity} units available.` });
                continue;
            }

            const request = await Request.create({
                student: req.user._id,
                component: component._id,
                quantity: Number(quantity),
                purpose: purpose.trim(),
                expectedReturnDate: dueDate,
                status: "pending"
            });

            const populated = await Request.findById(request._id)
                .populate("student", "name email studentId department phone")
                .populate("component", "name componentId category");
            results.push(populated);
        }

        if (results.length === 0) {
            return res.status(400).json({
                message: "No requests could be created.",
                errors
            });
        }

        res.status(201).json({
            message: `${results.length} request(s) submitted successfully.${errors.length ? ` ${errors.length} item(s) skipped.` : ""}`,
            requests: results,
            errors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// STUDENT GETS OWN REQUESTS
// ====================================

const getMyRequests = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip  = (page - 1) * limit;

        const totalItems = await Request.countDocuments({ student: req.user._id });
        const requests = await Request.find({ student: req.user._id })
            .populate("student", "name email studentId department phone")
            .populate("component", "name componentId category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            data: requests,
            pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, pageSize: limit }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ====================================
// ADMIN GETS ALL REQUESTS
// ====================================
const getAllRequests = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip  = (page - 1) * limit;

        const totalItems = await Request.countDocuments();
        const requests = await Request.find()
            .populate("student", "name email studentId department phone")
            .populate("component", "name componentId category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            data: requests,
            pagination: { totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, pageSize: limit }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ====================================
// ADMIN APPROVES REQUEST
// ====================================
const approveRequest = async (req, res) => {
    try {
        const request =
            await Request.findById(req.params.id
            );
        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }
        if (request.status !== "pending") {
            return res.status(400).json({
                message:
                    "Only pending requests can be approved."
            });
        }
        const component =
            await Component.findById(
                request.component
            );
        if (!component) {
            return res.status(404).json({
                message: "Component not found."
            });}
        if (
            request.quantity >
            component.availableQuantity
        ) {

            return res.status(400).json({
                message:"Not enough components available."
            });
        }
           request.status = "approved";
        request.approvedDate = new Date();
        await request.save();
         const updatedRequest =
            await Request.findById(
                request._id
            )
            .populate("student","name email studentId")
            .populate("component","name componentId"
            );
        res.status(200).json({
            message:"Request approved successfully.",
            request:updatedRequest
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ====================================
// ADMIN REJECTS REQUEST
// ====================================
const rejectRequest = async (req, res) => {
    try {
        const {
            rejectionReason
        } = req.body;
        const request =
            await Request.findById(
                req.params.id
            );
       if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }
        if (request.status !== "pending") {
            return res.status(400).json({
                message:"Only pending requests can be rejected."
            });
        }
        request.status = "rejected";
        request.rejectionReason =
            rejectionReason || "No reason provided";
        await request.save();
        res.status(200).json({
            message:"Request rejected successfully.",
            request
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ====================================
// ISSUE COMPONENT
// ====================================
const issueComponent = async (req, res) => {
    try {
        const {
            issueDate,expectedReturnDate
        } = req.body;
        const request =
            await Request.findById( req.params.id
            );
        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }
        if (request.status !== "approved") {
            return res.status(400).json({
                message:"Only approved requests can be issued."
            });
        }
        const component =
            await Component.findById(
                request.component
            );
        if (!component) {
            return res.status(404).json({
                message: "Component not found."
            });
        }
        if (
            component.availableQuantity <
            request.quantity
        ) {
            return res.status(400).json({
                message:"Insufficient inventory."
            });
        }
        component.availableQuantity -=request.quantity;
        await component.save();
        request.issueDate =issueDate || new Date();
        request.expectedReturnDate =expectedReturnDate;
        request.status = "issued";
        await request.save();
        const updatedRequest =
            await Request.findById(
                request._id
            )
            .populate(
                "student","name email studentId"
            )
            .populate(
                "component","name componentId"
            );
        res.status(200).json({
            message:
                "Component issued successfully.",
            request:
                updatedRequest
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
// RETURN COMPONENT
// ====================================
const returnComponent = async (req, res) => {
    try {
        const { condition = "good", adminComment = "" } = req.body;
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }
        if (
            request.status !== "issued" &&
            request.status !== "overdue"
        ) {
            return res.status(400).json({
                message: "This component is not currently issued."
            });
        }
        const component = await Component.findById(request.component);
        if (!component) {
            return res.status(404).json({
                message: "Component not found."
            });
        }

        const validCondition = ["good", "broken", "lost"].includes(condition) ? condition : "good";
        request.returnCondition = validCondition;
        request.actualReturnDate = new Date();
        if (adminComment) {
            request.adminComment = adminComment;
        }

        if (validCondition === "good") {
            component.availableQuantity += request.quantity;
            request.status = "returned";
        } else if (validCondition === "broken") {
            // Damaged/Broken: Keep out of available circulation
            request.status = "broken";
        } else if (validCondition === "lost") {
            // Lost: Deduct from total lab inventory as it cannot be recovered
            component.totalQuantity = Math.max(0, component.totalQuantity - request.quantity);
            request.status = "lost";
        }

        await component.save();
        await request.save();

        const updatedRequest = await Request.findById(request._id)
            .populate("student", "name email studentId department phone")
            .populate("component", "name componentId category");

        res.status(200).json({
            message: `Component marked as ${validCondition === "good" ? "returned" : validCondition}.`,
            request: updatedRequest
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ====================================
// EXTEND RETURN DATE
// ====================================
const extendReturn = async (req, res) => {
    try {
        const { newExpectedReturnDate, reason = "" } = req.body;
        if (!newExpectedReturnDate) {
            return res.status(400).json({ message: "New expected return date is required." });
        }

        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        // Student can only extend their own request
        if (req.user.role !== "admin" && request.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to extend this request." });
        }

        if (request.status !== "issued" && request.status !== "overdue") {
            return res.status(400).json({
                message: "Only currently issued or overdue components can be extended."
            });
        }

        const newDate = new Date(newExpectedReturnDate);
        if (isNaN(newDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        // Enforce maximum extension days set by admin for students
        const labSettings = await LabSettings.getSettings();
        const maxDays = labSettings.maxExtensionDays || 7;

        if (req.user.role !== "admin") {
            const currentDue = request.expectedReturnDate
                ? new Date(request.expectedReturnDate)
                : new Date();
            const maxAllowedDate = new Date(currentDue.getTime() + maxDays * 86_400_000);
            maxAllowedDate.setHours(23, 59, 59, 999);

            if (newDate > maxAllowedDate) {
                return res.status(400).json({
                    message: `Extension cannot exceed ${maxDays} days past current return date (maximum allowed: ${maxAllowedDate.toLocaleDateString()}).`
                });
            }
        }

        request.expectedReturnDate = newDate;
        request.extensionReason = reason;
        request.extensionStatus = "extended";

        // Reset overdue if new date is in future
        if (request.status === "overdue" && newDate > new Date()) {
            request.status = "issued";
        }

        await request.save();

        const updatedRequest = await Request.findById(request._id)
            .populate("student", "name email studentId department phone")
            .populate("component", "name componentId category");

        res.status(200).json({
            message: "Return date extended successfully.",
            request: updatedRequest
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================
// LAB SETTINGS: GET & UPDATE (ADMIN)
// ====================================
const getLabSettings = async (req, res) => {
    try {
        const settings = await LabSettings.getSettings();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLabSettings = async (req, res) => {
    try {
        const { standardIssueDays, maxExtensionDays } = req.body;
        let settings = await LabSettings.getSettings();

        if (standardIssueDays !== undefined) {
            settings.standardIssueDays = Math.max(1, Math.min(60, parseInt(standardIssueDays) || 7));
        }
        if (maxExtensionDays !== undefined) {
            settings.maxExtensionDays = Math.max(1, Math.min(30, parseInt(maxExtensionDays) || 7));
        }

        await settings.save();
        res.status(200).json({
            message: "Lab borrowing and extension limits updated successfully.",
            settings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CHECK OVERDUE COMPONENTS
// ====================================
const checkOverdue = async (req, res) => {
    try {
        const currentDate = new Date();
        const requests = await Request.find({
            status: "issued",
            expectedReturnDate: { $lt: currentDate }
        })
            .populate("student", "name email")
            .populate("component", "name");
        let emailCount = 0;
        for (const request of requests) {
            request.status = "overdue";
            await request.save();
            try {
                await sendOverdueEmail(
                    request.student.email,
                    request.student.name,
                    request.component.name,
                    request.expectedReturnDate
                );
                emailCount++;
            } catch (emailError) {
                console.error(
                    `Email failed for ${request.student.email}:`,
                    emailError.message
                );
            }
        }
        res.status(200).json({
            message: "Overdue status updated.",
            overdueCount: requests.length,
            emailsSent: emailCount
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ====================================
// ADMIN GETS COMPONENT ISSUE/RETURN HISTORY
// ====================================
const getComponentHistory = async (req, res) => {
    try {
        const { componentId } = req.params;
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
        const skip  = (page - 1) * limit;

        const filter = { component: componentId };

        const [totalItems, history, summaryCounts] = await Promise.all([
            Request.countDocuments(filter),
            Request.find(filter)
                .populate("student", "name email studentId department phone")
                .populate("component", "name componentId category availableQuantity totalQuantity")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Request.aggregate([
                { $match: { component: new (require("mongoose").Types.ObjectId)(componentId) } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]).catch(() => [])
        ]);

        const summary = {
            totalRequests: totalItems,
            issued: 0,
            returned: 0,
            overdue: 0,
            approved: 0,
            pending: 0,
            rejected: 0
        };

        if (Array.isArray(summaryCounts)) {
            summaryCounts.forEach((item) => {
                if (summary[item._id] !== undefined) {
                    summary[item._id] = item.count;
                }
            });
        }

        res.status(200).json({
            data: history,
            summary,
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

// ====================================
// ADMIN BATCH APPROVE
// ====================================
const batchApprove = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Request IDs array is required." });
        }
        const results = [];
        const errors  = [];
        for (const id of ids) {
            try {
                const request = await Request.findById(id);
                if (!request) { errors.push({ id, reason: "Not found." }); continue; }
                if (request.status !== "pending") { errors.push({ id, reason: `Already ${request.status}.` }); continue; }
                const component = await Component.findById(request.component);
                if (!component) { errors.push({ id, reason: "Component not found." }); continue; }
                if (request.quantity > component.availableQuantity) {
                    errors.push({ id, reason: `Insufficient stock (${component.availableQuantity} available).` });
                    continue;
                }
                request.status = "approved";
                request.approvedDate = new Date();
                await request.save();
                results.push(id);
            } catch (e) { errors.push({ id, reason: e.message }); }
        }
        res.status(200).json({
            message: `${results.length} request(s) approved.${errors.length ? ` ${errors.length} skipped.` : ""}`,
            approved: results, errors
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ====================================
// ADMIN BATCH REJECT
// ====================================
const batchReject = async (req, res) => {
    try {
        const { ids, rejectionReason = "Rejected by lab admin" } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Request IDs array is required." });
        }
        const results = [];
        const errors  = [];
        for (const id of ids) {
            try {
                const request = await Request.findById(id);
                if (!request) { errors.push({ id, reason: "Not found." }); continue; }
                if (request.status !== "pending") { errors.push({ id, reason: `Already ${request.status}.` }); continue; }
                request.status = "rejected";
                request.rejectionReason = rejectionReason;
                await request.save();
                results.push(id);
            } catch (e) { errors.push({ id, reason: e.message }); }
        }
        res.status(200).json({
            message: `${results.length} request(s) rejected.${errors.length ? ` ${errors.length} skipped.` : ""}`,
            rejected: results, errors
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ====================================
// ADMIN BATCH ISSUE
// ====================================
const batchIssue = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Request IDs array is required." });
        }
        const settings = await LabSettings.getSettings();
        const issueDays = settings.standardIssueDays || 7;
        const dueDate = new Date(Date.now() + issueDays * 86_400_000);
        const results = [];
        const errors  = [];
        for (const id of ids) {
            try {
                const request = await Request.findById(id);
                if (!request) { errors.push({ id, reason: "Not found." }); continue; }
                if (request.status !== "approved") { errors.push({ id, reason: `Status is ${request.status}, not approved.` }); continue; }
                const component = await Component.findById(request.component);
                if (!component) { errors.push({ id, reason: "Component not found." }); continue; }
                if (component.availableQuantity < request.quantity) {
                    errors.push({ id, reason: `Insufficient stock (${component.availableQuantity} available).` });
                    continue;
                }
                component.availableQuantity -= request.quantity;
                await component.save();
                request.issueDate = new Date();
                request.expectedReturnDate = dueDate;
                request.status = "issued";
                await request.save();
                results.push(id);
            } catch (e) { errors.push({ id, reason: e.message }); }
        }
        res.status(200).json({
            message: `${results.length} component(s) issued.${errors.length ? ` ${errors.length} skipped.` : ""}`,
            issued: results, errors
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};


// ====================================
// ADMIN: CREATE MANUAL HISTORY ENTRY
// Allows admin to backfill written/physical lab records as Request documents.
// ====================================
const createManualHistoryEntry = async (req, res) => {
    try {
        const { componentId } = req.params;
        const {
            studentId,
            studentName,
            studentRollId,
            studentEmail,
            studentPhone,
            studentDepartment,
            quantity          = 1,
            purpose           = "Manual entry (backfilled)",
            status            = "returned",
            issueDate,
            expectedReturnDate,
            actualReturnDate,
            returnCondition   = "good",
            adminComment      = "",
        } = req.body;

        if (!componentId) return res.status(400).json({ message: "Component ID is required." });
        if (!issueDate)   return res.status(400).json({ message: "Issue date is required." });

        const component = await Component.findById(componentId);
        if (!component) return res.status(404).json({ message: "Component not found." });

        const entryData = {
            component:          componentId,
            quantity:           Number(quantity) || 1,
            purpose,
            status,
            isManualEntry:      true,
            issueDate:          new Date(issueDate),
            expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
            actualReturnDate:   actualReturnDate   ? new Date(actualReturnDate)   : null,
            returnCondition,
            adminComment,
            requestDate:        new Date(issueDate),
            manualStudentInfo: {
                name:       studentName       || "",
                studentId:  studentRollId     || "",
                email:      studentEmail      || "",
                phone:      studentPhone      || "",
                department: studentDepartment || "",
            },
            student: studentId || req.user._id,
        };

        const entry = await Request.create(entryData);
        const populated = await Request.findById(entry._id)
            .populate("student", "name email studentId department phone")
            .populate("component", "name componentId")
            .lean();

        res.status(201).json({ message: "Manual history entry created successfully.", data: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ====================================
// ADMIN: DELETE A MANUAL HISTORY ENTRY
// ====================================
const deleteManualHistoryEntry = async (req, res) => {
    try {
        const { entryId } = req.params;
        const entry = await Request.findById(entryId);
        if (!entry) return res.status(404).json({ message: "Entry not found." });
        if (!entry.isManualEntry) return res.status(403).json({ message: "Only manually added entries can be deleted." });
        await entry.deleteOne();
        res.status(200).json({ message: "Manual entry deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRequest,
    createBatchRequest,
    getMyRequests,
    getAllRequests,
    approveRequest,
    rejectRequest,
    issueComponent,
    returnComponent,
    extendReturn,
    getLabSettings,
    updateLabSettings,
    checkOverdue,
    getComponentHistory,
    batchApprove,
    batchReject,
    batchIssue,
    createManualHistoryEntry,
    deleteManualHistoryEntry
};
