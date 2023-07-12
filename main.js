const http = require("http");
const Io = require("./io");
const newTodo = new Io("./db/data.json");
const { v4: uuidv4 } = require("uuid");
const { toUnicode } = require("punycode");
const now = new Date()
const bodyParser = (req) => {
  return new Promise((resolve, reject) => {
    req.on("data", (data) => resolve(JSON.parse(data)));
    req.on("error", (err) => reject(err));
  });
};
const utc = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
http
  .createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    const todos = await newTodo.read();
    if (req.method == "GET" && req.url === "/todos") {
      res.statusCode = 200;
      res.end(JSON.stringify(todos), console.table(todos));
    } else if (req.method == "POST" && req.url === "/todos") {
      req.body = await bodyParser(req);
      const newTodos = { id: uuidv4(), isCompleted: false, createdAt: now, ...req.body };
      todos.push(newTodos);
      await newTodo.write(todos);
      res.statusCode = 201;
      res.end(JSON.stringify({ message: "success" }));
    } else if (req.method === "PUT" && req.url === "/todos") {
      req.body = await bodyParser(req);
      const { id } = req.body;
      const todoToUpdate = todos.find((todo) => todo.id === id);
      if (!todoToUpdate) {
        res.statusCode = 404;
        res.end("error: todo not found");
      } else {
        const updatedTodo = { ...todoToUpdate, ...req.body };
        const newTodos = todos.map((todo) => {
          if (todo.id === id) {
            return updatedTodo;
          }
          return todo;
        });
        await newTodo.write(newTodos);
        res.end("success");
      }
    } else if (req.method === "DELETE" && req.url === "/todos") {
      req.body = await bodyParser(req);
      const { id } = req.body;
      const newTodos = await todos.filter((todo) => todo.id !== id);
      let updatedTodos = newTodos;
      await newTodo.write(updatedTodos);
      res.end("success");
    } else {
      res.statusCode = 404;
      res.end("error: not found");
    }
  })
  .listen(4000, "localhost", () => {
    console.log("listening on 4000");
  });
