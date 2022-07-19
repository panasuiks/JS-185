CREATE TABLE expenses (
  id serial PRIMARY KEY,
  amount numeric(10,2) NOT NULL CONSTRAINT not_negative CHECK(amount >= 0),
  memo text NOT NULL,
  created_on date DEFAULT(DATE(NOW())) NOT NULL
);