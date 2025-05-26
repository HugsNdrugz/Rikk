// --- DOM Element References ---
const gameViewport = document.getElementById('game-viewport');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

const newGameBtn = document.getElementById('new-game-btn'); // Updated ID
const continueGameBtn = document.getElementById('continue-game-btn'); // New Button
const restartGameBtn = document.getElementById('restart-game-btn');

const cashDisplay = document.getElementById('cash-display');
const dayDisplay = document.getElementById('day-display');
const heatDisplay = document.getElementById('heat-display');

const gameScene = document.getElementById('game-scene');
const knockEffect = document.getElementById('knock-effect');

const rikkPhoneDisplay = document.getElementById('rikk-phone-display');
const chatContainer = document.getElementById('chat-container');
const choicesArea = document.getElementById('choices-area');

const openInventoryBtn = document.getElementById('open-inventory-btn');
const inventoryCountDisplay = document.getElementById('inventory-count-display');
const nextCustomerBtn = document.getElementById('next-customer-btn');

const inventoryModal = document.getElementById('inventory-modal');
const closeModalBtn = document.querySelector('#inventory-modal .close-modal-btn');
const inventoryList = document.getElementById('inventory-list');
const modalInventorySlotsDisplay = document.getElementById('modal-inventory-slots-display');

const finalDaysDisplay = document.getElementById('final-days-display');
const finalCashDisplay = document.getElementById('final-cash-display');
const finalVerdictText = document.getElementById('final-verdict-text');

// --- Audio References ---
const doorKnockSound = document.getElementById('door-knock-sound');
const cashSound = document.getElementById('cash-sound');
const deniedSound = document.getElementById('denied-sound');
const chatBubbleSound = document.getElementById('chat-bubble-sound');

// --- Game State Variables ---
let cash = 0;
let day = 0;
let heat = 0;
let inventory = [];
const MAX_INVENTORY_SLOTS = 5;
let currentCustomer = null;
let gameActive = false;
let currentCustomersInQueue = [];

// --- Game Configuration ---
const CUSTOMER_WAIT_TIME = 1000;
const KNOCK_ANIMATION_DURATION = 1200;
const PHONE_ANIMATION_DURATION = 600;
const SAVE_KEY = 'rikksHustleSaveDataV1'; // Key for localStorage

// --- Customer Data ---
const customers = [
    {
        name: "Shady Larry",
        dialogue: [
            { speaker: "customer", text: "Yo, Rikk. Got anything, uh, 'special' today? Need a fresh pair of kicks." },
            { speaker: "rikk", text: "Always got the freshest. What's your budget looking like?" },
            { speaker: "customer", text: "Trying to keep it under 50. What you workin' with?" }
        ],
        choices: [
            { text: "Offer Cheap Sneakers ($30)", outcome: { type: "sell", item: { name: "Cheap Sneakers", buyPrice: 15, sellPrice: 30 } } },
            { text: "Offer Premium Sneakers ($70)", outcome: { type: "sell", item: { name: "Premium Sneakers", buyPrice: 40, sellPrice: 70 } } },
            { text: "Decline - Too risky.", outcome: { type: "decline" } }
        ],
        successHeatIncrease: 5,
        declineHeatIncrease: 2,
    },
    {
        name: "Suspicious Susan",
        dialogue: [
            { speaker: "customer", text: "Heard you might have some... 'antiques.' Looking for something shiny." },
            { speaker: "rikk", text: "Antiques, huh? What kind of shiny we talkin'?" },
            { speaker: "customer", text: "Something small, valuable. Got about 100 on me." }
        ],
        choices: [
            { text: "Offer 'Borrowed' Watch ($90)", outcome: { type: "sell", item: { name: "'Borrowed' Watch", buyPrice: 50, sellPrice: 90 } } },
            { text: "Offer Old Coin Collection ($120)", outcome: { type: "sell", item: { name: "Old Coin Collection", buyPrice: 60, sellPrice: 120 } } },
            { text: "Decline - Fishy vibe.", outcome: { type: "decline" } }
        ],
        successHeatIncrease: 8,
        declineHeatIncrease: 3,
    },
    {
        name: "Nosy Neighbor",
        dialogue: [
            { speaker: "customer", text: "Just checking in, Rikk. Everything alright? Saw a lot of foot traffic today." },
            { speaker: "rikk", text: "Just... delivering flyers! You know, community outreach." },
            { speaker: "customer", text: "Right. Flyers. Well, keep it down. Some of us got early mornings." }
        ],
        choices: [
            { text: "Offer a 'Free' Sample (No heat gain)", outcome: { type: "give", item: { name: "Suspiciously Quiet Muffler", buyPrice: 0, sellPrice: 0 }, heatPenalty: 0 } },
            { text: "Tell them to mind their own business.", outcome: { type: "bluff", heatIncrease: 10 } }
        ],
        successHeatIncrease: 0,
        declineHeatIncrease: 0,
    },
    {
        name: "Vinny the Vendor",
        dialogue: [
            { speaker: "customer", text: "Psst, Rikk! Word on the street is you're looking to stock up. I got some quality goods, fresh off the... well, they're fresh." },
            { speaker: "rikk", text: "Always looking for a good deal, Vinny. What've you got?" },
            { speaker: "customer", text: "Today, I can offer you some top-tier 'Genuine' Wallets or a batch of 'Rare' Comic Books. Interested?" }
        ],
        choices: [
            {
                text: "Buy 5 'Genuine' Wallets ($50 total)",
                outcome: {
                    type: "buy",
                    item: { name: "Genuine Wallet", buyPrice: 10, sellPrice: 25, heatIncrease: 1 },
                    quantity: 5,
                    totalBuyPrice: 50
                }
            },
            {
                text: "Buy 'Rare' Comic Book ($30)",
                outcome: {
                    type: "buy",
                    item: { name: "Rare Comic Book", buyPrice: 30, sellPrice: 70, heatIncrease: 2 }
                }
            },
            { text: "Decline - Not today, Vinny.", outcome: { type: "decline" } }
        ],
        successHeatIncrease: 0, // Handled by item's heatIncrease if any
        declineHeatIncrease: 1, // Vinny gets a little annoyed
    }
];

// --- Game Functions ---

function initGame() {
    newGameBtn.addEventListener('click', handleStartNewGameClick);
    continueGameBtn.addEventListener('click', handleContinueGameClick);
    restartGameBtn.addEventListener('click', handleRestartGameClick);
    nextCustomerBtn.addEventListener('click', nextDay);
    openInventoryBtn.addEventListener('click', openInventoryModal);
    closeModalBtn.addEventListener('click', closeInventoryModal);
    inventoryModal.addEventListener('click', (e) => {
        if (e.target === inventoryModal) closeInventoryModal();
    });

    checkForSavedGame();
    updateHUD(); // Initialize HUD, might be 0s if no save
    updateInventoryDisplay();
    rikkPhoneDisplay.classList.add('hidden');
    rikkPhoneDisplay.classList.remove('active');
}

function handleStartNewGameClick() {
    initializeNewGameState();
    startGameFlow();
}

function handleContinueGameClick() {
    if (loadGameState()) {
        startGameFlow();
    } else {
        // If load failed (e.g., no save data or corrupt), start a new game
        displayCustomerMessage("System: No saved game found or data corrupted. Starting new game.", "narration"); // Temporary message
        initializeNewGameState();
        startGameFlow();
    }
}

function handleRestartGameClick() {
    initializeNewGameState(); // This already clears saved game
    startGameFlow();
}

function initializeNewGameState() {
    clearSavedGameState(); // Important to clear any previous save
    cash = 100;
    day = 0; // nextDay will increment this to 1 for the first day
    heat = 0;
    inventory = [];
    currentCustomersInQueue = [];
    gameActive = false; // Will be set to true in startGameFlow
}

function startGameFlow() {
    gameActive = true;

    startScreen.classList.remove('active');
    endScreen.classList.remove('active');
    gameScreen.classList.add('active');

    rikkPhoneDisplay.classList.add('hidden');
    rikkPhoneDisplay.classList.remove('active');

    updateHUD();
    updateInventoryDisplay();
    clearChat();
    clearChoices();

    nextDay(); // Start the first day or proceed to the next loaded/new day
}

function endGame(reason) {
    gameActive = false;
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');

    finalDaysDisplay.textContent = day;
    finalCashDisplay.textContent = cash;

    if (reason === "heat") {
        finalVerdictText.textContent = "The fuzz got too hot on your tail. Time to lay low... forever.";
        finalVerdictText.style.color = "#e74c3c";
    } else if (reason === "bankrupt") {
        finalVerdictText.textContent = "Broke and busted. Can't hustle on an empty wallet.";
        finalVerdictText.style.color = "#e74c3c";
    } else {
        finalVerdictText.textContent = "You hustled your way to the top! Nice work, Rikk.";
        finalVerdictText.style.color = "#27ae60";
    }

    rikkPhoneDisplay.classList.add('hidden');
    rikkPhoneDisplay.classList.remove('active');
    clearSavedGameState(); // Clear save data on game over
}

function nextDay() {
    if (!gameActive) return;

    day++;
    heat = Math.max(0, heat - 2);
    updateHUD();
    clearChat();
    clearChoices();

    nextCustomerBtn.disabled = true;

    rikkPhoneDisplay.classList.remove('active');
    setTimeout(() => rikkPhoneDisplay.classList.add('hidden'), PHONE_ANIMATION_DURATION);

    playSound(doorKnockSound);
    knockEffect.classList.remove('hidden');
    knockEffect.style.animation = 'none';
    void knockEffect.offsetWidth;
    knockEffect.style.animation = 'knockAnim 0.5s ease-out forwards';

    setTimeout(() => {
        knockEffect.classList.add('hidden');
        startCustomerInteraction();
    }, KNOCK_ANIMATION_DURATION);
    saveGameState(); // Save state at the beginning of a new day
}

function generateCustomer() {
    const randomIndex = Math.floor(Math.random() * customers.length);
    return customers[randomIndex];
}

function startCustomerInteraction() {
    currentCustomer = generateCustomer();
    let dialogueIndex = 0;

    rikkPhoneDisplay.classList.remove('hidden');
    setTimeout(() => rikkPhoneDisplay.classList.add('active'), 50);

    const displayNext = () => {
        if (dialogueIndex < currentCustomer.dialogue.length) {
            const msg = currentCustomer.dialogue[dialogueIndex];
            displayCustomerMessage(msg.text, msg.speaker);
            dialogueIndex++;
            setTimeout(displayNext, CUSTOMER_WAIT_TIME);
        } else {
            displayChoices(currentCustomer.choices);
        }
    };
    displayNext();
}

function displayCustomerMessage(message, speaker) {
    playSound(chatBubbleSound);
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', speaker);

    if (speaker === 'customer' || speaker === 'rikk') {
        const speakerName = document.createElement('span');
        speakerName.classList.add('speaker-name');
        speakerName.textContent = (speaker === 'customer' ? currentCustomer.name : 'Rikk');
        bubble.appendChild(speakerName);
    }

    const textNode = document.createTextNode(message);
    bubble.appendChild(textNode);
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function displayChoices(choices) {
    choicesArea.innerHTML = '';
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;
        if (choice.outcome.type === 'decline') button.classList.add('decline');
        button.addEventListener('click', () => handleChoice(choice.outcome));
        choicesArea.appendChild(button);
    });
}

function handleChoice(outcome) {
    clearChoices();
    let narrationText = "";
    let customerReaction = "";

    switch (outcome.type) {
        case "sell":
            const itemIndex = inventory.findIndex(i => i.name === outcome.item.name);
            if (itemIndex !== -1) {
                const itemSold = inventory.splice(itemIndex, 1)[0];
                cash += itemSold.sellPrice;
                heat += currentCustomer.successHeatIncrease || 0;
                narrationText = `You sold the ${itemSold.name} for $${itemSold.sellPrice}.`;
                customerReaction = `"${currentCustomer.name}: Pleasure doing business with you, Rikk!"`;
                playSound(cashSound);
            } else {
                narrationText = `You don't have ${outcome.item.name} to sell!`;
                customerReaction = `"${currentCustomer.name}: What? You ain't got it? Get outta here!"`;
                heat += 5;
                playSound(deniedSound);
            }
            break;
        case "buy":
            const buyItem = outcome.item;
            const quantityToBuy = outcome.quantity || 1;
            const totalCost = outcome.totalBuyPrice || (buyItem.buyPrice * quantityToBuy);

            if (cash >= totalCost && (inventory.length + quantityToBuy) <= MAX_INVENTORY_SLOTS) {
                cash -= totalCost;
                for (let i = 0; i < quantityToBuy; i++) {
                    inventory.push({...buyItem}); // Push a copy of the item
                }
                heat += (buyItem.heatIncrease || 0) * quantityToBuy; // Apply heat per item if specified
                narrationText = `You bought ${quantityToBuy}x ${buyItem.name} for $${totalCost}.`;
                customerReaction = `"${currentCustomer.name}: Smart move, Rikk! They'll fly off the shelves."`;
                playSound(cashSound);
            } else if (cash < totalCost) {
                narrationText = `Not enough cash for ${quantityToBuy}x ${buyItem.name}! You need $${totalCost}.`;
                customerReaction = `"${currentCustomer.name}: Don't waste my time if you ain't got the dough."`;
                heat += currentCustomer.declineHeatIncrease || 2;
                playSound(deniedSound);
            } else { // Inventory full
                narrationText = `Your stash is full. No space for ${quantityToBuy}x ${buyItem.name}! You need ${MAX_INVENTORY_SLOTS - inventory.length} free slots.`;
                customerReaction = `"${currentCustomer.name}: Clear some space first, amateur."`;
                heat += currentCustomer.declineHeatIncrease || 2;
                playSound(deniedSound);
            }
            break;
        case "decline":
            heat += currentCustomer.declineHeatIncrease || 0;
            narrationText = `You declined ${currentCustomer.name}'s offer.`;
            customerReaction = `"${currentCustomer.name}: Fine, be that way! I'll find someone else."`;
            playSound(deniedSound);
            break;
        case "give":
            const itemToGiveIndex = inventory.findIndex(i => i.name === outcome.item.name);
            if (itemToGiveIndex !== -1) {
                inventory.splice(itemToGiveIndex, 1);
                heat += outcome.heatPenalty || 0;
                narrationText = `You gave away a ${outcome.item.name}.`;
                customerReaction = `"${currentCustomer.name}: Oh, well, thank you, Rikk! Have a good day."`;
                playSound(cashSound);
            } else {
                narrationText = `You don't have a ${outcome.item.name} to give!`;
                customerReaction = `"${currentCustomer.name}: Liar! Don't mess with me!"`;
                heat += 5;
                playSound(deniedSound);
            }
            break;
        case "bluff":
            heat += outcome.heatIncrease || 0;
            narrationText = `You told ${currentCustomer.name} to back off.`;
            customerReaction = `"${currentCustomer.name}: Hmph! Watch your tone, Rikk."`;
            playSound(deniedSound);
            break;
    }

    updateHUD();
    updateInventoryDisplay();

    setTimeout(() => {
        if (narrationText) displayCustomerMessage(narrationText, 'narration');
        if (customerReaction) displayCustomerMessage(customerReaction, 'customer');
        setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5);
    }, CUSTOMER_WAIT_TIME);

    if (heat >= 100) endGame("heat");
    else if (cash < 0) endGame("bankrupt");
}

function endCustomerInteraction() {
    clearChat();
    clearChoices();
    currentCustomer = null;
    nextCustomerBtn.disabled = false;

    rikkPhoneDisplay.classList.remove('active');
    setTimeout(() => rikkPhoneDisplay.classList.add('hidden'), PHONE_ANIMATION_DURATION);
    saveGameState(); // Save state after interaction concludes
}

function updateHUD() {
    cashDisplay.textContent = cash;
    dayDisplay.textContent = day;
    heatDisplay.textContent = heat;
}

function updateInventoryDisplay() {
    inventoryCountDisplay.textContent = inventory.length;
    modalInventorySlotsDisplay.textContent = `${inventory.length}/${MAX_INVENTORY_SLOTS}`;
    inventoryList.innerHTML = '';
    if (inventory.length === 0) {
        inventoryList.innerHTML = "<p>Your stash is empty. Go get some goods!</p>";
    } else {
        inventory.forEach(item => {
            const p = document.createElement('p');
            p.textContent = item.name;
            const details = document.createElement('span');
            details.classList.add('item-detail');
            details.textContent = `Bought: $${item.buyPrice || 'N/A'}, Est. Value: $${item.sellPrice || 'N/A'}`;
            p.appendChild(details);
            inventoryList.appendChild(p);
        });
    }
}

function openInventoryModal() {
    inventoryModal.classList.add('active');
}

function closeInventoryModal() {
    inventoryModal.classList.remove('active');
}

function clearChat() {
    chatContainer.innerHTML = '';
}

function clearChoices() {
    choicesArea.innerHTML = '';
}

function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.error("Error playing sound:", e));
    }
}

// --- Save/Load Game State Functions ---
function saveGameState() {
    if (!gameActive) return; // Only save if the game is actively being played
    const stateToSave = { cash, day, heat, inventory };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        console.log("Game state saved:", stateToSave);
    } catch (e) {
        console.error("Error saving game state:", e);
        displayCustomerMessage("System: Error saving game. Storage might be full or disabled.", "narration");
    }
}

function loadGameState() {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
        try {
            const loadedState = JSON.parse(savedData);
            cash = loadedState.cash !== undefined ? loadedState.cash : 100;
            day = loadedState.day !== undefined ? loadedState.day : 0; // Will be incremented by nextDay
            heat = loadedState.heat !== undefined ? loadedState.heat : 0;
            inventory = Array.isArray(loadedState.inventory) ? loadedState.inventory : [];
            console.log("Game state loaded.", { cash, day, heat, inventory });
            return true;
        } catch (e) {
            console.error("Error parsing saved game state:", e);
            clearSavedGameState(); // Clear corrupted data
            return false;
        }
    }
    return false;
}

function clearSavedGameState() {
    localStorage.removeItem(SAVE_KEY);
    console.log("Saved game state cleared.");
}

function checkForSavedGame() {
    if (localStorage.getItem(SAVE_KEY)) {
        continueGameBtn.classList.remove('hidden');
    } else {
        continueGameBtn.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', initGame);
