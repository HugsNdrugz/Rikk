document.addEventListener('DOMContentLoaded', () => {
  // --- Game Elements ---
  const startScreen = document.getElementById('start-screen');
  const gameScreen = document.getElementById('game-screen');
  const endScreen = document.getElementById('end-screen');

  const startGameBtn = document.getElementById('start-game-btn');
  const restartGameBtn = document.getElementById('restart-game-btn');
  const nextTurnBtn = document.getElementById('next-turn-btn');
  const checkStashBtn = document.getElementById('check-stash-btn'); // New
  const closeInventoryBtn = document.getElementById('close-inventory-btn'); // New

  const cashDisplay = document.getElementById('cash-display');
  const inventoryDisplay = document.getElementById('inventory-display');
  const customersLeftDisplay = document.getElementById('customers-left-display');
  const finalCashDisplay = document.getElementById('final-cash-display');
  const finalMessageDisplay = document.getElementById('final-message');

  const gameMessagesDiv = document.getElementById('game-messages'); // Renamed for clarity
  const knockMessage = document.getElementById('knock-message');
  const customerMessage = document.getElementById('customer-message');
  const actionMessage = document.getElementById('action-message');
  const optionsContainer = document.getElementById('options-container');

  const inventoryView = document.getElementById('inventory-view'); // New
  const inventoryListContent = document.getElementById('inventory-list-content'); // New

  const knockSound = document.getElementById('knock-sound');

  // --- Game Variables ---
  let cash = 0;
  let inventory = [];
  let customersLeft = 0;
  const MAX_CUSTOMERS = 10;
  const STARTING_CASH = 500;

  const itemTypes = [
    { name: "Bag of 'Green Crack'", baseValue: 60, range: 30, type: "drug" },
    { name: "Few 'Blue Magic' Pills", baseValue: 40, range: 25, type: "drug" },
    { name: "Gram of 'White Pony'", baseValue: 100, range: 50, type: "drug" },
    { name: "Sheet of 'Psychedelic Sunshine'", baseValue: 150, range: 70, type: "drug" },
    { name: "Vial of 'Liquid Giggles'", baseValue: 80, range: 40, type: "drug" },
    { name: "Brick of 'Afghan Gold' (Hash)", baseValue: 250, range: 100, type: "drug" },
    { name: "Bottle of 'Lean Back Syrup'", baseValue: 120, range: 60, type: "drug" },
    { name: "Slightly-Used Smartphone", baseValue: 90, range: 60, type: "storm_good" },
    { name: "Power Tool (No Questions)", baseValue: 70, range: 40, type: "storm_good" },
    { name: "Designer Handbag (Scuffed)", baseValue: 130, range: 80, type: "storm_good" },
    { name: "Crate of 'Premium' Liquor", baseValue: 100, range: 50, type: "storm_good" },
    { name: "Jewelry (Questionable Origin)", baseValue: 200, range: 120, type: "storm_good" },
    { name: "High-End Laptop (Needs Charger)", baseValue: 180, range: 90, type: "storm_good" }
  ];

  // --- Game Functions ---

  function updateDisplay() {
    cashDisplay.textContent = cash;
    inventoryDisplay.textContent = inventory.length;
    customersLeftDisplay.textContent = customersLeft;
  }

  function showScreen(screenToShow) {
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    endScreen.classList.remove('active');
    screenToShow.classList.add('active');

    // Ensure inventory view is hidden and check stash button is managed by screen visibility
    if (screenToShow === gameScreen) {
      toggleInventoryDisplay(false, true); // Close inventory if open, don't try to restore game elements yet
      checkStashBtn.style.display = ''; // Show for game screen
    } else {
      checkStashBtn.style.display = 'none'; // Hide for other screens
    }
  }

  function clearMessages() {
    knockMessage.textContent = '';
    customerMessage.textContent = '';
    actionMessage.textContent = '';
  }

  function clearOptions() {
    optionsContainer.innerHTML = '';
    nextTurnBtn.classList.add('hidden');
  }

  function generateItem() {
    const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const potentialStreetValue = type.baseValue + Math.floor(Math.random() * (type.range * 2)) - type.range;
    const purchasePrice = Math.floor(potentialStreetValue * (0.4 + Math.random() * 0.3));
    const estimatedResaleValue = Math.floor(potentialStreetValue * (0.8 + Math.random() * 0.4));

    return {
      name: type.name,
      purchasePrice: Math.max(5, purchasePrice),
      estimatedResaleValue: Math.max(10, estimatedResaleValue),
      type: type.type
    };
  }

  function toggleInventoryDisplay(show, suppressRestore = false) {
    if (show) {
        // Hide game elements
        gameMessagesDiv.style.display = 'none';
        optionsContainer.style.display = 'none';
        nextTurnBtn.style.display = 'none'; // Temporarily hide regardless of its 'hidden' class
        checkStashBtn.style.display = 'none';

        // Populate and show inventory
        inventoryListContent.innerHTML = ''; // Clear previous list
        if (inventory.length === 0) {
            inventoryListContent.innerHTML = '<p>Your stash is empty.</p>';
        } else {
            inventory.forEach(item => {
                const p = document.createElement('p');
                p.textContent = `${item.name} (Bought: $${item.purchasePrice}, Est. Value: $${item.estimatedResaleValue})`;
                // p.textContent = `${item.name} (Purchased: $${item.purchasePrice}, Est. Resale: $${item.estimatedResaleValue}, Type: ${item.type})`; // More detailed option
                inventoryListContent.appendChild(p);
            });
        }
        inventoryView.style.display = 'block';
    } else {
        // Hide inventory
        inventoryView.style.display = 'none';

        if (suppressRestore) return; // Used when changing screens, not just closing inventory

        // Restore game elements
        gameMessagesDiv.style.display = 'block';
        optionsContainer.style.display = ''; // Reverts to stylesheet (flex)
        checkStashBtn.style.display = '';   // Reverts to stylesheet

        // Restore nextTurnBtn based on its 'hidden' class state
        if (nextTurnBtn.classList.contains('hidden')) {
            nextTurnBtn.style.display = 'none'; // Keep it hidden
        } else {
            nextTurnBtn.style.display = ''; // Revert to stylesheet (make it visible)
        }
    }
}


  function handleCustomer() {
    toggleInventoryDisplay(false); // Ensure inventory is closed if it was somehow left open
    clearMessages();
    clearOptions();

    if (customersLeft <= 0) {
      endGame();
      return;
    }

    customersLeft--;
    updateDisplay();

    knockSound.play().catch(e => console.warn("Knock sound play failed:", e));
    knockMessage.textContent = "*Shifty eyes at the door... someone's here.*";

    const isSellingToYou = Math.random() > 0.4 || inventory.length === 0;

    if (isSellingToYou) {
      const item = generateItem();
      customerMessage.textContent = `A sketchy character mumbles, "Yo, got this ${item.name}. Need cash. Say... $${item.purchasePrice}?"`;

      if (cash >= item.purchasePrice) {
        const buyBtn = document.createElement('button');
        buyBtn.textContent = `Score it for $${item.purchasePrice}`;
        buyBtn.onclick = () => buyItem(item);
        optionsContainer.appendChild(buyBtn);
      } else {
        customerMessage.textContent += "\n(Damn, you're too broke for this.)";
      }
      const declineBtn = document.createElement('button');
      declineBtn.textContent = 'Tell \'em to kick rocks';
      declineBtn.onclick = () => declineOffer("You wave them off. Not interested.");
      optionsContainer.appendChild(declineBtn);

    } else {
      if (inventory.length > 0) {
        const itemToSell = inventory[Math.floor(Math.random() * inventory.length)];
        if (!itemToSell) {
            console.error("Error: itemToSell is undefined despite non-empty inventory.");
            customerMessage.textContent = "Error finding an item to sell. Something's off.";
            nextTurnBtn.classList.remove('hidden');
            return;
        }
        const offerPrice = Math.floor(itemToSell.estimatedResaleValue * (0.7 + Math.random() * 0.3));

        customerMessage.textContent = `A fiend's looking for ${itemToSell.name}. Offers $${offerPrice}. You think it's worth closer to $${itemToSell.estimatedResaleValue}.`;

        const sellBtn = document.createElement('button');
        sellBtn.textContent = `Sell for $${offerPrice}`;
        sellBtn.onclick = () => {
            const saleMessageDetails = sellItem(itemToSell, offerPrice);
            actionMessage.textContent = `Cha-ching! ${saleMessageDetails}`;
            clearOptions();
            nextTurnBtn.classList.remove('hidden');
        };
        optionsContainer.appendChild(sellBtn);

        const negotiateBtn = document.createElement('button');
        const negotiationAttempt = Math.floor(itemToSell.estimatedResaleValue * (1.0 + Math.random() * 0.25));
        negotiateBtn.textContent = `Haggle (Aim for $${negotiationAttempt})`;
        negotiateBtn.onclick = () => negotiateSell(itemToSell, negotiationAttempt, offerPrice);
        optionsContainer.appendChild(negotiateBtn);

        const declineBtn = document.createElement('button');
        declineBtn.textContent = 'Not worth it';
        declineBtn.onclick = () => declineOffer("You ain't parting with it for that price.");
        optionsContainer.appendChild(declineBtn);

      } else {
        customerMessage.textContent = "Someone's looking, but your stash is empty. Bad for business.";
        nextTurnBtn.classList.remove('hidden');
      }
    }
  }

  function buyItem(item) {
    cash -= item.purchasePrice;
    inventory.push({
      name: item.name,
      purchasePrice: item.purchasePrice,
      estimatedResaleValue: item.estimatedResaleValue,
      type: item.type
    });
    actionMessage.textContent = `Scored! You copped the "${item.name}" for $${item.purchasePrice}.`;
    updateDisplay();
    clearOptions();
    nextTurnBtn.classList.remove('hidden');
  }

  function sellItem(itemToSell, price) {
    cash += price;
    const index = inventory.findIndex(invItem => invItem === itemToSell);

    if (index > -1) {
      inventory.splice(index, 1);
    } else {
      console.warn("Item reference match failed in sellItem. Trying by properties. Item:", itemToSell);
      const fallbackIndex = inventory.findIndex(invItem =>
        invItem.name === itemToSell.name &&
        invItem.estimatedResaleValue === itemToSell.estimatedResaleValue &&
        invItem.purchasePrice === itemToSell.purchasePrice
      );
      if (fallbackIndex > -1) {
        inventory.splice(fallbackIndex, 1);
        console.warn("Item found by properties and removed.");
      } else {
        console.error("CRITICAL: Could not find item in inventory to sell:", itemToSell);
      }
    }
    updateDisplay();
    return `Flipped the "${itemToSell.name}" for $${price}.`;
  }

  function negotiateSell(itemToSell, proposedPrice, originalOffer) {
    actionMessage.textContent = `You try to squeeze 'em for $${proposedPrice}...`;
    clearOptions();

    setTimeout(() => {
      if (Math.random() < 0.55) {
        const finalPrice = Math.floor(Math.random() * (proposedPrice - originalOffer + 1)) + originalOffer;
        const saleDetails = sellItem(itemToSell, finalPrice);
        actionMessage.textContent += ` They bit! ${saleDetails}. Nice.`;
      } else {
        actionMessage.textContent += ` Nah, they ain't buying that. The deal's dead.`;
      }
      nextTurnBtn.classList.remove('hidden');
    }, 1500);
  }

  function declineOffer(message) {
    actionMessage.textContent = message;
    clearOptions();
    nextTurnBtn.classList.remove('hidden');
  }

  function startGame() {
    cash = STARTING_CASH;
    inventory = [];
    customersLeft = MAX_CUSTOMERS;
    updateDisplay();
    clearMessages();
    clearOptions();
    showScreen(gameScreen); // This will now also handle checkStashBtn visibility
    handleCustomer();
  }

  function endGame() {
    showScreen(endScreen); // This will hide checkStashBtn
    finalCashDisplay.textContent = cash;
    if (cash >= STARTING_CASH * 2.5) {
      finalMessageDisplay.textContent = "You're a damn kingpin! Raking it in!";
    } else if (cash > STARTING_CASH) {
      finalMessageDisplay.textContent = "Solid hustle. Made some good bank tonight.";
    } else if (cash === STARTING_CASH) {
      finalMessageDisplay.textContent = "Broke even. Could be worse, could be better.";
    } else if (cash > 0) {
      finalMessageDisplay.textContent = "Tough night on the streets. Lost some dough.";
    } else {
      finalMessageDisplay.textContent = "Ouch. You're broke. Maybe this life ain't for you.";
    }
    clearMessages();
    clearOptions();
  }

  // --- Event Listeners ---
  startGameBtn.addEventListener('click', startGame);
  restartGameBtn.addEventListener('click', startGame);
  nextTurnBtn.addEventListener('click', handleCustomer);
  checkStashBtn.addEventListener('click', () => toggleInventoryDisplay(true));
  closeInventoryBtn.addEventListener('click', () => toggleInventoryDisplay(false));

  // Initial setup
  showScreen(startScreen); // Set initial screen and manage checkStashBtn visibility
});