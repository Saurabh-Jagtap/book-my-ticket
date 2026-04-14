//  CREATE TABLE seats (
//      id SERIAL PRIMARY KEY,
//      name VARCHAR(255),
//      isbooked INT DEFAULT 0
//  );
// INSERT INTO seats (isbooked)
// SELECT 0 FROM generate_series(1, 20);

import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';


const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;

// Equivalent to mongoose connection
// Pool is nothing but group of connections
// If you pick one connection out of the pool and release it
// the pooler will keep that connection open for sometime to other clients to reuse
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = new express();
app.use(cors());
app.use(express.json());

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = { id: decoded.id }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token", error: error });
  }
};

function validateAuthInput(email, password) {
  if (!email || !password) {
    return "Email and password are required";
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return "Invalid input type";
  }

  if (email.trim() === "" || password.trim() === "") {
    return "Email and password cannot be empty";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
}

const handleRegister = async (req, res) => {
  try {
    const { email, password } = req.body;
    const error = validateAuthInput(email, password);
    if (error) {
      return res.status(400).json({ message: error });
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, hashedPassword]
    )
    return res.status(201).json({ message: "User registered" });
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: "Email already exists" });
  }
};

const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    const error = validateAuthInput(email, password);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )
    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    return res.json({ token });
  } catch (error) {
    console.log("Error: ", error)
    return res.status(500).json({ message: "Internal server error" });
  }
};

app.post('/api/register', handleRegister)
app.post('/api/login', handleLogin)

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
//get all seats
app.get("/seats", async (req, res) => {
  const result = await pool.query("select * from seats"); // equivalent to Seats.find() in mongoose
  res.send(result.rows);
});

//book a seat give the seatId and your name

app.put("/:id/:name", authMiddleware, async (req, res) => {
  let conn;
  try {
    const id = req.params.id;
    const name = req.params.name;
    const userId = req.user.id;
    // payment integration should be here
    // verify payment
    conn = await pool.connect(); // pick a connection from the pool
    //begin transaction
    // KEEP THE TRANSACTION AS SMALL AS POSSIBLE
    await conn.query("BEGIN");
    //getting the row to make sure it is not booked
    /// $1 is a variable which we are passing in the array as the second parameter of query function,
    // Why do we use $1? -> this is to avoid SQL INJECTION
    // (If you do ${id} directly in the query string,
    // then it can be manipulated by the user to execute malicious SQL code)
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    //if no rows found then the operation should fail can't book
    // This shows we Do not have the current seat available for booking
    if (result.rowCount === 0) {
      await conn.query("ROLLBACK");
      return res.status(400).json({ message: "Seat already booked" });
    }
    //if we get the row, we are safe to update
    const sqlU = "update seats set isbooked = 1, name = $2, user_id = $3 where id = $1";
    const updateResult = await conn.query(sqlU, [id, name, userId]); // Again to avoid SQL INJECTION we are using $1 and $2 as placeholders

    //end transaction by committing
    await conn.query("COMMIT");
    return res.json({ message: "Seat booked successfully" });
  } catch (ex) {
    console.log(ex);
    if (conn) await conn.query("ROLLBACK");
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
