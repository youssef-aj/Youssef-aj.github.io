/* global bootstrap */

// Admin panel voor het beheren van de GameStore

const ELEMENTS = {
    productNameInput: document.getElementById('product-name'),
    charCount: document.getElementById('charCount'),
    ordersGrid: document.getElementById('orders-grid'),
    productsTable: document.getElementById('products-table'),
    addProductForm: document.getElementById('add-product-form'),
    resetProductsButton: document.getElementById('reset-products'),
};

// Bootstrap modal instantie
let editModal;

// Laadt de pagina met alle benodigde data en event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialiseer Bootstrap modal
    const editModalEl = document.getElementById('editPriceModal');
    if (editModalEl) {
        editModal = new bootstrap.Modal(editModalEl);
    }

    loadOrders();
    loadProducts();

    ELEMENTS.addProductForm.addEventListener('submit', addProduct);
    ELEMENTS.resetProductsButton.addEventListener('click', resetProducts);
    ELEMENTS.productNameInput.addEventListener('input', updateCharCount);
});

// Update het aantal karakters voor de productnaam (max 70)
function updateCharCount() {
    const length = ELEMENTS.productNameInput.value.length;
    ELEMENTS.charCount.textContent = `${length}/70 tekens`;
}

// Laadt alle bestellingen uit localStorage
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    ELEMENTS.ordersGrid.innerHTML = orders.map(order => `
        <div class="card mb-2">
            <div class="card-body">
                <h5>Bestelling #${order.id + 1}</h5>
                <p>Datum: ${order.date}</p>
                <p>Totaal: €${order.total.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

// Laadt alle producten in de tabel
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

// Voegt een nieuw product toe aan de winkel
function addProduct(e) {
    e.preventDefault();

    const productName = ELEMENTS.productNameInput.value;
    const productPrice = parseFloat(document.getElementById('product-price').value);

    if (productName.length > 70) {
        alert('Productnaam mag niet langer zijn dan 70 tekens');
        return;
    }

    if (productPrice > 200) {
        alert('Productprijs mag niet hoger zijn dan €200');
        return;
    }

    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];

    const newProduct = {
        id: products.length,
        title: productName,
        price: productPrice,
        image: document.getElementById('product-image').value || '/img/placeholder.jpg',
    };

    products.push(newProduct);
    localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));

    loadProducts();
    e.target.reset();
}

// Verwijdert een product uit de winkel
function deleteProduct(id) {
    let products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];

    products = products.filter(product => product.id !== id);

    products.forEach((product, index) => {
        product.id = index;
    });

    localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));
    loadProducts();
}

// Reset alle producten naar de originele staat
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

// Past de prijs van een product aan
function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('gamesStorage'))?.games || [];
    const product = products.find(p => p.id === id);

    if (!product) return;

    const newPriceInput = document.getElementById('newPrice');
    const newNameInput = document.getElementById('newName');
    const newImageInput = document.getElementById('newImage');
    const savePriceBtn = document.getElementById('savePriceBtn');

    // Vul de form met huidige waarden
    newPriceInput.value = product.price;
    newNameInput.value = product.title;
    newImageInput.value = product.image;

    // Verwijder oude event listeners
    const newSavePriceBtn = savePriceBtn.cloneNode(true);
    savePriceBtn.parentNode.replaceChild(newSavePriceBtn, savePriceBtn);

    // Voeg nieuwe event listener toe
    newSavePriceBtn.addEventListener('click', () => {
        const newPrice = parseFloat(newPriceInput.value);
        const newName = newNameInput.value.trim();
        const newImage = newImageInput.value.trim();

        if (newPrice > 200) {
            alert('Prijs mag niet hoger zijn dan €200');
            return;
        }

        if (newName.length > 70) {
            alert('Productnaam mag niet langer zijn dan 70 tekens');
            return;
        }

        product.price = newPrice;
        product.title = newName;
        product.image = newImage;

        localStorage.setItem('gamesStorage', JSON.stringify({ games: products }));
        loadProducts();
        editModal.hide(); // Bootstrap modal API gebruiken
    });

    editModal.show(); // Bootstrap modal API gebruiken
}

// Verwerkt de checkout en slaat de bestelling op in localStorage
function handleCheckout(cart) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const cartTotal = cart.reduce((total, item) => total + item.price, 0);

    orders.push({
        id: orders.length,
        total: cartTotal,
        date: new Date().toLocaleString(),
        items: cart,
    });

    localStorage.setItem('orders', JSON.stringify(orders));
    loadOrders();
}