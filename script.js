document.addEventListener('DOMContentLoaded', () => {
    const CONSTANTS = {
        STARTING_CASH: 200, MAX_DAYS: 20, INVENTORY_CAPACITY: 8, BASE_HEAT_INCREASE_PER_DEAL: 3,
        BASE_HEAT_DECREASE_PER_DAY: 1, MIN_HEAT_FOR_EVENT: 25, POLICE_EVENT_CHANCE: 0.10,
        MARKET_FLUCTUATION_RANGE: 0.20, HAGGLE_ATTEMPTS: 1, HAGGLE_VALUE_PERCENT_PLAYER_SELLING: 0.15,
        HAGGLE_VALUE_PERCENT_PLAYER_BUYING: 0.15, NPC_HAGGLE_ACCEPT_CHANCE: 0.55,
    };
    const ITEM_BLUEPRINTS = [
        { id: "gc", name: "Green Crack", baseValue: 50, rarity: 1, type: "drug", fluctuation: 0 },
        { id: "bm", name: "Blue Magic Pills", baseValue: 30, rarity: 1, type: "drug", fluctuation: 0 },
        { id: "wp", name: "White Pony Gram", baseValue: 80, rarity: 2, type: "drug", fluctuation: 0 },
        { id: "ps", name: "Psychedelic Sheet", baseValue: 120, rarity: 3, type: "drug", fluctuation: 0 },
        { id: "phone", name: "Hot Smartphone", baseValue: 70, rarity: 1, type: "goods", fluctuation: 0 },
        { id: "watch", name: "Bling Watch", baseValue: 100, rarity: 2, type: "goods", fluctuation: 0 },
    ];
    const CUSTOMER_NAMES = ["Shady Steve", "Jittery Jess", "Smooth Sal", "Quick Mike", "Lena the Lender", "Big Tony"];
    const STORIES_SELLING_TO_PLAYER = [
        "Yo, Rikk, my man! Got this {itemName} straight off the truck. Need to move it fast. You in?",
        "Psst, Rikk! Found this {itemName} just lyin' around. My loss, your gain, eh?",
        "Rikk, word on the street is you got cash. I got this sweet {itemName}, best price, just for you.",
    ];
    const STORIES_BUYING_FROM_PLAYER = [
        "Rikk! I'm fiendin' for some {itemName}. Heard you the plug. Hook me up!",
        "My connect dried up, Rikk. You got that {itemName}? I'm payin' good.",
        "Ayo, Rikk, I need a {itemName} for a... situation. You holdin'?",
    ];

    let gameState = {};

    console.log("Script loaded. Attempting to define ui object..."); // DEBUG
    const ui = {
        screens: { start: document.getElementById('start-screen'), game: document.getElementById('game-screen'), end: document.getElementById('end-screen') },
        displays: {
            cash: document.getElementById('cash-display'), day: document.getElementById('day-display'), heat: document.getElementById('heat-display'),
            inventoryCount: document.getElementById('inventory-count-display'),
            finalCash: document.getElementById('final-cash-display'), finalDays: document.getElementById('final-days-display'),
            finalVerdict: document.getElementById('final-verdict-text'),
        },
        buttons: {
            start: document.getElementById('start-game-btn'), restart: document.getElementById('restart-game-btn'),
            openInventory: document.getElementById('open-inventory-btn'), nextCustomer: document.getElementById('next-customer-btn'),
        },
        containers: { choices: document.getElementById('choices-area'), chat: document.getElementById('chat-container') },
        inventoryModal: {
            modal: document.getElementById('inventory-modal'), list: document.getElementById('inventory-list'),
            closeBtn: document.querySelector('.close-modal-btn'), slotsDisplay: document.getElementById('modal-inventory-slots-display'),
        },
        sceneElements: { knockEffect: document.getElementById('knock-effect')},
        audio: {
            knock: document.getElementById('door-knock-sound'), cash: document.getElementById('cash-sound'),
            denied: document.getElementById('denied-sound'), chatBubble: document.getElementById('chat-bubble-sound'),
        }
    };
    console.log("ui object defined:", ui); // DEBUG

    function initializeGameState() {
        gameState = {
            cash: CONSTANTS.STARTING_CASH, currentDay: 1, heat: 0, inventory: [],
            items: JSON.parse(JSON.stringify(ITEM_BLUEPRINTS)),
            activeCustomer: null,
            customerQueuePosition: 0, maxEncountersPerDay: Math.floor(3 + Math.random() * 2), // 3-4 encounters
        };
        gameState.items.forEach(item => item.currentFluctuation = 0); // Ensure fluctuation is initialized
    }


    function startGame() {
        initializeGameState();
        showScreen('game');
        ui.buttons.nextCustomer.disabled = true;
        updateUIDisplay();
        clearChat();
        addChatMessage(`Day ${gameState.currentDay}. Sun's up, Rikk. Time to make paper.`, "narration");
        processMarketFluctuations(false); // false to not announce on day 1 start
        setTimeout(nextEncounter, 1500);
    }

    function showScreen(screenId) {
        Object.values(ui.screens).forEach(screen => screen.classList.remove('active'));
        ui.screens[screenId].classList.add('active');
    }
    function updateUIDisplay() {
        ui.displays.cash.textContent = gameState.cash;
        ui.displays.day.textContent = gameState.currentDay;
        ui.displays.heat.textContent = gameState.heat;
        ui.displays.inventoryCount.textContent = gameState.inventory.length;
        const invSlotsText = `${gameState.inventory.length}/${CONSTANTS.INVENTORY_CAPACITY}`;
        ui.inventoryModal.slotsDisplay.textContent = invSlotsText;
    }

    function clearChat() {
        ui.containers.chat.innerHTML = "";
        ui.containers.choices.innerHTML = "";
    }

    function addChatMessage(message, speakerType, speakerName = "") { // speakerType: "rikk", "customer", "narration"
        playSound(ui.audio.chatBubble);
        const bubble = document.createElement('div');
        bubble.classList.add('chat-bubble', speakerType);
        
        if (speakerType === "customer" && speakerName) {
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('speaker-name');
            nameSpan.textContent = speakerName;
            bubble.appendChild(nameSpan);
        }
        
        const messageNode = document.createTextNode(message); // Handles text content safely
        bubble.appendChild(messageNode);
        
        ui.containers.chat.prepend(bubble); // Prepend to keep newest at bottom due to flex-direction: column-reverse
        ui.containers.chat.scrollTop = ui.containers.chat.scrollHeight;
    }
    
    function playSound(soundElement) {
        if (soundElement) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => console.warn("Audio play failed:", e));
        }
    }

    function processMarketFluctuations(announce = true) {
        let news = "";
        gameState.items.forEach(item => {
            const baseFluctuation = item.type === "drug" ? CONSTANTS.MARKET_FLUCTUATION_RANGE * 1.5 : CONSTANTS.MARKET_FLUCTUATION_RANGE * 0.8;
            const change = (Math.random() * (baseFluctuation * 2)) - baseFluctuation;
            item.currentFluctuation = parseFloat(change.toFixed(2));
        });

        const fluctuatedItems = gameState.items.filter(item => item.currentFluctuation !== 0);
        if (fluctuatedItems.length > 0) {
            const sampleItem = fluctuatedItems[Math.floor(Math.random() * fluctuatedItems.length)];
            let priceTrend = sampleItem.currentFluctuation > 0 ? "skyrocketin'" : "droppin' low";
            if (Math.abs(sampleItem.currentFluctuation) < 0.05) priceTrend = "holdin' steady but watch it";
            news = `Word on the wire: price of ${sampleItem.name} is ${priceTrend}.`;
        } else {
            news = "Streets are quiet, prices locked in... for now.";
        }

        gameState.inventory.forEach(invItem => {
            const blueprint = gameState.items.find(bp => bp.id === invItem.blueprintId);
            if (blueprint) {
                invItem.currentMarketValue = calculateItemStreetValue(blueprint);
            }
        });

        if (announce) addChatMessage(news, "narration");
    }
    function calculateItemStreetValue(itemBlueprint, forBuyingFromNPC = false) {
        let value = itemBlueprint.baseValue * (1 + (itemBlueprint.currentFluctuation || 0) ); // Use currentFluctuation, default to 0 if undefined
        const npcMarginBase = itemBlueprint.type === "drug" ? 0.30 : 0.20;
        const npcMargin = npcMarginBase + (Math.random() * 0.15);

        if (forBuyingFromNPC) {
            value = value * (1 + npcMargin);
        } else {
            value = value * (1 - npcMargin);
        }
        return Math.max(Math.floor(itemBlueprint.baseValue * 0.2), Math.floor(value));
    }

    function nextEncounter() {
        ui.containers.choices.innerHTML = "";
        ui.buttons.nextCustomer.disabled = true;

        if (gameState.customerQueuePosition >= gameState.maxEncountersPerDay) {
            endDay(); return;
        }
        if (gameState.cash <= 0 && gameState.inventory.length === 0 && gameState.currentDay > 1) {
            endGame("Rikk's broke and fresh out. Game over, fam."); return;
        }
        if (gameState.currentDay > CONSTANTS.MAX_DAYS) {
            endGame("The hustle ran its course. Let's see the damage."); return;
        }

        if (gameState.heat >= CONSTANTS.MIN_HEAT_FOR_EVENT && Math.random() < CONSTANTS.POLICE_EVENT_CHANCE) {
            if (gameState.heat > 50 && Math.random() < 0.3) {
                handleRivalEncounter();
            } else {
                handlePoliceEvent();
            }
            return;
        }
        
        playSound(ui.audio.knock);
        if (ui.sceneElements.knockEffect) { // Check if knockEffect exists
            ui.sceneElements.knockEffect.classList.remove('hidden');
            setTimeout(() => ui.sceneElements.knockEffect.classList.add('hidden'), 700);
        }


        addChatMessage("...", "narration");
        setTimeout(generateCustomer, 1500 + Math.random() * 1000);
    }

    function handleRivalEncounter() {
        playSound(ui.audio.denied);
        const rivalName = `"${["Slick", "Grim", "Heavy"][Math.floor(Math.random()*3)]} D"`;
        addChatMessage(`${rivalName} is at the door. Not looking friendly.`, "narration");

        setTimeout(() => {
            let outcomeMessage;
            if (gameState.heat > 60 && gameState.inventory.length > 2 && Math.random() < 0.4) {
                const itemsLostCount = Math.min(gameState.inventory.length, Math.floor(Math.random() * 2) + 1);
                let lostItemsMessage = "";
                for(let i=0; i<itemsLostCount; i++) {
                    if(gameState.inventory.length > 0) {
                        const itemLost = gameState.inventory.splice(Math.floor(Math.random() * gameState.inventory.length), 1)[0];
                        lostItemsMessage += `${itemLost.name}, `;
                    }
                }
                lostItemsMessage = lostItemsMessage.slice(0, -2);
                const cashStolen = Math.min(gameState.cash, Math.floor(gameState.cash * (0.1 + Math.random()*0.2)));
                gameState.cash -= cashStolen;

                outcomeMessage = `${rivalName} and his crew ran up in your spot! They took ${lostItemsMessage || 'nothin\''} and jacked $${cashStolen}! Your heat dropped a bit though, they the new target.`;
                updateHeat(-20);
            } else if (Math.random() < 0.6) {
                const taxAmount = Math.min(gameState.cash, Math.floor(CONSTANTS.STARTING_CASH * (0.1 + Math.random() * 0.1)));
                gameState.cash -= taxAmount;
                outcomeMessage = `${rivalName} says this is their block. Had to pay a 'street tax' of $${taxAmount} to keep things cool. For now.`;
                updateHeat(5);
            } else {
                outcomeMessage = `${rivalName} gave you a warning. "Watch your step, Rikk. This turf ain't big enough for all of us."`;
                updateHeat(2);
            }
            addChatMessage(outcomeMessage, "narration");
            updateUIDisplay();
            gameState.customerQueuePosition++;
            ui.buttons.nextCustomer.disabled = false;
        }, 2000);
    }

    function handlePoliceEvent() {
        playSound(ui.audio.denied);
        addChatMessage("FIVE-O! It's a raid, Rikk! They're kickin' in the door!", "narration");
        let cashConfiscated = 0;
        let itemsConfiscatedMessages = [];
        let chargesFiled = false;

        if (gameState.cash > CONSTANTS.STARTING_CASH * 0.75) {
            cashConfiscated = Math.floor(gameState.cash * (0.2 + Math.random() * 0.3));
            gameState.cash -= cashConfiscated;
        }

        const drugItemsInStash = gameState.inventory.filter(i => gameState.items.find(bp => bp.id === i.blueprintId)?.type === "drug");
        if (drugItemsInStash.length > 0) {
            chargesFiled = true;
            const numDrugsToLose = Math.min(drugItemsInStash.length, Math.floor(Math.random() * 2) + 1);
            for (let i = 0; i < numDrugsToLose; i++) {
                if (drugItemsInStash.length > 0) {
                    const itemLost = drugItemsInStash.splice(Math.floor(Math.random() * drugItemsInStash.length), 1)[0];
                    gameState.inventory = gameState.inventory.filter(invItem => invItem !== itemLost);
                    itemsConfiscatedMessages.push(itemLost.name);
                }
            }
        }
        if (gameState.heat > 70) {
            const hotGoodsInStash = gameState.inventory.filter(i => gameState.items.find(bp => bp.id === i.blueprintId)?.type === "goods");
            if (hotGoodsInStash.length > 0 && Math.random() < 0.4) {
                const itemLost = hotGoodsInStash.splice(Math.floor(Math.random() * hotGoodsInStash.length), 1)[0];
                 gameState.inventory = gameState.inventory.filter(invItem => invItem !== itemLost);
                itemsConfiscatedMessages.push(`${itemLost.name} (stolen property)`);
                chargesFiled = true;
            }
        }
        
        let consequence = `Cops tossed the place! `;
        if (cashConfiscated > 0) consequence += `They seized $${cashConfiscated} as 'evidence'. `;
        if (itemsConfiscatedMessages.length > 0) consequence += `Confiscated: ${itemsConfiscatedMessages.join(', ')}. `;
        if (!chargesFiled && cashConfiscated === 0 && itemsConfiscatedMessages.length === 0) {
             consequence += "Rikk talked his way out of it this time, but it was close!";
             updateHeat(-10);
        } else {
            consequence += chargesFiled ? "Lookin' at some serious charges, Rikk!" : "Got a slap on the wrist for now.";
            updateHeat(-25); 
            if (chargesFiled && gameState.cash < 50 && drugItemsInStash.length > 2) {
                 setTimeout(() => {
                    addChatMessage(consequence, "narration");
                    endGame("The Feds ain't playin'. Rikk's locked up. Hustle over.");
                }, 2000);
                return;
            }
        }

        setTimeout(() => {
            addChatMessage(consequence, "narration");
            updateUIDisplay();
            gameState.customerQueuePosition++;
            ui.buttons.nextCustomer.disabled = false;
        }, 2000);
    }

    function generateCustomer() {
        const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
        const isSellingToPlayer = Math.random() > 0.4 || gameState.inventory.length < CONSTANTS.INVENTORY_CAPACITY * 0.3;
        let itemBlueprint, story, offerPrice;
        let customerItemName; 

        gameState.activeCustomer = { name, haggleAttempts: CONSTANTS.HAGGLE_ATTEMPTS, isSellingToPlayer };

        if (isSellingToPlayer && gameState.inventory.length < CONSTANTS.INVENTORY_CAPACITY) {
            const availableItems = gameState.items.filter(item => {
                return name.includes("(Reseller)") ? item.rarity >= 2 : item.rarity <= 2 || Math.random() < 0.1;
            });
            if (availableItems.length === 0) {
                addChatMessage("Doorbell. Nobody there. Wasted Rikk's time.", "narration");
                ui.buttons.nextCustomer.disabled = false; return;
            }
            itemBlueprint = availableItems[Math.floor(Math.random() * availableItems.length)];
            customerItemName = itemBlueprint.slangTerms ? itemBlueprint.slangTerms[Math.floor(Math.random() * itemBlueprint.slangTerms.length)] : itemBlueprint.name;
            story = STORIES_SELLING_TO_PLAYER[Math.floor(Math.random() * STORIES_SELLING_TO_PLAYER.length)]
                        .replace("{itemName}", customerItemName);
            offerPrice = calculateItemStreetValue(itemBlueprint, true);
            gameState.activeCustomer.item = { ...itemBlueprint, offerPrice, displayName: customerItemName };
            
            addChatMessage(story, "customer", name);
            setTimeout(() => addChatMessage(`"${customerItemName}, huh? They want $${offerPrice} for it."`, "rikk"), 1000);
            
            setTimeout(() => {
                makeButton("Cop It ($" + offerPrice + ")", () => transaction(true), gameState.cash < offerPrice || gameState.inventory.length >= CONSTANTS.INVENTORY_CAPACITY);
                if (gameState.activeCustomer.haggleAttempts > 0 && gameState.cash >= offerPrice * 0.7) {
                     makeButton("Talk 'em Down", () => attemptHaggle(true));
                }
                makeButton("Nah, Pass", () => decline(`"${customerItemName}? Nah, I'm good."`), false, "decline");
            }, 2500);

        } else if (gameState.inventory.length > 0) {
            const playerItemToSell = gameState.inventory[Math.floor(Math.random() * gameState.inventory.length)];
            itemBlueprint = gameState.items.find(bp => bp.id === playerItemToSell.blueprintId);
            customerItemName = itemBlueprint.slangTerms ? itemBlueprint.slangTerms[Math.floor(Math.random() * itemBlueprint.slangTerms.length)] : playerItemToSell.name;
            
            let storyTemplate = STORIES_BUYING_FROM_PLAYER[Math.floor(Math.random() * STORIES_BUYING_FROM_PLAYER.length)];
            story = storyTemplate.replace("{itemName}", customerItemName).replace("{slangTerm}", customerItemName); 

            offerPrice = calculateItemStreetValue(itemBlueprint, false);
            gameState.activeCustomer.item = { ...playerItemToSell, offerPrice, displayName: customerItemName, itemRef: playerItemToSell };

            addChatMessage(story, "customer", name);
            setTimeout(() => addChatMessage(`"Wants my ${playerItemToSell.name} for $${offerPrice}. Hmm..."`, "rikk"), 1000);

            setTimeout(() => {
                makeButton("Serve 'em ($" + offerPrice + ")", () => transaction(false));
                if (gameState.activeCustomer.haggleAttempts > 0) {
                    makeButton("Tax 'em More", () => attemptHaggle(false));
                }
                makeButton("Not for That Price", () => decline(`"${playerItemToSell.name} for $${offerPrice}? Get real."`), false, "decline");
            }, 2500);
        } else {
            addChatMessage("Knock knock... Rikk checks the peephole. Nobody he wants to see when his stash is dry.", "narration");
            gameState.customerQueuePosition = gameState.maxEncountersPerDay;
            ui.buttons.nextCustomer.disabled = false;
            return;
        }
        updateUIDisplay();
    }

    function makeButton(text, onClick, disabled = false, extraClass = '') {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.onclick = () => {
            ui.containers.choices.innerHTML = ""; 
            onClick();
        };
        btn.disabled = disabled;
        btn.classList.add('choice-button');
        if (extraClass) btn.classList.add(extraClass);
        ui.containers.choices.appendChild(btn);
    }
    
    function attemptHaggle(playerIsBuying) {
        gameState.activeCustomer.haggleAttempts--;
        const customer = gameState.activeCustomer;
        const originalOffer = customer.item.offerPrice;
        const itemDisplayName = customer.item.displayName || customer.item.name;
        let newOffer, rikkMessage;

        if (playerIsBuying) {
            const reduction = Math.floor(originalOffer * CONSTANTS.HAGGLE_VALUE_PERCENT_PLAYER_BUYING);
            newOffer = Math.max(5, originalOffer - reduction);
            rikkMessage = `"$${originalOffer} for ${itemDisplayName}? Nah, best I can do is $${newOffer}."`;
        } else {
            const increase = Math.floor(originalOffer * CONSTANTS.HAGGLE_VALUE_PERCENT_PLAYER_SELLING);
            newOffer = originalOffer + increase;
            rikkMessage = `"$${originalOffer} for my ${itemDisplayName}? You trippin'. Price is $${newOffer}, take it or leave it."`;
        }
        addChatMessage(rikkMessage, "rikk");

        setTimeout(() => {
            let customerResponse;
            if (Math.random() < CONSTANTS.NPC_HAGGLE_ACCEPT_CHANCE) {
                playSound(ui.audio.cash);
                customerResponse = `${customer.name} thinks for a sec... "Aight, Rikk, you drive a hard bargain. $${newOffer} it is."`;
                customer.item.offerPrice = newOffer;
                 addChatMessage(customerResponse, "customer", customer.name);
                setTimeout(() => {
                    if (playerIsBuying) makeButton(`Score for $${newOffer}`, () => transaction(true), gameState.cash < newOffer || gameState.inventory.length >= CONSTANTS.INVENTORY_CAPACITY);
                    else makeButton(`Flip for $${newOffer}`, () => transaction(false));
                    makeButton("On Second Thought...", () => decline(`"Changed my mind on the ${itemDisplayName}."`), false, "decline");
                }, 1000);
            } else {
                playSound(ui.audio.denied);
                customerResponse = `${customer.name} scoffs, "Forget it, Rikk. My first price ($${originalOffer}) was final. You want it or not?"`;
                addChatMessage(customerResponse, "customer", customer.name);
                setTimeout(() => {
                    if (playerIsBuying) makeButton(`Okay, $${originalOffer} then`, () => transaction(true), gameState.cash < originalOffer || gameState.inventory.length >= CONSTANTS.INVENTORY_CAPACITY);
                    else makeButton(`Fine, $${originalOffer}`, () => transaction(false));
                    makeButton("I'm Out", () => decline(`"Nah, not for that price."`), false, "decline");
                }, 1000);
            }
        }, 2000);
    }

    function transaction(isPlayerBuying) {
        const itemDetails = gameState.activeCustomer.item;
        const itemDisplayName = itemDetails.displayName || itemDetails.name;
        let rikkMessage;

        if (isPlayerBuying) {
            if (gameState.inventory.length >= CONSTANTS.INVENTORY_CAPACITY) {
                rikkMessage = `"My stash is full, can't take that ${itemDisplayName} right now."`;
                playSound(ui.audio.denied); addChatMessage(rikkMessage, "rikk"); resolveCurrentEncounter(false); return;
            }
            if (gameState.cash < itemDetails.offerPrice) {
                rikkMessage = `"Not enough dough for that ${itemDisplayName}."`;
                playSound(ui.audio.denied); addChatMessage(rikkMessage, "rikk"); resolveCurrentEncounter(false); return;
            }
            gameState.cash -= itemDetails.offerPrice;
            const newItem = { blueprintId: itemDetails.id, name: itemDetails.name, purchasePrice: itemDetails.offerPrice };
            const blueprint = gameState.items.find(bp => bp.id === newItem.blueprintId); // Find blueprint for market value calc
            newItem.currentMarketValue = blueprint ? calculateItemStreetValue(blueprint) : newItem.purchasePrice; // Calculate market value or default
            gameState.inventory.push(newItem);
            rikkMessage = `"Pleasure doin' business." Rikk copped ${itemDisplayName} for $${itemDetails.offerPrice}.`;
            playSound(ui.audio.cash);
        } else { 
            gameState.cash += itemDetails.offerPrice;
            gameState.inventory = gameState.inventory.filter(invItem => invItem !== itemDetails.itemRef);
            rikkMessage = `"Good lookin' out." Rikk flipped his ${itemDisplayName} for $${itemDetails.offerPrice}.`;
            playSound(ui.audio.cash);
        }
        addChatMessage(rikkMessage, "rikk");
        const itemType = gameState.items.find(bp => bp.id === itemDetails.blueprintId)?.type;
        updateHeat(CONSTANTS.BASE_HEAT_INCREASE_PER_DEAL + (itemType === "drug" ? 2 : 0) );
        resolveCurrentEncounter(true);
    }

    function decline(rikkMessage) {
        addChatMessage(rikkMessage, "rikk");
        playSound(ui.audio.denied);
        resolveCurrentEncounter(false);
    }
    
    function resolveCurrentEncounter(transactionMade) {
        gameState.activeCustomer = null;
        ui.buttons.nextCustomer.disabled = false;
        gameState.customerQueuePosition++;
        updateUIDisplay();
    }

    function endDay() {
        addChatMessage(`Sunset. Day ${gameState.currentDay} done. Rikk lays low for the night...`, "narration");
        gameState.currentDay++;
        gameState.customerQueuePosition = 0;
        updateHeat(-CONSTANTS.BASE_HEAT_DECREASE_PER_DAY);
        processMarketFluctuations();
        updateUIDisplay();
        setTimeout(() => {
             if (gameState.currentDay > CONSTANTS.MAX_DAYS) { endGame("The hustle ran its course. Let's see the damage."); return; }
            addChatMessage(`Dawn breaks. Day ${gameState.currentDay}. Back to the grind.`, "narration");
            setTimeout(nextEncounter, 1500);
        }, 2500);
    }
    
    function updateHeat(amount) { gameState.heat = Math.max(0, Math.min(100, gameState.heat + amount)); }
    
    function toggleInventoryModal(show) {
        ui.inventoryModal.modal.style.display = show ? 'flex' : 'none';
        if (show) renderInventory();
    }

    function renderInventory() {
        ui.inventoryModal.list.innerHTML = "";
        if (gameState.inventory.length === 0) { ui.inventoryModal.list.innerHTML = "<p>Rikk's backpack is empty.</p>"; return; }
        gameState.inventory.forEach(item => {
            const p = document.createElement('p');
            const blueprint = gameState.items.find(bp => bp.id === item.blueprintId);
            // Use item.currentMarketValue if it exists, otherwise calculate (should exist after purchase)
            const currentSellValue = item.currentMarketValue !== undefined ? item.currentMarketValue : (blueprint ? calculateItemStreetValue(blueprint, false) : item.purchasePrice);
            p.innerHTML = `<strong>${item.name}</strong><br><span class="item-detail">Bought: $${item.purchasePrice}, Street Value: ~$${currentSellValue}</span>`;
            ui.inventoryModal.list.appendChild(p);
        });
    }

    function endGame(reason) {
        showScreen('end');
        ui.displays.finalCash.textContent = gameState.cash;
        ui.displays.finalDays.textContent = Math.min(gameState.currentDay -1, CONSTANTS.MAX_DAYS) ;
        let verdict = `${reason} `;
        if (gameState.cash >= CONSTANTS.STARTING_CASH * 15) verdict += "Rikk's a certified street legend! Untouchable!";
        else if (gameState.cash >= CONSTANTS.STARTING_CASH * 8) verdict += "Rikk basically runs these blocks now. Major weight!";
        else if (gameState.cash >= CONSTANTS.STARTING_CASH * 3) verdict += "Rikk's a known hustler. Stackin' paper.";
        else if (gameState.cash > CONSTANTS.STARTING_CASH) verdict += "Rikk survived and profited. Respect.";
        else if (gameState.cash >= CONSTANTS.STARTING_CASH * 0.3) verdict += "Barely scraped by. The streets are tough, Rikk.";
        else verdict += "Chewed up and spit out. Rikk's hustle ended in the red.";
        ui.displays.finalVerdict.textContent = verdict;
    }

    ui.buttons.start.addEventListener('click', startGame);
    ui.buttons.restart.addEventListener('click', startGame);
    ui.buttons.openInventory.addEventListener('click', () => toggleInventoryModal(true));
    ui.inventoryModal.closeBtn.addEventListener('click', () => toggleInventoryModal(false));
    window.addEventListener('click', (event) => { if (event.target === ui.inventoryModal.modal) toggleInventoryModal(false); });
    ui.buttons.nextCustomer.addEventListener('click', nextEncounter);
    
    showScreen('start');
});