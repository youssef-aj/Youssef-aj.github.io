/**
 * Games data laden uit localStorage of ophalen uit JSON bestand
 * Probeert eerst data uit localStorage te halen, en als dat mislukt of niet bestaat,
 * haalt het de data op uit het games.json bestand
 * @returns {Promise<Object>} Belofte met de games data
 */
async function storageGamesData() {
    // Definieer localStorage key (naam waaronder we data opslaan)
    const localStorageKey = `gamesStorage`;
    // Probeer data uit localStorage te halen
    const storeData = localStorage.getItem(localStorageKey);
    let data;

    if (storeData) {
        try {
            // Probeer opgeslagen data te veranderen naar JSON format
            data = JSON.parse(storeData);
            console.debug("Data uit localStorage gehaald:", data);
            return data;
        }
        catch (error) {
            console.error("Fout bij het lezen van localStorage data:", error);
            data = await fetchJsonData();
            return data;
        }
    }
    else {
        // Als er geen data in localStorage is, haal het op uit JSON bestand
        data = await fetchJsonData();
        return data;
    }
}

/**
 * Haal data op uit JSON bestand en sla het op in localStorage
 * @returns {Promise<Object>} De opgehaalde data
 */
async function fetchJsonData() {
    try {
        const response = await fetch(`./games.json`);
        if (!response.ok) {
            throw new Error(`Fout bij het ophalen van JSON bestand`);
        }
        // Zet JSON antwoord om naar bruikbare data
        const data = await response.json();
        // Sla data op in localStorage voor volgende keer
        localStorage.setItem('gamesStorage', JSON.stringify(data));
        console.log(`Data succesvol opgehaald uit JSON bestand en opgeslagen in localStorage`);
        return data;
    } catch (error) {
        console.error(error.message);
        return { games: [] };
    }
}


// Winkelwagen state variabelen
let cart = JSON.parse(localStorage.getItem('cartData')) || [];    // Load cart from localStorage or empty array
let cartCount = 0;      // Aantal items in winkelwagen
let cartTotal = 0;      // Totaalbedrag van winkelwagen
let gamesData = null;   // Games data opslag

// Function to save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cartData', JSON.stringify(cart));
}

// DOM elementen voor snelle toegang
const cartButton = document.getElementById('cart-button');
const cartCountElement = document.getElementById('cart-count');
const gameGrid = document.getElementById('game-grid');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Bootstrap modal instanties
let cartModal;              // Winkelwagen modal
let checkoutSuccessModal;   // Bevestiging modal na succesvolle checkout
let emptyCartModal;         // Lege winkelwagen waarschuwing modal


/**
 * Zet de applicatie op wanneer de pagina is geladen
 * Maakt alle event listeners en laadt de game data
 */
async function setup() {
    // Maak Bootstrap carousel (automatische diavoorstelling)
    const carousel = new bootstrap.Carousel(document.getElementById('featuredGamesCarousel'), {
        interval: 3000,    // Verander slide elke 3 seconden
        wrap: true,        // Begin opnieuw na laatste slide
        ride: 'carousel'   // Start automatisch
    });

    // Maak Bootstrap modals (popup vensters)
    cartModal = new bootstrap.Modal(document.getElementById('cart-modal'));
    checkoutSuccessModal = new bootstrap.Modal(document.getElementById('checkout-success-modal'));
    emptyCartModal = new bootstrap.Modal(document.getElementById('empty-cart-modal'));

    // Event listener voor afrekenen knop
    document.getElementById('checkout-button').addEventListener('click', handleCheckout);

    // Event listener voor winkelwagen knop
    cartButton.addEventListener('click', openCartModal);

    // Load cart data and update UI
    updateCartState();

    // Laad games data en toon game kaarten
    try {
        const data = await storageGamesData();
        gamesData = data.games;
        renderGameCards(gamesData);

        // Zoekfunctionaliteit instellen
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keyup', (event) => {
            // Zoek ook als gebruiker op Enter drukt
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    } catch (error) {
        console.error("Kan games niet laden:", error);
        // Toon foutmelding als games niet geladen kunnen worden
        gameGrid.innerHTML = '<div class="col-12 text-center"><p>Kan games niet laden. Vernieuw de pagina.</p></div>';
    }
}

setup(); // Start de applicatie bij het laden van de pagina


/**
 * Voer zoekopdracht uit op games
 * Filtert games op basis van titel
 */
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    // Check of er games data beschikbaar is
    if (!gamesData) {
        return;
    }

    if (searchTerm === '') {
        // Als zoekterm leeg is, toon alle games
        renderGameCards(gamesData);
    } else {
        // Filter games op titel die de zoekterm bevat
        const filteredGames = gamesData.filter(game =>
            game.title.toLowerCase().includes(searchTerm)
        );
        renderGameCards(filteredGames);
    }
}

/**
 * Toon game kaarten in het grid
 * @param {Array} games - Array van game objecten om weer te geven
 */
function renderGameCards(games) {
    // Leeg het huidige grid
    gameGrid.innerHTML = '';

    // Toon bericht als er geen games zijn
    if (!games || games.length === 0) {
        gameGrid.innerHTML = '<div class="col-12 text-center"><p>Geen games gevonden die overeenkomen met je zoekopdracht.</p></div>';
        return;
    }

    // Maak een kaart voor elke game
    for (const game of games) {
        const card = document.createElement('div');
        card.className = 'col';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-img-container">
                    <img src="${game.image || '/api/placeholder/400/320'}" alt="${game.title}" class="card-img-top">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${game.title}</h5>
                    <p class="card-price">€${game.price.toFixed(2)}</p>
                    <button class="add-to-cart-btn mt-auto" data-game-id="${game.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        gameGrid.appendChild(card);

        // Event listener toevoegen aan 'Add to Cart' knop
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => addToCart(game));
    }
}

/**
 * Game toevoegen aan winkelwagen
 * @param {Object} game - Game object om toe te voegen aan winkelwagen
 */
function addToCart(game) {
    // Controleer of game al in winkelwagen zit
    const existingItemIndex = cart.findIndex(item => item.id === game.id);

    if (existingItemIndex !== -1) {
        // Verhoog aantal als game al in winkelwagen zit
        cart[existingItemIndex].quantity += 1;
    } else {
        // Voeg nieuwe game toe aan winkelwagen
        cart.push({
            id: game.id,
            title: game.title,
            price: game.price,
            quantity: 1
        });
    }

    // Werk winkelwagen status bij
    updateCartState();

    // Save cart to localStorage after updating
    saveCartToStorage();

    // Toon visuele feedback dat item is toegevoegd
    const addButton = document.querySelector(`.add-to-cart-btn[data-game-id="${game.id}"]`);
    const originalText = addButton.textContent;
    addButton.textContent = 'Toegevoegd!';
    addButton.style.backgroundColor = '#2980b9'; // Donkerblauwe feedback kleur

    // Reset knop na 1 seconde
    setTimeout(() => {
        addButton.textContent = originalText;
        addButton.style.backgroundColor = '';
    }, 1000);
}

/**
 * Werk winkelwagen status bij (aantal items en totaalbedrag)
 */
function updateCartState() {
    // Bereken totaal aantal items in winkelwagen
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Bereken totaalprijs
    cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Update UI met nieuwe aantal
    cartCountElement.textContent = cartCount;

    // Als winkelwagen modal open is, update de inhoud
    const cartTotalPrice = document.getElementById('cart-total-price');
    if (cartTotalPrice) {
        cartTotalPrice.textContent = `€${cartTotal.toFixed(2)}`;
    }
}

/**
 * Open winkelwagen modal en toon inhoud
 */
function openCartModal() {
    // Winkelwagen items renderen
    renderCartItems();

    // Modal tonen
    cartModal.show();
}

/**
 * Toon winkelwagen items in de modal
 */
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');

    // Verwijder vorige items
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        // Toon leeg winkelwagen bericht
        cartItemsContainer.innerHTML = '<div class="empty-cart-message">Je winkelwagen is leeg</div>';
    } else {
        // Render elk winkelwagen item
        for (const item of cart) {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">€${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <button class="remove-item-btn" data-id="${item.id}">×</button>
            `;
            cartItemsContainer.appendChild(cartItemElement);

            // Event listeners voor aantal knoppen en verwijderknop
            const decreaseBtn = cartItemElement.querySelector('.decrease');
            const increaseBtn = cartItemElement.querySelector('.increase');
            const removeBtn = cartItemElement.querySelector('.remove-item-btn');

            decreaseBtn.addEventListener('click', () => decreaseQuantity(item.id));
            increaseBtn.addEventListener('click', () => increaseQuantity(item.id));
            removeBtn.addEventListener('click', () => removeFromCart(item.id));
        }
    }

    // Update totaalprijs
    cartTotalPrice.textContent = `€${cartTotal.toFixed(2)}`;
}

/**
 * Verminder aantal van een item in de winkelwagen
 * @param {number} itemId - ID van het item om aantal te verminderen
 */
function decreaseQuantity(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            // Verminder aantal als meer dan 1
            cart[itemIndex].quantity -= 1;
        } else {
            // Verwijder item als aantal 1 is
            cart.splice(itemIndex, 1);
        }

        // Update winkelwagen status en UI
        updateCartState();
        renderCartItems();

        // Save cart to localStorage after updating
        saveCartToStorage();
    }
}

/**
 * Verhoog aantal van een item in de winkelwagen
 * @param {number} itemId - ID van het item om aantal te verhogen
 */
function increaseQuantity(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        // Verhoog aantal
        cart[itemIndex].quantity += 1;

        // Update winkelwagen status en UI
        updateCartState();
        renderCartItems();

        // Save cart to localStorage after updating
        saveCartToStorage();
    }
}

/**
 * Verwijder een item uit de winkelwagen
 * @param {number} itemId - ID van het item om te verwijderen
 */
function removeFromCart(itemId) {
    // Filter het item uit de winkelwagen
    cart = cart.filter(item => item.id !== itemId);

    // Update winkelwagen status en UI
    updateCartState();
    renderCartItems();

    // Save cart to localStorage after updating
    saveCartToStorage();
}

/**
 * Handel checkout proces af
 * Slaat bestelling op en reset winkelwagen
 */
function handleCheckout() {
    if (cart.length === 0) {
        // Toon lege winkelwagen modal als winkelwagen leeg is
        cartModal.hide();
        emptyCartModal.show();
    } else {
        // Bestelling opslaan in localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push({
            id: orders.length,            // Nieuwe ID toewijzen
            total: cartTotal,             // Totaalbedrag
            date: new Date().toLocaleString(),  // Huidige datum/tijd
            items: cart                   // Winkelwagen items
        });
        localStorage.setItem('orders', JSON.stringify(orders));

        // Reset winkelwagen en toon bevestiging
        cart = [];
        updateCartState();
        cartModal.hide();
        checkoutSuccessModal.show();

        // Save empty cart to localStorage after checkout
        saveCartToStorage();
    }
}