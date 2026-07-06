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

    // function cacheDOM() {
    //     DOM.searchInput = document.getElementById("searchFilter");
    //     DOM.vendorFilters = document.querySelectorAll(".vendor-filter");
    //     DOM.availabilityFilters = document.querySelectorAll(".availability-filter");
    //     DOM.priceMin = document.getElementById("priceMin");
    //     DOM.priceMax = document.getElementById("priceMax");
    //     DOM.priceMinDisplay = document.getElementById("priceMinDisplay");
    //     DOM.priceMaxDisplay = document.getElementById("priceMaxDisplay");
    //     DOM.clearBtn = document.getElementById("clearFiltersBtn");
    //     DOM.sortForm = document.getElementById("sortForm");
    //     DOM.productGrid = document.getElementById("product-grid");
    //     DOM.productCards = [...document.querySelectorAll(".product-card")];
    //     DOM.productCount = document.getElementById("product-count");
    //     DOM.noProducts = document.getElementById("noProductsMessage");


    //     //---- Product Variant Pop-up box
    //     DOM.variantModal = document.getElementById("variantModal");
    //     DOM.variantPopup = document.querySelector(".variant-popup");
    //     DOM.variantOverlay = document.querySelector(".variant-overlay");
    //     DOM.variantClose = document.querySelector(".variant-close");
    //     DOM.popupCancel = document.querySelector(".popup-cancel");

    //     DOM.popupTitle = document.getElementById("popupTitle");
    //     DOM.popupVendor = document.getElementById("popupVendor");
    //     DOM.popupImage = document.getElementById("popupProductImage");
    //     DOM.popupPrice = document.getElementById("popupPrice");
    //     DOM.popupComparePrice = document.getElementById("popupComparePrice");
    //     DOM.popupDescription = document.getElementById("popupDescription");
    //     DOM.popupOptions = document.getElementById("popupOptions");

    //         DOM.popupQty = document.getElementById("popupQty");

    // }



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
    
    // Variant Popup - Main Elements
    DOM.variantModal = document.getElementById("variantModal");
    DOM.variantPopup = document.querySelector(".variant-popup");
    DOM.variantOverlay = document.querySelector(".variant-overlay");
    DOM.variantClose = document.querySelector(".variant-close");
    DOM.popupCancel = document.querySelector(".popup-cancel");
    
    // Variant Popup - Content Elements
    DOM.popupTitle = document.getElementById("popupTitle");
    DOM.popupVendor = document.getElementById("popupVendor");
    DOM.popupImage = document.getElementById("popupProductImage");
    DOM.popupPrice = document.getElementById("popupPrice");
    DOM.popupComparePrice = document.getElementById("popupComparePrice");
    DOM.popupDescription = document.getElementById("popupDescription");
    DOM.popupOptions = document.getElementById("popupOptions");
    DOM.popupQty = document.getElementById("popupQty");  
    
    // Current product reference
    DOM.currentProduct = null;
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
        setupVariantPopup();
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
            const url = new URL(window.location.origin + window.location.pathname);

            window.location.href = url.toString();
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





    /*---------- Variant Pop-up Functions ----------*/

    function renderVariantOptions(product) {
        DOM.popupOptions.innerHTML = "";
        
        if (!product.options || product.options.length === 0) {
            DOM.popupOptions.style.display = "none";
            return;
        }
        
        DOM.popupOptions.style.display = "flex";
        
        product.options.forEach((option, index) => {
            // Create option group
            const group = document.createElement("div");
            group.className = "option-group";
            
            // Create label
            const label = document.createElement("label");
            label.textContent = option.name;
            group.appendChild(label);
            
            // Create values container
            const valuesDiv = document.createElement("div");
            valuesDiv.className = "option-values";
            
            // Get unique values for this option
            const values = [...new Set(product.variants.map(v => v.options[index]))];
            
            values.forEach((value, i) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = value;
                btn.dataset.optionIndex = index;
                btn.dataset.value = value;
                
                // First value is active by default
                if (i === 0) {
                    btn.classList.add("active");
                }
                
                // Click handler for variant selection
                btn.addEventListener("click", function() {
                    // Remove active from siblings
                    const siblings = this.closest(".option-values").querySelectorAll("button");
                    siblings.forEach(b => b.classList.remove("active"));
                    this.classList.add("active");
                    
                    // Update variant info
                    updateVariantInfo(product);
                });
                
                valuesDiv.appendChild(btn);
            });
            
            group.appendChild(valuesDiv);
            DOM.popupOptions.appendChild(group);
        });
        
        // Set initial variant
        updateVariantInfo(product);
    }

    function updateVariantInfo(product) {
        // Get selected options
        const selectedOptions = [];
        const optionGroups = DOM.popupOptions.querySelectorAll(".option-group");
        
        optionGroups.forEach(group => {
            const activeBtn = group.querySelector(".option-values .active");
            if (activeBtn) {
                selectedOptions.push(activeBtn.textContent);
            }
        });
        
        // Find matching variant
        let selectedVariant = null;
        
        if (selectedOptions.length === product.options.length) {
            selectedVariant = product.variants.find(variant => {
                return variant.options.every((opt, index) => {
                    return opt === selectedOptions[index];
                });
            });
        }
        
        // If no variant found, use first available
        if (!selectedVariant) {
            selectedVariant = product.variants.find(v => v.available) || product.variants[0];
        }
        
        if (selectedVariant) {
            // Update price
            const price = selectedVariant.price / 100;
            DOM.popupPrice.textContent = `₹${price.toLocaleString("en-IN")}`;
            
            // Update compare price
            if (selectedVariant.compare_at_price && selectedVariant.compare_at_price > selectedVariant.price) {
                DOM.popupComparePrice.textContent = `₹${(selectedVariant.compare_at_price / 100).toLocaleString("en-IN")}`;
                DOM.popupComparePrice.style.display = "inline";
            } else {
                DOM.popupComparePrice.textContent = "";
                DOM.popupComparePrice.style.display = "none";
            }
            
            // Update add to cart button with variant ID
            const addBtn = document.querySelector(".popup-add-cart");
            if (addBtn) {
                addBtn.dataset.variantId = selectedVariant.id;
                addBtn.textContent = `Add To Cart - ₹${price.toLocaleString("en-IN")}`;
                
                // Disable if out of stock
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
            
            // Update image if variant has different image
            if (selectedVariant.featured_image) {
                DOM.popupImage.src = selectedVariant.featured_image.src;
            }
        }
    }

    async function openVariantPopup(btn) {
    const handle = btn.dataset.productHandle;
    
    try {
        const response = await fetch(`/products/${handle}.js`);
        const product = await response.json();
        
        // Store product for later use
        DOM.currentProduct = product;
        
        // Set basic info
        DOM.popupTitle.textContent = product.title;
        DOM.popupVendor.textContent = product.vendor;
        DOM.popupDescription.innerHTML = product.description;
        DOM.popupImage.src = product.featured_image;
        DOM.popupImage.alt = product.title;
        
        // Set price
        const price = product.price / 100;
        DOM.popupPrice.textContent = `₹${price.toLocaleString("en-IN")}`;
        
        if (product.compare_at_price > product.price) {
            DOM.popupComparePrice.textContent = `₹${(product.compare_at_price / 100).toLocaleString("en-IN")}`;
            DOM.popupComparePrice.style.display = "inline";
        } else {
            DOM.popupComparePrice.textContent = "";
            DOM.popupComparePrice.style.display = "none";
        }
        
        // Render variant options
        renderVariantOptions(product);
        
        // 🔥 YEH CHECK ADD KAREIN 🔥
        if (DOM.popupQty) {
            DOM.popupQty.value = 1;
        }
        
        // Show modal
        DOM.variantModal.classList.remove("hide");
        document.body.style.overflow = "hidden";
        
    } catch (error) {
        console.error("Error loading product:", error);
        showToast("Failed to load product details", "error");
    }
}

    function closeVariantPopup() {
        DOM.variantModal.classList.add("hide");
        document.body.style.overflow = "";
    }

    function setupVariantPopup() {
        // Close buttons
        if (DOM.variantClose) {
            DOM.variantClose.addEventListener("click", closeVariantPopup);
        }
        
        if (DOM.variantOverlay) {
            DOM.variantOverlay.addEventListener("click", closeVariantPopup);
        }
        
        if (DOM.popupCancel) {
            DOM.popupCancel.addEventListener("click", closeVariantPopup);
        }
        
        // Quantity controls
        const qtyMinus = document.querySelector(".qty-minus");
        const qtyPlus = document.querySelector(".qty-plus");
        
        if (qtyMinus) {
            qtyMinus.addEventListener("click", function() {
                let val = parseInt(DOM.popupQty.value, 10) || 1;
                if (val > 1) {
                    DOM.popupQty.value = val - 1;
                }
            });
        }
        
        if (qtyPlus) {
            qtyPlus.addEventListener("click", function() {
                let val = parseInt(DOM.popupQty.value, 10) || 1;
                const max = parseInt(DOM.popupQty.max, 10) || 999;
                if (val < max) {
                    DOM.popupQty.value = val + 1;
                }
            });
        }
        
        if (DOM.popupQty) {
            DOM.popupQty.addEventListener("change", function() {
                let val = parseInt(this.value, 10);
                if (isNaN(val) || val < 1) {
                    this.value = 1;
                }
                const max = parseInt(this.max, 10) || 999;
                if (val > max) {
                    this.value = max;
                }
            });
        }
        
        // Add to cart from popup
        const addToCartPopup = document.querySelector(".popup-add-cart");
        if (addToCartPopup) {
            addToCartPopup.addEventListener("click", function() {
                const variantId = this.dataset.variantId;
                const quantity = parseInt(DOM.popupQty.value, 10) || 1;
                
                if (!variantId) {
                    showToast("Please select a variant", "error");
                    return;
                }
                
                // Call existing addToCart function with quantity
                addToCartWithQuantity(variantId, quantity);
            });
        }
        
        // Close on Escape key
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && !DOM.variantModal.classList.contains("hide")) {
                closeVariantPopup();
            }
        });
    }

    async function addToCartWithQuantity(variantId, quantity) {
        const btn = document.querySelector(".popup-add-cart");
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
                        quantity: quantity
                    }]
                })
            });
            
            if (!response.ok) throw new Error();
            
            btn.textContent = "Added ✓";
            await updateCartCount();
            showToast(`Added ${quantity} item(s) to cart`);
            
            // Close popup after short delay
            setTimeout(() => {
                closeVariantPopup();
            }, 1000);
            
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

    // Update the existing setupCartButtons function
    // Replace your existing setupCartButtons with this:
    function setupCartButtons() {
        if (!DOM.productGrid) return;
        
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


