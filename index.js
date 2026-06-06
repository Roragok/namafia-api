import express from "express";
import cors from "cors";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import AWS from "aws-sdk";

/* ---------------- EXPRESS APP ---------------- */

const app = express();

/* ---------------- AWS IAM AUTH (Vercel ENV) ---------------- */
/*
  These MUST exist in Vercel environment variables:

  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_REGION
*/

AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }),
});

const docClient = new AWS.DynamoDB.DocumentClient();

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
  res.json({ title: "NAMafiA Entry Point" });
});

/* ---------------- HELPERS ---------------- */

const scanTable = async (TableName) => {
  const params = { TableName };
  const items = [];

  let data;
  do {
    data = await docClient.scan(params).promise();
    items.push(...(data.Items || []));
    params.ExclusiveStartKey = data.LastEvaluatedKey;
  } while (data.LastEvaluatedKey);

  return items;
};

/* ---------------- GAMES ---------------- */

app.get("/getGames", async (req, res) => {
  try {
    const items = await scanTable("mafia-game");
    res.json(items);
  } catch (err) {
    console.error("getGames error:", err);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

app.get("/getGame/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const params = {
      TableName: "mafia-game",
      KeyConditionExpression: "#game_id = :game_id",
      ExpressionAttributeNames: {
        "#game_id": "game_id",
      },
      ExpressionAttributeValues: {
        ":game_id": id,
      },
    };

    const data = await docClient.query(params).promise();
    res.json(data.Items);
  } catch (err) {
    console.error("getGame error:", err);
    res.status(500).json({ error: "Failed to fetch game" });
  }
});

/* ---------------- DAYS ---------------- */

app.get("/getDays", async (req, res) => {
  try {
    const items = await scanTable("mafia-day");
    res.json(items);
  } catch (err) {
    console.error("getDays error:", err);
    res.status(500).json({ error: "Failed to fetch days" });
  }
});

app.get("/getDays/:game_id", async (req, res) => {
  try {
    const id = req.params.game_id;

    const params = {
      TableName: "mafia-day",
      IndexName: "parent_id-index",
      KeyConditionExpression: "parent_id = :parent_id",
      ExpressionAttributeValues: {
        ":parent_id": id,
      },
    };

    const data = await docClient.query(params).promise();

    const cleaned = (data.Items || []).map((game) => {
      if (game.votes && typeof game.votes === "object") {
        game.votes = Object.values(game.votes);
      }
      return game;
    });

    res.json(cleaned);
  } catch (err) {
    console.error("getDays/:game_id error:", err);
    res.status(500).json({ error: "Failed to fetch days" });
  }
});

app.get("/getDay/:day_id", async (req, res) => {
  try {
    const id = Number(req.params.day_id);

    const params = {
      TableName: "mafia-day",
      KeyConditionExpression: "#day_id = :day_id",
      ExpressionAttributeNames: {
        "#day_id": "day_id",
      },
      ExpressionAttributeValues: {
        ":day_id": id,
      },
    };

    const data = await docClient.query(params).promise();
    res.json(data.Items);
  } catch (err) {
    console.error("getDay error:", err);
    res.status(500).json({ error: "Failed to fetch day" });
  }
});

/* ---------------- EXPORT FOR VERCEL ---------------- */

export default app;
