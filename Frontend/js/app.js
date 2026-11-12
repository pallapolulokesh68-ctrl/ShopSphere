
// ============================================
// SHOPSPHERE - COMPLETE APP.JS
// ============================================

const API_URL = "http://localhost:5000/api";

// ============================================
// 1. HELPER FUNCTIONS
// ============================================

function getToken() {
    return localStorage.getItem("token");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatPrice(value) {
    return "₹" + Number(value || 0).toFixed(2);
}

// ============================================
// 2. PRODUCTS
// ============================================

let allProducts = [];

async function loadProducts() {
    const container = document.getElementById("productsContainer");
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load products.");
        }

        allProducts = data;
        displayProducts(allProducts);

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Unable to load products.</p>";
    }
}

function displayProducts(products) {
    const container = document.getElementById("productsContainer");
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = "<p>No products found.</p>";
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">

            <img
                src="${escapeHTML(product.image || 'https://placehold.co/300x200?text=ShopSphere')}"
                alt="${escapeHTML(product.name)}"
                onerror="this.onerror=null;this.src='https://placehold.co/300x200?text=No+Image'"
            >

            <h3>${escapeHTML(product.name)}</h3>

            <p>${escapeHTML(product.description)}</p>

            <p>
                <strong>Category:</strong>
                ${escapeHTML(product.category)}
            </p>

            <p class="price">${formatPrice(product.price)}</p>

            <p>Stock: ${Number(product.stock)}</p>

            <button
                onclick="addToCart('${product._id}')"
                ${Number(product.stock) <= 0 ? "disabled" : ""}>
                Add to Cart
            </button>

            <button onclick="addToWishlist('${product._id}')">
                Add to Wishlist ❤️
            </button>

        </div>
    `).join("");
}

function searchProducts() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    const search = input.value.toLowerCase().trim();

    const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
    );

    displayProducts(filtered);
}

function filterCategory(category) {
    if (category.toLowerCase() === "all") {
        displayProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
    );

    displayProducts(filtered);
}

// ============================================
// 3. REGISTRATION
// ============================================

function initializeRegister() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("registerMessage");

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (message) {
                    message.textContent =
                        data.message || "Registration failed.";
                }
                return;
            }

            alert("Registration successful! Please login.");
            window.location.href = "login.html";

        } catch (error) {
            console.error(error);

            if (message) {
                message.textContent = "Unable to register.";
            }
        }
    });
}

// ============================================
// 4. LOGIN
// ============================================

function initializeLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("loginMessage");

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (message) {
                    message.textContent =
                        data.message || "Login failed.";
                }
                return;
            }

            localStorage.setItem("token", data.token);

            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            alert("Login successful!");

            if (data.user?.role === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }

        } catch (error) {
            console.error(error);

            if (message) {
                message.textContent = "Unable to login.";
            }
        }
    });
}

// ============================================
// 5. LOGOUT
// ============================================

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("You have logged out successfully!");
    window.location.href = "login.html";
}

function adminLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("Admin logged out successfully!");
    window.location.href = "login.html";
}

// ============================================
// 6. NAVIGATION
// ============================================

function openCart() {
    window.location.href = "cart.html";
}

function openWishlist() {
    window.location.href = "wishlist.html";
}

function goToCheckout() {
    if (!getToken()) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    window.location.href = "checkout.html";
}

// ============================================
// 7. ADD TO CART
// ============================================

async function addToCart(productId) {
    const token = getToken();

    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                productId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to add product.");
            return;
        }

        alert("Product added to cart successfully!");
        loadCart();

    } catch (error) {
        console.error(error);
        alert("Unable to add product to cart.");
    }
}

// ============================================
// 8. LOAD CART
// ============================================

async function loadCart() {
    const container = document.getElementById("cartContainer");
    if (!container) return;

    const token = getToken();

    if (!token) {
        container.innerHTML = "<p>Please login to view your cart.</p>";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML =
                `<p>${escapeHTML(data.message || "Unable to load cart.")}</p>`;
            return;
        }

        displayCart(data.items || []);

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Unable to load cart.</p>";
    }
}

// ============================================
// 9. DISPLAY CART
// ============================================

function displayCart(items) {
    const container = document.getElementById("cartContainer");
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <h3>Your cart is empty!</h3>
            <button onclick="window.location.href='index.html'">
                Continue Shopping
            </button>
        `;
        return;
    }

    let total = 0;

    const cartHTML = items.map(item => {
        const product = item.product;
        if (!product) return "";

        const price = Number(product.price);
        const quantity = Number(item.quantity);
        const subtotal = price * quantity;

        total += subtotal;

        return `
            <div class="cart-item">

                <h3>${escapeHTML(product.name)}</h3>

                <p>Price: ${formatPrice(price)}</p>

                <p>
                    Quantity:
                    <input
                        type="number"
                        min="1"
                        value="${quantity}"
                        onchange="updateCartQuantity('${product._id}', this.value)"
                    >
                </p>

                <p>Subtotal: ${formatPrice(subtotal)}</p>

                <button onclick="removeCartItem('${product._id}')">
                    Remove
                </button>

            </div>
        `;
    }).join("");

    container.innerHTML = `
        ${cartHTML}

        <div class="cart-total">
            <h2>Total: ${formatPrice(total)}</h2>

            <button onclick="goToCheckout()">
                Proceed to Checkout
            </button>
        </div>
    `;
}

// ============================================
// 10. UPDATE CART QUANTITY
// ============================================

async function updateCartQuantity(productId, quantity) {
    const token = getToken();
    if (!token) return;

    const newQuantity = Number(quantity);

    if (!Number.isInteger(newQuantity) || newQuantity < 1) {
        alert("Please enter a valid quantity.");
        loadCart();
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/cart/update/${productId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to update quantity.");
            loadCart();
            return;
        }

        loadCart();

    } catch (error) {
        console.error(error);
        alert("Unable to update quantity.");
    }
}

// ============================================
// 11. REMOVE CART ITEM
// ============================================

async function removeCartItem(productId) {
    const token = getToken();
    if (!token) return;

    if (!confirm("Remove this product from your cart?")) return;

    try {
        const response = await fetch(
            `${API_URL}/cart/remove/${productId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to remove product.");
            return;
        }

        alert("Product removed successfully!");
        loadCart();

    } catch (error) {
        console.error(error);
        alert("Unable to remove product.");
    }
}

// ============================================
// 12. CHECKOUT
// ============================================

async function loadCheckout() {
    const container = document.getElementById("checkoutItems");
    if (!container) return;

    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = "<p>Unable to load checkout.</p>";
            return;
        }

        displayCheckoutSummary(data.items || []);

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Unable to load checkout.</p>";
    }
}

function displayCheckoutSummary(items) {
    const container = document.getElementById("checkoutItems");
    const totalElement = document.getElementById("checkoutTotal");

    if (!container || !totalElement) return;

    if (items.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        totalElement.textContent = formatPrice(0);
        return;
    }

    let total = 0;

    container.innerHTML = items.map(item => {
        if (!item.product) return "";

        const subtotal =
            Number(item.product.price) * Number(item.quantity);

        total += subtotal;

        return `
            <p>
                ${escapeHTML(item.product.name)}
                × ${Number(item.quantity)}
                = ${formatPrice(subtotal)}
            </p>
        `;
    }).join("");

    totalElement.textContent = formatPrice(total);
}

function initializeCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            alert("Please login first!");
            window.location.href = "login.html";
            return;
        }

        const shippingAddress = {
            fullName: document.getElementById("fullName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            pincode: document.getElementById("pincode").value.trim()
        };

        const message = document.getElementById("checkoutMessage");

        const submitButton = form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${API_URL}/orders/place`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(shippingAddress)
            });

            const data = await response.json();

            if (!response.ok) {
                if (message) {
                    message.textContent =
                        data.message || "Order placement failed.";
                } else {
                    alert(data.message || "Order placement failed.");
                }
                return;
            }

            alert("Your order has been placed successfully!");
            window.location.href = "my-orders.html";

        } catch (error) {
            console.error(error);

            if (message) {
                message.textContent = "Unable to place order.";
            } else {
                alert("Unable to place order.");
            }

        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// ============================================
// 13. MY ORDERS
// ============================================

async function loadMyOrders() {
    const container = document.getElementById("ordersContainer");
    if (!container) return;

    const token = getToken();

    if (!token) {
        container.innerHTML = `
            <p>Please login to view your orders.</p>
            <button onclick="window.location.href='login.html'">
                Login
            </button>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/my-orders`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML =
                `<p>${escapeHTML(data.message || "Unable to load orders.")}</p>`;
            return;
        }

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `
                <h3>No orders found!</h3>
                <p>You haven't placed any orders yet.</p>
                <button onclick="window.location.href='index.html'">
                    Continue Shopping
                </button>
            `;
            return;
        }

        container.innerHTML = data.map(order => `
            <div class="order-card">

                <h3>Order #${escapeHTML(order._id)}</h3>

                <p>
                    <strong>Order Date:</strong>
                    ${new Date(order.createdAt).toLocaleDateString()}
                </p>

                <p>
                    <strong>Order Status:</strong>
                    ${escapeHTML(order.orderStatus)}
                </p>

                <p>
                    <strong>Payment Method:</strong>
                    ${escapeHTML(order.paymentMethod)}
                </p>

                <p>
                    <strong>Payment Status:</strong>
                    ${escapeHTML(order.paymentStatus)}
                </p>

                <h4>Products</h4>

                <ul>
                    ${(order.items || []).map(item => `
                        <li>
                            ${escapeHTML(item.name)}
                            — Quantity: ${Number(item.quantity)}
                            — ${formatPrice(item.price)}
                        </li>
                    `).join("")}
                </ul>

                <h3>Total: ${formatPrice(order.totalAmount)}</h3>

                <div class="shipping-details">
                    <h4>Delivery Address</h4>
                    <p>${escapeHTML(order.shippingAddress?.fullName)}</p>
                    <p>${escapeHTML(order.shippingAddress?.phone)}</p>
                    <p>${escapeHTML(order.shippingAddress?.address)}</p>
                    <p>
                        ${escapeHTML(order.shippingAddress?.city)}
                        - ${escapeHTML(order.shippingAddress?.pincode)}
                    </p>
                </div>

            </div>
        `).join("");

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Unable to load orders.</p>";
    }
}

// ============================================
// 14. WISHLIST
// ============================================

async function addToWishlist(productId) {
    const token = getToken();

    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/wishlist/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to add to wishlist.");
            return;
        }

        alert("Product added to wishlist successfully!");
        loadWishlist();

    } catch (error) {
        console.error(error);
        alert("Unable to add product to wishlist.");
    }
}

async function loadWishlist() {
    const container = document.getElementById("wishlistContainer");
    if (!container) return;

    const token = getToken();

    if (!token) {
        container.innerHTML = `
            <p>Please login to view your wishlist.</p>
            <button onclick="window.location.href='login.html'">
                Login
            </button>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/wishlist`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            container.innerHTML =
                `<p>${escapeHTML(data.message || "Unable to load wishlist.")}</p>`;
            return;
        }

        const products = data.products || [];

        if (products.length === 0) {
            container.innerHTML = `
                <div class="order-card">
                    <h3>Your wishlist is empty! ❤️</h3>
                    <p>Add your favourite products here.</p>
                    <button onclick="window.location.href='index.html'">
                        Continue Shopping
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="product-grid">

                ${products.filter(Boolean).map(product => `
                    <div class="product-card">

                        <img
                            src="${escapeHTML(product.image || 'https://placehold.co/300x200?text=ShopSphere')}"
                            alt="${escapeHTML(product.name)}"
                            onerror="this.onerror=null;this.src='https://placehold.co/300x200?text=No+Image'"
                        >

                        <h3>${escapeHTML(product.name)}</h3>

                        <p>${escapeHTML(product.description)}</p>

                        <p class="price">${formatPrice(product.price)}</p>

                        <p>Stock: ${Number(product.stock)}</p>

                        <button onclick="addToCart('${product._id}')">
                            Add to Cart
                        </button>

                        <button
                            style="background:#dc2626"
                            onclick="removeWishlistItem('${product._id}')">
                            Remove ❤️
                        </button>

                    </div>
                `).join("")}

            </div>
        `;

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Unable to load wishlist.</p>";
    }
}

async function removeWishlistItem(productId) {
    const token = getToken();

    if (!token) {
        alert("Please login first!");
        return;
    }

    if (!confirm("Remove this product from your wishlist?")) return;

    try {
        const response = await fetch(
            `${API_URL}/wishlist/remove/${productId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to remove product.");
            return;
        }

        alert("Product removed from wishlist!");
        loadWishlist();

    } catch (error) {
        console.error(error);
        alert("Unable to remove wishlist product.");
    }
}

// ============================================
// 15. ADMIN DASHBOARD
// ============================================

async function loadAdminDashboard() {
    const productsElement = document.getElementById("totalProducts");
    if (!productsElement) return;

    const message = document.getElementById("adminMessage");
    const token = getToken();

    if (!token) {
        alert("Please login as administrator.");
        window.location.href = "login.html";
        return;
    }

    try {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            throw new Error(userData.message || "Authentication failed.");
        }

        if (userData.role !== "admin") {
            alert("Access denied. Admin only!");
            window.location.href = "index.html";
            return;
        }

        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load dashboard.");
        }

        document.getElementById("totalProducts").textContent =
            data.totalProducts;

        document.getElementById("totalOrders").textContent =
            data.totalOrders;

        document.getElementById("totalUsers").textContent =
            data.totalUsers;

        if (message) {
            message.textContent = "Dashboard loaded successfully!";
        }

    } catch (error) {
        console.error(error);
        if (message) message.textContent = error.message;
    }
}

// ============================================
// 16. ADMIN PRODUCT MANAGEMENT
// ============================================

async function loadAdminProducts() {
    const container = document.getElementById("adminProductsContainer");
    if (!container) return;

    const token = getToken();

    if (!token) {
        container.innerHTML = "<p>Please login as administrator.</p>";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        if (!response.ok) {
            throw new Error(products.message || "Unable to load products.");
        }

        if (!Array.isArray(products) || products.length === 0) {
            container.innerHTML = "<p>No products available.</p>";
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="admin-product-card">

                <img
                    src="${escapeHTML(product.image || 'https://placehold.co/200x150?text=Product')}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.onerror=null;this.src='https://placehold.co/200x150?text=No+Image'"
                >

                <div class="admin-product-info">

                    <h3>${escapeHTML(product.name)}</h3>

                    <p>${escapeHTML(product.description)}</p>

                    <p><strong>Category:</strong>
                        ${escapeHTML(product.category)}
                    </p>

                    <p><strong>Price:</strong>
                        ${formatPrice(product.price)}
                    </p>

                    <p><strong>Stock:</strong>
                        ${Number(product.stock)}
                    </p>

                    <div class="admin-product-buttons">

                        <button onclick="editAdminProduct('${product._id}')">
                            Edit
                        </button>

                        <button
                            class="admin-delete-btn"
                            onclick="deleteAdminProduct('${product._id}')">
                            Delete
                        </button>

                    </div>
                </div>
            </div>
        `).join("");

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
    }
}

function initializeAdminProductForm() {
    const form = document.getElementById("adminProductForm");
    if (!form) return;

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            alert("Please login as administrator!");
            return;
        }

        const productId = document.getElementById("editProductId").value;

        const product = {
            name: document.getElementById("productName").value.trim(),
            description: document.getElementById("productDescription").value.trim(),
            price: Number(document.getElementById("productPrice").value),
            category: document.getElementById("productCategory").value,
            image: document.getElementById("productImage").value.trim(),
            stock: Number(document.getElementById("productStock").value)
        };

        if (
            !product.name ||
            !product.description ||
            !product.category ||
            !Number.isFinite(product.price) ||
            product.price <= 0 ||
            !Number.isInteger(product.stock) ||
            product.stock < 0
        ) {
            alert("Please enter valid product details.");
            return;
        }

        const url = productId
            ? `${API_URL}/products/${productId}`
            : `${API_URL}/products`;

        const method = productId ? "PUT" : "POST";

        const submitButton = form.querySelector("button[type='submit']");

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(product)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save product.");
            }

            alert(productId
                ? "Product updated successfully!"
                : "Product added successfully!");

            form.reset();

            document.getElementById("editProductId").value = "";
            document.getElementById("productFormTitle").textContent =
                "Add New Product";

            document.getElementById("cancelEditBtn").style.display = "none";

            if (submitButton) {
                submitButton.textContent = "Save Product";
            }

            await loadAdminProducts();

        } catch (error) {
            console.error(error);
            alert(error.message);

        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

async function editAdminProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const product = await response.json();

        if (!response.ok) {
            alert(product.message || "Unable to fetch product.");
            return;
        }

        document.getElementById("editProductId").value = product._id;
        document.getElementById("productName").value = product.name;
        document.getElementById("productDescription").value = product.description;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productCategory").value = product.category;
        document.getElementById("productImage").value = product.image || "";
        document.getElementById("productStock").value = product.stock;

        document.getElementById("productFormTitle").textContent = "Edit Product";
        document.getElementById("cancelEditBtn").style.display = "inline-block";

        document.querySelector(
            "#adminProductForm button[type='submit']"
        ).textContent = "Update Product";

        window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
        console.error(error);
        alert("Unable to edit product.");
    }
}

function cancelProductEdit() {
    const form = document.getElementById("adminProductForm");
    if (!form) return;

    form.reset();

    document.getElementById("editProductId").value = "";
    document.getElementById("productFormTitle").textContent = "Add New Product";
    document.getElementById("cancelEditBtn").style.display = "none";

    document.querySelector(
        "#adminProductForm button[type='submit']"
    ).textContent = "Save Product";
}

async function deleteAdminProduct(productId) {
    const token = getToken();

    if (!token) {
        alert("Please login as administrator.");
        return;
    }

    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to delete product.");
            return;
        }

        alert("Product deleted successfully!");
        await loadAdminProducts();

    } catch (error) {
        console.error(error);
        alert("Unable to delete product.");
    }
}

// ============================================
// 17. ADMIN MANAGE ORDERS
// ============================================

let allAdminOrders = [];

// LOAD ALL ORDERS

async function loadAdminOrders() {
    const container = document.getElementById("adminOrdersContainer");
    if (!container) return;

    const token = getToken();

    if (!token) {
        container.innerHTML = "<p>Please login as administrator.</p>";
        return;
    }

    container.innerHTML = "<p>Loading orders...</p>";

    try {
        const response = await fetch(`${API_URL}/admin/orders`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load orders.");
        }

        if (!Array.isArray(data)) {
            throw new Error("Unexpected response from orders API.");
        }

        allAdminOrders = data;

        console.log("Orders received from backend:", allAdminOrders);

        filterAdminOrders();

    } catch (error) {
        console.error("Order loading error:", error);

        container.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;
    }
}

// FILTER ORDERS - FIXED

function filterAdminOrders() {
    const filter = document.getElementById("orderStatusFilter");

    const selectedStatus = filter
        ? filter.value.trim()
        : "All";

    const filteredOrders =
        selectedStatus === "All" ||
        selectedStatus === "All Orders" ||
        selectedStatus === ""
            ? allAdminOrders
            : allAdminOrders.filter(order =>
                order.orderStatus === selectedStatus
            );

    displayAdminOrders(filteredOrders);
}

// DISPLAY ORDERS

function displayAdminOrders(orders) {
    const container = document.getElementById("adminOrdersContainer");
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="order-card">
                <h3>No orders found!</h3>
                <p>There are no orders for this status.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {

        const currentStatus = order.orderStatus;

        const isFinal =
            currentStatus === "Delivered" ||
            currentStatus === "Cancelled";

        return `
            <div class="admin-order-card">

                <div class="admin-order-header">

                    <h3>Order #${escapeHTML(order._id)}</h3>

                    <span class="order-status-badge">
                        ${escapeHTML(currentStatus)}
                    </span>

                </div>

                <div class="admin-order-details">

                    <h4>Customer Details</h4>

                    <p>
                        <strong>Name:</strong>
                        ${escapeHTML(order.user?.name || "Customer")}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(order.user?.email || "Not available")}
                    </p>

                    <h4>Order Information</h4>

                    <p>
                        <strong>Order Date:</strong>
                        ${new Date(order.createdAt).toLocaleDateString()}
                    </p>

                    <p>
                        <strong>Payment Method:</strong>
                        ${escapeHTML(order.paymentMethod)}
                    </p>

                    <p>
                        <strong>Payment Status:</strong>
                        ${escapeHTML(order.paymentStatus)}
                    </p>

                    <h4>Products</h4>

                    <ul>
                        ${(order.items || []).map(item => `
                            <li>
                                ${escapeHTML(item.name)}
                                — Quantity: ${Number(item.quantity)}
                                — ${formatPrice(item.price)}
                            </li>
                        `).join("")}
                    </ul>

                    <h3 class="admin-order-total">
                        Total: ${formatPrice(order.totalAmount)}
                    </h3>

                    <h4>Delivery Address</h4>

                    <p>${escapeHTML(order.shippingAddress?.fullName)}</p>
                    <p>${escapeHTML(order.shippingAddress?.phone)}</p>
                    <p>${escapeHTML(order.shippingAddress?.address)}</p>

                    <p>
                        ${escapeHTML(order.shippingAddress?.city)}
                        - ${escapeHTML(order.shippingAddress?.pincode)}
                    </p>

                </div>

                <div class="admin-order-update">

                    ${
                        isFinal
                        ? `<p>This order is ${escapeHTML(currentStatus)}. Its status cannot be changed.</p>`
                        : `
                            <label for="status-${order._id}">
                                Update Order Status
                            </label>

                            <select id="status-${order._id}">

                                <option value="Processing"
                                    ${currentStatus === "Processing" ? "selected" : ""}>
                                    Processing
                                </option>

                                <option value="Shipped"
                                    ${currentStatus === "Shipped" ? "selected" : ""}>
                                    Shipped
                                </option>

                                <option value="Delivered">
                                    Delivered
                                </option>

                                <option value="Cancelled">
                                    Cancelled
                                </option>

                            </select>

                            <button
                                onclick="updateAdminOrderStatus('${order._id}')">
                                Update Status
                            </button>
                        `
                    }

                </div>

            </div>
        `;
    }).join("");
}

// UPDATE ORDER STATUS - CORRECT BACKEND FIELD

async function updateAdminOrderStatus(orderId) {
    const token = getToken();

    if (!token) {
        alert("Please login as administrator.");
        return;
    }

    const statusElement = document.getElementById(`status-${orderId}`);
    if (!statusElement) return;

    const newStatus = statusElement.value;

    const allowedStatuses = [
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];

    if (!allowedStatuses.includes(newStatus)) {
        alert("Please select a valid order status.");
        return;
    }

    if (!confirm(`Change order status to ${newStatus}?`)) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/admin/orders/${orderId}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    orderStatus: newStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to update order status.");
            return;
        }

        alert("Order status updated successfully!");

        await loadAdminOrders();

    } catch (error) {
        console.error(error);
        alert("Unable to update order status.");
    }
}

// ============================================
// 18. INITIALIZE ALL PAGES
// ============================================

document.addEventListener("DOMContentLoaded", function() {

    loadProducts();
    loadCart();
    loadCheckout();
    loadMyOrders();
    loadWishlist();

    initializeLogin();
    initializeRegister();
    initializeCheckout();

    loadAdminDashboard();

    initializeAdminProductForm();
    loadAdminProducts();

    loadAdminOrders();

});
