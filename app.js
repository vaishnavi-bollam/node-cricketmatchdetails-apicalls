const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
let dbPath = path.join(__dirname, "cricketMatchDetails.db");
let dbConnectionObject = null;
const initializeDBandServer = async () => {
  try {
    dbConnectionObject = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server starts at port number 3001");
    });
  } catch (error) {
    console.log(`ERROR : ${error.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

//API 1 player_details table:
app.get("/players/", async (requestObject, responseObject) => {
  //const requestBody = requestObject.body;
  //console.log(requestBody);//{}
  const player_detailsQuery = `SELECT * FROM player_details;`;
  const dbResponse = await dbConnectionObject.all(player_detailsQuery);
  //console.log(dbResponse);//array of objects as output
  const dbResponseResult = dbResponse.map((eachObject) => {
    return {
      playerId: eachObject.player_id,
      playerName: eachObject.player_name,
    };
  });
  responseObject.send(dbResponseResult);
});

//API 2 player_details table:

app.get("/players/:playerId/", async (requestObject, responseObject) => {
  const playerIdObject = requestObject.params;
  const { playerId } = playerIdObject;
  //const requestBody = requestObject.body;
  //console.log(requestBody);//{}
  const playerQuery = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const dbResponse = await dbConnectionObject.get(playerQuery);
  //console.log(dbResponse);
  const dbResponseResult = {
    playerId: dbResponse.player_id,
    playerName: dbResponse.player_name,
  };
  responseObject.send(dbResponseResult);
});

//API 3 player_details table:
app.put("/players/:playerId/", async (requestObject, responseObject) => {
  const requestBody = requestObject.body;
  /*
  {
  "playerName": "Raju"
  }
  */
  const { playerName } = requestBody;
  const playerIdObject = requestObject.params;

  const { playerId } = playerIdObject;
  const playerQuery = `
  UPDATE player_details SET player_name='${playerName}'
  WHERE player_id=${playerId};
  `;
  const dbResponse = await dbConnectionObject.run(playerQuery);
  //console.log(dbResponse);
  responseObject.send("Player Details Updated");
});

//API 4 match details:
app.get("/matches/:matchId/", async (requestObject, responseObject) => {
  const matchIdObject = requestObject.params;
  /*
{ 
  matchId: 18,
  match: "RR vs SRH",
  year: 2011
}
  */
  const { matchId } = matchIdObject;
  //const requestBody = requestObject.body;
  //console.log(requestBody);//{}
  const matchQuery = `SELECT * FROM match_details WHERE match_id=${matchId}`;
  const dbResponse = await dbConnectionObject.get(matchQuery);
  //console.log(dbResponse);
  const dbResponseResult = {
    matchId: dbResponse.match_id,
    match: dbResponse.match,
    year: dbResponse.year,
  };
  responseObject.send(dbResponseResult);
});

//API 5 player_details table:
app.get("/players/:playerId/matches", async (requestObject, responseObject) => {
  const playerIdValue = requestObject.params.playerId;
  //console.log(playerIdValue);
  const listOfMatchesQuery = `
  SELECT
   match_details.match_id AS matchId,
   match,year
  FROM match_details INNER JOIN player_match_score
  ON match_details.match_id=player_match_score.match_id
  WHERE player_id= ${playerIdValue};
  `;
  const dbResponse = await dbConnectionObject.all(listOfMatchesQuery);
  //console.log(dbResponse);//array of objects as output
  const dbResponseResult = dbResponse.map((eachObject) => {
    return {
      matchId: eachObject.matchId,
      match: eachObject.match,
      year: eachObject.year,
    };
  });
  responseObject.send(dbResponseResult);
});

//API 6 Returns a list of players of a specific match:
app.get("/matches/:matchId/players", async (requestObject, responseObject) => {
  const matchIdValue = requestObject.params.matchId;
  //console.log(matchIdValue);
  const listOfPlayersQuery = `
  SELECT
   player_details.player_id,
   player_details.player_name
  FROM player_details INNER JOIN player_match_score
  ON player_details.player_id=player_match_score.player_id
  WHERE match_id= ${matchIdValue};
  `;
  const dbResponse = await dbConnectionObject.all(listOfPlayersQuery);
  //console.log(dbResponse);//array of objects as output
  const dbResponseResult = dbResponse.map((eachObject) => {
    return {
      playerId: eachObject.player_id,
      playerName: eachObject.player_name,
    };
  });
  responseObject.send(dbResponseResult);
});

//API 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID:
app.get(
  "/players/:playerId/playerScores",
  async (requestObject, responseObject) => {
    const playerIdValue = requestObject.params.playerId;
    const playerStatisticsQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerIdValue};
    `;
    const dbResponse = await dbConnectionObject.get(playerStatisticsQuery);
    responseObject.send(dbResponse);
  }
);

module.exports = app;
