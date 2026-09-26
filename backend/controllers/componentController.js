const Component = require("../models/component");

// GET ALL COMPONENTS
// ==========================

const getComponents = async (req, res) => {
    try {
        const components = await Component.find().sort({ createdAt: -1 });
        res.status(200).json(
            components);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ==========================
// GET SINGLE COMPONENT
// ==========================

const getComponent = async (req, res) => {

    try {

        const component = await Component.findById(
            req.params.id
        );


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


// ADD COMPONENT
// ==========================

const addComponent = async (req, res) => {
    try {
        const {name,componentId,category,description,totalQuantity,location,lowStockLimit} = req.body;
        if (!name ||!componentId ||!category ||totalQuantity === undefined) {
            return res.status(400).json({
                message: "Required fields are missing."
            });
        }
        const existingComponent =
            await Component.findOne({componentId});
        if (existingComponent) {
            return res.status(400).json({
                message: "Component ID already exists."
            });

        }
        const component = await Component.create({name,componentId,category,description,totalQuantity,availableQuantity: totalQuantity,location,lowStockLimit});
        res.status(201).json({
            message: "Component added successfully.",component
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });}
};

// UPDATE COMPONENT
// ==========================
const updateComponent = async (req, res) => {
    try {
        const component =
            await Component.findById(
                req.params.id
            );
        if (!component) {
            return res.status(404).json({
                message: "Component not found."
            });
        }
        const {name,category,description,totalQuantity,location,lowStockLimit } = req.body;
        if (name !== undefined)
            component.name = name;
        if (category !== undefined)
            component.category = category;
        if (description !== undefined)
            component.description = description;
        if (location !== undefined)
            component.location = location;
        if (lowStockLimit !== undefined)
            component.lowStockLimit = lowStockLimit;
        if (totalQuantity !== undefined) {
            const difference = totalQuantity -component.totalQuantity;
            component.totalQuantity =
                totalQuantity;
            component.availableQuantity +=
                difference;
            if (component.availableQuantity < 0) {
                component.availableQuantity = 0;
            }
        }
        await component.save();
        res.status(200).json({
            message: "Component updated successfully.",component
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
// DELETE COMPONENT
// ==========================
const deleteComponent = async (req, res) => {
    try {
       const component =
            await Component.findById(
                req.params.id
            );
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
module.exports = {
    getComponents,getComponent,addComponent,updateComponent,deleteComponent
};