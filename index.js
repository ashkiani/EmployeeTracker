const inquirer = require("inquirer");
const Database = require("./lib/database");
const db = new Database("employees_db");
let exit = false;
let action = "";
let table = "";
let fields = [];
let values = [];

start();
async function getAction() {
  return inquirer
    .prompt({
      name: "action",
      type: "list",
      message: "Please select an action:",
      choices: ["View", "Add", "Update", "Delete", "EXIT"]
    }).then(async function (menuAnswer) {
      action = menuAnswer.action;
      exit = action == "EXIT";
      if (!exit) {
        await getTable();
      }

    })
}

async function getNewEmployee() {
  return inquirer
    .prompt([{
      name: "firstName",
      type: "input",
      message: "Please enter First Name:"
    }, {
      name: "lastName",
      type: "input",
      message: "Please enter Last Name:"
    }]).then(async function (employeeInfo) {
      console.log(employeeInfo);
      let roles = db.executeQuery("SELECT * FROM role");
      if (roles.length > 0) {
        await getEmployeeRole(roles);

      }
    })
}
async function getEmployeeRole(roles) {
  return inquirer
    .prompt({
      name: "role",
      type: "choice",
      message: "Please select the role:",
      choices: roles.map(role => { return role.title; }).push("No Role")
    }).then(async function (roleInfo) {
      console.log(roleInfo);

    })
}
async function getNewRole() {
  return inquirer
    .prompt({
      name: "title",
      type: "input",
      message: "Please enter role title:"
    }).then(async function (roleInfo) {
      console.log(roleInfo);
      let existingRole = await db.executeQuery("SELECT * FROM role WHERE title='" + roleInfo.title + "'");
      if (existingRole.length == 0) {
        await db.executeQuery("INSERT INTO role SET title='" + roleInfo.title + "'");
      }
    })
}
async function getNewDepartment() {
  return inquirer
    .prompt({
      name: "name",
      type: "input",
      message: "Please enter department name:"
    }).then(async function (deptInfo) {
      console.log(deptInfo);
      let existingDept = await db.executeQuery("SELECT * FROM department WHERE name='" + deptInfo.name + "'");
      if (existingDept.length == 0) {
        await db.executeQuery("INSERT INTO department SET name='" + deptInfo.name + "'");
      }
    })
}

async function getValues() {
  switch (action) {
    case "Add":
      switch (table) {
        case "employee":
          return getNewEmployee();
        case "role":
          return getNewRole();
        case "department":
          return getNewDepartment();
      }
    case "Update":

      break;
    case "Delete":

      break;
  }


}

async function getTable() {
  return inquirer
    .prompt({
      name: "table",
      type: "list",
      message: "Please select a table:",
      choices: ["Employees", "Departments", "Roles"]
    }).then(async function (menuAnswer) {
      table = menuAnswer.table.toLowerCase();
      table = table.substring(0, table.length - 1);
      await getValues();
    })
}

async function start() {
  let query = "";
  let result;
  db.connect();
  while (!exit) {
    await getAction();
    switch (action) {
      case "View":
        query = "SELECT * FROM " + table
        break;
      case "Add":
        query = "";
        break;
      case "Update":
        query = "";
        break;
      case "Delete":
        query = "";
        break;
      case "EXIT":
        query = "";
        break;
      default:
        console.log("didn't catch the answer.");
        query = "";

    }
    if (query != "") {
      result = await db.executeQuery(query);
      console.log(result);
    }
  }
  console.log("Exited while loop");
  db.disconnect();
}
