import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Minus, User } from "lucide-react";
import "./App.css"; // import the CSS file

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);

  // Auto-login from localStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (savedUser) setUser(savedUser);
    const savedProducts = JSON.parse(localStorage.getItem("products")) || [];
    setProducts(savedProducts);
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) localStorage.setItem("currentUser", JSON.stringify(user));
    else localStorage.removeItem("currentUser");
  }, [user]);

  // Update products in localStorage
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const handleAuth = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const username = form.get("username").trim();
    const name = form.get("name").trim() || username;
    const role = form.get("role");

    if (!username) {
      alert("Please enter a username");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (authMode === "signup") {
      if (users.some(u => u.username === username)) {
        alert("Username already exists!");
        return;
      }
      const newUser = { username, name, role };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      setUser(newUser);
    } else {
      const existingUser = users.find(u => u.username === username);
      if (!existingUser) {
        alert("Account not found. Please sign up.");
        return;
      }
      if (existingUser.role !== role) {
        alert(`Role mismatch! This account is a ${existingUser.role}`);
        return;
      }
      setUser(existingUser);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: { ...product, qty: (prev[product.id]?.qty || 0) + 1 },
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[id].qty === 1) delete updated[id];
      else updated[id].qty -= 1;
      return updated;
    });
  };

  const handleAddProductManual = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const newProduct = {
      id: Date.now(),
      name: form.get("name"),
      price: parseFloat(form.get("price")),
      image: form.get("image") || "https://via.placeholder.com/300",
    };
    setProducts(prev => [...prev, newProduct]);
    e.target.reset();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        const formatted = data.map((item, idx) => ({
          id: Date.now() + idx,
          name: item.name,
          price: parseFloat(item.price),
          image: item.image || "https://via.placeholder.com/300",
        }));
        setProducts(prev => [...prev, ...formatted]);
      } catch {
        alert("Invalid JSON file!");
      }
    };
    reader.readAsText(file);
  };

  const total = Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);

  if (!user) {
    return (
      <div className="auth-container">
        <form onSubmit={handleAuth} className="auth-form">
          <h2>{authMode === "login" ? "Login" : "Sign Up"}</h2>
          <input name="username" placeholder="Username" className="input-field" required />
          {authMode === "signup" && <input name="name" placeholder="Name" className="input-field" />}
          <select name="role" className="input-field" required>
            <option value="">Select Role</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
          <button className="btn-primary">{authMode === "login" ? "Login" : "Create Account"}</button>
          <p onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="auth-toggle">
            {authMode === "login" ? "No account? Sign up" : "Already have an account? Login"}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>🛒 My Shop</h1>
        <div className="header-right">
          <div className="user-menu">
            <User className="user-icon" />
            <div className="dropdown">
              {user.role === "buyer" && <button>Buyer Dashboard</button>}
              {user.role === "seller" && <button>Seller Dashboard</button>}
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
          <div className="cart-info">
            <ShoppingCart />
            <span>{Object.keys(cart).length}</span>
          </div>
        </div>
      </header>

      {user.role === "seller" && (
        <section className="seller-dashboard">
          <h2>Add Products</h2>
          <form onSubmit={handleAddProductManual} className="seller-form">
            <input name="name" placeholder="Product Name" required />
            <input name="price" type="number" step="0.01" placeholder="Price" required />
            <input name="image" placeholder="Image URL" />
            <button type="submit" className="btn-primary">Add Product</button>
          </form>
          <div className="file-upload">
            <input type="file" accept=".json" onChange={handleFileUpload} />
            <p>File format: JSON array of products [{`{name, price, image}`}]</p>
          </div>
        </section>
      )}

      <main className="products-grid">
        {products.map(product => (
          <motion.div key={product.id} whileHover={{ scale: 1.05 }} className="product-card">
            <img src={product.image} alt={product.name} />
            <h2>{product.name}</h2>
            <p>${product.price}</p>
            {user.role === "buyer" && <button className="btn-primary" onClick={() => addToCart(product)}>Add to Cart</button>}
          </motion.div>
        ))}
      </main>

      {user.role === "buyer" && (
        <section className="cart-section">
          <h2>Your Cart</h2>
          {Object.values(cart).length === 0 && <p>Cart is empty</p>}
          {Object.values(cart).map(item => (
            <div key={item.id} className="cart-item">
              <span>{item.name} (x{item.qty})</span>
              <div className="cart-buttons">
                <button onClick={() => removeFromCart(item.id)}><Minus size={16} /></button>
                <button onClick={() => addToCart(item)}><Plus size={16} /></button>
              </div>
            </div>
          ))}
          <div className="cart-total">Total: ${total.toFixed(2)}</div>
          <button className="btn-primary">Checkout</button>
        </section>
      )}
    </div>
  );
}