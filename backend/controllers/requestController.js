const Request = require("../models/Request");
const Component = require("../models/Component");
const { sendOverdueEmail } = require("../services/emailService");
// STUDENT CREATES REQUEST
// ====================================
const createRequest = async (req, res) => {
    try {const {componentId,quantity,purpose} = req.body;
        if (!componentId ||!quantity ||!purpose) {
            return res.status(400).json({
               message:"Component, quantity and purpose are required."
            });}
        const component =await Component.findById(componentId);
        if (!component) {
            return res.status(404).json({message: "Component not found."});
        }
        if (quantity >component.availableQuantity
        ) {
            return res.status(400).json({
                message:"Requested quantity is not available."
            });
        }
        const request =
            await Request.create({student: req.user._id,component: component._id,quantity,purpose,status: "pending"});
        const populatedRequest =
            await Request.findById(
                request._id
            ).populate(
                "student","name email studentId"
            )
            .populate("component","name componentId"
            );
        res.status(201).json({
            message:"Component request submitted successfully.",
            request:populatedRequest
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });}
};
// STUDENT GETS OWN REQUESTS
// ====================================

const getMyRequests = async (req, res) => {

    try {

        const requests =
            await Request.find({

                student: req.user._id

            })
            .populate(
                "component",
                "name componentId category"
            )
            .sort({
                createdAt: -1
            });


        res.status(200).json(
            requests
        );

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// ====================================
// ADMIN GETS ALL REQUESTS
// ====================================
const getAllRequests = async (req, res) => {
    try {
        const requests =
            await Request.find()
            .populate(
                "student","name email studentId department"
            )
            .populate(
                "component","name componentId category"
            )
            .sort({createdAt: -1
            });
        res.status(200).json(
            requests
        );
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
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
        const request =
            await Request.findById(
                req.params.id
            );
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
                message:"This component is not currently issued."
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
        component.availableQuantity +=request.quantity;
        await component.save();
        request.actualReturnDate =new Date();
        request.status = "returned";
        await request.save();
        res.status(200).json({
            message:"Component returned successfully.",
            request
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
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

module.exports = {
    createRequest,
    getMyRequests,
    getAllRequests,
    approveRequest,
    rejectRequest,
    issueComponent,
    returnComponent,
    checkOverdue
};