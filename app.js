const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
let db = null;
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDbAndServer();
// register user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const isUserPresentQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    username = '${username}';`;
  const isUserPresent = await db.get(isUserPresentQuery);
  console.log(isUserPresent);
  if (isUserPresent === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const registerUserQuery = `
      INSERT INTO 
       user(username,name,password,gender,location)
      VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(registerUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// login user

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const isUserPresentQuery = `
    SELECT 
      *
    FROM 
      user
    WHERE 
      username = '${username}';`;
  const isUserPresent = await db.get(isUserPresentQuery);
  if (isUserPresent === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      isUserPresent.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// change password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getDbUserQuery = `
    SELECT 
      *  
    FROM 
      user
    WHERE username = '${username}';`;
  const dbUser = await db.get(getDbUserQuery);
  const isOldPasswordSame = await bcrypt.compare(oldPassword, dbUser.password);
  if (isOldPasswordSame === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    const lenOfPassword = newPassword.length >= 5;
    if (lenOfPassword === true) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const changePasswordQuery = `
      UPDATE 
       user
      SET 
        password = '${hashedPassword}'
      WHERE 
        username = '${username}';`;
      await db.run(changePasswordQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  }
});
module.exports = app;
