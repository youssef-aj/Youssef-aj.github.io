/**
 * admin.js - Beheerdersinterface voor game webshop
 * Dit script beheert de administratiefuncties waaronder bestellingen bekijken en producten beheren
 */

// Wacht tot de pagina volledig is geladen voordat we functionaliteit toevoegen
document.addEventListener('DOMContentLoaded', () => {
    // Initiële data laden
    loadOrders();    // Bestellingen ophalen uit localStorage
    loadProducts();  // Producten ophalen uit localStorage

    // Event listeners voor formulieren en knoppen instellen
    document.getElementById('add-product-form').addEventListener('submit', addProduct);   // Formulier voor nieuw product
    document.getElementById('reset-products').addEventListener('click', resetProducts);   // Reset knop voor producten
});

/**
 * Bestellingen laden uit localStorage en weergeven in het bestellingenoverzicht
 * Toont bestelnummer, datum en totaalbedrag voor elke bestelling
 */
function loadOrders() {
    // Bestellingen ophalen uit localStorage (of lege array als er geen zijn)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const ordersGrid = document.getElementById('orders-grid');

    // HTML genereren voor elke bestelling en in de pagina plaatsen
    ordersGrid.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body ">
                <h5>Bestelling #${order.id}</h5>
                <p>Datum: ${order.date}</p>
                <p>Totaal: €${order.total.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Producten laden uit localStorage en weergeven in de producttabel
 * Toont ID, naam, prijs en actieknoppen voor elk product
 */
function loadProducts() {
    // Producten ophalen uit localStorage (of lege array als er geen zijn)
    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];
    const table = document.getElementById('products-table');

    // HTML genereren voor elk product in tabelvorm
    table.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.title}</td>
            <td>€${product.price.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-warning me-2" onclick="editProduct(${product.id})">Bewerk</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">Verwijder</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Nieuw product toevoegen aan de productlijst
 * @param {Event} e - Het formulier verzend event
 */
function addProduct(e) {
    // Voorkom standaard formuliergedrag (pagina verversen)
    e.preventDefault();

    // Huidige producten ophalen uit localStorage
    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];

    // Nieuw product aanmaken met gegevens uit het formulier
    const newProduct = {
        id: products.length,                                                 // Automatisch ID toewijzen
        title: document.getElementById('product-name').value,                // Productnaam uit formulier
        price: parseFloat(document.getElementById('product-price').value),   // Prijs omzetten naar getal
        image: document.getElementById('product-image').value || '/img/placeholder.jpg' // Afbeelding of standaard afbeelding
    };

    // Product toevoegen aan de lijst en opslaan in localStorage
    products.push(newProduct);
    localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));

    // Scherm bijwerken en formulier leegmaken
    loadProducts();
    this.reset();
}

/**
 * Product verwijderen uit de productlijst
 * @param {number} id - ID van het te verwijderen product
 */
function deleteProduct(id) {
    // Huidige producten ophalen
    let products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];

    // Product met specifiek ID uit de lijst halen
    products = products.filter(p => p.id !== id);

    // Bijgewerkte lijst opslaan in localStorage
    localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));

    // Scherm bijwerken
    loadProducts();
}

/**
 * Producten resetten naar de standaardwaarden uit games.json
 * Verwijdert alle aangepaste producten en herstelt de originele lijst
 */
async function resetProducts() {
    // Originele productdata ophalen uit JSON bestand
    const response = await fetch('./games.json');
    const data = await response.json();

    // Data opslaan in localStorage (overschrijft huidige data)
    localStorage.setItem('gamesStorage', JSON.stringify(data));

    // Scherm bijwerken
    loadProducts();
}

/**
 * Product bewerken via modal
 * @param {number} id - ID van het te bewerken product
 */
function editProduct(id) {
    // Huidige producten ophalen
    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];
    const product = products.find(p => p.id === id);

    // Modal elementen
    const editModal = new bootstrap.Modal(document.getElementById('editPriceModal'));
    const priceInput = document.getElementById('newPrice');

    // Huidige prijs in input zetten
    priceInput.value = product.price;

    // Save button handler
    document.getElementById('savePriceBtn').onclick = function () {
        const newPrice = parseFloat(priceInput.value);

        if (!isNaN(newPrice)) {
            // Prijs bijwerken en opslaan
            product.price = newPrice;
            localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));

            // Modal sluiten en producten herladen
            editModal.hide();
            loadProducts();
        }
    };

    // Modal tonen
    editModal.show();
}