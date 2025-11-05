const API_URL = "https://fakestoreapi.com"
let products = []
let cart = []
let wishlist = []
let balance = 1000
let bannerIndex = 0
let appliedCoupon = null
const VALID_COUPONS = {
  IIUC10: 0.1, // 10% discount
}

// Fetch Products
async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`)
    products = await res.json()
    displayProducts(products)
    loadCategories()
  } catch (err) {
    showNotification("❌ Failed to load products")
  }
}

// Load Categories
async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/products/categories`)
    const cats = await res.json()
    const select = document.getElementById("categoryFilter")
    cats.forEach((cat) => {
      const opt = document.createElement("option")
      opt.value = cat
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1)
      select.appendChild(opt)
    })
  } catch (err) {}
}

// Display Products
function displayProducts(prods) {
  const grid = document.getElementById("productsGrid")
  grid.innerHTML = ""

  prods.forEach((p, i) => {
    const inWishlist = wishlist.some((w) => w.id === p.id)
    const card = document.createElement("div")
    card.className = "bg-white rounded-xl shadow-lg card-hover overflow-hidden border-2 border-gray-100 scale-in"
    card.style.animationDelay = `${i * 0.05}s`
    card.innerHTML = `
            <div class="relative overflow-hidden bg-gray-100 h-48 flex items-center justify-center group">
                <img src="${p.image}" alt="${p.title}" class="h-40 w-40 object-contain group-hover:scale-110 transition duration-300">
                <button class="wishlist-btn absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition" data-id="${p.id}">
                    <i class="fas fa-heart text-2xl ${inWishlist ? "text-red-500" : "text-gray-300"}"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-800 line-clamp-2 mb-2">${p.title}</h3>
                <div class="flex justify-between items-center mb-3">
                    <span class="text-2xl font-black text-blue-600">${p.price.toFixed(0)} BDT</span>
                    <div class="flex items-center bg-yellow-100 px-2 py-1 rounded-lg">
                        <i class="fas fa-star text-yellow-500 text-sm"></i>
                        <span class="ml-1 font-bold text-sm">${p.rating.rate}</span>
                    </div>
                </div>
                <button class="add-to-cart w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-bold hover:shadow-lg transition" data-id="${p.id}">
                    🛒 Add to Cart
                </button>
            </div>
        `
    grid.appendChild(card)
  })

  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.currentTarget.dataset.id)
      const product = products.find((p) => p.id === id)
      const existing = cart.find((c) => c.id === id)
      if (existing) {
        existing.qty++
      } else {
        cart.push({ ...product, qty: 1 })
      }
      updateCart()
      showNotification("✅ Added to cart!")
    })
  })

  document.querySelectorAll(".wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.currentTarget.dataset.id)
      const product = products.find((p) => p.id === id)
      const idx = wishlist.findIndex((w) => w.id === id)
      const icon = e.currentTarget.querySelector("i")

      if (idx > -1) {
        wishlist.splice(idx, 1)
        icon.classList.remove("text-red-500")
        icon.classList.add("text-gray-300")
        showNotification("💔 Removed from wishlist")
      } else {
        wishlist.push(product)
        icon.classList.add("text-red-500")
        icon.classList.remove("text-gray-300")
        showNotification("❤️ Added to wishlist!")
      }
      updateWishlistCount()
    })
  })
}

// Update Cart
function updateCart() {
  document.getElementById("cartCount").textContent = cart.reduce((sum, item) => sum + item.qty, 0)

  const container = document.getElementById("cartItems")
  if (cart.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-12">Your cart is empty</p>'
    document.getElementById("cartSubtotal").textContent = "0 BDT"
    document.getElementById("cartTotal").textContent = "0 BDT"
    document.getElementById("discountRow").classList.add("hidden")
    document.getElementById("couponInput").value = ""
    appliedCoupon = null
    return
  }

  container.innerHTML = ""
  cart.forEach((item) => {
    const div = document.createElement("div")
    div.className = "flex justify-between items-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
    div.innerHTML = `
            <div class="flex-1">
                <h4 class="font-bold text-gray-800 line-clamp-2">${item.title}</h4>
                <p class="text-gray-600">${item.price.toFixed(0)} BDT × ${item.qty}</p>
            </div>
            <div class="flex items-center space-x-2">
                <button class="qty-dec px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" data-id="${item.id}">−</button>
                <span class="font-bold">${item.qty}</span>
                <button class="qty-inc px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600" data-id="${item.id}">+</button>
                <button class="remove px-3 py-1 bg-gray-300 rounded hover:bg-red-500 hover:text-white" data-id="${item.id}">🗑️</button>
            </div>
        `
    container.appendChild(div)
  })

  document.querySelectorAll(".qty-inc").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.currentTarget.dataset.id)
      const item = cart.find((c) => c.id === id)
      if (item) item.qty++
      updateCart()
    })
  })

  document.querySelectorAll(".qty-dec").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.currentTarget.dataset.id)
      const item = cart.find((c) => c.id === id)
      if (item) {
        item.qty--
        if (item.qty <= 0) cart = cart.filter((c) => c.id !== id)
      }
      updateCart()
    })
  })

  document.querySelectorAll(".remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.currentTarget.dataset.id)
      cart = cart.filter((c) => c.id !== id)
      updateCart()
    })
  })

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  document.getElementById("cartSubtotal").textContent = subtotal.toFixed(0) + " BDT"

  let total = subtotal
  if (appliedCoupon) {
    const discountPercent = VALID_COUPONS[appliedCoupon]
    const discount = subtotal * discountPercent
    document.getElementById("discountAmount").textContent = "-" + discount.toFixed(0) + " BDT"
    document.getElementById("discountRow").classList.remove("hidden")
    total = subtotal - discount
  } else {
    document.getElementById("discountRow").classList.add("hidden")
  }

  document.getElementById("cartTotal").textContent = total.toFixed(0) + " BDT"
}

// Update Wishlist Count
function updateWishlistCount() {
  document.getElementById("wishlistCount").textContent = wishlist.length
}

// Display Wishlist
function displayWishlist() {
  const container = document.getElementById("wishlistItems")
  if (wishlist.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-12">Your wishlist is empty</p>'
    return
  }

  container.innerHTML = ""
  wishlist.forEach((item) => {
    const div = document.createElement("div")
    div.className = "flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
    div.innerHTML = `
            <img src="${item.image}" class="w-20 h-20 object-contain">
            <div class="flex-1">
                <h4 class="font-bold">${item.title}</h4>
                <p class="text-blue-600 font-bold">${item.price.toFixed(0)} BDT</p>
            </div>
            <button class="remove-wish px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" data-id="${item.id}">Remove</button>
        `
    container.appendChild(div)
  })

  document.querySelectorAll(".remove-wish").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number.parseInt(e.currentTarget.dataset.id)
      wishlist = wishlist.filter((w) => w.id !== id)
      displayWishlist()
      updateWishlistCount()
      displayProducts(products)
    })
  })
}

// Event Listeners Setup
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("applyCoupon").addEventListener("click", () => {
    const couponCode = document.getElementById("couponInput").value.trim().toUpperCase()
    const messageEl = document.getElementById("couponMessage")

    if (!couponCode) {
      messageEl.className = "mt-2 text-sm text-red-600 hidden"
      messageEl.textContent = ""
      return
    }

    if (VALID_COUPONS[couponCode]) {
      appliedCoupon = couponCode
      const discount = VALID_COUPONS[couponCode] * 100
      messageEl.className = "mt-2 text-sm text-green-600"
      messageEl.textContent = `✅ Coupon applied! ${discount}% discount`
      updateCart()
      showNotification(`🎉 ${couponCode} applied! ${discount}% off your order!`)
    } else {
      appliedCoupon = null
      messageEl.className = "mt-2 text-sm text-red-600"
      messageEl.textContent = "❌ Invalid coupon code"
      document.getElementById("discountRow").classList.add("hidden")
      updateCart()
    }
  })

  // Allow Enter key to apply coupon
  document.getElementById("couponInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("applyCoupon").click()
    }
  })

  // Checkout
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    if (cart.length === 0) {
      showNotification("❌ Cart is empty!")
      return
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    let total = subtotal
    if (appliedCoupon) {
      total = subtotal * (1 - VALID_COUPONS[appliedCoupon])
    }

    if (total > balance) {
      showNotification("❌ Insufficient balance!")
      return
    }

    balance -= total
    document.getElementById("userBalance").textContent = balance.toFixed(0)
    cart = []
    appliedCoupon = null
    updateCart()
    document.getElementById("cartModal").classList.add("hidden")
    showNotification("🎉 Order placed successfully!")
  })

  // Add Money
  document.getElementById("addMoneyBtn").addEventListener("click", () => {
    document.getElementById("addMoneyModal").classList.remove("hidden")
  })

  document.getElementById("confirmAddMoney").addEventListener("click", () => {
    const amount = Number.parseInt(document.getElementById("addAmount").value)
    if (amount && amount >= 100 && amount <= 10000) {
      balance += amount
      document.getElementById("userBalance").textContent = balance.toFixed(0)
      document.getElementById("addMoneyModal").classList.add("hidden")
      document.getElementById("addAmount").value = ""
      showNotification(`✅ Added ${amount} BDT!`)
    } else {
      showNotification("❌ Invalid amount! (100-10000)")
    }
  })

  document.getElementById("cancelAddMoney").addEventListener("click", () => {
    document.getElementById("addMoneyModal").classList.add("hidden")
    document.getElementById("addAmount").value = ""
  })

  // Reviews
  async function fetchReviews() {
    try {
      const res = await fetch(`${API_URL}/products`)
      const data = await res.json()
      const names = [
        "Sarah Johnson",
        "Michael Chen",
        "Emma Williams",
        "David Rodriguez",
        "Lisa Anderson",
        "James Thompson",
      ]
      const reviews = data.slice(0, 6).map((p, i) => ({
        name: names[i],
        comment: p.description.substring(0, 100) + "...",
        rating: p.rating.rate,
      }))
      displayReviews(reviews)
    } catch (err) {}
  }

  function displayReviews(reviews) {
    const container = document.getElementById("reviewsContainer")
    container.innerHTML = ""
    reviews.forEach((r) => {
      const div = document.createElement("div")
      div.className = "bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 text-white"
      div.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold text-lg">${r.name}</h4>
                    <div class="flex text-yellow-400">
                        ${'<i class="fas fa-star"></i>'.repeat(Math.round(r.rating))}
                    </div>
                </div>
                <p class="text-gray-200">"${r.comment}"</p>
            `
      container.appendChild(div)
    })
  }

  // Banner Navigation
  document.getElementById("nextBanner").addEventListener("click", () => {
    bannerIndex = (bannerIndex + 1) % 3
    document.getElementById("bannerSlider").style.transform = `translateX(-${bannerIndex * 100}%)`
  })

  document.getElementById("prevBanner").addEventListener("click", () => {
    bannerIndex = (bannerIndex - 1 + 3) % 3
    document.getElementById("bannerSlider").style.transform = `translateX(-${bannerIndex * 100}%)`
  })

  // Auto-slide Banner
  setInterval(() => {
    bannerIndex = (bannerIndex + 1) % 3
    document.getElementById("bannerSlider").style.transform = `translateX(-${bannerIndex * 100}%)`
  }, 5000)

  // Search & Filter
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase()
    const filtered = products.filter(
      (p) => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term),
    )
    displayProducts(filtered)
  })

  document.getElementById("categoryFilter").addEventListener("change", (e) => {
    const cat = e.target.value
    const filtered = cat ? products.filter((p) => p.category === cat) : products
    displayProducts(filtered)
  })

  document.getElementById("sortFilter").addEventListener("change", (e) => {
    const sort = e.target.value
    const sorted = [...products]

    if (sort === "low-high") sorted.sort((a, b) => a.price - b.price)
    else if (sort === "high-low") sorted.sort((a, b) => b.price - a.price)
    else if (sort === "rating") sorted.sort((a, b) => b.rating.rate - a.rating.rate)

    displayProducts(sorted)
  })

  document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("searchInput").value = ""
    document.getElementById("categoryFilter").value = ""
    document.getElementById("sortFilter").value = "default"
    displayProducts(products)
  })

  // Modals
  document.getElementById("cartBtn").addEventListener("click", () => {
    document.getElementById("cartModal").classList.remove("hidden")
  })

  document.getElementById("closeCart").addEventListener("click", () => {
    document.getElementById("cartModal").classList.add("hidden")
  })

  document.getElementById("wishlistBtn").addEventListener("click", () => {
    displayWishlist()
    document.getElementById("wishlistModal").classList.remove("hidden")
  })

  document.getElementById("closeWishlist").addEventListener("click", () => {
    document.getElementById("wishlistModal").classList.add("hidden")
  })

  // Contact Form
  document.getElementById("contactForm").addEventListener("submit", (e) => {
    e.preventDefault()
    document.getElementById("contactSuccess").classList.remove("hidden")
    document.getElementById("contactForm").reset()
    setTimeout(() => {
      document.getElementById("contactSuccess").classList.add("hidden")
    }, 3000)
  })

  // Back to Top
  window.addEventListener("scroll", () => {
    const btn = document.getElementById("backToTop")
    btn.classList.toggle("hidden", window.scrollY < 300)
  })

  document.getElementById("backToTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  })

  // Initialize
  fetchProducts()
  fetchReviews()
})

// Notification
function showNotification(msg) {
  const notif = document.createElement("div")
  notif.className =
    "fixed bottom-20 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold"
  notif.textContent = msg
  document.body.appendChild(notif)
  setTimeout(() => notif.remove(), 3000)
}

window.addEventListener('load', () => {
    // Check if the popup has been shown before in this browser
    if (!localStorage.getItem('popupShown')) {
        alert('Welcome to our e-commerce site!');
        localStorage.setItem('popupShown', 'true'); // Mark as shown
    }
});
// script.js

window.addEventListener('load', () => {
    alert('অনুগ্রহপূর্বক নাম্বার বেশি দিয়ে আমাদের মন খুশি করিয়েন প্রিয় স্যার 🥲');
});