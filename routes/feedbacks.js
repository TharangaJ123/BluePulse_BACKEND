const router = require("express").Router();
let Feedback = require("../models/Feedback");





// Add feedback
router.route("/add").post((req, res) => {
    const { id, name, Email, section, message, percentage } = req.body;

    const newFeedback = new Feedback({ id, name, Email, section, message, percentage });

    newFeedback.save()
        .then(() => res.json("Feedback Added"))
        .catch((err) => res.status(500).json({ error: err.message }));
});




// Get all feedback
router.route("/").get((req, res) => {
    Feedback.find()
        .then((feedbacks) => res.json(feedbacks))
        .catch((err) => res.status(500).json({ error: err.message }));
});





                       // Update feedback
router.route("/update/:id").put(async (req, res) => {
    let userId = req.params.id;
    const { id, name, Email, section, message, percentage } = req.body;

    const updateFeedback = { id, name, Email, section, message, percentage };

    try {
        const update = await Feedback.findByIdAndUpdate(userId, updateFeedback, { new: true });
        if (update) {
            res.status(200).send({ status: "User updated", user: update });
        } else {
            res.status(404).send({ status: "User not found" });
        }
    } catch (err) {
        res.status(500).send({ status: "Error with updating data", error: err.message });
    }
});

                       


                     // Delete feedback
router.route("/delete/:id").delete(async (req, res) => {
    let userId = req.params.id;

    try {
        await Feedback.findByIdAndDelete(userId);
        res.status(200).send({ status: "User deleted" });
    } catch (err) {
        res.status(500).send({ status: "Error with delete user", error: err.message });
    }
});

                       


                    // Get feedback by ID
router.route("/get/:id").get(async (req, res) => {
    let userId = req.params.id;

    try {
        const user = await Feedback.findById(userId);
        if (user) {
            res.status(200).send({ status: "User fetched", user: user });
        } else {
            res.status(404).send({ status: "User not found" });
        }
    } catch (err) {
        res.status(500).send({ status: "Error with getting user", error: err.message });
    }
});

module.exports = router;
