const SPEED = [0, 1200, 800, 1000]; // milliseconds
const SKILL = [1000, 1000, 1000, 1000]; // strength of each player
const OPEN = [false, false, false, false]; // whether to open cards
const FLASH = [false, false, false, false]; // whether to show hand briefly each turn
const GLANCE = [false, false, false, false]; // whether to show hand if clicked
const PROBE = [true, false, true, false]; // whether to show piles if clicked
const FANNED = [true, false, false, false]; // whether cards are fanned
const ANALYSIS = { 's': [], 'h': [], 'c': [], 'd': [] }; // analysis of cards played
const ALLOW = { analysis: true }; // whether to allow analysis

class CardGame {
    constructor() {
        // Game state
        this.winnerPosition = 1;
        this.winnerTries = [0, 0, 0, 0];
        this.designatedSuit = "s";
        this.prevWinnerPosition = this.getPrevWinnerIndex() || 0;

        loadSettings();
        this.initCards();
        this.setupHands();
        this.setupPiles();
        this.bindEvents();
    }

    // Initialize the card library and the main deck
    initCards() {
        cards.init({ table: '#card-table', type: STANDARD, acesHigh: true });
        this.deck = new cards.Deck();
        this.deck.x -= 50;
        this.deck.addCards(cards.all);
        this.deck.render({ immediate: true });
    }

    // Create the four player hands with initial positions and face-up states
    setupHands() {
        this.upperHand = new cards.Hand({ faceUp: false, y: 60 });
        this.lowerHand = new cards.Hand({ faceUp: true, y: 340 });
        this.leftHand = new cards.Hand({ faceUp: false, y: 200, x: 100 });
        this.rightHand = new cards.Hand({ faceUp: false, y: 200, x: 500 });
        this.selectedHand = this.lowerHand;
    }

    // Create piles and assign positions using an array of coordinates
    setupPiles() {
        this.currentPile = new cards.Hand({ faceUp: true });
        this.currentPile.x += 50;

        this.accumPile = new cards.Hand({ faceUp: true });
        this.accumPile.x += 50;
        this.accumPile.y += 50;

        this.discardPile = new cards.Deck({ faceUp: true });
        this.discardPile.x += 50;

        // Define positions for home piles and create them accordingly
        const positions = [
            { x: 0, y: 245 },
            { x: 250, y: 100 },
            { x: 0, y: -240 },
            { x: -250, y: 100 }
        ];
        this.homePiles = positions.map(pos => {
            const pile = new cards.Deck({ faceUp: false });
            pile.x += pos.x;
            pile.y += pos.y;
            return pile;
        });

        // When a home pile is clicked, temporarily animate its cards
        this.homePiles.forEach((pile,i) => {
            pile.click(async () => {
                if(PROBE[i]) this.animatePile(pile);
            });
        });
        [this.lowerHand, this.rightHand, this.upperHand, this.leftHand].forEach((hand,i) => {
            hand.click(async () => {
                if(GLANCE[i]) this.animatePile(hand);
            });
        });
    }

    async animatePile(pile) {
        const tempPile = new cards.Hand({ faceUp: true });
        tempPile.x = pile.x;
        tempPile.y = pile.y;
        this.pile2pile(pile, tempPile);
        pile.render();
        tempPile.render();
        await this.sleep(3000);
        this.pile2pile(tempPile, pile);
        tempPile.render();
        pile.render();
    }

    // Bind UI events for dealing and clicking on hands, deck, and discard pile
    bindEvents() {
        this.splashBannerTimeout(`Welcome!<br><span style="font-size:16px;">Are you ready?</span><br><span style="font-size:10px">Click DEAL to start playing!</span>`, 5000);
        $('#restart').hide();
        $('#restart').click(() => {
            location.reload();
        });
        // Deal cards when the deal button is clicked, then start the game loop
        $('#deal').click(() => {
            $('#deal').hide();
            $('#restart').hide();
            // Deal 5 cards first, then two rounds of 4 cards each
            [5, 4, 4].forEach(num =>
                this.deck.deal(num, [this.lowerHand, this.rightHand, this.upperHand, this.leftHand], 50, () => { })
            );
            this.sleep(1000).then(() => {
                this.designatedSuit = this.allocateDesignatedSuit(this.getStarterHand());
                [this.lowerHand, this.rightHand, this.upperHand, this.leftHand].forEach(hand => this.reorder(hand));
                // this.reorder(this.lowerHand);
                this.run();
            });
        });

        // When the deck is clicked, add its top card to the selected hand
        // this.deck.click(card => {
        //     if (card === this.deck.topCard()) {
        //         this.selectedHand.addCard(this.deck.topCard());
        //         this.selectedHand.render();
        //         this.updateScore(this.selectedHand, -1);
        //     }
        // });

        // If the deck is empty and the discard pile is clicked, refill the deck
        this.discardPile.click(() => {
            if (this.deck.cards.length === 0) {
                this.deck.addCards(this.discardPile.cards);
                this.deck.render();
                this.discardPile.render();
            }
        });
    }

    // Reorder cards in a hand to be in a specific order (ascending by rank, then suit)
    reorder(hand) {
        hand.order2();
        hand.render();
    }

    splashBannerTimeout(text, expires) {
        const element = document.createElement("div");
        element.setAttribute("style", "background-color: rgba(5, 23, 39, 0.7); color: white; width: 300px; height: auto; position: fixed; top: calc(50% + 100px); left: 50%; transform: translate(-50%, -50%); border-radius: 10px; border: 2px solid white; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; display: flex; align-items: center; justify-content: center; text-align: center; padding: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); flex-direction: column;");
        element.innerHTML = text;
        if(expires) setTimeout(function () {
            element.parentNode.removeChild(element);
        }, expires);
        document.body.appendChild(element);
    }

    // Main game loop: each hand takes turns until a win condition is met
    async run() {
        const hands = [this.lowerHand, this.rightHand, this.upperHand, this.leftHand];
        let leader = this.prevWinnerPosition;
        this.displayScores(this.retrieveScores());
        while (true) {
            for (let i=0; i < hands.length; i++) {
                const index = (leader+i) % hands.length;
                const hand = hands[index];
                console.log("index:", index);
                console.log("hand:", hand);
                if(OPEN[index] || FLASH[index]) faceUp(hand, true);
                hand.render();
                await this.sleep(SPEED[index]/2);
                // For the lower hand, wait for player interaction; others play automatically
                if (hand === this.lowerHand) {
                    while (hand.length > 0 && await this.interaction(hand)) { }
                } else {
                    while (hand.length > 0 && this.response(hand)) { }
                }
                if(0) confettiBasic();
                if(0) confettiFireworks();
                await this.sleep(SPEED[index]/2);
                if(!OPEN[index]) if(hand!=this.lowerHand) faceUp(hand, false);
                hand.render();
                this.displayAnalysis();
            }
            // Move cards from current pile to accumulative pile, then to home piles
            this.pile2pile(this.currentPile, this.accumPile);
            const accumPoints = this.accumPile.length / 4;
            leader = this.pile2home(this.accumPile, leader);
            console.log("accumPoints:", accumPoints);
            console.log("accumPile.length:", this.accumPile.length);
            console.log("accumPile:", this.accumPile);
            if(!this.accumPile.length) this.updateScore(hands[leader], accumPoints);
            console.log("leader:", leader);
            // this.updateScore(hands[leader], 1);
            if (this.winnerPosition > 4) break;
            if (hands[leader].length === 0) break;
        }
        console.log("Game over!");
        this.storeScores();
        this.displayScores(this.retrieveScores());
        function faceUp(hand, faceUp=true) {
            hand.faceUp = faceUp;
            hand.render();
        }
        const winnerHand = this.getHandWithMostTricks();
        const outcome = winnerHand===this.lowerHand||winnerHand===this.upperHand ? "Won" : "Lost";
        // this.splashBannerTimeout(`Game over!<br>You ${outcome}.<br>Hope you had fun!`)
        // this.splashBannerTimeout(`Game over!<br>You ${outcome}.<br><span style="font-size: 10px;">Restart to play again!</span>`)
        this.splashBannerTimeout(`Game over!<br><span style="font-size:16px;">You ${outcome}.</span><br><span style="font-size:10px">Click Restart to play again!</span>`)

        $('#restart').show(2000);
    }

    // Wait for player to click a card; then play that card
    async interaction(hand) {
        if (hand.length === 0) return false;
        const card = await new Promise(resolve => hand.click(resolve));
        this.playCard(card);
        return false;
    }

    // Automatically select and play a card based on simple criteria
    response(hand) {
        if (hand.length === 0) return false;
        const card1 = this.selectCard(hand);
        this.playCard(card1);
        return false;
        const bottomCard = this.currentPile.bottomCard();
        const highestCard = this.currentPile.highestCard();
        if(bottomCard == null) {
            const card = hand.lowestCard();
            this.playCard(card);
            return false;
        }
        const card = hand.find(c => c.suit === bottomCard.suit && c.rank > highestCard.rank)
            // || hand.find(c => c.suit === bottomCard.suit)
            || hand.lowestCard(bottomCard.suit)
            || hand.lowestCard(this.designatedSuit)
            || hand.lowestCard();
        // console.log("card:", card);
        // console.log("highestCard:", highestCard);
        // console.log("bottomCard:", bottomCard);
        // console.log("hand.lowestCard(bottomCard.suit):", hand.lowestCard(bottomCard.suit));
        // console.log("hand.lowestCard():", hand.lowestCard());
        // console.log("hand:", hand);

        this.playCard(card);
        return false;
    }

    selectCard(hand) {
        if(this.currentPile.length>0) {
            const pos = this.getIndexForHand(hand);
            const rung = this.designatedSuit;
            const starterCard = this.currentPile.bottomCard();
            const partnerCard = this.currentPile.at(-2);
            const highestRegularCard = this.currentPile.highestCard(starterCard.suit);
            const highestColorCard = this.currentPile.highestCard(rung);
            const highCard = hand.highestCard(starterCard.suit);
            const lowCard = hand.lowestCard(starterCard.suit);
            const anyLowCard = hand.lowestCard();
            const anyLowNonColorCard = hand.lowestQualifiedCard(c => c.suit!=rung);
            const highColorCard = hand.highestCard(rung);
            const lowColorCard = hand.lowestCard(rung);
            const myProperRegularCard = properRankCard(hand, starterCard.suit, highestRegularCard);
            const myProperColorCard = properRankCard(hand, rung, highestColorCard);
            const anyLowNonColorCardSmart = eloReq => SKILL[pos]>=eloReq ? anyLowNonColorCard : anyLowCard;
            const anyLowNonColorCard1000 = SKILL[pos] > 1000 ? anyLowNonColorCard : anyLowCard;
            console.log("myProperRegularCard:", myProperRegularCard);
            console.log("myProperColorCard:", myProperColorCard);
            console.log("highCard:", highCard);
            console.log("lowCard:", lowCard);
            console.log("anyLowCard:", anyLowCard);
            console.log("highColorCard:", highColorCard);
            console.log("lowColorCard:", lowColorCard);
            console.log("highestRegularCard:", highestRegularCard);
            console.log("highestColorCard:", highestColorCard);
            console.log("starterCard:", starterCard);
            if(starterCard.suit == rung) { // if color starter
                if(highestColorCard == partnerCard && SKILL[pos] > 1000) {
                    return lowColorCard || lowCard || anyLowCard;
                } else {
                    return myProperColorCard || lowCard || anyLowCard;
                }
            }
            else if(highestColorCard) { // if already cut
                if(highestColorCard == partnerCard && SKILL[pos] > 1000) {
                    return lowCard || anyLowCard;
                } else {
                    if(highCard == null) { // if no card of starter suit
                        return myProperColorCard || anyLowNonColorCard1000;
                    }
                    return lowCard || anyLowNonColorCard1000 || anyLowCard;
                }
            }
            else if(highestRegularCard == partnerCard) {
                return lowCard || anyLowNonColorCard1000 || anyLowCard;
            }
            else if(highCard == null) { // if the player has no card of starter suit
                // see if we can cut it with color
                return lowColorCard || anyLowCard;
            }
            return myProperRegularCard || lowCard || anyLowNonColorCard1000 || anyLowCard;
        } else {
            const card = hand.highestCard();
            return card;
        }
        function properRankCard(hand, suit, refCard) {
            if(refCard == null) return hand.lowestCard(suit);
            for(let i=hand.length-1; i>=0; i--) {
                const card = hand[i];
                if(card.suit == suit && card.rank > refCard.rank) return card;
            }
        }
    }
    
    // Add a card to the current pile and update displays
    playCard(card) {
        if (!card) return;
        this.currentPile.addCard(card);
        this.currentPile.render();
        this.lowerHand.render();
        ANALYSIS[card.suit].push(card.rank);
    }

    // Store scores in local storage (maintaining a history)
    storeScores() {
        const scoreIds = ["bottom-score", "right-score", "top-score", "left-score"];
        const scores = scoreIds.map(id => document.getElementById(id).innerHTML);
        console.log("scores:", scores);
        const storedScores = this.retrieveScores();
        storedScores.push(scores);
        localStorage.setItem("doosar-scores", JSON.stringify(storedScores));
        console.log("Stored scores:", storedScores);
    }

    // Retrieve scores from local storage
    retrieveScores() {
        const storedScores = JSON.parse(localStorage.getItem("doosar-scores") || "[]");
        console.log("Stored scores:", storedScores);
        return storedScores;
    }

    // Retrieve latest scores from local storage
    retrieveLatestRoundScores() {
        const storedScores = this.retrieveScores();
        const latestScores = storedScores[storedScores.length - 1] || [0, 0, 0, 0];
        console.log("Latest scores:", latestScores);
        return latestScores;
    }

    // display historical scores in a table
    displayScores(storedScores) {
        const table = document.createElement("table");
        table.style.margin = "0 auto"; // Center the table
        const headerRow = document.createElement("tr");
        ["Bottom", "Right", "Top", "Left"].forEach(header => {
            const headerCell = document.createElement("th");
            headerCell.style.padding = "0 30px"; // Increase padding for wider columns
            headerCell.innerHTML = header;
            headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);
        storedScores.reverse().forEach(scores => {
            const row = document.createElement("tr");
            scores.forEach(score => {
                const cell = document.createElement("td");
                cell.style.padding = "0 30px"; // Increase padding for wider columns
                cell.innerHTML = score;
                row.appendChild(cell);
            });
            table.appendChild(row);
        });
        const element = document.getElementById('history');
        element.innerHTML = ""; // Clear previous content
        element.appendChild(table);
    }

    // Display the analysis of cards played
    displayAnalysis() {
        const element = document.getElementById('analysis');
        if(!ALLOW.analysis) element.style.display = "none";
        else element.style.display = "block";
        element.innerHTML = ""; // Clear previous content
        const table = document.createElement("table");
        table.style.margin = "0 auto"; // Center the table
        const headerRow = document.createElement("tr");
        ["♠", "♥", "♣", "♦"].forEach(header => {
            const headerCell = document.createElement("th");
            headerCell.style.padding = "20px";
            headerCell.style.fontSize = "24px"; // Increase font size for symbols
            headerCell.style.color = header=="♦"||header=="♥" ? "red" : "black"; // Set color
            headerCell.innerHTML = header;
            headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);
        const rows = {};
        ["s", "h", "c", "d"].forEach(suit => {
            ANALYSIS[suit].forEach(rank => {
                const row = rows[rank] || (rows[rank] = {});
                row[suit] = numOrLetter(rank);
            });
        });
        Object.keys(rows).sort((a, b) => b - a).forEach(rank => {
            const dataRow = document.createElement("tr");
            ["s", "h", "c", "d"].forEach(suit => {
                const dataCell = document.createElement("td");
                dataCell.style.padding = "0 20px 0 20px";
                dataCell.innerHTML = rows[rank][suit] || "-";
                dataRow.appendChild(dataCell);
            });
            table.appendChild(dataRow);
        });
        element.appendChild(table);
        function numOrLetter(num) {
            return num > 10 ? ["J", "Q", "K", "A"][num - 11] : num;
        }
    }

    // Move all cards from the discard pile back to the deck, preserving the top card
    discardPile2Deck() {
        const topCard = this.discardPile.topCard();
        this.discardPile.removeCard(topCard);
        while (this.discardPile.length > 0) {
            this.deck.addCard(this.discardPile.topCard());
        }
        this.discardPile.addCard(topCard);
        this.deck.render();
        this.discardPile.render();
    }

    // Move all cards from one pile to another and render both piles
    pile2pile(fromPile, toPile) {
        while (fromPile.length > 0) {
            toPile.addCard(fromPile.bottomCard());
        }
        fromPile.render();
        toPile.render();
    }

    // Determine the proper home pile for cards based on the biggest card among the top four
    pile2home(accumPile, offset) {
        const starterSuit = accumPile.at(-4).suit;
        const biggestDesignatedCardIndex = accumPile.slice(-4).reduce((biggestIndex, card, index, cards) => {
            if(card.suit !== this.designatedSuit) return biggestIndex;
            return biggestIndex===-1 || card.rank > cards[biggestIndex].rank ? index : biggestIndex;
        }, -1);
        const biggestRegularCardIndex = accumPile.slice(-4).reduce((biggestIndex, card, index, cards) => {
            if(card.suit !== starterSuit) return biggestIndex;
            return biggestIndex===-1 || card.rank > cards[biggestIndex].rank ? index : biggestIndex;
        }, 0);
        const biggestCardIndex = biggestDesignatedCardIndex > -1 ? biggestDesignatedCardIndex : biggestRegularCardIndex;
        const adjustedIndex = (biggestCardIndex + offset) % 4;
        console.log("biggestCardIndex:", biggestCardIndex);
        console.log("biggestRegularCardIndex:", biggestRegularCardIndex);
        console.log("biggestDesignatedCardIndex:", biggestDesignatedCardIndex);
        console.log("adjustedIndex:", adjustedIndex);
        console.log("accumPile.slice(-4):", accumPile.slice(-4));
        console.log("accumPile:", accumPile);
        const endOfGame = this.lowerHand.length === 0;
        if((biggestCardIndex === 0 && accumPile.length>=8) || endOfGame) {
            this.pile2pile(accumPile, this.homePiles[adjustedIndex]);
        }
        return adjustedIndex;
    }

    // Get starter hand based on the previous winner's position
    getStarterHand() {
        const hands = [this.lowerHand, this.rightHand, this.upperHand, this.leftHand];
        return hands[this.prevWinnerPosition] || this.lowerHand;
    }

    // Allocate a designated suit based on the most cards in the player's hand (first 5 cards)
    allocateDesignatedSuit(hand) {
        console.log("designated suit from player:", this.prevWinnerPosition);
        console.log("designated suit from hand:", hand.slice(0, 5));
        const suitCounts = { s: 0, h: 0, c: 0, d: 0 };
        hand.slice(0, 5).forEach(card => {
            suitCounts[card.suit]++;
        });
        console.log("designated suit counts:", suitCounts);
        const ds = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b);
        console.log("designated suit:", ds);
        this.assignElement('designated-suit', this.getNameForSuit(ds));
        this.assignElement('designated-suit', this.getSymbolForSuit(ds));
        return ds;
    }

    // Turn all hands face down except the chosen one
    turnCardsFaceUp(chosenHand) {
        [this.upperHand, this.lowerHand, this.leftHand, this.rightHand].forEach(hand => {
            hand.faceUp = false;
            hand.render();
        });
        chosenHand.faceUp = true;
        chosenHand.render();
    }

    // Update the score for a hand and, if empty, mark it with its finishing position
    updateScore(chosenHand, delta) {
        const id = this.getScoreIdForHand(chosenHand);
        this.updateElement(id, delta);
        const handOrder = [this.lowerHand, this.rightHand, this.upperHand, this.leftHand];
        const myLocation = handOrder.indexOf(chosenHand);
        if (delta > 0) this.winnerTries[myLocation] += delta;
        if (chosenHand.length === 0) {
            const winnerHand = this.getHandWithMostTricks();
            const id = this.getScoreIdForHand(winnerHand);
            const element = document.getElementById(id);
            element.style.color = "green";
            element.innerHTML += ` (${this.estify(this.winnerPosition++)})`;
            // element.innerHTML += ` (${this.estify(this.winnerPosition++)})[-${this.winnerTries[myLocation]}]`;
        }
    }

    // Helper to return the score element ID for a given hand
    getScoreIdForHand(hand) {
        const ids = ["bottom-score", "right-score", "top-score", "left-score"];
        return ids[this.getIndexForHand(hand)];
    }
    getIndexForHand(hand) {
        const hands = [this.lowerHand, this.rightHand, this.upperHand, this.leftHand];
        return hands.indexOf(hand) || 0;
    }

    getHandWithMostTricks() {
        console.log("winnerTries:", this.winnerTries);
        const evensTotalTricks = this.winnerTries[0] + this.winnerTries[2];
        const oddsTotalTricks = this.winnerTries[1] + this.winnerTries[3];
        const winnerIndex = evensTotalTricks > oddsTotalTricks ? 
            (this.winnerTries[0] >= this.winnerTries[2] ? 0 : 2) :
            (this.winnerTries[1] >= this.winnerTries[3] ? 1 : 3);
        const handOrder = [this.lowerHand, this.rightHand, this.upperHand, this.leftHand];
        if(winnerIndex == 0 || winnerIndex == 2) {
            if(evensTotalTricks>=13) {
                confettiSchoolPride(15);
                confettiFireworks(15);
            }
            else if(evensTotalTricks>=12) {
                confettiFireworks(10);
            }
            else if(evensTotalTricks>7) {
                for(let i=0; i<=evensTotalTricks-7; i++) {
                    this.sleep(i*1000).then(confettiRealistic);
                }
            }
            else if(evensTotalTricks>=7) confettiBasic();
        }
        return handOrder[winnerIndex];
    }

    getPrevWinnerIndex() {
        const lastRoundScores = this.retrieveLatestRoundScores();
        const evensTotalTricks = lastRoundScores[0] + lastRoundScores[2];
        const oddsTotalTricks = lastRoundScores[1] + lastRoundScores[3];
        const winnerIndex = evensTotalTricks > oddsTotalTricks ? 
            (lastRoundScores[0] >= lastRoundScores[2] ? 0 : 2) :
            (lastRoundScores[1] >= lastRoundScores[3] ? 1 : 3);
        return winnerIndex;
    }

    getNameForSuit(suit) {
        return { s: "spades", h: "hearts", c: "clubs", d: "diamonds" }[suit] || "";
    }
    getSymbolForSuit(suit) {
        const symbols = { s: "♠", h: "♥", c: "♣", d: "♦" };
        const colors = { s: "black", h: "red", c: "black", d: "red" };
        const symbol = symbols[suit] || "";
        const color = colors[suit] || "black";
        return `<span style="color: ${color};">${symbol}</span>`;
    }

    // Increment the score display for an element
    updateElement(id, delta) {
        const element = document.getElementById(id);
        element.innerHTML = parseInt(element.innerHTML) + delta;
    }

    // assign a value to an element
    assignElement(id, value) {
        const element = document.getElementById(id);
        element.innerHTML = value;
    }

    // Convert a numeric position to its ordinal name
    estify(position) {
        return ["first", "second", "third", "fourth"][position - 1] || "";
    }

    // Sleep helper (used for delays)
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and start the game
const game = new CardGame();
