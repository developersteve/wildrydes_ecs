import lumigo from "@lumigo/opentelemetry";
import { trace } from '@opentelemetry/api';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import {PutCommand, GetCommand, UpdateCommand, ScanCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";
import {DynamoDBClient, PutItemCommand, GetItemCommand} from '@aws-sdk/client-dynamodb';
import express from "express";
import { nanoid } from 'nanoid'
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Constants
const PORT = 80;
const HOST = '0.0.0.0';
const jwtSecret = "thebirdistheword"
const TABLE_NAME = "wildrydes";
const DDBclient = new DynamoDBClient({});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../');

async function putItem(item) {

  const params = {
    TableName: TABLE_NAME,
    Item: item, 
    ConditionExpression: 'attribute_not_exists(idunicorns)',
  };

  const command = new PutItemCommand(params);

 try {
    const { $metadata } = await DDBclient.send(command);

    if ($metadata.httpStatusCode === 200) {
      //exec in here
      console.log("Item added to table. ", $metadata);
    } else {
      //exec in here
      console.error(`Unexpected status code: ${statusCode}`);
    }
    return $metadata.httpStatusCode;
  } catch (err) {
    console.error("Error adding item to table:");
    // throw err;
    return 400;
  }
}

const adjectives = ["Sparkling", "Rainbow", "Magical", "Glimmering", "Enchanted", "Whimsical", "Majestic", "Shimmering", "Radiant", "Twinkling"];
const nouns = ["Unicorn", "Pegasus", "Stallion", "Mare", "Filly", "Colt", "Foal", "Horn", "Galloper", "Equus"];
const colors = ["White", "Pink", "Purple", "Blue", "Green", "Yellow", "Orange", "Red", "Golden"];
const genders = ["Male", "Female", "Non-binary"];

function generateUnicorn() {
  const adjIndex = Math.floor(Math.random() * adjectives.length);
  const nounIndex = Math.floor(Math.random() * nouns.length);
  const colorIndex = Math.floor(Math.random() * colors.length);
  const genderIndex = Math.floor(Math.random() * genders.length);

  const adjective = adjectives[adjIndex];
  const noun = nouns[nounIndex];
  const color = colors[colorIndex];
  const gender = genders[genderIndex];

  return {
    Name: `${adjective} ${noun}`,
    Color: color,
    Gender: gender
  };
}

// App
const app = express();
app.use(express.static('public'))
// for parsing application/json
app.use(express.json()); 
// for parsing form data
app.use(express.urlencoded({ extended: true })); 
// cookies
app.use(cookieParser());


app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

app.post('/register', async (req, res) => {
  const uuid = nanoid();
  req.body.password = bcrypt.hashSync(req.body.password , 10);

  const item = { 
    uuid: { S: uuid },
    idunicorns: { S: req.body.username },
    password: { S: req.body.password }
  };

  try {

    const statusCode = await putItem(item);   

    if (statusCode === 200) {
      res.status(200).json({ message: "Correct credentials" });
    } else {
      console.log(statusCode);
      res.status(500).json({ error: 'Registration Error' });
    }
  
  } catch (err) {
    trace.getActiveSpan()?.setAttribute('lumigo.execution_tags.database','err_adding');
    console.error("Error adding item:", err);

    res.status(500).json({ error: 'Registration Error' });
  }
});


app.get('/sign-in', (req, res) => {
  res.sendFile('public/signin.html', { root: __dirname });
});

app.post('/sign-in', async (req, res) => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      idunicorns: { S: req.body.username }
    }
  };

  const command = new GetItemCommand(params);

  try {
    const { Item } = await DDBclient.send(command);
    console.log(Item);
    if (Item) {
      console.log("checking");
      console.log(Item.password.S + " " + req.body.password);
      if (bcrypt.compareSync(req.body.password, Item.password.S)) { 
        var token = jwt.sign(
          {
            "username": req.body.username,
            "role": "user"
          },
          jwtSecret,
          { expiresIn: '4h' }
        );
        res.cookie('auth_token', token, { expires: new Date(Date.now() + 4 * 3600000) }); // expires 4 hours
        res.status(200).json({ message: "Correct credentials" });
      } else {
        trace.getActiveSpan()?.setAttribute('lumigo.execution_tags.auth','err_password');
        res.status(500).json({ error: 'Incorrect Password' });
      }
    } else {
      trace.getActiveSpan()?.setAttribute('lumigo.execution_tags.auth','err_username');
      res.status(500).json({ error: 'Wrong credentials' });
    }
  } catch (err) {
    console.error("Error fetching item from table:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/ride', (req, res) => {
  const authToken = req.cookies.auth_token;
  // Missing token from cookie
  if (!authToken) {
    console.log("ride: no auth cookie token");
    res.clearCookie('auth_token');
    res.redirect('/sign-in');
  }
  else {
    var decoded = jwt.verify(authToken, jwtSecret);
    if (!decoded) {
      console.log("ride: bad token");
      res.clearCookie('auth_token');
      res.redirect('/sign-in');
    }
    // Token verification failed
    else {
      console.log("ride: token verified");
      res.sendFile('public/ride.html', { root: __dirname });
    }
  }
});

app.post('/ride', async function (req, res) {

  console.log('unicorn data ' + JSON.stringify(req.body));
  var unicorn = generateUnicorn();
  console.log('unicorn' + JSON.stringify(unicorn));

  const uuid = nanoid();

  const item = { 
    idunicorns: { S: uuid },
    name: { S: unicorn.Name },
    color: { S: unicorn.Color }, 
    gender: { S: unicorn.Gender },
  };

  try {
    const statusCode = await putItem(item);
    console.log(`Item added to table with status code: ${statusCode}`);
    res.json(unicorn);
  } catch (err) {
    console.error("Error adding item to table:", err);
  }
  
});

app.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  
  res.sendFile('public/signin.html', { root: __dirname });
});

app.get('*', (req, res) => {
  res.sendFile('public/404.html', { root: __dirname });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);