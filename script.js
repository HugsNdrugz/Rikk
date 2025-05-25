// --- DOM Element References ---
const gameViewport = document.getElementById('game-viewport');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

const startGameBtn = document.getElementById('start-game-btn');
const restartGameBtn = document.getElementById('restart-game-btn');

const cashDisplay = document.getElementById('cash-display');
const dayDisplay = document.getElementById('day-display');
const heatDisplay = document.getElementById('heat-display');

const gameScene = document.getElementById('game-scene');
const knockEffect = document.getElementById('knock-effect');

// NEW: Reference to the phone display
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
const MAX_INVENTORY_SLOTS = 5; // Example: Rikk can carry 5 items
let currentCustomer = null;
let gameActive = false;
let currentCustomersInQueue = []; // For future multi-customer scenarios

// --- Game Configuration ---
const CUSTOMER_WAIT_TIME = 1000; // How long to wait before displaying next message/choices
const KNOCK_ANIMATION_DURATION = 1200; // Duration of knock effect before chat starts
const PHONE_ANIMATION_DURATION = 600; // Match CSS transition duration

// --- Customer Data (Simplified for example) ---
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
        successCashIncrease: 0, // Handled by item sale
        declineCashPenalty: 0
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
        successCashIncrease: 0,
        declineCashPenalty: 0
    },
    {
        name: "Nosy Neighbor",
        dialogue: [
            { speaker: "customer", text: "Just checking in, Rikk. Everything alright? Saw a lot of foot traffic today." },
            { speaker: "rikk", text: "Just... delivering flyers! You know, community outreach." },
            { speaker: "customer", text: "Right. Flyers. Well, keep it down. Some of us got early mornings." }
        ],
        choices: [
            { text: "Offer a 'Free' Sample (No heat gain)", outcome: { type: "give", item: { name: "Suspiciously Quiet Muffler", buyPrice: 0, sellPrice: 0 }, heatPenalty: 0 } }, // Example of giving an item
            { text: "Tell them to mind their own business.", outcome: { type: "bluff", heatIncrease: 10 } }
        ],
        successHeatIncrease: 0, // Heat depends on choice outcome
        declineHeatIncrease: 0, // Not a typical decline
        successCashIncrease: 0,
        declineCashPenalty: 0
    }
    // Add more customers here as you expand
];

// --- Game Functions ---

function initGame() {
    // Event Listeners
    startGameBtn.addEventListener('click', startGame);
    restartGameBtn.addEventListener('click', startGame);
    nextCustomerBtn.addEventListener('click', nextDay);
    openInventoryBtn.addEventListener('click', openInventoryModal);
    closeModalBtn.addEventListener('click', closeInventoryModal);
    inventoryModal.addEventListener('click', (e) => {
        if (e.target === inventoryModal) {
            closeInventoryModal();
        }
    });

    // Initial UI setup
    updateHUD();
    updateInventoryDisplay();
    rikkPhoneDisplay.classList.add('hidden'); // Ensure phone is hidden initially
    rikkPhoneDisplay.classList.remove('active');
}

function startGame() {
    cash = 100; // Starting cash
    day = 0;
    heat = 0;
    inventory = [];
    currentCustomersInQueue = [];
    gameActive = true;

    // Hide screens, show game screen
    startScreen.classList.remove('active');
    endScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // Hide phone display at start of new game
    rikkPhoneDisplay.classList.add('hidden');
    rikkPhoneDisplay.classList.remove('active');

    updateHUD();
    updateInventoryDisplay();
    clearChat();
    clearChoices();

    // Start the first day/customer sequence
    nextDay();
}

function endGame(reason) {
    gameActive = false;
    gameScreen.classList.remove('active');
    endScreen.classList.add('active');

    finalDaysDisplay.textContent = day;
    finalCashDisplay.textContent = cash;

    if (reason === "heat") {
        finalVerdictText.textContent = "The fuzz got too hot on your tail. Time to lay low... forever.";
        finalVerdictText.style.color = "#e74c3c"; // Red for failure
    } else if (reason === "bankrupt") {
        finalVerdictText.textContent = "Broke and busted. Can't hustle on an empty wallet.";
        finalVerdictText.style.color = "#e74c3c";
    } else {
        finalVerdictText.textContent = "You hustled your way to the top! Nice work, Rikk.";
        finalVerdictText.style.color = "#27ae60"; // Green for success
    }

    // Hide phone display at end of game
    rikkPhoneDisplay.classList.add('hidden');
    rikkPhoneDisplay.classList.remove('active');
}

function nextDay() {
    if (!gameActive) return;

    day++;
    heat = Math.max(0, heat - 2); // Reduce heat slightly each day
    updateHUD();
    clearChat();
    clearChoices();

    // Disable next customer button until interaction is complete
    nextCustomerBtn.disabled = true;

    // Hide phone display immediately for the "knock" phase
    rikkPhoneDisplay.classList.remove('active');
    setTimeout(() => {
        rikkPhoneDisplay.classList.add('hidden'); // Fully hide after transition
    }, PHONE_ANIMATION_DURATION);


    // Trigger the knock effect
    playSound(doorKnockSound);
    knockEffect.classList.remove('hidden');
    knockEffect.style.animation = 'none'; // Reset animation
    void knockEffect.offsetWidth; // Trigger reflow
    knockEffect.style.animation = 'knockAnim 0.5s ease-out forwards'; // Re-apply animation

    // After knock, start customer interaction
    setTimeout(() => {
        knockEffect.classList.add('hidden');
        startCustomerInteraction();
    }, KNOCK_ANIMATION_DURATION);
}

function generateCustomer() {
    // For now, cycle through customers, or pick randomly if enough are present
    const randomIndex = Math.floor(Math.random() * customers.length);
    return customers[randomIndex];
}

function startCustomerInteraction() {
    currentCustomer = generateCustomer();
    let dialogueIndex = 0;

    // Show the phone display and make it active
    rikkPhoneDisplay.classList.remove('hidden');
    setTimeout(() => { // Small delay to allow 'hidden' removal before 'active' triggers slide-in
        rikkPhoneDisplay.classList.add('active');
    }, 50); // Very short delay

    const displayNext = () => {
        if (dialogueIndex < currentCustomer.dialogue.length) {
            const msg = currentCustomer.dialogue[dialogueIndex];
            displayCustomerMessage(msg.text, msg.speaker);
            dialogueIndex++;
            setTimeout(displayNext, CUSTOMER_WAIT_TIME); // Wait before next message
        } else {
            // All dialogue displayed, show choices
            displayChoices(currentCustomer.choices);
        }
    };
    displayNext();
}

function displayCustomerMessage(message, speaker) {
    playSound(chatBubbleSound); // Play sound for each message
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble');
    bubble.classList.add(speaker); // 'customer' or 'rikk' or 'narration'

    if (speaker === 'customer' || speaker === 'rikk') {
        const speakerName = document.createElement('span');
        speakerName.classList.add('speaker-name');
        speakerName.textContent = (speaker === 'customer' ? currentCustomer.name : 'Rikk');
        bubble.appendChild(speakerName);
    }

    const textNode = document.createTextNode(message);
    bubble.appendChild(textNode);
    chatContainer.appendChild(bubble);

    // Scroll to the bottom to show latest message (if using column-reverse, this is the top)
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function displayChoices(choices) {
    choicesArea.innerHTML = ''; // Clear previous choices

    choices.forEach(choice => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;
        if (choice.outcome.type === 'decline') {
            button.classList.add('decline');
        }
        button.addEventListener('click', () => handleChoice(choice.outcome));
        choicesArea.appendChild(button);
    });
}

function handleChoice(outcome) {
    clearChoices(); // Clear choices immediately after selection

    let narrationText = "";
    let customerReaction = "";

    switch (outcome.type) {
        case "sell":
            if (inventory.length < MAX_INVENTORY_SLOTS) {
                // If item is in inventory and matches
                const itemIndex = inventory.findIndex(i => i.name === outcome.item.name);
                if (itemIndex !== -1) {
                    const itemSold = inventory.splice(itemIndex, 1)[0]; // Remove item
                    cash += itemSold.sellPrice;
                    heat += currentCustomer.successHeatIncrease;
                    narrationText = `You sold the ${itemSold.name} for $${itemSold.sellPrice}.`;
                    customerReaction = `"${currentCustomer.name}: Pleasure doing business with you, Rikk!"`;
                    playSound(cashSound);
                } else {
                    narrationText = `You don't have ${outcome.item.name} to sell!`;
                    customerReaction = `"${currentCustomer.name}: What? You ain't got it? Get outta here!"`;
                    heat += 5; // Penalty for promising what you don't have
                    playSound(deniedSound);
                }
            } else {
                narrationText = `You don't have space for new items right now.`; // This case shouldn't be reached if only selling
                customerReaction = `"${currentCustomer.name}: Don't waste my time if you're not ready to deal."`;
                heat += 2; // Annoy customer
                playSound(deniedSound);
            }
            break;
        case "buy":
            if (cash >= outcome.item.buyPrice && inventory.length < MAX_INVENTORY_SLOTS) {
                cash -= outcome.item.buyPrice;
                inventory.push(outcome.item);
                heat += outcome.item.heatIncrease || 0; // Items can have heat
                narrationText = `You bought the ${outcome.item.name} for $${outcome.item.buyPrice}.`;
                customerReaction = `"${currentCustomer.name}: Good doing business with you, Rikk!"`;
                playSound(cashSound);
            } else if (cash < outcome.item.buyPrice) {
                narrationText = `Not enough cash for ${outcome.item.name}!`;
                customerReaction = `"${currentCustomer.name}: Come back when you got real money, chump."`;
                heat += currentCustomer.declineHeatIncrease; // Treat as a decline due to inability
                playSound(deniedSound);
            } else { // Inventory full
                narrationText = `Your stash is full. No space for ${outcome.item.name}!`;
                customerReaction = `"${currentCustomer.name}: Seriously, Rikk? Get organized!"`;
                heat += currentCustomer.declineHeatIncrease;
                playSound(deniedSound);
            }
            break;
        case "decline":
            heat += currentCustomer.declineHeatIncrease;
            narrationText = `You declined ${currentCustomer.name}'s offer.`;
            customerReaction = `"${currentCustomer.name}: Fine, be that way! I'll find someone else."`;
            playSound(deniedSound);
            break;
        case "give": // New type for giving an item (e.g., free sample)
            if (inventory.findIndex(i => i.name === outcome.item.name) !== -1) {
                const itemGivenIndex = inventory.findIndex(i => i.name === outcome.item.name);
                inventory.splice(itemGivenIndex, 1); // Remove the item
                heat += outcome.heatPenalty || 0; // Heat can be reduced or stay same
                narrationText = `You gave away a ${outcome.item.name}.`;
                customerReaction = `"${currentCustomer.name}: Oh, well, thank you, Rikk! Have a good day."`;
                playSound(cashSound); // Use cash sound for successful transaction, even if free
            } else {
                narrationText = `You don't have a ${outcome.item.name} to give!`;
                customerReaction = `"${currentCustomer.name}: Liar! Don't mess with me!"`;
                heat += 5; // Penalty for empty promise
                playSound(deniedSound);
            }
            break;
        case "bluff": // New type for bluffing or direct confrontation
            heat += outcome.heatIncrease || 0;
            narrationText = `You told ${currentCustomer.name} to back off.`;
            customerReaction = `"${currentCustomer.name}: Hmph! Watch your tone, Rikk."`;
            playSound(deniedSound); // Or a specific "threat" sound
            break;
        // Add more outcome types (e.g., special events, police raid)
    }

    updateHUD();
    updateInventoryDisplay();

    // Display the outcome and customer reaction after a delay
    setTimeout(() => {
        if (narrationText) {
            displayCustomerMessage(narrationText, 'narration');
        }
        if (customerReaction) {
            displayCustomerMessage(customerReaction, 'customer');
        }
        // Then, end the interaction after another delay
        setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5); // Give time to read reaction
    }, CUSTOMER_WAIT_TIME);

    // Check for game over conditions
    if (heat >= 100) { // Example threshold
        endGame("heat");
    } else if (cash < 0) { // Example threshold
        endGame("bankrupt");
    }
}

function endCustomerInteraction() {
    clearChat();
    clearChoices();
    currentCustomer = null;
    nextCustomerBtn.disabled = false; // Enable next customer button

    // Hide the phone display
    rikkPhoneDisplay.classList.remove('active');
    setTimeout(() => {
        rikkPhoneDisplay.classList.add('hidden'); // Fully hide after transition
    }, PHONE_ANIMATION_DURATION);
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
        const p = document.createElement('p');
        p.textContent = "Your stash is empty. Go get some goods!";
        inventoryList.appendChild(p);
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
        audioElement.currentTime = 0; // Rewind to start
        audioElement.play().catch(e => console.error("Error playing sound:", e));
    }
}

// --- Initialize the game when the DOM is fully loaded ---
document.addEventListener('DOMContentLoaded', initGame);