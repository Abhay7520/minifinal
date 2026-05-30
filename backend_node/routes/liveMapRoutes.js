const express = require("express");
const router = express.Router();
const liveMapController = require("../controllers/liveMapController");

router.use("/", liveMapController);

module.exports = router;
