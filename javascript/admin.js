/**
 * Admin Panel Beheersysteem
 * -------------------------
 * Dit script beheert de admin functionaliteit van de GameStore:
 * - Bestellingen bekijken
 * - Producten toevoegen/bewerken/verwijderen
 * - Producten resetten naar standaardwaarden
 */

/**
 * DOM Elements Object
 * Centrale plek voor alle belangrijke DOM element referenties
 * Maakt het makkelijker om elementen te vinden en bij te werken
 */
const ELEMENTS = {
    productNameInput: document.getElementById('product-name'),
    charCount: document.getElementById('charCount'),
    ordersGrid: document.getElementById('orders-grid'),
    productsTable: document.getElementById('products-table'),
    addProductForm: document.getElementById('add-product-form'),
    resetProductsButton: document.getElementById('reset-products')
};

/**
 * Pagina Initialisatie
 * --------------------
 * - Laadt alle benodigde data
 * - Stelt event listeners in
 * - Initialiseert karakter teller
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadOrders();
    loadProducts();

    // Set up event listeners
    ELEMENTS.addProductForm.addEventListener('submit', addProduct);
    ELEMENTS.resetProductsButton.addEventListener('click', resetProducts);

    // Character count for product name
    ELEMENTS.productNameInput.addEventListener('input', updateCharCount);
});

/**
 * Product Naam Validatie
 * ---------------------
 * Houdt bij hoeveel karakters er in de productnaam zijn
 * Maximum is 70 karakters
 */
function updateCharCount() {
    const length = ELEMENTS.productNameInput.value.length;
    ELEMENTS.charCount.textContent = `${length}/70 tekens`;
}

/**
 * Bestellingen Management
 * ----------------------
 * Laadt en toont alle bestellingen uit localStorage
 * Toont bestelnummer, datum en totaalbedrag
 */
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    ELEMENTS.ordersGrid.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body">
                <h5>Bestelling #${order.id}</h5>
                <p>Datum: ${order.date}</p>
                <p>Totaal: €${order.total.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Product Lijst Management
 * -----------------------
 * Laadt en toont alle producten in de tabel
 * Met knoppen voor bewerken en verwijderen
 */
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];

    ELEMENTS.productsTable.innerHTML = products.map(product => `
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
 * Nieuw Product Toevoegen
 * ----------------------
 * @param {Event} e - Form submit event
 * 
 * Validaties:
 * - Naam max 70 karakters
 * - Prijs max €200
 * 
 * Process:
 * 1. Valideer input
 * 2. Maak nieuw product object
 * 3. Voeg toe aan localStorage
 * 4. Update UI
 */
function addProduct(e) {
    e.preventDefault();

    const productName = ELEMENTS.productNameInput.value;
    const productPrice = parseFloat(document.getElementById('product-price').value);

    // Validate input
    if (productName.length > 70) {
        alert('Productnaam mag niet langer zijn dan 70 tekens');
        return;
    }

    if (productPrice > 200) {
        alert('Productprijs mag niet hoger zijn dan €200');
        return;
    }

    // Get current products
    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];

    // Create new product
    const newProduct = {
        id: products.length,
        title: productName,
        price: productPrice,
        image: document.getElementById('product-image').value || '/img/placeholder.jpg'
    };

    // Add to products and save
    products.push(newProduct);
    localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));

    // Update UI and reset form
    loadProducts();
    e.target.reset();
}

/**
 * Product Verwijderen
 * ------------------
 * @param {number} id - Product ID om te verwijderen
 * 
 * Process:
 * 1. Verwijder product uit array
 * 2. Update alle product IDs
 * 3. Sla op in localStorage
 * 4. Update UI
 */
function deleteProduct(id) {
    let products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];

    products = products.filter(product => product.id !== id);

    // Update IDs to maintain sequence
    products.forEach((product, index) => {
        product.id = index;
    });

    localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));
    loadProducts();
}

/**
 * Products Resetten
 * ----------------
 * Zet alle producten terug naar de originele staat
 * door games.json opnieuw in te laden
 * 
 * Error handling:
 * - Toont success message bij succes
 * - Toont error message bij mislukking
 */
async function resetProducts() {
    try {
        const response = await fetch('games.json');
        const data = await response.json();
        localStorage.setItem('gamesStorage', JSON.stringify(data));
        loadProducts();
        alert('Producten zijn gereset naar de standaardwaarden');
    } catch (error) {
        console.error('Error resetting products:', error);
        alert('Er is een fout opgetreden bij het resetten van de producten');
    }
}

/**
 * Product Prijs Bewerken
 * ---------------------
 * @param {number} id - Product ID om te bewerken
 * 
 * Features:
 * - Toont huidige prijs
 * - Validatie: max €200
 * - Auto-update na opslaan
 * - Cleanup van event listeners
 */
function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];
    const product = products.find(p => p.id === id);

    if (!product) return;

    // Initialize edit modal
    const editModal = new bootstrap.Modal(document.getElementById('editPriceModal'));
    const newPriceInput = document.getElementById('newPrice');
    const savePriceBtn = document.getElementById('savePriceBtn');

    // Set current price
    newPriceInput.value = product.price;

    // Handle save
    const saveHandler = () => {
        const newPrice = parseFloat(newPriceInput.value);

        if (newPrice > 200) {
            alert('Prijs mag niet hoger zijn dan €200');
            return;
        }

        product.price = newPrice;
        localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));
        loadProducts();
        editModal.hide();

        // Clean up event listener
        savePriceBtn.removeEventListener('click', saveHandler);
    };

    savePriceBtn.addEventListener('click', saveHandler);
    editModal.show();
}