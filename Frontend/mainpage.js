// Cart management
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentRestaurantId = localStorage.getItem('currentRestaurantId') ? parseInt(localStorage.getItem('currentRestaurantId')) : null;

// Load restaurants on page load
document.addEventListener('DOMContentLoaded', function() {
    loadRestaurants();
    updateCartUI();
    loadOrders();
});

// Load all restaurants
function loadRestaurants() {
    const container = document.getElementById('restaurantsContainer');
    if (!container) return;
    
    container.innerHTML = '<p>Loading restaurants...</p>';
    
    fetch('/restaurants')
        .then(function(res) {
            return res.json();
        })
        .then(function(restaurants) {
            if (restaurants.length === 0) {
                container.innerHTML = '<p>No restaurants available</p>';
                return;
            }
            
            let html = '';
            for (let i = 0; i < restaurants.length; i++) {
                const r = restaurants[i];
                let imageSrc = r.restaurant_image || 'https://via.placeholder.com/300x200?text=Restaurant';
                
                html += '<div class="restaurant-card" onclick="viewMenu(' + r.restaurant_id + ')">';
                html += '<img class="restaurant-thumb" src="' + imageSrc + '" alt="' + r.restaurant_name + '">';
                html += '<div class="restaurant-info">';
                html += '<h3>' + r.restaurant_name + '</h3>';
                html += '<p>' + (r.description || '') + '</p>';
                html += '<div class="restaurant-meta">';
                html += '<span>⏱ ' + (r.delivery_time || 30) + ' min</span>';
                html += '<span>💵 ' + (r.delivery_price || 20) + ' EGP delivery</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }
            container.innerHTML = html;
        })
        .catch(function(err) {
            console.error('Error:', err);
            container.innerHTML = '<p>Failed to load restaurants</p>';
        });
}

// View restaurant menu
function viewMenu(restaurantId) {
    window.location.href = 'menu.html?id=' + restaurantId;
}

// Cart functions
function addToCart(item, restaurantId) {
    if (currentRestaurantId && currentRestaurantId !== restaurantId) {
        if (!confirm('You have items from another restaurant. Clear cart and add this item?')) {
            return;
        }
        cart = [];
    }
    
    currentRestaurantId = restaurantId;
    let found = false;
    
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].item_id === item.item_id) {
            cart[i].quantity += 1;
            found = true;
            break;
        }
    }
    
    if (!found) {
        cart.push({
            item_id: item.item_id,
            item_name: item.item_name,
            item_price: item.item_price,
            quantity: 1,
            restaurant_id: restaurantId
        });
    }
    
    saveCart();
    updateCartUI();
}

function removeFromCart(itemId) {
    let newCart = [];
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].item_id !== itemId) {
            newCart.push(cart[i]);
        }
    }
    cart = newCart;
    
    if (cart.length === 0) {
        currentRestaurantId = null;
    }
    
    saveCart();
    updateCartUI();
}

function updateQuantity(itemId, change) {
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].item_id === itemId) {
            cart[i].quantity += change;
            if (cart[i].quantity <= 0) {
                removeFromCart(itemId);
            } else {
                saveCart();
                updateCartUI();
            }
            break;
        }
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (currentRestaurantId) {
        localStorage.setItem('currentRestaurantId', currentRestaurantId);
    } else {
        localStorage.removeItem('currentRestaurantId');
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update cart count
    let totalItems = 0;
    for (let i = 0; i < cart.length; i++) {
        totalItems += cart[i].quantity;
    }
    if (cartCount) cartCount.textContent = totalItems;
    
    // If cart is empty
    if (cart.length === 0) {
        if (cartItems) cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        if (cartTotal) cartTotal.textContent = '0';
        const addressSection = document.getElementById('cartAddressSection');
        if (addressSection) addressSection.style.display = 'none';
        return;
    }
    
    // Show address section
    const addressSection = document.getElementById('cartAddressSection');
    if (addressSection) addressSection.style.display = 'block';
    
    // Display cart items
    let itemsHTML = '';
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        itemsHTML += '<div class="cart-item">';
        itemsHTML += '<div class="cart-item-info">';
        itemsHTML += '<h4>' + item.item_name + '</h4>';
        itemsHTML += '<p>' + item.item_price + ' EGP × ' + item.quantity + '</p>';
        itemsHTML += '</div>';
        itemsHTML += '<div class="cart-item-controls">';
        itemsHTML += '<button onclick="updateQuantity(' + item.item_id + ', -1)">-</button>';
        itemsHTML += '<span>' + item.quantity + '</span>';
        itemsHTML += '<button onclick="updateQuantity(' + item.item_id + ', 1)">+</button>';
        itemsHTML += '<button class="remove-btn" onclick="removeFromCart(' + item.item_id + ')">×</button>';
        itemsHTML += '</div>';
        itemsHTML += '</div>';
    }
    if (cartItems) cartItems.innerHTML = itemsHTML;
    
    // Calculate total
    let itemsTotal = 0;
    for (let i = 0; i < cart.length; i++) {
        itemsTotal += parseFloat(cart[i].item_price) * parseInt(cart[i].quantity);
    }
    
    // Get delivery price
    if (currentRestaurantId) {
        fetch('/restaurants/' + currentRestaurantId)
            .then(function(res) {
                return res.json();
            })
            .then(function(restaurant) {
                const deliveryPrice = parseFloat(restaurant.delivery_price) || 0;
                const finalTotal = itemsTotal + deliveryPrice;
                if (cartTotal) cartTotal.textContent = finalTotal.toFixed(2);
                
                const breakdown = document.getElementById('cartBreakdown');
                if (breakdown) {
                    breakdown.innerHTML = '<div class="breakdown-row"><span>Items:</span><span>' + itemsTotal.toFixed(2) + ' EGP</span></div>';
                    breakdown.innerHTML += '<div class="breakdown-row"><span>Delivery Fee:</span><span>' + deliveryPrice.toFixed(2) + ' EGP</span></div>';
                    breakdown.innerHTML += '<div class="breakdown-row total-row"><strong>Total:</strong><strong>' + finalTotal.toFixed(2) + ' EGP</strong></div>';
                    breakdown.style.display = 'block';
                }
            })
            .catch(function(err) {
                if (cartTotal) cartTotal.textContent = itemsTotal.toFixed(2);
            });
    } else {
        if (cartTotal) cartTotal.textContent = itemsTotal.toFixed(2);
    }
}

// Cart sidebar toggle
document.getElementById('cartBtn').addEventListener('click', function() {
    document.getElementById('cartSidebar').classList.add('open');
});

document.getElementById('closeCart').addEventListener('click', function() {
    document.getElementById('cartSidebar').classList.remove('open');
});

// Checkout
document.getElementById('checkoutBtn').addEventListener('click', function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const userId = localStorage.getItem('userId') || 1;
    
    if (!currentRestaurantId && cart.length > 0 && cart[0].restaurant_id) {
        currentRestaurantId = cart[0].restaurant_id;
        saveCart();
    }
    
    if (!currentRestaurantId) {
        alert('Error: Restaurant information is missing');
        return;
    }
    
    const addressInput = document.getElementById('deliveryAddress');
    const deliveryAddress = addressInput ? addressInput.value.trim() : '';
    
    if (!deliveryAddress) {
        alert('Please enter a delivery address');
        return;
    }
    
    fetch('/restaurants/' + currentRestaurantId)
        .then(function(res) {
            return res.json();
        })
        .then(function(restaurant) {
            const deliveryPrice = parseFloat(restaurant.delivery_price);
            let itemsTotal = 0;
            for (let i = 0; i < cart.length; i++) {
                itemsTotal += parseFloat(cart[i].item_price) * parseInt(cart[i].quantity);
            }
            
            const orderData = {
                user_id: userId,
                restaurant_id: currentRestaurantId,
                items: [],
                total_price: itemsTotal,
                delivery_address: deliveryAddress
            };
            
            for (let i = 0; i < cart.length; i++) {
                orderData.items.push({
                    item_id: cart[i].item_id,
                    quantity: cart[i].quantity,
                    price: cart[i].item_price
                });
            }
            
            placeOrder(orderData);
        })
        .catch(function(err) {
            alert('Error: Could not fetch restaurant information');
        });
});

function placeOrder(orderData) {
    fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        alert('Order placed! Order #' + data.order_id);
        cart = [];
        currentRestaurantId = null;
        const addressInput = document.getElementById('deliveryAddress');
        if (addressInput) addressInput.value = '';
        saveCart();
        updateCartUI();
        loadOrders();
        document.getElementById('cartSidebar').classList.remove('open');
    })
    .catch(function(err) {
        alert('Failed to place order');
    });
}

// Orders modal
document.getElementById('ordersBtn').addEventListener('click', function() {
    loadOrders();
    document.getElementById('ordersModal').style.display = 'flex';
});

document.getElementById('closeOrders').addEventListener('click', function() {
    document.getElementById('ordersModal').style.display = 'none';
});

// Load user orders
function loadOrders() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        const ordersList = document.getElementById('ordersList');
        if (ordersList) ordersList.innerHTML = '<p>Please log in</p>';
        return;
    }
    
    fetch('/orders/user/' + userId)
        .then(function(res) {
            return res.json();
        })
        .then(function(orders) {
            const ordersList = document.getElementById('ordersList');
            if (!ordersList) return;
            
            if (orders.length === 0) {
                ordersList.innerHTML = '<p>No orders yet</p>';
                return;
            }
            
            let html = '';
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                const statusValue = (order.status || 'pending').toLowerCase();
                let statusDisplay = statusValue;
                if (statusValue === 'pending') statusDisplay = '⏳ Pending';
                else if (statusValue === 'accepted') statusDisplay = '✅ Accepted';
                else if (statusValue === 'on_the_way') statusDisplay = '🚚 On Way';
                else if (statusValue === 'delivered') statusDisplay = '✅ Delivered';
                
                html += '<div class="order-card">';
                html += '<div class="order-header">';
                html += '<div><h3>Order #' + order.order_id + '</h3>';
                html += '<p class="order-date-small">' + new Date(order.created_at).toLocaleString() + '</p></div>';
                html += '<span class="status-badge ' + statusValue.replace(/_/g, '-') + '">' + statusDisplay + '</span>';
                html += '</div>';
                html += '<div class="order-info-grid">';
                html += '<div class="info-item"><strong>Restaurant:</strong><span>' + (order.restaurant_name || 'N/A') + '</span></div>';
                html += '<div class="info-item"><strong>Total:</strong><span>' + parseFloat(order.total_price).toFixed(2) + ' EGP</span></div>';
                if (order.delivery_address) {
                    html += '<div class="info-item full-width"><strong>Address:</strong><span>' + order.delivery_address + '</span></div>';
                }
                html += '</div>';
                html += '<div class="order-items"><strong>Items:</strong><ul>';
                if (order.items) {
                    for (let j = 0; j < order.items.length; j++) {
                        const item = order.items[j];
                        html += '<li>' + item.item_name + ' × ' + item.quantity + ' - ' + (item.price * item.quantity) + ' EGP</li>';
                    }
                }
                html += '</ul></div>';
                html += '</div>';
            }
            ordersList.innerHTML = html;
        })
        .catch(function(err) {
            const ordersList = document.getElementById('ordersList');
            if (ordersList) ordersList.innerHTML = '<p>Failed to load orders</p>';
        });
}

// Make functions global
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.viewMenu = viewMenu;
window.addToCart = addToCart;
