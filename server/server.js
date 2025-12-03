const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const connection = require('./database');

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../Frontend')));

// Parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SIGNUP route
app.post('/signup', function(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields required' });
    }

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    connection.query(sql, [name, email, password], function(err, result) {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Email already exists!" });
            }
            return res.status(500).json({ message: "Database error: " + err });
        }
        res.json({ message: "User registered successfully!", user_id: result.insertId });
    });
});

// LOGIN route
app.post('/login', function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    connection.query(sql, [email, password], function(err, results) {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length > 0) {
            const userId = results[0].user_id || results[0].id;
            res.json({ message: "Login successful!", user_id: userId });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    });
});

// ADMIN LOGIN
app.post('/adminlogin', function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const sql = "SELECT * FROM admin WHERE admin_email = ? AND admin_password = ?";
    
    connection.query(sql, [email, password], function(err, results) {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length > 0) {
            res.json({ message: "Login successful!", admin_id: results[0].admin_id });
        } else {
            res.status(401).json({ message: "Invalid Credentials" });
        }
    });
});

// DELIVERY LOGIN
app.post('/deliverylogin', function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const sql = "SELECT * FROM delivery WHERE delivery_email = ? AND delivery_password = ?";
    
    connection.query(sql, [email, password], function(err, results) {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length > 0) {
            res.json({ message: "Login successful!", delivery_id: results[0].delivery_id });
        } else {
            res.status(401).json({ message: "Invalid Credentials" });
        }
    });
});

// ADD restaurant
app.post('/restaurants', function(req, res) {
    const name = req.body.name;
    const image = req.body.image;
    const description = req.body.description;
    const delivery_time = req.body.delivery_time;
    const delivery_price = req.body.delivery_price;

    const sql = "INSERT INTO restaurants (restaurant_name, restaurant_image, description, delivery_time, delivery_price) VALUES (?, ?, ?, ?, ?)";
    connection.query(sql, [name, image, description, delivery_time, delivery_price], function(err) {
        if (err) return res.status(500).send("Database error");
        res.send("Restaurant added!");
    });
});

// GET all restaurants
app.get('/restaurants', function(req, res) {
    connection.query("SELECT * FROM restaurants", function(err, results) {
        if (err) return res.status(500).send("Database error");
        res.json(results);
    });
});

// GET single restaurant
app.get('/restaurants/:id', function(req, res) {
    const id = req.params.id;
    connection.query("SELECT * FROM restaurants WHERE restaurant_id = ?", [id], function(err, results) {
        if (err) return res.status(500).send("Database error");
        if (results.length === 0) return res.status(404).send("Restaurant not found");
        res.json(results[0]);
    });
});

// UPDATE restaurant
app.put('/restaurants/:id', function(req, res) {
    const id = req.params.id;
    const name = req.body.name;
    const image = req.body.image;
    const description = req.body.description;
    const delivery_time = req.body.delivery_time;
    const delivery_price = req.body.delivery_price;
    
    const sql = "UPDATE restaurants SET restaurant_name = ?, restaurant_image = ?, description = ?, delivery_time = ?, delivery_price = ? WHERE restaurant_id = ?";
    
    connection.query(sql, [name, image, description, delivery_time, delivery_price, id], function(err) {
        if (err) return res.status(500).send("Database error");
        res.send("Restaurant updated!");
    });
});

// DELETE restaurant
app.delete('/restaurants/:id', function(req, res) {
    const id = req.params.id;
    
    connection.query("DELETE FROM order_items WHERE menu_item_id IN (SELECT menu_item_id FROM menu_items WHERE restaurant_id = ?)", [id], function(err) {
        if (err) return res.status(500).send("Database error");
        
        connection.query("DELETE FROM orders WHERE restaurant_id = ?", [id], function(err) {
            if (err) return res.status(500).send("Database error");
            
            connection.query("DELETE FROM menu_items WHERE restaurant_id = ?", [id], function(err) {
                if (err) return res.status(500).send("Database error");
                
                connection.query("DELETE FROM categories WHERE restaurant_id = ?", [id], function(err) {
                    if (err) return res.status(500).send("Database error");
                    
                    connection.query("DELETE FROM restaurants WHERE restaurant_id = ?", [id], function(err) {
                        if (err) return res.status(500).send("Database error");
                        res.send("Restaurant deleted!");
                    });
                });
            });
        });
    });
});

// GET menu items for a restaurant
app.get('/menu/:id', function(req, res) {
    const id = req.params.id;
    connection.query("SELECT * FROM menu_items WHERE restaurant_id = ?", [id], function(err, results) {
        if (err) return res.status(500).send("Database error");
        res.json(results);
    });
});

// GET single menu item
app.get('/menu/item/:id', function(req, res) {
    const id = req.params.id;
    connection.query("SELECT * FROM menu_items WHERE menu_item_id = ?", [id], function(err, results) {
        if (err) return res.status(500).send("Database error");
        if (results.length === 0) return res.status(404).send("Menu item not found");
        res.json(results[0]);
    });
});

// ADD menu item
app.post('/menu', function(req, res) {
    const restaurant_id = req.body.restaurant_id;
    const item_name = req.body.item_name;
    const description = req.body.description;
    const image = req.body.image;
    const price = req.body.price;
    const category_id = req.body.category_id;
    
    if (!restaurant_id || !item_name || price === undefined) {
        return res.status(400).json({ message: "Restaurant ID, item name, and price are required" });
    }
    
    const sql = "INSERT INTO menu_items (restaurant_id, category_id, item_name, description, price, image) VALUES (?, ?, ?, ?, ?, ?)";
    
    connection.query(sql, [restaurant_id, category_id || null, item_name, description || null, price, image || null], function(err, result) {
        if (err) {
            return res.status(500).json({ message: "Database error: " + err.message });
        }
        res.json({ message: "Menu item added!", menu_item_id: result.insertId });
    });
});

// UPDATE menu item
app.put('/menu/:id', function(req, res) {
    const id = req.params.id;
    const item_name = req.body.item_name;
    const description = req.body.description;
    const image = req.body.image;
    const price = req.body.price;
    const category_id = req.body.category_id;
    
    if (!item_name || price === undefined) {
        return res.status(400).json({ message: "Item name and price are required" });
    }
    
    const sql = "UPDATE menu_items SET item_name = ?, description = ?, image = ?, price = ?, category_id = ? WHERE menu_item_id = ?";
    
    connection.query(sql, [item_name, description || null, image || null, price, category_id || null, id], function(err) {
        if (err) {
            return res.status(500).json({ message: "Database error: " + err.message });
        }
        res.json({ message: "Menu item updated!" });
    });
});

// DELETE menu item
app.delete('/menu/:id', function(req, res) {
    const id = req.params.id;
    connection.query("DELETE FROM menu_items WHERE menu_item_id = ?", [id], function(err) {
        if (err) return res.status(500).send("Database error");
        res.send("Menu item deleted!");
    });
});

// CREATE order
app.post('/orders', function(req, res) {
    const user_id = req.body.user_id;
    const restaurant_id = req.body.restaurant_id;
    const items = req.body.items;
    const total_price = req.body.total_price;
    const delivery_address = req.body.delivery_address;
    
    // Get delivery price from restaurant
    connection.query('SELECT delivery_price FROM restaurants WHERE restaurant_id = ?', [restaurant_id], function(err, results) {
        if (err || !results || results.length === 0) {
            return res.status(500).json({ message: "Could not get delivery price" });
        }
        
        const deliveryPrice = parseFloat(results[0].delivery_price) || 20;
        const itemsTotal = parseFloat(total_price) || 0;
        const finalTotal = itemsTotal + deliveryPrice;
        
        // Create order
        const orderSql = "INSERT INTO orders (user_id, restaurant_id, total_price, status, delivery_address, created_at) VALUES (?, ?, ?, 'pending', ?, NOW())";
        connection.query(orderSql, [user_id, restaurant_id, finalTotal, delivery_address || 'Not specified'], function(err, result) {
            if (err) return res.status(500).json({ message: "Database error: " + err.message });
            
            const orderId = result.insertId;
            let completed = 0;
            let hasError = false;
            
            for (let i = 0; i < items.length; i++) {
                connection.query('INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)', 
                    [orderId, items[i].item_id, items[i].quantity, items[i].price], 
                    function(err) {
                        if (err && !hasError) {
                            hasError = true;
                            return res.status(500).json({ message: "Error creating order items" });
                        }
                        completed++;
                        if (completed === items.length && !hasError) {
                            res.json({ order_id: orderId, message: "Order created successfully!" });
                        }
                    }
                );
            }
        });
    });
});

// GET user orders
app.get('/orders/user/:id', function(req, res) {
    const userId = req.params.id;
    
    const sql = "SELECT o.*, r.restaurant_name, GROUP_CONCAT(CONCAT(m.item_name, '|', oi.quantity, '|', oi.price) SEPARATOR '||') as items_data FROM orders o LEFT JOIN restaurants r ON o.restaurant_id = r.restaurant_id LEFT JOIN order_items oi ON o.order_id = oi.order_id LEFT JOIN menu_items m ON oi.menu_item_id = m.menu_item_id WHERE o.user_id = ? GROUP BY o.order_id ORDER BY o.created_at DESC";
    
    connection.query(sql, [userId], function(err, results) {
        if (err) return res.status(500).send("Database error");
        
        const orders = [];
        for (let i = 0; i < results.length; i++) {
            const order = results[i];
            const items = [];
            if (order.items_data) {
                const itemGroups = order.items_data.split('||');
                for (let j = 0; j < itemGroups.length; j++) {
                    const parts = itemGroups[j].split('|');
                    items.push({ item_name: parts[0], quantity: parseInt(parts[1]), price: parseFloat(parts[2]) });
                }
            }
            orders.push({ ...order, items });
        }
        
        res.json(orders);
    });
});

// GET available orders for delivery
app.get('/delivery/orders/available', function(req, res) {
    const sql = "SELECT o.*, r.restaurant_name, r.delivery_price as restaurant_delivery_price, u.name as user_name, GROUP_CONCAT(CONCAT(m.item_name, '|', oi.quantity, '|', oi.price) SEPARATOR '||') as items_data FROM orders o LEFT JOIN restaurants r ON o.restaurant_id = r.restaurant_id LEFT JOIN users u ON o.user_id = u.id LEFT JOIN order_items oi ON o.order_id = oi.order_id LEFT JOIN menu_items m ON oi.menu_item_id = m.menu_item_id WHERE (o.delivery_id IS NULL OR o.delivery_id = 0) AND o.status = 'pending' GROUP BY o.order_id ORDER BY o.created_at DESC";
    
    connection.query(sql, function(err, results) {
        if (err) {
            return res.status(500).json({ message: "Database error: " + err.message });
        }
        
        const orders = [];
        for (let i = 0; i < results.length; i++) {
            const order = results[i];
            const items = [];
            if (order.items_data) {
                const itemGroups = order.items_data.split('||');
                for (let j = 0; j < itemGroups.length; j++) {
                    const parts = itemGroups[j].split('|');
                    items.push({ item_name: parts[0], quantity: parseInt(parts[1]), price: parseFloat(parts[2]) });
                }
            }
            orders.push({ ...order, items });
        }
        
        res.json(orders);
    });
});

// GET deliveries for delivery person
app.get('/delivery/orders/:id', function(req, res) {
    const deliveryId = req.params.id;
    
    const sql = "SELECT o.*, r.restaurant_name, r.delivery_price as restaurant_delivery_price, u.name as user_name, GROUP_CONCAT(CONCAT(m.item_name, '|', oi.quantity, '|', oi.price) SEPARATOR '||') as items_data FROM orders o LEFT JOIN restaurants r ON o.restaurant_id = r.restaurant_id LEFT JOIN users u ON o.user_id = u.id LEFT JOIN order_items oi ON o.order_id = oi.order_id LEFT JOIN menu_items m ON oi.menu_item_id = m.menu_item_id WHERE o.delivery_id = ? GROUP BY o.order_id ORDER BY o.created_at DESC";
    
    connection.query(sql, [deliveryId], function(err, results) {
        if (err) {
            return res.status(500).json({ message: "Database error: " + err.message });
        }
        
        const deliveries = [];
        for (let i = 0; i < results.length; i++) {
            const delivery = results[i];
            const items = [];
            if (delivery.items_data) {
                const itemGroups = delivery.items_data.split('||');
                for (let j = 0; j < itemGroups.length; j++) {
                    const parts = itemGroups[j].split('|');
                    items.push({ item_name: parts[0], quantity: parseInt(parts[1]), price: parseFloat(parts[2]) });
                }
            }
            deliveries.push({ ...delivery, items });
        }
        
        res.json(deliveries);
    });
});

// POST - Accept an order
app.post('/delivery/orders/:id/accept', function(req, res) {
    const orderId = req.params.id;
    const delivery_id = req.body.delivery_id;
    
    if (!delivery_id) {
        return res.status(400).json({ message: "delivery_id is required" });
    }
    
    const checkSql = "SELECT delivery_id, status FROM orders WHERE order_id = ?";
    connection.query(checkSql, [orderId], function(err, results) {
        if (err) {
            return res.status(500).json({ message: "Database error: " + err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        const order = results[0];
        if (order.delivery_id && order.delivery_id != 0 && order.delivery_id != delivery_id) {
            return res.status(400).json({ message: "Order is already assigned to another delivery person" });
        }
        
        const updateSql = "UPDATE orders SET delivery_id = ?, status = 'accepted' WHERE order_id = ? AND (delivery_id IS NULL OR delivery_id = 0)";
        
        connection.query(updateSql, [delivery_id, orderId], function(err) {
            if (err) {
                return res.status(500).json({ message: "Database error: " + err.message });
            }
            res.json({ message: "Order accepted successfully!", order_id: orderId });
        });
    });
});

// UPDATE delivery status
app.put('/delivery/orders/:id/status', function(req, res) {
    const orderId = req.params.id;
    const status = req.body.status;
    const delivery_id = req.body.delivery_id;
    
    connection.query('SELECT delivery_id, status FROM orders WHERE order_id = ?', [orderId], function(err, results) {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length === 0) return res.status(404).json({ message: "Order not found" });
        
        const order = results[0];
        if (order.delivery_id != delivery_id) {
            return res.status(403).json({ message: "Order not assigned to you" });
        }
        
        const newStatus = status.toLowerCase().replace(/[\s-]/g, '_');
        connection.query('UPDATE orders SET status = ? WHERE order_id = ?', [newStatus, orderId], function(err) {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json({ message: "Status updated!" });
        });
    });
});

// GET admin statistics
app.get('/admin/statistics', function(req, res) {
    const stats = { totalRestaurants: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 };
    let done = 0;
    
    connection.query("SELECT COUNT(*) as count FROM restaurants", function(err, results) {
        if (!err && results[0]) stats.totalRestaurants = results[0].count;
        done++;
        if (done === 4) res.json(stats);
    });
    
    connection.query("SELECT COUNT(*) as count FROM orders", function(err, results) {
        if (!err && results[0]) stats.totalOrders = results[0].count;
        done++;
        if (done === 4) res.json(stats);
    });
    
    connection.query("SELECT SUM(total_price) as total FROM orders WHERE status = 'delivered'", function(err, results) {
        if (!err && results[0] && results[0].total) stats.totalRevenue = parseFloat(results[0].total);
        done++;
        if (done === 4) res.json(stats);
    });
    
    connection.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'", function(err, results) {
        if (!err && results[0]) stats.pendingOrders = results[0].count;
        done++;
        if (done === 4) res.json(stats);
    });
});

app.listen(3000, function() {
    console.log("Server running on http://localhost:3000");
});
