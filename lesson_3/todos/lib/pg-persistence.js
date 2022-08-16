const Todo = require("./todo");
const TodoList = require("./todolist");
const session = require("express-session");
const { dbQuery } = require("./db-query")
const { sortTodoLists } = require("./sort");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  

  async _partitionTodoLists(todoLists) {
    let undone = [];
    let done = [];
    for (let todoList of todoLists) {
      if (await this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    }
    return [...undone, ...done];
  }

  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users WHERE username=$1";
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;
    return bcrypt.compare(password, result.rows[0].password);
  }

  async sortedTodoLists() {
    let todoLists = (await dbQuery("SELECT * FROM todolists ORDER BY title ASC")).rows;
    for (let todoListIndex in todoLists) {
      let todoList = todoLists[todoListIndex]
      todoList.todos = await this.sortedTodos(todoList);
      console.log('tets');
    }
    return await this._partitionTodoLists(todoLists);
  }

  async isDoneTodoList(todoList) {
    let sql_undone = "SELECT * FROM todos WHERE todolist_id = $1 AND done = false";
    let sql_done = "SELECT * FROM todos WHERE todolist_id = $1 AND done = true";
    let undone = (await dbQuery(sql_undone, todoList.id)).rows;
    let done = (await dbQuery(sql_done, todoList.id)).rows;
    return undone.length === 0 && done.length != 0;
  }

  // Find a todo list with the indicated ID. Returns `undefined` if not found.
  // Note that `todoListId` must be numeric.
  async loadTodoList(todoListId) {
    let sql = "SELECT * FROM todolists WHERE id = $1";
    let todoList = (await dbQuery(sql, todoListId)).rows[0];
    todoList.todos = await this.sortedTodos(todoList);
    return todoList;
  };

  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done)
  }

  async sortedTodos(todoList) {
    let sql = "SELECT * FROM todos WHERE todolist_id = $1 ORDER BY done ASC, title ASC";
    return (await dbQuery(sql, todoList.id)).rows;
  }

  async loadTodo(todoListId, todoId) {
    let todoList = this.loadTodoList(todoListId);
    if (todoList) {
      let sql = "SELECT * FROM todos WHERE id = $1 AND todolist_id = $2";
      let todo = (await dbQuery(sql, todoId, todoListId)).rows[0];
      return todo;
    } else {
      return undefined;
    }
  }

  markTodoDone(todoListId, todoId) {
    let sql = "UPDATE todos SET done = true WHERE id = $1 AND todolist_id = $2"
    dbQuery(sql, todoId, todoListId);
  }

  markTodoUndone(todoListId, todoId) {
    let sql = "UPDATE todos SET done = false WHERE id = $1 AND todolist_id = $2"
    dbQuery(sql, todoId, todoListId);
  }

  deleteTodoList(todoListId) {
    let sql = "DELETE FROM todolists WHERE id = $1"
    dbQuery(sql, todoListId);
  }

  async deleteTodo(todoListId, todoId) {
    let sql = "DELETE FROM todos WHERE id = $1 AND todolist_id = $2"
    dbQuery(sql, todoId, todoListId);
  }

  markAllTodosDone(todoListId) {
    let sql = "UPDATE todos SET done = true WHERE todolist_id = $1"
    dbQuery(sql, todoListId);
  }

  createNewTodo(todoListId, title) {
    let sql = "INSERT INTO todos (title, todolist_id) VALUES ($1, $2)"
    dbQuery(sql, title, todoListId)
  }

  async changeTodoListTitle(todoListId, title) {
    let sql = "UPDATE todolists SET title = $1 WHERE id = $2"
    let result = await dbQuery(sql, title, todoListId);
    return result.rowCount === 1;
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  existsTodoListTitle(title) {
    // return this._todoLists.some(todoList => todoList.title === title)
  }

  async createNewTodoList(title) {
    let sql = "INSERT INTO todolists (title) VALUES ($1)";
    await dbQuery(sql, title);
  }
}