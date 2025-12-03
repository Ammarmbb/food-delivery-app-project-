let editingRestaurantId = null;
let editingMenuItemId = null;
let currentRestaurantIdForMenu = null;

// Load restaurants on page load
document.addEventListener('DOMContentLoaded', function() {
    loadRestaurants();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('Additembt').onclick = function() {
        editingRestaurantId = null;
        document.getElementById('modalTitle').textContent = 'Add Restaurant';
        clearRestaurantForm();
        document.getElementById('addModal').style.display = 'flex';
    };

    document.getElementById('closeModal').onclick = function() {
        document.getElementById('addModal').style.display = 'none';
        editingRestaurantId = null;
    };

    document.getElementById('saveRestaurant').onclick = saveRestaurant;

    document.getElementById('closeMenuModal').onclick = function() {
        document.getElementById('menuModal').style.display = 'none';
        currentRestaurantIdForMenu = null;
    };

    document.getElementById('addMenuItemBtn').onclick = function() {
        editingMenuItemId = null;
        document.getElementById('menuItemModalTitle').textContent = 'Add Menu Item';
        clearMenuItemForm();
        document.getElementById('menuItemModal').style.display = 'flex';
    };

    document.getElementById('closeMenuItemModal').onclick = function() {
        document.getElementById('menuItemModal').style.display = 'none';
        editingMenuItemId = null;
    };

    document.getElementById('saveMenuItem').onclick = saveMenuItem;

    document.getElementById('statsBtn').onclick = function() {
        loadStatistics();
        document.getElementById('statsModal').style.display = 'flex';
    };

    document.getElementById('closeStats').onclick = function() {
        document.getElementById('statsModal').style.display = 'none';
    };
}

// Load all restaurants
function loadRestaurants() {
    fetch('/restaurants')
        .then(function(res) {
            return res.json();
        })
        .then(function(restaurants) {
            const container = document.getElementById('restaurantList');
            if (restaurants.length === 0) {
                container.innerHTML = '<p class="no-data">No restaurants yet. Add one to get started!</p>';
                return;
            }

            let html = '';
            for (let i = 0; i < restaurants.length; i++) {
                const r = restaurants[i];
                html += '<div class="restaurant-card admin-card">';
                html += '<img class="restaurant-thumb" src="' + (r.restaurant_image || '') + '" alt="' + r.restaurant_name + '">';
                html += '<div class="restaurant-info">';
                html += '<h3>' + r.restaurant_name + '</h3>';
                html += '<p>' + r.description + '</p>';
                html += '<div class="restaurant-meta">';
                html += '<span>⏱ ' + r.delivery_time + ' min</span>';
                html += '<span>💵 ' + r.delivery_price + ' EGP</span>';
                html += '</div>';
                html += '<div class="admin-actions">';
                html += '<button class="edit-btn" onclick="editRestaurant(' + r.restaurant_id + ')">Edit</button>';
                html += '<button class="menu-btn" onclick="manageMenu(' + r.restaurant_id + ')">Menu</button>';
                html += '<button class="delete-btn" onclick="deleteRestaurant(' + r.restaurant_id + ')">Delete</button>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }
            container.innerHTML = html;
        })
        .catch(function(err) {
            alert('Failed to load restaurants');
        });
}

// Save restaurant
function saveRestaurant() {
    const name = document.getElementById('rname').value.trim();
    const imageFile = document.getElementById('rimageFile').files[0];
    const existingImage = document.getElementById('rimage').value;
    const description = document.getElementById('rdesc').value.trim();
    const dtime = document.getElementById('dtime').value;
    const dprice = document.getElementById('dprice').value;

    document.querySelectorAll('#addModal .error').forEach(function(e) {
        e.textContent = '';
    });

    let hasError = false;
    if (!name) { document.getElementById('name-error').textContent = 'Name required'; hasError = true; }
    if (!imageFile && !existingImage) { document.getElementById('Image-error').textContent = 'Image required'; hasError = true; }
    if (!description) { document.getElementById('dec-error').textContent = 'Description required'; hasError = true; }
    if (!dtime || dtime < 1) { document.getElementById('time-error').textContent = 'Valid delivery time required'; hasError = true; }
    if (!dprice || dprice < 0) { document.getElementById('price-error').textContent = 'Valid delivery price required'; hasError = true; }

    if (hasError) return;

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            saveRestaurantWithImage(base64Image);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveRestaurantWithImage(existingImage);
    }

    function saveRestaurantWithImage(imageData) {
        const url = editingRestaurantId ? '/restaurants/' + editingRestaurantId : '/restaurants';
        const method = editingRestaurantId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, image: imageData, description, delivery_time: dtime, delivery_price: dprice })
        })
        .then(function(res) {
            return res.text();
        })
        .then(function(msg) {
            alert(msg);
            loadRestaurants();
            document.getElementById('addModal').style.display = 'none';
            editingRestaurantId = null;
            clearRestaurantForm();
        })
        .catch(function(err) {
            alert('Failed to save restaurant');
        });
    }
}

// Edit restaurant
function editRestaurant(id) {
    fetch('/restaurants/' + id)
        .then(function(res) {
            return res.json();
        })
        .then(function(restaurant) {
            editingRestaurantId = id;
            document.getElementById('modalTitle').textContent = 'Edit Restaurant';
            document.getElementById('rname').value = restaurant.restaurant_name;
            document.getElementById('rimage').value = restaurant.restaurant_image || '';
            document.getElementById('rdesc').value = restaurant.description || '';
            document.getElementById('dtime').value = restaurant.delivery_time || '';
            document.getElementById('dprice').value = restaurant.delivery_price || '';
            document.getElementById('rimageFile').value = '';
            document.getElementById('addModal').style.display = 'flex';
        })
        .catch(function(err) {
            alert('Failed to load restaurant');
        });
}

// Delete restaurant
function deleteRestaurant(id) {
    if (!confirm('Are you sure you want to delete this restaurant? This will also delete all menu items.')) {
        return;
    }

    fetch('/restaurants/' + id, { method: 'DELETE' })
        .then(function(res) {
            return res.text();
        })
        .then(function(msg) {
            alert(msg);
            loadRestaurants();
        })
        .catch(function(err) {
            alert('Failed to delete restaurant');
        });
}

// Manage menu
function manageMenu(restaurantId) {
    currentRestaurantIdForMenu = restaurantId;
    fetch('/restaurants/' + restaurantId)
        .then(function(res) {
            return res.json();
        })
        .then(function(restaurant) {
            document.getElementById('menuModalTitle').textContent = 'Menu - ' + restaurant.restaurant_name;
            loadMenuItems(restaurantId);
            document.getElementById('menuModal').style.display = 'flex';
        });
}

// Load menu items
function loadMenuItems(restaurantId) {
    fetch('/menu/' + restaurantId)
        .then(function(res) {
            return res.json();
        })
        .then(function(items) {
            const container = document.getElementById('menuItemsList');
            if (!items || items.length === 0) {
                container.innerHTML = '<p class="no-data">No menu items yet</p>';
                return;
            }

            let html = '';
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                html += '<div class="menu-item-card">';
                html += '<div class="menu-item-info">';
                html += '<h4>' + item.item_name + '</h4>';
                html += '<p>' + (item.description || '') + '</p>';
                html += '<strong>' + item.price + ' EGP</strong>';
                html += '</div>';
                html += '<div class="menu-item-actions">';
                html += '<button class="edit-btn" onclick="editMenuItem(' + item.menu_item_id + ')">Edit</button>';
                html += '<button class="delete-btn" onclick="deleteMenuItem(' + item.menu_item_id + ')">Delete</button>';
                html += '</div>';
                html += '</div>';
            }
            container.innerHTML = html;
        })
        .catch(function(err) {
            document.getElementById('menuItemsList').innerHTML = '<p class="error">Failed to load menu items</p>';
        });
}

// Save menu item
function saveMenuItem() {
    const name = document.getElementById('itemName').value.trim();
    const description = document.getElementById('itemDesc').value.trim();
    const imageFile = document.getElementById('itemImageFile').files[0];
    const existingImage = document.getElementById('itemImage').value;
    const price = document.getElementById('itemPrice').value;

    document.querySelectorAll('#menuItemModal .error').forEach(function(e) {
        e.textContent = '';
    });

    let hasError = false;
    if (!name) { document.getElementById('item-name-error').textContent = 'Name required'; hasError = true; }
    if (!price || price < 0) { document.getElementById('item-price-error').textContent = 'Valid price required'; hasError = true; }

    if (hasError) return;

    const url = editingMenuItemId ? '/menu/' + editingMenuItemId : '/menu';
    const method = editingMenuItemId ? 'PUT' : 'POST';

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            saveMenuItemWithImage(base64Image);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveMenuItemWithImage(existingImage);
    }

    function saveMenuItemWithImage(imageData) {
        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurant_id: currentRestaurantIdForMenu,
                item_name: name,
                description: description,
                image: imageData,
                price: parseFloat(price),
                category_id: null
            })
        })
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            alert(data.message || 'Menu item saved successfully!');
            loadMenuItems(currentRestaurantIdForMenu);
            document.getElementById('menuItemModal').style.display = 'none';
            editingMenuItemId = null;
            clearMenuItemForm();
        })
        .catch(function(err) {
            alert('Failed to save menu item');
        });
    }
}

// Edit menu item
function editMenuItem(itemId) {
    fetch('/menu/item/' + itemId)
        .then(function(res) {
            return res.json();
        })
        .then(function(item) {
            editingMenuItemId = itemId;
            document.getElementById('menuItemModalTitle').textContent = 'Edit Menu Item';
            document.getElementById('itemName').value = item.item_name;
            document.getElementById('itemDesc').value = item.description || '';
            document.getElementById('itemImage').value = item.image || '';
            document.getElementById('itemImageFile').value = '';
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('menuItemModal').style.display = 'flex';
        })
        .catch(function(err) {
            alert('Failed to load menu item');
        });
}

// Delete menu item
function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }

    fetch('/menu/' + itemId, { method: 'DELETE' })
        .then(function(res) {
            return res.text();
        })
        .then(function(msg) {
            alert(msg);
            loadMenuItems(currentRestaurantIdForMenu);
        })
        .catch(function(err) {
            alert('Failed to delete menu item');
        });
}

// Load statistics
function loadStatistics() {
    fetch('/admin/statistics')
        .then(function(res) {
            return res.json();
        })
        .then(function(stats) {
            document.getElementById('totalRestaurants').textContent = stats.totalRestaurants || 0;
            document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
            document.getElementById('totalRevenue').textContent = (stats.totalRevenue || 0).toFixed(2) + ' EGP';
            document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
        })
        .catch(function(err) {
            alert('Failed to load statistics');
        });
}

// Clear forms
function clearRestaurantForm() {
    document.getElementById('rname').value = '';
    document.getElementById('rimageFile').value = '';
    document.getElementById('rimage').value = '';
    document.getElementById('rdesc').value = '';
    document.getElementById('dtime').value = '';
    document.getElementById('dprice').value = '';
    document.querySelectorAll('#addModal .error').forEach(function(e) {
        e.textContent = '';
    });
}

function clearMenuItemForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemDesc').value = '';
    document.getElementById('itemImageFile').value = '';
    document.getElementById('itemImage').value = '';
    document.getElementById('itemPrice').value = '';
    document.querySelectorAll('#menuItemModal .error').forEach(function(e) {
        e.textContent = '';
    });
}

// Make functions global
window.editRestaurant = editRestaurant;
window.deleteRestaurant = deleteRestaurant;
window.manageMenu = manageMenu;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;
