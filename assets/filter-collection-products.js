/*-------- GLOBAL STATE --------*/
let allProducts = [];
let products = [];
let originalProducts = [];
let currentPage = 1;

const filters = {
    search: '',
    sort: '',
    vendor: [],
    stock: '',
    price: { min: 0, max: 999999 }
};

const defaultCollection = window.location.pathname.split('/').pop();

/*------------ 1. GET SETTINGS ------------*/
function getSettings() {
    const container = document.getElementById('products-container');
    if (!container) {
        return {
            productsPerPage: 8,
            addToCartText: 'Add To Cart',
            outOfStockText: 'Out of Stock',
            showVendor: true,
            showComparePrice: true,
            showRating: true,
            showSaleBadge: true,
            showAddToCart: true
        };
    }
    const d = container.dataset;
    return {
        productsPerPage: Number(d.productsPerPage) || 8,
        addToCartText: d.addToCartText || 'Add To Cart',
        outOfStockText: d.outOfStockText || 'Out of Stock',
        showVendor: d.showVendor === 'true',
        showComparePrice: d.showComparePrice === 'true',
        showRating: d.showRating === 'true',
        showSaleBadge: d.showSaleBadge === 'true',
        showAddToCart: d.showAddToCart === 'true'
    };
}


/*------------- 2. GET DOM ELEMENTS - Har baar fresh select karo -------------*/
function getDOMElements() {
    return {
        seachFilter: document.querySelector('.search-filter'),
        sortFilter: document.querySelector('.sort-filter'),
        vendorFilters: document.querySelectorAll('.vendor-filter'),
        stockFilters: document.querySelectorAll('.stock-availability-filter'),
        priceSlider: document.querySelector('.price-slider'),
        priceMinInput: document.querySelector('.price-min-input'),
        priceMinDisplay: document.querySelector('.price-min'),
        priceMaxDisplay: document.querySelector('.price-max'),
        clearFiltersBtn: document.querySelector('.clear-filters-btn'),
        productCount: document.getElementById('product-count'),
        productGrid: document.querySelector('.product-grid'),
        paginationWrapper: document.querySelector('.pagination-wrapper'),
    };
}



/*------------- 3. PRICE RANGE SETUP -------------*/
function setupPriceRange(productList, dom) {
    const { priceSlider, priceMinInput, priceMinDisplay, priceMaxDisplay } = dom;
    if (!priceSlider || !priceMinInput) return;

    //---- store price of every products ----
    const prices = productList.map(function(p) {
        return Number(p.variants[0].price) || 0;
    });

    // console.log("Print Price : ", prices);
    
    const minPrice = Math.floor(Math.min.apply(null, prices));
    const maxPrice = Math.ceil(Math.max.apply(null, prices));

    priceMinInput.min = minPrice;
    priceMinInput.max = maxPrice;
    priceMinInput.value = minPrice;

    priceSlider.min = minPrice;
    priceSlider.max = maxPrice;
    priceSlider.value = maxPrice;

    filters.price.min = minPrice;
    filters.price.max = maxPrice;

    if (priceMinDisplay) priceMinDisplay.textContent = '₹' + minPrice;
    if (priceMaxDisplay) priceMaxDisplay.textContent = '₹' + maxPrice;
}


/*----------- 4. RENDER PRODUCTS -----------*/
function renderProducts(productList) {
    const dom = getDOMElements();
    const settings = getSettings();
    const grid = dom.productGrid;
    if (!grid) return;

    grid.innerHTML = '';
    setupPriceRange(productList, dom);

    productList.forEach(function(product) {
        const variant = product.variants[0];
        const imageSrc = product.images[0]?.src || '';
        const comparePrice = variant.compare_at_price ? variant.compare_at_price : null;
        const price = variant.price ? variant.price : 0;
        const available = variant.available;

        //---- Check if product is on sale ----
        var isOnSale = false;
        if (comparePrice && price < comparePrice) {
            isOnSale = true;
        }

        var card = document.createElement('article');
        card.className = 'product-card';
        card.dataset.title = product.title.toLowerCase();
        card.dataset.price = Number(price) || 0;
        card.dataset.stock = available ? 'true' : 'false';
        card.dataset.vendor = product.vendor ? product.vendor.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
        card.dataset.created = new Date(product.created_at).getTime();
        card.dataset.variantId = variant.id;
        card.dataset.filteredOut = 'false';
        card.dataset.productHandle = product.handle;

        // ----- BADGES -----
        var badgesHTML = '';
        if (settings.showSaleBadge && isOnSale) {
            badgesHTML += '<span class="sale-badge">SALE</span>';
        }
        if (!available) {
            badgesHTML += '<span class="sold-out-badge">Sold Out</span>';
        }

        // ----- CARD HTML -----
        var cardHTML = '';
        cardHTML += '<div class="product-image">';
        cardHTML += '<a href="/products/' + product.handle + '" class="product-link">';
        cardHTML += '<img src="' + imageSrc + '" alt="' + product.title + '" loading="lazy">';
        cardHTML += '</a>';
        cardHTML += badgesHTML;
        cardHTML += '</div>';
        cardHTML += '<div class="product-info">';

        //---- Vendor ----
        if (settings.showVendor && product.vendor) {
            cardHTML += '<span class="vendor">' + product.vendor + '</span>';
        }

        //---- Title ----
        cardHTML += '<a href="/products/' + product.handle + '" class="product-title-link">';
        cardHTML += '<h3>' + product.title + '</h3>';
        cardHTML += '</a>';

        // ----- RATING (Only if actual rating exists in metafield) -----
        // Uncomment below code and replace with your metafield path
        /*
        if (settings.showRating && product.metafields && product.metafields.reviews && product.metafields.reviews.rating) {
            var rating = product.metafields.reviews.rating.value || 0;
            var stars = Math.round(rating);
            cardHTML += '<div class="rating">';
            for (var i = 0; i < stars; i++) cardHTML += '★';
            for (var j = stars; j < 5; j++) cardHTML += '☆';
            cardHTML += '<span class="rating-number">(' + rating + ')</span>';
            cardHTML += '</div>';
        }
        */

        //---- Price ----
        cardHTML += '<div class="price">';
        if (settings.showComparePrice && comparePrice && price < comparePrice) {
            cardHTML += '<span class="old-price">₹' + comparePrice + '</span>';
        }
        cardHTML += '<span class="new-price">₹' + price + '</span>';
        cardHTML += '</div>';

        //---- Add to Cart ----
        if (settings.showAddToCart) {
            cardHTML += '<button class="cart-btn" ' + (!available ? 'disabled' : '') + ' data-variant-id="' + variant.id + '">';
            cardHTML += available ? settings.addToCartText : settings.outOfStockText;
            cardHTML += '</button>';
        }

        cardHTML += '</div>';
        card.innerHTML = cardHTML;
        grid.appendChild(card);
    });

    products = document.querySelectorAll('.product-card');
    originalProducts = Array.from(products);
    applyFilters();
}

/*----------- 5. LOAD PRODUCTS FROM API -----------*/
function loadAllProducts() {
    fetch('/collections/' + defaultCollection + '/products.json?limit=250')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            allProducts = data.products;
            renderProducts(allProducts);
            setupPagination();
            setupCartButtons();
        })
        .catch(function(error) {
            console.error('Error loading products:', error);
        });
}

/*----------- 6. APPLY FILTERS -----------*/
function applyFilters() {
    var allCards = document.querySelectorAll('.product-card');
    allCards.forEach(function(product) {
        var visible = true;

        // Search
        if (!product.dataset.title.includes(filters.search)) visible = false;

        // Stock
        if (filters.stock && filters.stock !== product.dataset.stock) visible = false;

        // Price
        var productPrice = Number(product.dataset.price);
        if (productPrice < filters.price.min || productPrice > filters.price.max) visible = false;

        // Vendor
        if (filters.vendor.length > 0) {
            var productVendor = product.dataset.vendor;
            if (!filters.vendor.includes(productVendor)) visible = false;
        }

        product.dataset.filteredOut = visible ? 'false' : 'true';
        product.style.display = visible ? 'block' : 'none';
    });

    var dom = getDOMElements();
    updateProductCount(dom);
    updatePagination(dom);
}


/*----------- 7. UPDATE PRODUCT COUNT -----------*/
function updateProductCount(dom) {
    if (dom.productCount) {
        var visible = document.querySelectorAll('.product-card[style*="display: block"]');
        dom.productCount.textContent = visible.length || 0;
    }
}

/*------------ 8. APPLY SORTING ------------*/
function applySorting() {
    var dom = getDOMElements();
    var grid = dom.productGrid;
    if (!grid) return;
    var sortFilter = dom.sortFilter;
    if (!sortFilter) return;

    var productArray = Array.from(document.querySelectorAll('.product-card'));

    switch (sortFilter.value) {
        case 'manual':
            productArray = Array.from(originalProducts);
            break;
        case 'price-ascending':
            productArray.sort(function(a, b) {
                return Number(a.dataset.price) - Number(b.dataset.price);
            });
            break;
        case 'price-descending':
            productArray.sort(function(a, b) {
                return Number(b.dataset.price) - Number(a.dataset.price);
            });
            break;
        case 'created-descending':
            productArray.sort(function(a, b) {
                return Number(b.dataset.created) - Number(a.dataset.created);
            });
            break;
    }

    productArray.forEach(function(item) {
        grid.appendChild(item);
    });
    applyFilters();
}

/*------------ 9. PAGINATION ------------*/
function getVisibleCards() {
    return Array.from(document.querySelectorAll('.product-card')).filter(function(card) {
        return card.dataset.filteredOut !== 'true';
    });
}

function showPage(page, settings, dom) {
    var allCards = document.querySelectorAll('.product-card');
    var filteredCards = getVisibleCards();
    var totalPages = Math.ceil(filteredCards.length / settings.productsPerPage) || 1;

    allCards.forEach(function(card) {
        card.style.display = 'none';
    });

    var start = (page - 1) * settings.productsPerPage;
    var end = start + settings.productsPerPage;
    var visibleCards = filteredCards.slice(start, end);

    visibleCards.forEach(function(card) {
        card.style.display = 'block';
    });

    document.querySelectorAll('.page-btn').forEach(function(btn) {
        btn.classList.toggle('active', parseInt(btn.dataset.page) === page);
    });

    var prevBtn = document.querySelector('.prev-btn');
    var nextBtn = document.querySelector('.next-btn');
    if (prevBtn) prevBtn.disabled = page === 1;
    if (nextBtn) nextBtn.disabled = page === totalPages;

    currentPage = page;
}

function createPaginationButtons(totalPages, settings, dom) {
    var wrapper = dom.paginationWrapper;
    if (!wrapper) return;

    var html = '<button class="pagination-btn prev-btn" disabled>← Prev</button>';
    for (var i = 1; i <= totalPages; i++) {
        html += '<button class="pagination-btn page-btn' + (i === 1 ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button class="pagination-btn next-btn">Next →</button>';

    wrapper.innerHTML = html;

    document.querySelectorAll('.page-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var page = parseInt(this.dataset.page);
            var settings = getSettings();
            var dom = getDOMElements();
            showPage(page, settings, dom);
        });
    });

    var prevBtn = document.querySelector('.prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                var settings = getSettings();
                var dom = getDOMElements();
                showPage(currentPage - 1, settings, dom);
            }
        });
    }

    var nextBtn = document.querySelector('.next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            var filteredCards = getVisibleCards();
            var settings = getSettings();
            var totalPages = Math.ceil(filteredCards.length / settings.productsPerPage) || 1;
            if (currentPage < totalPages) {
                var dom = getDOMElements();
                showPage(currentPage + 1, settings, dom);
            }
        });
    }
}

function setupPagination() {
    var settings = getSettings();
    var dom = getDOMElements();
    var filteredCards = getVisibleCards();
    var totalPages = Math.ceil(filteredCards.length / settings.productsPerPage) || 1;

    if (totalPages <= 1) {
        if (dom.paginationWrapper) dom.paginationWrapper.style.display = 'none';
        showPage(1, settings, dom);
        return;
    }

    if (dom.paginationWrapper) dom.paginationWrapper.style.display = 'flex';
    createPaginationButtons(totalPages, settings, dom);
    showPage(1, settings, dom);
}

function updatePagination(dom) {
    var settings = getSettings();
    var filteredCards = getVisibleCards();
    var totalPages = Math.ceil(filteredCards.length / settings.productsPerPage) || 1;

    if (totalPages <= 1) {
        if (dom.paginationWrapper) dom.paginationWrapper.style.display = 'none';
        showPage(1, settings, dom);
        return;
    }

    if (dom.paginationWrapper) dom.paginationWrapper.style.display = 'flex';
    createPaginationButtons(totalPages, settings, dom);
    if (currentPage > totalPages) currentPage = totalPages;
    showPage(currentPage, settings, dom);
}

/*------------ 10. ADD TO CART (Event Delegation) ------------*/
function setupCartButtons() {
    var dom = getDOMElements();
    var grid = dom.productGrid;
    if (!grid) return;
    grid.removeEventListener('click', cartClickHandler);
    grid.addEventListener('click', cartClickHandler);
}

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

/*------------ 11. URL FILTERS - SAVE & LOAD ------------*/
function saveFiltersToURL() {
    var urlParams = new URLSearchParams();
    if (filters.search) urlParams.set('search', filters.search);
    if (filters.sort) urlParams.set('sort', filters.sort);
    if (filters.stock) urlParams.set('stock', filters.stock);
    if (filters.vendor.length) urlParams.set('vendor', filters.vendor.join(','));
    if (filters.price.min) urlParams.set('price_min', filters.price.min);
    if (filters.price.max < 999999) urlParams.set('price_max', filters.price.max);

    var newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.pushState({}, '', newUrl);
}

function loadFiltersFromURL() {
    var dom = getDOMElements();
    var urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('search')) {
        filters.search = urlParams.get('search');
        if (dom.seachFilter) dom.seachFilter.value = filters.search;
    }

    if (urlParams.has('sort')) {
        filters.sort = urlParams.get('sort');
        if (dom.sortFilter) dom.sortFilter.value = filters.sort;
    }

    if (urlParams.has('stock')) {
        filters.stock = urlParams.get('stock');
        dom.stockFilters.forEach(function(el) {
            if (el.value === filters.stock) el.checked = true;
        });
    }

    if (urlParams.has('vendor')) {
        filters.vendor = urlParams.get('vendor').split(',');
        dom.vendorFilters.forEach(function(el) {
            if (filters.vendor.includes(el.value)) el.checked = true;
        });
    }

    if (urlParams.has('price_min')) {
        filters.price.min = parseInt(urlParams.get('price_min'));
        if (dom.priceMinInput) dom.priceMinInput.value = filters.price.min;
        if (dom.priceMinDisplay) dom.priceMinDisplay.textContent = '₹' + filters.price.min;
    }

    if (urlParams.has('price_max')) {
        filters.price.max = parseInt(urlParams.get('price_max'));
        if (dom.priceSlider) dom.priceSlider.value = filters.price.max;
        if (dom.priceMaxDisplay) dom.priceMaxDisplay.textContent = '₹' + filters.price.max;
    }

    setTimeout(function() { applyFilters(); }, 100);
}

/*------------ 12. EVENT HANDLERS ------------*/
function handleSearch(e) {
    filters.search = e.target.value.toLowerCase().trim();
    applyFilters();
    saveFiltersToURL();
}

function handleSort(e) {
    applySorting();
    saveFiltersToURL();
}

function handleVendor(e) {
    if (e.target.checked) {
        if (!filters.vendor.includes(e.target.value)) {
            filters.vendor.push(e.target.value);
        }
    } else {
        filters.vendor = filters.vendor.filter(function(v) {
            return v !== e.target.value;
        });
    }
    applyFilters();
    saveFiltersToURL();
}

function handleStock(e) {
    filters.stock = e.target.value;
    applyFilters();
    saveFiltersToURL();
}

function handlePriceMax(e) {
    var value = parseInt(e.target.value);
    filters.price.max = value;
    var dom = getDOMElements();
    if (dom.priceMaxDisplay) dom.priceMaxDisplay.textContent = '₹' + value;
    applyFilters();
    saveFiltersToURL();
}

function handlePriceMin(e) {
    var value = parseInt(e.target.value) || 0;
    filters.price.min = value;
    var dom = getDOMElements();
    if (dom.priceMinDisplay) dom.priceMinDisplay.textContent = '₹' + value;
    applyFilters();
    saveFiltersToURL();
}

function handleClearFilters() {
    var dom = getDOMElements();

    filters.search = '';
    filters.sort = '';
    filters.vendor = [];
    filters.stock = '';
    filters.price.min = Number(dom.priceMinInput?.min) || 0;
    filters.price.max = Number(dom.priceSlider?.max) || 999999;

    if (dom.seachFilter) dom.seachFilter.value = '';
    if (dom.sortFilter) dom.sortFilter.value = 'manual';
    dom.vendorFilters.forEach(function(el) { el.checked = false; });
    dom.stockFilters.forEach(function(el) { el.checked = false; });

    if (dom.priceMinInput) {
        dom.priceMinInput.value = filters.price.min;
        if (dom.priceMinDisplay) dom.priceMinDisplay.textContent = '₹' + filters.price.min;
    }
    if (dom.priceSlider) {
        dom.priceSlider.value = filters.price.max;
        if (dom.priceMaxDisplay) dom.priceMaxDisplay.textContent = '₹' + filters.price.max;
    }

    applyFilters();
    window.history.pushState({}, '', window.location.pathname);
}

/*------------ 13. ATTACH EVENT LISTENERS ------------*/
function attachEventListeners() {
    var dom = getDOMElements();

    if (dom.seachFilter) {
        dom.seachFilter.removeEventListener('input', handleSearch);
        dom.seachFilter.addEventListener('input', handleSearch);
    }

    if (dom.sortFilter) {
        dom.sortFilter.removeEventListener('change', handleSort);
        dom.sortFilter.addEventListener('change', handleSort);
    }

    dom.vendorFilters.forEach(function(el) {
        el.removeEventListener('change', handleVendor);
        el.addEventListener('change', handleVendor);
    });

    dom.stockFilters.forEach(function(el) {
        el.removeEventListener('change', handleStock);
        el.addEventListener('change', handleStock);
    });

    if (dom.priceSlider) {
        dom.priceSlider.removeEventListener('input', handlePriceMax);
        dom.priceSlider.addEventListener('input', handlePriceMax);
    }

    if (dom.priceMinInput) {
        dom.priceMinInput.removeEventListener('input', handlePriceMin);
        dom.priceMinInput.addEventListener('input', handlePriceMin);
    }

    if (dom.clearFiltersBtn) {
        dom.clearFiltersBtn.removeEventListener('click', handleClearFilters);
        dom.clearFiltersBtn.addEventListener('click', handleClearFilters);
    }
}

/*------------ 14. INITIALIZE ------------*/
function init() {
    products = [];
    originalProducts = [];
    allProducts = [];
    currentPage = 1;
    filters.search = '';
    filters.sort = '';
    filters.vendor = [];
    filters.stock = '';
    filters.price = { min: 0, max: 999999 };

    loadAllProducts();
    loadFiltersFromURL();
    attachEventListeners();
}

/*----- 15. EVENTS - Page Load & Section Reload ------*/
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