// routes for Admin to manage Employees
const express = require("express");
const router = express.Router();

//import controller functions
const {
  getUsers,
  getUser,
  createUser,
  editUser,
  deleteUser,
} = require("../controllers/userController");

//routes for the user collection
//GET all employee data with the role as employee
router.get("/", getUsers);

//GET a single employee by id
router.get("/:id", getUser);

//POST and create a employee
router.post("/", createUser);

//UPDATE a employee by id
router.patch("/:id", editUser);

//DELETE a employee by id
router.delete("/:id", deleteUser);

module.exports = router;
