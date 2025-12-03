const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get("id");

// GET restaurant info
fetch('/restaurants/' + restaurantId)
    .then(function(res) {
        return res.json();
    })
    .then(function(r) {
        if (r) {
            document.getElementById("restName").innerText = r.restaurant_name;
            let imageSrc = r.restaurant_image || 'https://via.placeholder.com/800x300?text=Restaurant';
            document.getElementById("restImage").src = imageSrc;
            document.getElementById("restDesc").innerText = r.description || '';
            document.getElementById("restTime").innerText = r.delivery_time || 30;
            document.getElementById("restPrice").innerText = r.delivery_price || 20;
        }
    })
    .catch(function(err) {
        console.error('Error loading restaurant:', err);
    });

// GET menu items
fetch('/menu/' + restaurantId)
    .then(function(res) {
        return res.json();
    })
    .then(function(items) {
        const container = document.getElementById("menuList");
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="no-items">No menu items available</p>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let imageSrc = item.image || 'https://via.placeholder.com/200x150?text=Food';
            
            html += '<div class="menu-card">';
            html += '<div class="menu-item-image">';
            html += '<img src="' + imageSrc + '" alt="' + item.item_name + '">';
            html += '</div>';
            html += '<div class="menu-item-info">';
            html += '<h3>' + item.item_name + '</h3>';
            html += '<p>' + (item.description || 'Delicious food item') + '</p>';
            html += '<div class="menu-item-footer">';
            html += '<strong class="price">' + item.price + ' EGP</strong>';
            html += '<button class="add-to-cart-btn" onclick="addItemToCart(' + item.menu_item_id + ', \'' + item.item_name.replace(/'/g, "\\'") + '\', ' + item.price + ', ' + restaurantId + ')">Add to Cart</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        container.innerHTML = html;
    })
    .catch(function(err) {
        console.error('Error loading menu:', err);
        document.getElementById("menuList").innerHTML = '<p class="error">Failed to load menu items</p>';
    });

// Add item to cart
function addItemToCart(itemId, itemName, itemPrice, restId) {
    const item = {
        item_id: itemId,
        item_name: itemName,
        item_price: itemPrice
    };
    
    if (typeof addToCart === 'function') {
        addToCart(item, restId);
    } else {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let found = false;
        
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].item_id === itemId) {
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
                restaurant_id: restId
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('currentRestaurantId', restId);
    }
    
    // Show feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Added!';
    btn.style.backgroundColor = '#4caf50';
    setTimeout(function() {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 1000);
}

// Make function global
window.addItemToCart = addItemToCart;
