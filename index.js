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
      let roles = db.executeQuery("SELECT * FROM roles");
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
      choices: roles.map(role => { return role.title; })
    }).then(async function (roleInfo) {
      console.log(roleInfo);

    })
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
      switch (action) {
        case "Add":
          switch (table) {
            case "employee":
              await getNewEmployee();
              break;
              case "role":
                await getNewRole();
              break;
              case "department":
              break;
          }
          await getNewEmployee();
          break;
        case "Update":

          break;
        case "Delete":

          break;
      }




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

