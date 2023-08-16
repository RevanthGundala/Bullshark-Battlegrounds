const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

function initialize() {
  let player1 = {};
  let player2 = {};

  console.log("Initialized new players");

  app.get(`/api/get/`, async (req, res) => {
    const player_1 = {
      address: player1.address,
      hand: player1.hand,
      deck: player1.deck,
    };
    const player_2 = {
      address: player2.address,
      hand: player2.hand,
      deck: player2.deck,
    };
    const response = {
      player_1,
      player_2,
    };

    res.json(response);
  });

  app.post(`/api/post/`, async (req, res) => {
    try {
      const { player_1, player_2 } = req.body;
      player1.address = player_1.address;
      player1.hand = player_1.hand;
      player1.deck = player_1.deck;
      player2.address = player_2.address;
      player2.hand = player_2.hand;
      player2.deck = player_2.deck;
      res.send("Players added");
    } catch (error) {
      console.error(error);
      res.status(400).send("Error adding players");
    }
  });

  //   app.delete("/api/delete", async (req, res) => {

  //   });

  app.listen(5002, () => {
    console.log("Server started on port 5002");
  });
}

initialize();
