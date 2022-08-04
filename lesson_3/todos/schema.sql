CREATE TABLE todolists (
  id serial PRIMARY KEY,
  title text NOT NULL UNIQUE
);

CREATE TABLE todos (
  id serial PRIMARY KEY,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT(false),
  todolist_id int NOT NULL REFERENCES todolists(id) ON DELETE CASCADE
);