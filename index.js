const inquirer = require("inquirer");
const Database = require("./lib/database");
const db = new Database("employees_db");
const cTable = require('console.table');
let exit = false;
let action = "";
let table = "";
let employeeRole = "";
let employeeManagerID = 0;
const noRoleTitle = "No Role";
const noManager = "No Manager";

//Siavash 2/8/2020 Added the following code to suppress the MaxListenersExceeded warning. 
//I assume that the warning eventually reappears if the number of team members grows but I tested it with up to 8 employees and worked fine.
require('events').EventEmitter.defaultMaxListeners = 250;

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

async function addNewEmployee() {
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
      let roles = await db.executeQuery("SELECT * FROM role");
      let sql = `INSERT INTO employee SET first_name= '${employeeInfo.firstName}' , last_name= '${employeeInfo.lastName}'`;
      if (roles.length > 0) {
        await getEmployeeRole(roles);
        if (employeeRole != noRoleTitle) {
          let roles = await db.executeQuery(`SELECT id from role WHERE title='${employeeRole}'`)
          if (roles.length > 0) {
            let employeeId = roles[0].id;
            sql += `, role_id=${employeeId}`
          }
        }
      }
      // console.log(sql);
      await db.executeQuery(sql);
    })
}
async function getEmployeeRole(roles) {
  let titles = roles.map(role => { return role.title; });
  titles.push(noRoleTitle);
  return inquirer
    .prompt({
      name: "role",
      type: "list",
      message: "Please select the role:",
      choices: titles
    }).then(async function (roleInfo) {
      employeeRole = roleInfo.role;
    })
}

async function getEmployeeManager(managers) {
  let mngrs = managers.map(manager => { return JSON.stringify(manager); });
  mngrs.push(JSON.stringify({ id: 0, name: noManager }));
  return inquirer
    .prompt({
      name: "manager",
      type: "list",
      message: "Please select the manager:",
      choices: mngrs
    }).then(async function (managerInfo) {
      employeeManagerID = JSON.parse(managerInfo.manager).id;
    })
}

async function addNewRole() {
  return inquirer
    .prompt({
      name: "title",
      type: "input",
      message: "Please enter role title:"
    }).then(async function (roleInfo) {
      let existingRole = await db.executeQuery("SELECT * FROM role WHERE title='" + roleInfo.title + "'");
      if (existingRole.length == 0) {
        await db.executeQuery("INSERT INTO role SET title='" + roleInfo.title + "'");
      }
    })
}
async function addNewDepartment() {
  return inquirer
    .prompt({
      name: "name",
      type: "input",
      message: "Please enter department name:"
    }).then(async function (deptInfo) {
      let existingDept = await db.executeQuery("SELECT * FROM department WHERE name='" + deptInfo.name + "'");
      if (existingDept.length == 0) {
        await db.executeQuery("INSERT INTO department SET name='" + deptInfo.name + "'");
      }
    })
}

async function updateEmployee() {
  let sql = `SELECT employee.id, employee.first_name,employee.last_name,title,concat( emp1.first_name , ' ', emp1.last_name) AS manager
              FROM employees_db.employee LEFT JOIN employees_db.role ON role_id=employees_db.role.id LEFT JOIN employees_db.employee AS emp1 ON employee.manager_id=emp1.id;`
  let employees = await db.executeQuery(sql);
  employees = employees.map(employee => { return JSON.stringify(employee) });
  return inquirer
    .prompt({
      name: "id",
      type: "list",
      message: "Please select the  employee the employee that you want to update:",
      choices: employees
    }).then(async function (employeeInfo) {
      let index = employees.indexOf(employeeInfo.id);
      let employeeId = JSON.parse(employees[index]).id;
      await employeeUpdatePrompt(employeeId);
    })
}
async function employeeUpdatePrompt(employeeId) {
  return inquirer
    .prompt({
      name: "updateAction",
      type: "list",
      message: "Please select the field to update:",
      choices: ["Role", "Manager"]
    }).then(async function (updateAction) {
      switch (updateAction.updateAction) {
        case "Role":
          let roles = await db.executeQuery("SELECT * FROM role");
          if (roles.length > 0) {
            await getEmployeeRole(roles);
            let roleId = 'NULL';
            if (employeeRole != noRoleTitle) {
              roleId = await db.executeQuery(`SELECT id from role WHERE title='${employeeRole}'`)
              roleId = roleId[0].id;
            }
            let sql = `UPDATE employee SET role_id= ${roleId} WHERE id=${employeeId}`;
            await db.executeQuery(sql);
          }
          else { console.log("No Role is available. Please create a new Role first."); }
          break;
        case "Manager":
          let possibleManagers = await db.executeQuery(`SELECT * FROM employee WHERE id<>${employeeId}`);
          if (possibleManagers.length > 0) {
            await getEmployeeManager(possibleManagers);
            let managerId = 'NULL';
            if (employeeManagerID != 0) {
              managerId = employeeManagerID;
            }
            let sql = `UPDATE employee SET manager_id= ${managerId} WHERE id=${employeeId}`;
            await db.executeQuery(sql);
          } else { console.log("No Manager is available. Please add a new manager first."); }
          break;
      }

    })
}

async function PrintTable() {

  // SELECT employee.id, first_name,last_name,title,salary,department.name AS department
  // FROM employees_db.employee LEFT JOIN employees_db.role ON role_id=employees_db.role.id LEFT JOIN employees_db.department ON department_id=employees_db.department.id;


  let sql = `SELECT * FROM ${table}`;

  let res = await db.executeQuery(sql);
  console.table(res);
  // let caption = `----Table:${table}---`;
  // console.log("start " + caption);
  // res.forEach(row => console.log(JSON.stringify(row)));
  // console.log("end " + caption);
}
async function getValues() {
  switch (action) {
    case "View":
      return PrintTable();
    case "Add":
      switch (table) {
        case "employee":
          return addNewEmployee();
        case "role":
          return addNewRole();
        case "department":
          return addNewDepartment();
      }
    case "Update":
      return updateEmployee();

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
  db.connect();
  try {
    while (!exit) {
      await getAction();
    }
  }
  catch (err) {
    console.log(err);
  }
  finally {
    console.log("Exited while loop");
    db.disconnect();
  }
}

