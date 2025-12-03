let allDeliveries = [];
let availableOrders = [];
let currentFilter = 'all';
let currentTab = 'my-orders';

// Load deliveries on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDeliveries();
    loadAvailableOrders();
});

// Load available orders
function loadAvailableOrders() {
    fetch('/delivery/orders/available')
        .then(function(res) {
            return res.json();
        })
        .then(function(orders) {
            availableOrders = orders || [];
            displayAvailableOrders();
        })
        .catch(function(err) {
            console.error('Error loading available orders:', err);
            document.getElementById('availableOrdersList').innerHTML = '<p class="error">Failed to load available orders</p>';
        });
}

// Display available orders
function displayAvailableOrders() {
    const container = document.getElementById('availableOrdersList');
    const countBadge = document.getElementById('availableCount');
    
    if (countBadge) {
        countBadge.textContent = availableOrders.length;
    }
    
    if (availableOrders.length === 0) {
        container.innerHTML = '<div class="no-data-card"><p>No available orders at the moment</p></div>';
        return;
    }

    let html = '';
    for (let i = 0; i < availableOrders.length; i++) {
        const order = availableOrders[i];
        html += '<div class="delivery-card available-order">';
        html += '<div class="delivery-header-card">';
        html += '<div><h3>Order #' + order.order_id + '</h3>';
        html += '<p class="order-date">' + new Date(order.created_at).toLocaleString() + '</p></div>';
        html += '<span class="status-badge pending">Pending</span>';
        html += '</div>';
        html += '<div class="delivery-info">';
        html += '<div class="info-row"><strong>Restaurant:</strong><span>' + (order.restaurant_name || 'N/A') + '</span></div>';
        html += '<div class="info-row"><strong>Customer:</strong><span>' + (order.user_name || 'N/A') + '</span></div>';
        html += '<div class="info-row"><strong>Total:</strong><span class="price-highlight">' + parseFloat(order.total_price).toFixed(2) + ' EGP</span></div>';
        if (order.delivery_address) {
            html += '<div class="info-row"><strong>Address:</strong><span>' + order.delivery_address + '</span></div>';
        }
        html += '</div>';
        html += '<div class="delivery-items"><strong>Items:</strong><ul>';
        if (order.items) {
            for (let j = 0; j < order.items.length; j++) {
                const item = order.items[j];
                html += '<li>' + item.item_name + ' × ' + item.quantity + ' - ' + (item.price * item.quantity) + ' EGP</li>';
            }
        }
        html += '</ul></div>';
        html += '<div class="delivery-actions">';
        html += '<button class="status-btn accept-btn" onclick="acceptOrder(' + order.order_id + ')">Accept Order</button>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

// Accept an order
function acceptOrder(orderId) {
    const deliveryId = localStorage.getItem('deliveryId') || 1;
    
    if (!confirm('Are you sure you want to accept this order?')) {
        return;
    }

    fetch('/delivery/orders/' + orderId + '/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: deliveryId })
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        loadAvailableOrders();
        loadDeliveries();
        if (currentTab === 'available') {
            showTab('my-orders');
        }
    })
    .catch(function(err) {
        alert('Failed to accept order');
    });
}

// Load all deliveries
function loadDeliveries() {
    const deliveryId = localStorage.getItem('deliveryId') || 1;
    
    fetch('/delivery/orders/' + deliveryId)
        .then(function(res) {
            return res.json();
        })
        .then(function(deliveries) {
            allDeliveries = deliveries || [];
            const countBadge = document.getElementById('myOrdersCount');
            if (countBadge) {
                countBadge.textContent = allDeliveries.length;
            }
            filterMyOrders(currentFilter);
        })
        .catch(function(err) {
            console.error('Error loading deliveries:', err);
            document.getElementById('deliveriesList').innerHTML = '<p class="error">Failed to load deliveries</p>';
        });
}

// Show tab
function showTab(tab) {
    currentTab = tab;
    
    if (tab === 'available') {
        document.getElementById('availableOrdersSection').style.display = 'block';
        document.getElementById('myOrdersSection').style.display = 'none';
        loadAvailableOrders();
    } else {
        document.getElementById('availableOrdersSection').style.display = 'none';
        document.getElementById('myOrdersSection').style.display = 'block';
        loadDeliveries();
    }
}

// Filter my orders by status
function filterMyOrders(status) {
    currentFilter = status;
    
    let filtered = allDeliveries;
    if (status !== 'all') {
        filtered = [];
        for (let i = 0; i < allDeliveries.length; i++) {
            const d = allDeliveries[i];
            const dStatus = (d.status || 'pending').toLowerCase();
            if (dStatus === status || dStatus === status.replace('_', '-')) {
                filtered.push(d);
            }
        }
    }

    displayDeliveries(filtered);
}

// Display deliveries
function displayDeliveries(deliveries) {
    const container = document.getElementById('deliveriesList');
    
    if (deliveries.length === 0) {
        container.innerHTML = '<p class="no-data">No deliveries found</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < deliveries.length; i++) {
        const delivery = deliveries[i];
        const statusValue = (delivery.status || 'pending').toLowerCase();
        const statusClass = statusValue.replace(/_/g, '-');
        const canUpdate = statusValue !== 'delivered' && statusValue !== 'cancelled';
        
        let statusDisplay = statusValue;
        if (statusValue === 'pending') statusDisplay = '⏳ Pending';
        else if (statusValue === 'accepted') statusDisplay = '✅ Accepted';
        else if (statusValue === 'on_the_way') statusDisplay = '🚚 On Way';
        else if (statusValue === 'delivered') statusDisplay = '✅ Delivered';
        else if (statusValue === 'done') statusDisplay = '✅ ok';
        
        html += '<div class="delivery-card">';
        html += '<div class="delivery-header-card">';
        html += '<div><h3>Order #' + delivery.order_id + '</h3>';
        html += '<p class="order-date">' + new Date(delivery.created_at).toLocaleString() + '</p></div>';
        html += '<span class="status-badge ' + statusClass + '">' + statusDisplay + '</span>';
        html += '</div>';
        html += '<div class="delivery-info">';
        html += '<div class="info-row"><strong>Restaurant:</strong><span>' + (delivery.restaurant_name || 'N/A') + '</span></div>';
        html += '<div class="info-row"><strong>Customer:</strong><span>' + (delivery.user_name || 'N/A') + '</span></div>';
        html += '<div class="info-row"><strong>Total:</strong><span class="price-highlight">' + parseFloat(delivery.total_price).toFixed(2) + ' EGP</span></div>';
        if (delivery.delivery_address) {
            html += '<div class="info-row"><strong>Address:</strong><span>' + delivery.delivery_address + '</span></div>';
        }
        html += '</div>';
        html += '<div class="delivery-items"><strong>Items:</strong><ul>';
        if (delivery.items) {
            for (let j = 0; j < delivery.items.length; j++) {
                const item = delivery.items[j];
                html += '<li>' + item.item_name + ' × ' + item.quantity + ' - ' + (item.price * item.quantity) + ' EGP</li>';
            }
        }
        html += '</ul></div>';
        
        if (canUpdate) {
            html += '<div class="delivery-actions">';
            if (statusValue === 'pending' || statusValue === 'accepted') {
                html += '<button class="status-btn on-way-btn" onclick="updateDeliveryStatus(' + delivery.order_id + ', \'on_the_way\')">Mark as On Way</button>';
            }
            if (statusValue === 'on_the_way' || statusValue === 'done') {
                html += '<button class="status-btn delivered-btn" onclick="updateDeliveryStatus(' + delivery.order_id + ', \'delivered\')">Mark as Delivered</button>';
            }
            html += '</div>';
        }
        html += '</div>';
    }
    container.innerHTML = html;
}

// Update delivery status
function updateDeliveryStatus(orderId, newStatus) {
    if (!confirm('Update order status?')) {
        return;
    }

    const deliveryId = localStorage.getItem('deliveryId') || 1;
    
    fetch('/delivery/orders/' + orderId + '/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, delivery_id: deliveryId })
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        loadDeliveries();
        if (currentTab === 'available') {
            loadAvailableOrders();
        }
    })
    .catch(function(err) {
        alert('Failed to update status');
    });
}

// Make functions global
window.showTab = showTab;
window.filterMyOrders = filterMyOrders;
window.acceptOrder = acceptOrder;
window.updateDeliveryStatus = updateDeliveryStatus;
