document.addEventListener("DOMContentLoaded", function () {

/*------------ PAGE LOADER - BLUR EFFECT -------------*/
    const pageLoader = document.getElementById('pageLoader');
    const featuredCollection = document.getElementById('featuredCollection');

    /*------------- Loader Hide Function -------------*/
    function hideLoader() {
        if (pageLoader) {
            pageLoader.classList.add('hide');
        }
        if (featuredCollection) {
            featuredCollection.classList.add('loaded');
        }
    }

    /*------------- Force Hide After 2 Seconds (Mobile Fix) -------------*/
    setTimeout(function() {
        hideLoader();
    }, 2000);

    /*------------- Images Load Hone Ka Wait (Desktop Fix) -------------*/
    function waitForImages() {
        const images = document.querySelectorAll('.product-img');
        let loaded = 0;
        const total = images.length;

        if (total === 0) {
            hideLoader();
            return;
        }

        images.forEach(img => {
            if (img.complete) {
                loaded++;
                if (loaded === total) hideLoader();
            } else {
                img.addEventListener('load', function() {
                    loaded++;
                    if (loaded === total) hideLoader();
                });
                img.addEventListener('error', function() {
                    loaded++;
                    if (loaded === total) hideLoader();
                });
            }
        });
    }

    waitForImages();


    /*============= SECTION 1: VENDOR FILTER ==============*/

    const dropdownBtn = document.getElementById('dropdownBtn');
    const dropdownContent = document.getElementById('dropdownContent');
    const checkboxes = document.querySelectorAll('.vendor-checkbox');
    const selectedVendorText = document.getElementById('selectedVendorText');
    const productCards = document.querySelectorAll('.product-card'); // <--- SIRF EK BAAR

    if (dropdownBtn && dropdownContent) {

        dropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('active');
            dropdownContent.classList.toggle('show');
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.custom-dropdown')) {
                dropdownBtn.classList.remove('active');
                dropdownContent.classList.remove('show');
            }
        });

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const value = this.value;

                if (value === 'all' && this.checked) {
                    checkboxes.forEach(cb => {
                        if (cb.value !== 'all') {
                            cb.checked = false;
                        }
                    });
                } else if (this.checked) {
                    const allCheckbox = document.querySelector('.vendor-checkbox[value="all"]');
                    if (allCheckbox) {
                        allCheckbox.checked = false;
                    }
                } else {
                    const anyChecked = Array.from(checkboxes).some(cb => cb.checked && cb.value !== 'all');
                    const allCheckbox = document.querySelector('.vendor-checkbox[value="all"]');
                    if (!anyChecked && allCheckbox) {
                        allCheckbox.checked = true;
                    }
                }

                filterProducts();
                updateSelectedText();
                
                /* ----- TRIGGER ANIMATION ON FILTER CHANGE ----- */
                triggerLoaderAnimation();
            });
        });

        function filterProducts() {
            const selectedVendors = [];
            const allCheckbox = document.querySelector('.vendor-checkbox[value="all"]');
            let visibleCount = 0;

            checkboxes.forEach(cb => {
                if (cb.checked && cb.value !== 'all') {
                    selectedVendors.push(cb.value);
                }
            });

            const showAll = allCheckbox.checked || selectedVendors.length === 0;

            productCards.forEach(card => {
                const cardVendor = card.dataset.vendor;

                if (showAll || selectedVendors.includes(cardVendor)) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            updateProductCount(visibleCount);
        }

        function updateProductCount(count) {
            const countElement = document.getElementById('productCount');
            if (countElement) {
                const totalProducts = productCards.length;
                if (count === totalProducts) {
                    countElement.textContent = count + ' products';
                } else {
                    countElement.textContent = count + ' of ' + totalProducts + ' products';
                }
            }
        }

        function updateSelectedText() {
            const selected = Array.from(checkboxes).filter(cb => cb.checked && cb.value !== 'all');
            const count = selected.length;

            if (selectedVendorText) {
                if (count === 0) {
                    selectedVendorText.textContent = 'All Vendors';
                } else if (count === 1) {
                    const vendorName = selected[0].value;
                    const label = document.querySelector(`.vendor-checkbox[value="${vendorName}"]`)?.closest('.dropdown-item')?.querySelector('span')?.textContent;
                    selectedVendorText.textContent = label || vendorName;
                } else {
                    selectedVendorText.textContent = count + ' Vendors';
                }
            }
        }

        updateSelectedText();
        updateProductCount(productCards.length);
    }


    /*============= SECTION 2: AJAX ADD TO CART ==============*/

    const popup = document.querySelector(".cart-popup");
    const overlay = document.querySelector(".cart-popup-overlay");
    const popupImage = document.getElementById("popup-image");
    const popupTitle = document.getElementById("popup-title");
    const popupQty = document.getElementById("popup-qty");

    function openPopup(img, title, qty = 1) {
        popupImage.src = img;
        popupTitle.textContent = title;
        popupQty.textContent = qty;
        popup.classList.add("active");
        overlay.classList.add("active");
    }

    function closePopup() {
        popup.classList.remove("active");
        overlay.classList.remove("active");
    }

    document.querySelector(".popup-close")?.addEventListener("click", closePopup);
    document.querySelector(".continue-btn")?.addEventListener("click", closePopup);
    overlay?.addEventListener("click", closePopup);

    const forms = document.querySelectorAll(".ajax-cart-form");

    forms.forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const variantId = form.querySelector('input[name="id"]').value;
            const button = form.querySelector("button");

            button.disabled = true;
            button.innerHTML = "Adding...";

            try {
                const response = await fetch("/cart/add.js", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: variantId,
                        quantity: 1
                    })
                });

                if (!response.ok) {
                    throw new Error("Cart Error");
                }

                const card = form.closest(".product-card");
                const img = card.querySelector(".product-img").src;
                const title = card.querySelector(".product-title").textContent;

                openPopup(img, title, 1);

            } catch (err) {
                console.log(err);
                alert("Unable to add product.");
            } finally {
                button.disabled = false;
                button.innerHTML = "Add to Cart";
            }
        });
    });


    /*============= SECTION 3: VARIANT POPUP ==============*/

    const variantPopup = document.querySelector(".variant-popup");
    const variantOverlay = document.querySelector(".variant-popup-overlay");
    const variantImage = document.getElementById("variant-image");
    const variantTitle = document.getElementById("variant-title");
    const variantPrice = document.getElementById("variant-price");
    const variantOptions = document.getElementById("variant-options");
    const qtyInput = document.getElementById("popup-qty-input");
    const qtyPlus = document.querySelector(".qty-plus");
    const qtyMinus = document.querySelector(".qty-minus");
    const variantAddBtn = document.querySelector(".variant-add-btn");
    const variantClose = document.querySelector(".variant-close");
    const variantCancel = document.querySelector(".variant-cancel-btn");

    let currentForm = null;

    function openVariantPopup(form) {
        currentForm = form;

        const card = form.closest(".product-card");
        variantImage.src = card.querySelector(".product-img").src;
        variantTitle.textContent = card.querySelector(".product-title").textContent;
        qtyInput.value = 1;

        const originalSelect = form.querySelector(".variant-select");
        const popupSelect = originalSelect.cloneNode(true);
        popupSelect.id = "popup-variant-select";
        popupSelect.style.display = "block";

        variantOptions.innerHTML = "";
        variantOptions.appendChild(popupSelect);

        const selectedOption = popupSelect.options[popupSelect.selectedIndex];
        variantPrice.textContent = selectedOption.dataset.price;

        popupSelect.addEventListener("change", () => {
            originalSelect.value = popupSelect.value;
            form.querySelector('input[name="id"]').value = popupSelect.value;
            const option = popupSelect.options[popupSelect.selectedIndex];
            variantPrice.textContent = option.dataset.price;
        });

        variantPopup.classList.add("active");
        variantOverlay.classList.add("active");
    }

    document.querySelectorAll(".select-variant-btn").forEach(button => {
        button.addEventListener("click", () => {
            const form = button.closest(".ajax-cart-form");
            openVariantPopup(form);
        });
    });

    function closeVariantPopup() {
        variantPopup.classList.remove("active");
        variantOverlay.classList.remove("active");
    }

    variantClose?.addEventListener("click", closeVariantPopup);
    variantCancel?.addEventListener("click", closeVariantPopup);
    variantOverlay?.addEventListener("click", closeVariantPopup);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeVariantPopup();
        }
    });

    qtyPlus?.addEventListener("click", () => {
        qtyInput.value = Number(qtyInput.value) + 1;
    });

    qtyMinus?.addEventListener("click", () => {
        if (Number(qtyInput.value) > 1) {
            qtyInput.value = Number(qtyInput.value) - 1;
        }
    });

    variantAddBtn?.addEventListener("click", async () => {
        const popupSelect = document.getElementById("popup-variant-select");
        if (!popupSelect) return;

        const variantId = popupSelect.value;
        const quantity = Number(qtyInput.value);

        variantAddBtn.disabled = true;
        variantAddBtn.textContent = "Adding...";

        try {
            const response = await fetch("/cart/add.js", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: variantId,
                    quantity: quantity
                })
            });

            if (!response.ok) {
                throw new Error("Unable to add product");
            }

            closeVariantPopup();
            openPopup(variantImage.src, variantTitle.textContent, quantity);

        } catch (error) {
            console.error(error);
            alert("Unable to add product.");
        } finally {
            variantAddBtn.disabled = false;
            variantAddBtn.textContent = "Add to Cart";
        }
    });


    /* ============================================================ */
    /* SECTION 4: PRODUCTS LOADER WITH LINE ANIMATION               */
    /* ============================================================ */
    
    /*------------- Get Elements -------------*/
    const productsGrid = document.querySelector('.products-grid');
    const loaderLine = document.querySelector('.products-loader-line');
    
    /*------------- Check if elements exist -------------*/
    if (!productsGrid || !loaderLine || productCards.length === 0) {
        console.warn('Products loader elements not found!');
        return;
    }
    
    /*------------- Hide all products initially -------------*/
    function hideAllProducts() {
        productCards.forEach((card) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.pointerEvents = 'none';
        });
    }
    
    /*------------- Show products one by one -------------*/
    function showProductsOneByOne() {
        // Get only visible products (filtered)
        const visibleCards = document.querySelectorAll('.product-card[style*="display: block"]');
        
        // If no visible cards, use all cards
        const cardsToShow = visibleCards.length > 0 ? visibleCards : productCards;
        
        cardsToShow.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.style.pointerEvents = 'auto';
            }, 100 + (index * 80));
        });
    }
    
    /*------------- Reset products for reload -------------*/
    function resetProducts() {
        productCards.forEach((card) => {
            if (card.style.display !== 'none') {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.pointerEvents = 'none';
            }
        });
    }
    
    /*------------- Run Line Animation -------------*/
    function runLineAnimation() {
        return new Promise((resolve) => {
            // Reset line
            loaderLine.style.clipPath = 'inset(0 0 0 0)';
            
            // Force reflow
            void loaderLine.offsetWidth;
            
            // Start animation
            loaderLine.animate(
                [
                    { clipPath: 'inset(0 0 0 0)' },
                    { clipPath: 'inset(0 0 0 100%)' }
                ],
                {
                    duration: 2000,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                }
            );
            
            // Wait for animation to complete
            setTimeout(() => {
                resolve();
            }, 2100);
        });
    }
    
    /*------------- Main Load Function -------------*/
    async function triggerLoaderAnimation() {
        // Step 1: Reset products
        resetProducts();
        
        // Step 2: Run line animation
        await runLineAnimation();
        
        // Step 3: Show products one by one
        showProductsOneByOne();
    }
    
    /*------------- Initial Load -------------*/
    // Hide products first
    hideAllProducts();
    
    // Wait a bit then start loading
    setTimeout(() => {
        triggerLoaderAnimation();
    }, 500);
    
    /*------------- Expose function globally for debugging -------------*/
    window.triggerLoaderAnimation = triggerLoaderAnimation;
    
});