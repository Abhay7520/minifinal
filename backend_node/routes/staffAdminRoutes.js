const express = require("express");
const router = express.Router();
const staffAdminController = require("../controllers/staffAdminController");

router.use("/", staffAdminController);

module.exports = router;
