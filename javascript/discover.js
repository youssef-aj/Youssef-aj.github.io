/* global bootstrap */

/**
 * Games data laden uit localStorage of ophalen uit JSON bestand
 * Probeert eerst data uit localStorage te halen, en als dat mislukt of niet bestaat,
 * haalt het de data op uit het games.json bestand
 * @returns {Promise<Object>} Belofte met de games data
 */
async function storageGamesData() {
    const storeData = localStorage.getItem('gamesStorage');
    try {
        if (storeData) {
            return JSON.parse(storeData);
        }
        return fetchJsonData();
    } catch (error) {
        return fetchJsonData();
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
        const data = await response.json();
        localStorage.setItem('gamesStorage', JSON.stringify(data));
        return data;
    } catch (error) {
        return { games: [] };
    }
}

// Winkelwagen state variabelen
let cart = JSON.parse(localStorage.getItem('cartData')) || [];
let cartCount = 0;
let cartTotal = 0;
let gamesData = null;

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

// Bootstrap modal instanties - dit is de fix!
let cartModal, checkoutSuccessModal, emptyCartModal;

/**
 * Zet de applicatie op wanneer de pagina is geladen
 * Maakt alle event listeners en laadt de game data
 */
async function setup() {
    // Initialiseer Bootstrap modals
    cartModal = new bootstrap.Modal(document.getElementById('cart-modal'));
    checkoutSuccessModal = new bootstrap.Modal(document.getElementById('checkout-success-modal'));
    emptyCartModal = new bootstrap.Modal(document.getElementById('empty-cart-modal'));

    document.getElementById('checkout-button').addEventListener('click', handleCheckout);
    cartButton.addEventListener('click', openCartModal);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', e => e.key === 'Enter' && performSearch());

    updateCartState();

    try {
        const data = await storageGamesData();
        gamesData = data.games;
        renderGameCards(gamesData);
    } catch (error) {
        gameGrid.innerHTML = '<div class="col-12 text-center"><p>Kan games niet laden. Vernieuw de pagina.</p></div>';
    }
}

setup();

/**
 * Voer zoekopdracht uit op games
 * Filtert games op basis van titel
 */
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!gamesData) return;

    const filteredGames = searchTerm === ''
        ? gamesData
        : gamesData.filter(game => game.title.toLowerCase().includes(searchTerm));
    renderGameCards(filteredGames);
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
        gameGrid.innerHTML =
            '<div class="col-12 text-center"><p>Geen games gevonden die overeenkomen met je zoekopdracht.</p></div>';
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
    const existingItemIndex = cart.findIndex(item => item.id === game.id);

    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push({
            id: game.id,
            title: game.title,
            price: game.price,
            quantity: 1,
        });
    }

    updateCartState();
    saveCartToStorage();

    const addButton = document.querySelector(`.add-to-cart-btn[data-game-id="${game.id}"]`);
    const originalText = addButton.textContent;
    addButton.textContent = 'Toegevoegd!';
    addButton.style.backgroundColor = '#2980b9';

    setTimeout(() => {
        addButton.textContent = originalText;
        addButton.style.backgroundColor = '';
    }, 1000);
}

/**
 * Werk winkelwagen status bij (aantal items en totaalbedrag)
 */
function updateCartState() {
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartCountElement.textContent = cartCount;

    const cartTotalPrice = document.getElementById('cart-total-price');
    if (cartTotalPrice) {
        cartTotalPrice.textContent = `€${cartTotal.toFixed(2)}`;
    }
}

/**
 * Open winkelwagen modal en toon inhoud
 */
function openCartModal() {
    renderCartItems();
    cartModal.show(); // Bootstrap modal API gebruiken
}

/**
 * Toon winkelwagen items in de modal
 */
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        const emptyMessage = '<div class="empty-cart-message">Je winkelwagen is leeg</div>';
        cartItemsContainer.innerHTML = emptyMessage;
        return;
    }

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

        const decreaseBtn = cartItemElement.querySelector('.decrease');
        const increaseBtn = cartItemElement.querySelector('.increase');
        const removeBtn = cartItemElement.querySelector('.remove-item-btn');

        decreaseBtn.addEventListener('click', () => decreaseQuantity(item.id));
        increaseBtn.addEventListener('click', () => increaseQuantity(item.id));
        removeBtn.addEventListener('click', () => removeFromCart(item.id));
    }

    cartTotalPrice.textContent = `€${cartTotal.toFixed(2)}`;
}

/**
 * Verminder aantal van een item in de winkelwagen
 * @param {number} itemId - ID van het item om aantal te verminderen
 */
function decreaseQuantity(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
    } else {
        cart.splice(itemIndex, 1);
    }
    updateCartState();
    renderCartItems();
    saveCartToStorage();
}

/**
 * Verhoog aantal van een item in de winkelwagen
 * @param {number} itemId - ID van het item om aantal te verhogen
 */
function increaseQuantity(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity += 1;
    updateCartState();
    renderCartItems();
    saveCartToStorage();
}

/**
 * Verwijder een item uit de winkelwagen
 * @param {number} itemId - ID van het item om te verwijderen
 */
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartState();
    renderCartItems();
    saveCartToStorage();
}

/**
 * Handel checkout proces af
 * Slaat bestelling op en reset winkelwagen
 */
function handleCheckout() {
    if (cart.length === 0) {
        cartModal.hide(); // Bootstrap modal API
        emptyCartModal.show(); // Bootstrap modal API
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push({
        id: orders.length,
        total: cartTotal,
        date: new Date().toLocaleString(),
        items: cart,
    });
    localStorage.setItem('orders', JSON.stringify(orders));

    cart = [];
    updateCartState();
    cartModal.hide(); // Bootstrap modal API
    checkoutSuccessModal.show(); // Bootstrap modal API
    saveCartToStorage();
}