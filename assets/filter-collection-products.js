"use strict";

const DOM = {};

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("shopify:section:load", init);

function init() {
    cacheDOM();
    bindEvents();
    updateProductCount();
    toggleNoProducts();
    toggleClearFiltersButton();

}

function cacheDOM() {
    DOM.searchInput = document.getElementById("searchFilter");
    DOM.vendorFilters = document.querySelectorAll(".vendor-filter");
    DOM.availabilityFilters = document.querySelectorAll(".availability-filter");
    DOM.priceMin = document.getElementById("priceMin");
    DOM.priceMax = document.getElementById("priceMax");
    DOM.priceMinDisplay = document.getElementById("priceMinDisplay");
    DOM.priceMaxDisplay = document.getElementById("priceMaxDisplay");
    DOM.clearBtn = document.getElementById("clearFiltersBtn");
    DOM.sortForm = document.getElementById("sortForm");
    DOM.productGrid = document.getElementById("product-grid");
    DOM.productCards = [...document.querySelectorAll(".product-card")];
    DOM.productCount = document.getElementById("product-count");
    DOM.noProducts = document.getElementById("noProductsMessage");
}


function bindEvents() {
    setupSearch();
    setupVendorFilters();
    setupAvailabilityFilters();
    setupPriceFilter();
    setupSorting();
    setupClearFilters();
    setupCartButtons();

    setupVendorDropdown();
}

function setupSearch() {
    if (!DOM.searchInput) return;

    let timer;

    DOM.searchInput.addEventListener("input", e => {
        clearTimeout(timer);

        timer = setTimeout(() => {
            searchProducts(e.target.value.trim().toLowerCase());
        }, 250);
    });
}

function searchProducts(keyword) {
    DOM.productCards.forEach(card => {
        const title = card.dataset.title || "";
        const vendor = card.dataset.vendor || "";

        const match =
            keyword === "" ||
            title.includes(keyword) ||
            vendor.includes(keyword);

        card.style.display = match ? "" : "none";
    });

    updateProductCount();
    toggleNoProducts();
}


function updateProductCount() {
    if (!DOM.productCount) return;

    const visible = DOM.productCards.filter(card =>
        card.style.display !== "none"
    ).length;

    const total = Number(DOM.productCount.dataset.totalProducts);

    DOM.productCount.textContent =
        `Showing ${visible} of ${total} Products`;
}

function toggleNoProducts() {
    if (!DOM.noProducts) return;

    const hasVisible = DOM.productCards.some(card => {
        return card.style.display !== "none";
    });

    DOM.noProducts.style.display = hasVisible ? "none" : "block";
}

function getURL() {
    return new URL(window.location.href);
}

function setupVendorFilters() {
    DOM.vendorFilters.forEach(filter => {
        filter.addEventListener("change", applyFilters);
    });
}

function setupAvailabilityFilters() {
    DOM.availabilityFilters.forEach(filter => {
        filter.addEventListener("change", applyFilters);
    });
}

function setupPriceFilter() {
    if (!DOM.priceMin || !DOM.priceMax) return;

    const url = getURL();

    // Shopify's filter.v.price.gte / .lte URL params are already in the
    // shop's major currency unit (rupees), same as what's displayed on
    // the page. No conversion needed here — only `filter.range_max`
    // (used above in Liquid) comes in the subunit and needs /100.
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

    // change fires reliably on mouse-up / key-up release for range inputs
    DOM.priceMin.addEventListener("change", applyFilters);
    DOM.priceMax.addEventListener("change", applyFilters);
}

function updatePriceDisplay() {
    if (DOM.priceMinDisplay) {
        DOM.priceMinDisplay.textContent =
            `Min : ₹${Number(DOM.priceMin.value).toLocaleString("en-IN")}`;
    }

    if (DOM.priceMaxDisplay) {
        DOM.priceMaxDisplay.textContent =
            `Max : ₹${Number(DOM.priceMax.value).toLocaleString("en-IN")}`;
    }
}

function applyFilters() {
    const url = getURL();

    // Remove existing filter params before rebuilding them
    DOM.vendorFilters.forEach(filter => {
        url.searchParams.delete(filter.name);
    });

    DOM.availabilityFilters.forEach(filter => {
        url.searchParams.delete(filter.name);
    });

    url.searchParams.delete("filter.v.price.gte");
    url.searchParams.delete("filter.v.price.lte");
    url.searchParams.delete("page");

    // Re-add checked vendor filters
    DOM.vendorFilters.forEach(filter => {
        if (filter.checked) {
            url.searchParams.append(filter.name, filter.value);
        }
    });

    // Re-add checked availability filters
    DOM.availabilityFilters.forEach(filter => {
        if (filter.checked) {
            url.searchParams.append(filter.name, filter.value);
        }
    });

    // Re-add price range only when it differs from the full range.
    // Send the value as-is (major currency unit) — Shopify's
    // filter.v.price.gte / .lte expect the same scale as the displayed price.
    if (DOM.priceMin && +DOM.priceMin.value > Number(DOM.priceMin.min)) {
        url.searchParams.set("filter.v.price.gte", DOM.priceMin.value);
    }

    if (DOM.priceMax && +DOM.priceMax.value < Number(DOM.priceMax.max)) {
        url.searchParams.set("filter.v.price.lte", DOM.priceMax.value);
    }

    // Preserve current sort selection so it doesn't reset when a filter changes
    const sortSelect = document.querySelector("#sortForm select[name='sort_by']");
    if (sortSelect && sortSelect.value) {
        url.searchParams.set("sort_by", sortSelect.value);
    }

    window.location.href = url.toString();
}

function setupClearFilters() {
    if (!DOM.clearBtn) return;

    DOM.clearBtn.addEventListener("click", () => {
        // Full URL reset: just origin + pathname, no query params at all.
        // This naturally clears vendor, availability, price AND sort_by,
        // since none of them are carried over.
        const url = new URL(window.location.origin + window.location.pathname);

        window.location.href = url.toString();
    });
}

function setupCartButtons() {
    if (!DOM.productGrid) return;

    DOM.productGrid.addEventListener("click", async (e) => {
        const btn = e.target.closest(".cart-btn");

        if (!btn || btn.disabled) return;

        await addToCart(btn);
    });
}

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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                items: [{
                    id: Number(variantId),
                    quantity: 1
                }]
            })
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

async function updateCartCount() {
    try {
        const cart = await fetch("/cart.js").then(res => res.json());

        document.querySelectorAll(".cart-count").forEach(count => {
            count.textContent = cart.item_count;
            count.style.display = cart.item_count ? "inline-flex" : "none";
        });

    } catch (error) {
        // Silently fail - cart count update is not critical
    }
}

function showToast(message, type = "success") {
    // Remove existing toast
    document.querySelector(".custom-toast")?.remove();

    const toast = document.createElement("div");

    toast.className = `custom-toast ${type}`;

    toast.innerHTML = `
        <span>${message}</span>
        <button type="button" class="toast-close">&times;</button>
    `;

    document.body.appendChild(toast);

    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.remove();
    });

    setTimeout(() => {
        toast.remove();
    }, 3000);
}



function setupSorting() {
    const sortSelect = document.getElementById("sortSelect");

    if (!sortSelect) return;

    sortSelect.addEventListener("change", (e) => {
        const url = new URL(window.location.href);

        url.searchParams.set("sort_by", e.target.value);

        url.searchParams.delete("page");

        window.location.href = url.toString();
    });
}




/*---------- When Filter Select Only Then Clear Filter Button Show -----------*/ 
function toggleClearFiltersButton() {
    if (!DOM.clearBtn) return;

    const url = new URL(window.location.href);

    const hasVendorFilter =
        [...DOM.vendorFilters].some(filter => filter.checked);

    const hasAvailabilityFilter =
        [...DOM.availabilityFilters].some(filter => filter.checked);

    const hasPriceFilter =
        (DOM.priceMin && +DOM.priceMin.value > +DOM.priceMin.min) ||
        (DOM.priceMax && +DOM.priceMax.value < +DOM.priceMax.max);

    const sortValue = url.searchParams.get("sort_by");

    const hasSortFilter =
        sortValue && sortValue !== "manual";

    const hasActiveFilters =
        hasVendorFilter ||
        hasAvailabilityFilter ||
        hasPriceFilter ||
        hasSortFilter;

    DOM.clearBtn.classList.toggle("show", hasActiveFilters);
}





/*--------- Filter Dropdown Menu ---------*/ 

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