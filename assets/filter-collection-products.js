/*------------ GET SETTINGS ------------*/
function getSettings() {
    const container = document.getElementById('products-container');
    if (!container) {
        return {
            addToCartText: 'Add To Cart',
            outOfStockText: 'Out of Stock',
            showAddToCart: true
        };
    }
    const d = container.dataset;
    return {
        addToCartText: d.addToCartText || 'Add To Cart',
        outOfStockText: d.outOfStockText || 'Out of Stock',
        showAddToCart: d.showAddToCart === 'true'
    };
}


/*------------- GET DOM ELEMENTS - Har baar fresh select karo -------------*/
function getDOMElements() {
    return {
        productGrid: document.querySelector('.product-grid'),
    };
}


/*------------ ADD TO CART (Event Delegation) ------------*/
function setupCartButtons() {
    var dom = getDOMElements();
    var grid = dom.productGrid;
    if (!grid) return;
    grid.removeEventListener('click', cartClickHandler);
    grid.addEventListener('click', cartClickHandler);
}


/*---------- Cart Handler ------------*/ 
function cartClickHandler(e) {
    var btn = e.target.closest('.cart-btn');
    if (!btn || btn.disabled) return;
    e.preventDefault();
    e.stopPropagation();

    var variantId = btn.dataset.variantId;
    if (!variantId) return;

    var originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;

    fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items: [{ id: parseInt(variantId), quantity: 1 }]
        })
    })
    .then(function(response) {
        if (response.ok) {
            showToast('Product added to cart!', 'success');
            updateCartCount();
            btn.textContent = 'Added ✓';
            setTimeout(function() {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1500);
        } else {
            showToast('Failed to add to cart', 'error');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    })
    .catch(function() {
        showToast('Failed to add to cart', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    });
}


/*------------ Update Cart Count ----------*/ 
function updateCartCount() {
    fetch('/cart.js')
        .then(function(response) { return response.json(); })
        .then(function(cart) {
            document.querySelectorAll('.cart-count').forEach(function(el) {
                el.textContent = cart.item_count || 0;
                el.style.display = cart.item_count > 0 ? 'inline' : 'none';
            });
        })
        .catch(function() {});
}


/*------------ Show Toast Message ----------*/ 
function showToast(message, type) {
    var existing = document.querySelector('.custom-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'custom-toast ' + (type || 'success');
    toast.innerHTML = '<span>' + message + '</span><button class="toast-close">×</button>';
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);

    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.remove();
    });
}



/*------------ INITIALIZE ------------*/
function init() {
  setupCartButtons();
}


/*----- EVENTS - Page Load & Section Reload ------*/
document.addEventListener('DOMContentLoaded', function() {
    init();
});

document.addEventListener('shopify:section:load', function(event) {
    var section = event.target;
    if (section && section.querySelector('.custom-collection')) {
        setTimeout(function() {
            init();
        }, 100);
    }
});