const goalPlanningService = require("../services/goalPlanning.js");
const { validateGoalPlanningInput } = require("../utils/validateGoalPlanningInput.js");

const goalPlanningController = async (req, res) => {
  try {
    const data = req.body;

    const validation = validateGoalPlanningInput(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors
      });
    }

    const result = await goalPlanningService(data);

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
      errors: error.details || [],
    });
  }
};



module.exports = { goalPlanningController };
