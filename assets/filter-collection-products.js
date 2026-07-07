"use strict";

let isLoading = false;
let hasNextPage = true;
let infiniteScrollObserver = null;
/*------------ Global DOM Cache Object ----------*/
const DOM = {};

/*------------ Initialize on Page Load & Section Reload ----------*/
document.addEventListener("DOMContentLoaded", init);
document.addEventListener("shopify:section:load", init);

/*------------ Main Initialization Function ----------*/
function init() {
    cacheDOM();
    bindEvents();
    updateProductCount();
    toggleNoProducts();
    toggleClearFiltersButton();
}

/*------------ Cache All DOM Elements ----------*/
function cacheDOM() {
    // Search & Filters
    DOM.searchInput = document.getElementById("searchFilter");
    DOM.vendorFilters = document.querySelectorAll(".vendor-filter");
    DOM.availabilityFilters = document.querySelectorAll(".availability-filter");
    DOM.priceMin = document.getElementById("priceMin");
    DOM.priceMax = document.getElementById("priceMax");
    DOM.priceMinDisplay = document.getElementById("priceMinDisplay");
    DOM.priceMaxDisplay = document.getElementById("priceMaxDisplay");
    DOM.clearBtn = document.getElementById("clearFiltersBtn");
    DOM.sortForm = document.getElementById("sortForm");

    // Products
    DOM.productGrid = document.getElementById("product-grid");
    DOM.productCards = [...document.querySelectorAll(".product-card")];
    DOM.productCount = document.getElementById("product-count");
    DOM.noProducts = document.getElementById("noProductsMessage");

    // Variant Popup
    DOM.variantModal = document.getElementById("variantModal");
    DOM.variantPopup = document.querySelector(".variant-popup");
    DOM.variantOverlay = document.querySelector(".variant-overlay");
    DOM.variantClose = document.querySelector(".variant-close");
    DOM.popupCancel = document.querySelector(".popup-cancel");
    DOM.popupTitle = document.getElementById("popupTitle");
    DOM.popupVendor = document.getElementById("popupVendor");
    DOM.popupImage = document.getElementById("popupProductImage");
    DOM.popupPrice = document.getElementById("popupPrice");
    DOM.popupComparePrice = document.getElementById("popupComparePrice");
    DOM.popupDescription = document.getElementById("popupDescription");
    DOM.popupOptions = document.getElementById("popupOptions");
    DOM.popupQty = document.getElementById("popupQty");
    DOM.currentProduct = null;
    
    // Products container
    DOM.productsContainer = document.getElementById("products-container");

    // Infinity Scroll
    DOM.enableInfiniteScroll = DOM.productsContainer?.dataset.infiniteScroll === "true";
    DOM.infiniteTrigger = document.getElementById("infinite-scroll-trigger");

    // Read initial pagination state from trigger element
    if (DOM.infiniteTrigger) {
        hasNextPage = !!DOM.infiniteTrigger.dataset.nextUrl;
    }
    
}

/*------------ Bind All Event Listeners ----------*/
function bindEvents() {
    setupSearch();
    setupVendorFilters();
    setupAvailabilityFilters();
    setupPriceFilter();
    setupSorting();
    setupClearFilters();
    setupCartButtons();
    setupVendorDropdown();
    setupVariantPopup();
    
    /*--- Pagination Click Event Delegation ---*/
    document.addEventListener("click", function(e) {
        const link = e.target.closest(".pagination-btn");
        if (link) {
            e.preventDefault();
            const href = link.getAttribute("href");
            if (href) {
                fetchProducts(href);
            }
        }
    });


/*--------- Handle Infinite Scroll --------*/ 
    if (DOM.enableInfiniteScroll) {
    setupInfiniteScroll();
}
}


function setupInfiniteScroll() {
    if (!DOM.infiniteTrigger) return;

    // Disconnect previous observer if exists (prevents duplicates after AJAX)
    if (infiniteScrollObserver) {
        infiniteScrollObserver.disconnect();
    }

    infiniteScrollObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading && hasNextPage) {
            fetchMoreProducts();
        }
    }, {
        rootMargin: '200px' // Start loading 200px before trigger is visible
    });

    infiniteScrollObserver.observe(DOM.infiniteTrigger);
}




/*------------ Fetch Products via AJAX (Pagination, Filters, Sort) ----------*/
async function fetchProducts(url) {
    try {
        const grid = document.getElementById("product-grid");
        const container = document.getElementById("products-container");
        
        if (grid) {
            grid.style.opacity = "0.5";
            grid.style.pointerEvents = "none";
        }

        const response = await fetch(url, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Product grid update
        const oldGrid = document.getElementById("product-grid");
        const newGrid = doc.getElementById("product-grid");

        if (newGrid && oldGrid) {
            // Force replace
            oldGrid.innerHTML = newGrid.innerHTML;
            DOM.productCards = [...document.querySelectorAll(".product-card")];
            console.log("Products updated:", DOM.productCards.length);
            
            // Force grid visible
            oldGrid.style.display = "grid";
            oldGrid.style.opacity = "1";
            oldGrid.style.pointerEvents = "auto";
        }

        // Pagination update (search page mein nahi hota, isliye safe check)
        const newPagination = doc.querySelector(".pagination-wrapper");
        if (newPagination) {
            const oldPagination = document.querySelector(".pagination-wrapper");
            if (oldPagination) {
                oldPagination.innerHTML = newPagination.innerHTML;
            }
        } else {
            // Agar pagination nahi mila, toh hide karo
            const oldPagination = document.querySelector(".pagination-wrapper");
            if (oldPagination) {
                oldPagination.style.display = "none";
            }
        }

        // Product count update
        const newCount = doc.getElementById("product-count");
        if (newCount) {
            const oldCount = document.getElementById("product-count");
            if (oldCount) {
                oldCount.textContent = newCount.textContent;
                oldCount.dataset.totalProducts = newCount.dataset.totalProducts;
            }
        }

        // No products message
        const newNoProducts = doc.getElementById("noProductsMessage");
        if (newNoProducts) {
            const oldNoProducts = document.getElementById("noProductsMessage");
            if (oldNoProducts) {
                oldNoProducts.style.display = newNoProducts.style.display || "none";
            }
        }

        // URL update
        window.history.pushState({}, "", url);

        // Re-bind everything
        setupCartButtons();
        updateProductCount();
        toggleNoProducts();
        toggleClearFiltersButton();

        // Re-initialize infinite scroll if enabled
        if (DOM.enableInfiniteScroll) {
            const newTrigger = doc.getElementById("infinite-scroll-trigger");
            if (DOM.infiniteTrigger && newTrigger) {
                // Update trigger data attributes from response
                if (newTrigger.dataset.nextUrl) {
                    DOM.infiniteTrigger.dataset.nextUrl = newTrigger.dataset.nextUrl;
                    hasNextPage = true;
                } else {
                    delete DOM.infiniteTrigger.dataset.nextUrl;
                    hasNextPage = false;
                }
                DOM.infiniteTrigger.dataset.currentPage = newTrigger.dataset.currentPage || "1";
                DOM.infiniteTrigger.dataset.totalPages = newTrigger.dataset.totalPages || "1";
                // Re-observe
                setupInfiniteScroll();
            }
        }

        // Reset search state on filter/pagination change
        if (DOM.searchInput) {
            DOM.searchInput.value = "";
        }
        isSearchActive = false;
        originalGridHTML = null;
        allProductsCache = null; // Invalidate cache since filters changed

        // Force scroll
        if (container) {
            container.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        // Force grid visible (final check)
        if (grid) {
            grid.style.opacity = "1";
            grid.style.pointerEvents = "auto";
            grid.style.display = "grid";
        }

        console.log("Search complete!");

    } catch (error) {
        console.error("Error:", error);
        showToast("Failed to load products", "error");
        
        const grid = document.getElementById("product-grid");
        if (grid) {
            grid.style.opacity = "1";
            grid.style.pointerEvents = "auto";
            grid.style.display = "grid";
        }
    }
}


/*------------ Search - Global State Variables ----------*/
let allProductsCache = null;
let originalGridHTML = null;
let isSearchActive = false;

/*------------ Extract Collection Handle from URL ----------*/
function getCollectionHandle() {
    const parts = window.location.pathname.split("/");
    const idx = parts.indexOf("collections");
    return idx !== -1 ? parts[idx + 1] : null;
}

/*------------ Fetch All Products from Collection via AJAX API ----------*/
async function fetchAllCollectionProducts() {
    if (allProductsCache) return allProductsCache;

    const handle = getCollectionHandle();
    if (!handle) return [];

    let all = [];
    let page = 1;

    while (true) {
        const res = await fetch(`/collections/${handle}/products.json?limit=250&page=${page}`);
        const data = await res.json();
        if (!data.products || data.products.length === 0) break;
        all = all.concat(data.products);
        if (data.products.length < 250) break;
        page++;
    }

    allProductsCache = all;
    console.log(`Fetched ${all.length} total products for search`);
    return all;
}

/*------------ Build Product Card HTML from JSON Data ----------*/
function buildCardHTML(product) {
    const container = DOM.productsContainer;
    const showVendor = container?.dataset.showVendor === "true";
    const showAddToCart = container?.dataset.showAddToCart === "true";
    const showSaleBadge = container?.dataset.showSaleBadge === "true";
    const showSoldOutBadge = container?.dataset.showSoldOutBadge === "true";
    const showComparePrice = container?.dataset.showComparePrice === "true";
    const addToCartText = container?.dataset.addToCartText || "Add To Cart";
    const outOfStockText = container?.dataset.outOfStockText || "Out of Stock";

    const variant = product.variants[0] || {};
    const price = parseFloat(variant.price) || 0;
    const comparePrice = parseFloat(variant.compare_at_price) || 0;
    // Derive availability from variants (products.json has no top-level 'available')
    const available = product.variants.some(v => v.available);
    const variantCount = product.variants.length;
    const imgSrc = (product.images && product.images[0]?.src) || "";
    const hasSale = comparePrice > price && price > 0;

    let html = `<article class="product-card" data-title="${product.title.toLowerCase()}" data-price="${variant.price}" data-vendor="${product.vendor.toLowerCase()}" data-stock="${available}">`;

    // Sale badge (respects show_sale_badge setting)
    if (showSaleBadge && hasSale) {
        html += `<span class="sale-badge"> Sale </span>`;
    }

    // Sold out badge (respects show_sold_out_badge setting)
    if (showSoldOutBadge && !available) {
        html += `<span class="sold-out-badge"> Sold Out </span>`;
    }

    // Image
    html += `<div class="product-image"><img src="${imgSrc}" alt="${product.title}" height="400" width="400" loading="lazy"></div>`;

    // Info
    html += `<div class="product-info">`;

    if (showVendor) {
        html += `<span class="vendor">${product.vendor}</span>`;
    }

    html += `<h3>${product.title}</h3>`;

    // Price (respects show_compare_price setting)
    html += `<div class="price">`;
    if (showComparePrice && hasSale) {
        html += `<span class="old-price">₹${comparePrice.toLocaleString("en-IN")}</span>`;
    }
    html += `<span class="new-price"> ₹${price.toLocaleString("en-IN")} </span>`;
    html += `</div>`;

    // Add to cart button
    if (showAddToCart) {
        let btnText, disabled = "";
        if (available) {
            btnText = variantCount > 1 ? "Select Variant" : addToCartText;
        } else {
            btnText = outOfStockText;
            disabled = "disabled";
        }
        html += `<button class="cart-btn ${!available ? "stock-unavailable" : ""}" data-variant-id="${variant.id}" data-product-handle="${product.handle}" data-product-id="${product.id}" data-variant-count="${variantCount}" ${disabled}>${btnText}</button>`;
    }

    html += `</div></article>`;
    return html;
}

/*------------ Setup Search Input with Debounce ----------*/
function setupSearch() {
    if (!DOM.searchInput) {
        console.error("Search input not found!");
        return;
    }
    console.log("Search input found");

    // Pre-fetch all products on focus for faster search
    DOM.searchInput.addEventListener("focus", () => fetchAllCollectionProducts(), { once: true });

    let timer;
    DOM.searchInput.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const keyword = this.value.trim().toLowerCase();
            searchProducts(keyword);
        }, 300);
    });
}



/*------------ Search Products by Title Across All Collection Products ----------*/
async function searchProducts(keyword) {
    const grid = DOM.productGrid;
    if (!grid) return;

    // If search is empty, restore original view
    if (!keyword) {
        if (isSearchActive && originalGridHTML !== null) {
            grid.innerHTML = originalGridHTML;
            DOM.productCards = [...document.querySelectorAll(".product-card")];
            const pagination = document.querySelector(".pagination-wrapper");
            if (pagination) pagination.style.display = "";
            isSearchActive = false;
            updateProductCount();
            toggleNoProducts();
        }
        return;
    }

    // Save original grid HTML before first search
    if (!isSearchActive) {
        originalGridHTML = grid.innerHTML;
    }

    // Show loading state
    grid.style.opacity = "0.5";

    try {
        const products = await fetchAllCollectionProducts();

        // Filter by keyword (title only)
        const matched = products.filter(p => {
            const title = p.title.toLowerCase();
            return title.includes(keyword);
        });

        // Build grid HTML
        grid.innerHTML = matched.map(p => buildCardHTML(p)).join("");
        DOM.productCards = [...document.querySelectorAll(".product-card")];
        isSearchActive = true;

        // Hide pagination during search
        const pagination = document.querySelector(".pagination-wrapper");
        if (pagination) pagination.style.display = "none";

        // Update count
        if (DOM.productCount) {
            DOM.productCount.textContent = `Showing ${matched.length} of ${products.length} Products`;
        }
        toggleNoProducts();

    } catch (err) {
        console.error("Search error:", err);
    }

    grid.style.opacity = "1";
}



/*------------ Infinity Scroll Handling -----------*/
async function fetchMoreProducts() {
    if (isLoading || !hasNextPage) return;

    isLoading = true;

    // Show loading spinner
    const loader = DOM.infiniteTrigger?.querySelector('.infinite-scroll-loader');
    if (loader) loader.style.display = 'flex';

    try {
        // Get next page URL from trigger element's data attribute
        const nextUrl = DOM.infiniteTrigger?.dataset.nextUrl;
        if (!nextUrl) {
            hasNextPage = false;
            return;
        }

        // Fetch next page
        const response = await fetch(nextUrl, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        });

        if (!response.ok) throw new Error("Failed to load products");

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Get new products from response
        const newGrid = doc.getElementById("product-grid");

        if (!newGrid || newGrid.children.length === 0) {
            hasNextPage = false;
            return;
        }

        // Append new products to existing grid
        DOM.productGrid.insertAdjacentHTML("beforeend", newGrid.innerHTML);

        // Update cached product cards
        DOM.productCards = [...document.querySelectorAll(".product-card")];

        // Update product count
        updateProductCount();
        toggleNoProducts();

        // Check if there's a next page in the response
        const newTrigger = doc.getElementById("infinite-scroll-trigger");
        if (newTrigger && newTrigger.dataset.nextUrl) {
            // Update trigger with new pagination data
            DOM.infiniteTrigger.dataset.nextUrl = newTrigger.dataset.nextUrl;
            DOM.infiniteTrigger.dataset.currentPage = newTrigger.dataset.currentPage;
            DOM.infiniteTrigger.dataset.totalPages = newTrigger.dataset.totalPages;
        } else {
            // No more pages
            hasNextPage = false;
            delete DOM.infiniteTrigger.dataset.nextUrl;
        }

    } catch (error) {
        console.error("Infinite scroll error:", error);
    } finally {
        isLoading = false;
        if (loader) loader.style.display = 'none';
    }
}




/*------------ Update Visible Product Count Display ----------*/
function updateProductCount() {
    if (!DOM.productCount) return;
    const visible = DOM.productCards.filter(card => card.style.display !== "none").length;
    const total = Number(DOM.productCount.dataset.totalProducts);
    DOM.productCount.textContent = `Showing ${visible} of ${total} Products`;
}

/*------------ Toggle No Products Found Message ----------*/
function toggleNoProducts() {
    if (!DOM.noProducts) return;
    const hasVisible = DOM.productCards.some(card => card.style.display !== "none");
    DOM.noProducts.style.display = hasVisible ? "none" : "block";
}

/*------------ Setup Vendor Filter Checkboxes ----------*/
function setupVendorFilters() {
    DOM.vendorFilters.forEach(filter => {
        filter.addEventListener("change", applyFilters);
    });
}

/*------------ Setup Availability Filter Checkboxes ----------*/
function setupAvailabilityFilters() {
    DOM.availabilityFilters.forEach(filter => {
        filter.addEventListener("change", applyFilters);
    });
}

/*------------ Setup Price Range Slider Filter ----------*/
function setupPriceFilter() {
    if (!DOM.priceMin || !DOM.priceMax) return;

    const url = new URL(window.location.href);
    const min = Number(url.searchParams.get("filter.v.price.gte")) || 0;
    const max = Number(url.searchParams.get("filter.v.price.lte")) || Number(DOM.priceMax.max);

    DOM.priceMin.value = min;
    DOM.priceMax.value = max;
    updatePriceDisplay();

    DOM.priceMin.addEventListener("input", () => {
        if (+DOM.priceMin.value > +DOM.priceMax.value) {
            DOM.priceMin.value = DOM.priceMax.value;
        }
        updatePriceDisplay();
    });

    DOM.priceMax.addEventListener("input", () => {
        if (+DOM.priceMax.value < +DOM.priceMin.value) {
            DOM.priceMax.value = DOM.priceMin.value;
        }
        updatePriceDisplay();
    });

    DOM.priceMin.addEventListener("change", applyFilters);
    DOM.priceMax.addEventListener("change", applyFilters);
}

/*------------ Update Price Range Display Labels ----------*/
function updatePriceDisplay() {
    if (DOM.priceMinDisplay) {
        DOM.priceMinDisplay.textContent = `Min : ₹${Number(DOM.priceMin.value).toLocaleString("en-IN")}`;
    }
    if (DOM.priceMaxDisplay) {
        DOM.priceMaxDisplay.textContent = `Max : ₹${Number(DOM.priceMax.value).toLocaleString("en-IN")}`;
    }
}

/*------------ Apply All Active Filters and Fetch Filtered Products ----------*/
function applyFilters(e) {
       if (e) e.preventDefault();
       hasNextPage = true;
    const url = new URL(window.location.href);

    // Remove existing filter params
    DOM.vendorFilters.forEach(filter => url.searchParams.delete(filter.name));
    DOM.availabilityFilters.forEach(filter => url.searchParams.delete(filter.name));
    url.searchParams.delete("filter.v.price.gte");
    url.searchParams.delete("filter.v.price.lte");
    url.searchParams.delete("page");


    // Re-add checked vendor filters
    DOM.vendorFilters.forEach(filter => {
        if (filter.checked) {
            url.searchParams.append(filter.name, filter.value);
        }
    });

    DOM.availabilityFilters.forEach(filter => {
        if (filter.checked) {
            url.searchParams.append(filter.name, filter.value);
        }
    });

    if (DOM.priceMin && +DOM.priceMin.value > Number(DOM.priceMin.min)) {
        url.searchParams.set("filter.v.price.gte", DOM.priceMin.value);
    }
    if (DOM.priceMax && +DOM.priceMax.value < Number(DOM.priceMax.max)) {
        url.searchParams.set("filter.v.price.lte", DOM.priceMax.value);
    }

    const sortSelect = document.querySelector("#sortForm select[name='sort_by']");
    if (sortSelect && sortSelect.value) {
        url.searchParams.set("sort_by", sortSelect.value);
    }

    
    fetchProducts(url.toString());

}

/*------------ Setup Clear All Filters Button ----------*/
function setupClearFilters() {
    if (!DOM.clearBtn) return;
    DOM.clearBtn.addEventListener("click", function(e) {
        e.preventDefault();
        const url = new URL(window.location.origin + window.location.pathname);
        fetchProducts(url.toString());
    });
}

/*------------ Setup Sort Dropdown ----------*/
function setupSorting() {
    const sortSelect = document.getElementById("sortSelect");
    if (!sortSelect) return;
    sortSelect.addEventListener("change", function(e) {
        const url = new URL(window.location.href);
        url.searchParams.set("sort_by", this.value);
        url.searchParams.delete("page");

        hasNextPage = true;

        fetchProducts(url.toString());
    });
}

/*------------ Toggle Clear Filters Button Visibility ----------*/
function toggleClearFiltersButton() {
    if (!DOM.clearBtn) return;
    const url = new URL(window.location.href);
    const hasVendorFilter = [...DOM.vendorFilters].some(filter => filter.checked);
    const hasAvailabilityFilter = [...DOM.availabilityFilters].some(filter => filter.checked);
    const minVal = Number(DOM.priceMin?.min) || 0;
const maxVal = Number(DOM.priceMax?.max) || 0;
const hasPriceFilter = (DOM.priceMin && +DOM.priceMin.value > minVal) ||
                       (DOM.priceMax && +DOM.priceMax.value < maxVal);
    // const hasPriceFilter = (DOM.priceMin && +DOM.priceMin.value > +DOM.priceMin.min) ||
    //                       (DOM.priceMax && +DOM.priceMax.value < +DOM.priceMax.max);
    const sortValue = url.searchParams.get("sort_by");
    const hasSortFilter = sortValue && sortValue !== "manual";
    const hasActiveFilters = hasVendorFilter || hasAvailabilityFilter || hasPriceFilter || hasSortFilter;
    DOM.clearBtn.classList.toggle("show", hasActiveFilters);
}

/*------------ Setup Filter Dropdown Toggle (Expand/Collapse) ----------*/
function setupVendorDropdown() {
    const toggles = document.querySelectorAll(".filter-toggle");
    toggles.forEach(toggle => {
        const content = toggle.nextElementSibling;
        content.classList.add("hide");
        toggle.addEventListener("click", () => {
            toggle.classList.toggle("active");
            content.classList.toggle("hide");
        });
    });
    document.querySelectorAll(".filter-box").forEach(box => {
        box.addEventListener("mouseleave", () => {
            box.querySelector(".filter-content").classList.add("hide");
            box.querySelector(".filter-toggle").classList.remove("active");
        });
    });
}

/*------------ Render Variant Options in Popup ----------*/
function renderVariantOptions(product) {
    DOM.popupOptions.innerHTML = "";
    if (!product.options || product.options.length === 0) {
        DOM.popupOptions.style.display = "none";
        return;
    }
    DOM.popupOptions.style.display = "flex";
    product.options.forEach((option, index) => {
        const group = document.createElement("div");
        group.className = "option-group";
        const label = document.createElement("label");
        label.textContent = option.name;
        group.appendChild(label);
        const valuesDiv = document.createElement("div");
        valuesDiv.className = "option-values";
        const values = [...new Set(product.variants.map(v => v.options[index]))];
        values.forEach((value, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = value;
            btn.dataset.optionIndex = index;
            btn.dataset.value = value;
            if (i === 0) btn.classList.add("active");
            btn.addEventListener("click", function() {
                const siblings = this.closest(".option-values").querySelectorAll("button");
                siblings.forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                updateVariantInfo(product);
            });
            valuesDiv.appendChild(btn);
        });
        group.appendChild(valuesDiv);
        DOM.popupOptions.appendChild(group);
    });
    updateVariantInfo(product);
}

/*------------ Update Variant Price and Image on Option Change ----------*/
function updateVariantInfo(product) {
    const selectedOptions = [];
    const optionGroups = DOM.popupOptions.querySelectorAll(".option-group");
    optionGroups.forEach(group => {
        const activeBtn = group.querySelector(".option-values .active");
        if (activeBtn) selectedOptions.push(activeBtn.textContent);
    });
    let selectedVariant = null;
    if (selectedOptions.length === product.options.length) {
        selectedVariant = product.variants.find(variant => {
            return variant.options.every((opt, index) => opt === selectedOptions[index]);
        });
    }
    if (!selectedVariant) {
        selectedVariant = product.variants.find(v => v.available) || product.variants[0];
    }
    if (selectedVariant) {
        const price = selectedVariant.price / 100;
        DOM.popupPrice.textContent = `₹${price.toLocaleString("en-IN")}`;
        if (selectedVariant.compare_at_price && selectedVariant.compare_at_price > selectedVariant.price) {
            DOM.popupComparePrice.textContent = `₹${(selectedVariant.compare_at_price / 100).toLocaleString("en-IN")}`;
            DOM.popupComparePrice.style.display = "inline";
        } else {
            DOM.popupComparePrice.textContent = "";
            DOM.popupComparePrice.style.display = "none";
        }
        const addBtn = document.querySelector(".popup-add-cart");
        if (addBtn) {
            addBtn.dataset.variantId = selectedVariant.id;
            addBtn.textContent = `Add To Cart - ₹${price.toLocaleString("en-IN")}`;
            if (!selectedVariant.available) {
                addBtn.disabled = true;
                addBtn.textContent = "Out of Stock";
                addBtn.style.opacity = "0.6";
                addBtn.style.cursor = "not-allowed";
            } else {
                addBtn.disabled = false;
                addBtn.style.opacity = "1";
                addBtn.style.cursor = "pointer";
            }
        }
        if (selectedVariant.featured_image) {
            DOM.popupImage.src = selectedVariant.featured_image.src;
        }
    }
}

/*------------ Open Variant Selection Popup ----------*/
async function openVariantPopup(btn) {
    const handle = btn.dataset.productHandle;
    try {
        const response = await fetch(`/products/${handle}.js`);
        const product = await response.json();
        DOM.currentProduct = product;
        DOM.popupTitle.textContent = product.title;
        DOM.popupVendor.textContent = product.vendor;
        DOM.popupDescription.innerHTML = product.description;
        DOM.popupImage.src = product.featured_image;
        DOM.popupImage.alt = product.title;
        const price = product.price / 100;
        DOM.popupPrice.textContent = `₹${price.toLocaleString("en-IN")}`;
        if (product.compare_at_price > product.price) {
            DOM.popupComparePrice.textContent = `₹${(product.compare_at_price / 100).toLocaleString("en-IN")}`;
            DOM.popupComparePrice.style.display = "inline";
        } else {
            DOM.popupComparePrice.textContent = "";
            DOM.popupComparePrice.style.display = "none";
        }
        renderVariantOptions(product);
        if (DOM.popupQty) DOM.popupQty.value = 1;
        DOM.variantModal.classList.remove("hide");
        document.body.style.overflow = "hidden";
    } catch (error) {
        console.error("Error loading product:", error);
        showToast("Failed to load product details", "error");
    }
}

/*------------ Close Variant Popup ----------*/
function closeVariantPopup() {
    DOM.variantModal.classList.add("hide");
    document.body.style.overflow = "";
}

/*------------ Setup Variant Popup Events (Close, Qty, Add to Cart) ----------*/
function setupVariantPopup() {
    if (DOM.variantClose) DOM.variantClose.addEventListener("click", closeVariantPopup);
    if (DOM.variantOverlay) DOM.variantOverlay.addEventListener("click", closeVariantPopup);
    if (DOM.popupCancel) DOM.popupCancel.addEventListener("click", closeVariantPopup);
    
    const qtyMinus = document.querySelector(".qty-minus");
    const qtyPlus = document.querySelector(".qty-plus");
    
    if (qtyMinus) {
        qtyMinus.addEventListener("click", function() {
            let val = parseInt(DOM.popupQty.value, 10) || 1;
            if (val > 1) DOM.popupQty.value = val - 1;
        });
    }
    if (qtyPlus) {
        qtyPlus.addEventListener("click", function() {
            let val = parseInt(DOM.popupQty.value, 10) || 1;
            const max = parseInt(DOM.popupQty.max, 10) || 999;
            if (val < max) DOM.popupQty.value = val + 1;
        });
    }
    if (DOM.popupQty) {
        DOM.popupQty.addEventListener("change", function() {
            let val = parseInt(this.value, 10);
            if (isNaN(val) || val < 1) this.value = 1;
            const max = parseInt(this.max, 10) || 999;
            if (val > max) this.value = max;
        });
    }
    
    const addToCartPopup = document.querySelector(".popup-add-cart");
    if (addToCartPopup) {
        addToCartPopup.addEventListener("click", function() {
            const variantId = this.dataset.variantId;
            const quantity = parseInt(DOM.popupQty.value, 10) || 1;
            if (!variantId) {
                showToast("Please select a variant", "error");
                return;
            }
            addToCartWithQuantity(variantId, quantity);
        });
    }
    
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && !DOM.variantModal.classList.contains("hide")) {
            closeVariantPopup();
        }
    });
}

/*------------ Add Single Item to Cart ----------*/
async function addToCart(btn) {
    const variantId = btn.dataset.variantId;
    if (!variantId) {
        showToast("Variant not found", "error");
        return;
    }
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Adding...";
    try {
        const response = await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] })
        });
        if (!response.ok) throw new Error();
        btn.textContent = "Added ✓";
        await updateCartCount();
        showToast("Product added to cart");
    } catch (error) {
        btn.textContent = originalText;
        btn.disabled = false;
        showToast("Failed to add product", "error");
        return;
    }
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }, 1500);
}

/*------------ Add Item to Cart with Custom Quantity (from Popup) ----------*/
async function addToCartWithQuantity(variantId, quantity) {
    const btn = document.querySelector(".popup-add-cart");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Adding...";
    try {
        const response = await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: [{ id: Number(variantId), quantity: quantity }] })
        });
        if (!response.ok) throw new Error();
        btn.textContent = "Added ✓";
        await updateCartCount();
        showToast(`Added ${quantity} item(s) to cart`);
        setTimeout(() => closeVariantPopup(), 1000);
    } catch (error) {
        btn.textContent = originalText;
        btn.disabled = false;
        showToast("Failed to add to cart", "error");
        return;
    }
    setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    }, 1500);
}

/*------------ Update Cart Count Badge in Header ----------*/
async function updateCartCount() {
    try {
        const cart = await fetch("/cart.js").then(res => res.json());
        const itemCount = cart.item_count;

        // Update Dawn theme's cart-count-bubble elements
        document.querySelectorAll(".cart-count-bubble").forEach(bubble => {
            const countSpan = bubble.querySelector("span[aria-hidden='true']");
            if (countSpan) {
                countSpan.textContent = itemCount;
            }
            bubble.style.display = itemCount > 0 ? "" : "none";
        });

        // If cart-count-bubble doesn't exist yet (cart was empty), create it
        if (itemCount > 0 && document.querySelectorAll(".cart-count-bubble").length === 0) {
            const cartLink = document.getElementById("cart-icon-bubble");
            if (cartLink) {
                const bubble = document.createElement("div");
                bubble.className = "cart-count-bubble";
                bubble.innerHTML = `<span aria-hidden="true">${itemCount}</span>`;
                cartLink.appendChild(bubble);
            }
        }

        // Also support any custom .cart-count elements if they exist
        document.querySelectorAll(".cart-count").forEach(count => {
            count.textContent = itemCount;
            count.style.display = itemCount ? "inline-flex" : "none";
        });
    } catch (error) {
        console.error("Failed to update cart count:", error);
    }
}

/*------------ Show Toast Notification ----------*/
function showToast(message, type = "success") {
    document.querySelector(".custom-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `<span>${message}</span><button type="button" class="toast-close">&times;</button>`;
    document.body.appendChild(toast);
    toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
    setTimeout(() => toast.remove(), 3000);
}

/*------------ Setup Add to Cart Button Click Handlers ----------*/
let cartButtonsBound = false;
function setupCartButtons() {
    if (!DOM.productGrid || cartButtonsBound) return;
    cartButtonsBound = true;
    DOM.productGrid.addEventListener("click", (e) => {
        const btn = e.target.closest(".cart-btn");
        if (!btn || btn.disabled) return;
        const variantCount = Number(btn.dataset.variantCount);
        if (variantCount > 1) {
            openVariantPopup(btn);
            return;
        }
        addToCart(btn);
    });
}