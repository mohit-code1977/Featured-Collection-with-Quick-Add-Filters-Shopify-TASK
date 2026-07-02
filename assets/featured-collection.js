document.addEventListener("DOMContentLoaded", function () {

    /* ============================================================ */
    /* SECTION 1: VENDOR FILTER                                      */
    /* ============================================================ */

    const dropdownBtn = document.getElementById('dropdownBtn');
    const dropdownContent = document.getElementById('dropdownContent');
    const checkboxes = document.querySelectorAll('.vendor-checkbox');
    const selectedVendorText = document.getElementById('selectedVendorText');
    const productCards = document.querySelectorAll('.product-card');
    const line = document.getElementById('line');

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

                /* ----- VENDOR CHANGE PAR ANIMATION + PRODUCTS RELOAD ----- */
                setTimeout(() => {
                    loadProductsWithAnimation();
                }, 200);
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


    /* ============================================================ */
    /* SECTION 2: AJAX ADD TO CART                                   */
    /* ============================================================ */

    const popup = document.querySelector(".cart-popup");
    const overlay = document.querySelector(".cart-popup-overlay");
    const popupImage = document.getElementById("popup-image");
    const popupTitle = document.getElementById("popup-title");
    const popupQty = document.getElementById("popup-qty");

    function openPopup(img, title, qty = 1) {
        if (popupImage) popupImage.src = img;
        if (popupTitle) popupTitle.textContent = title;
        if (popupQty) popupQty.textContent = qty;
        if (popup) popup.classList.add("active");
        if (overlay) overlay.classList.add("active");
    }

    function closePopup() {
        if (popup) popup.classList.remove("active");
        if (overlay) overlay.classList.remove("active");
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
                const img = card.querySelector(".product-img")?.src || '';
                const title = card.querySelector(".product-title")?.textContent || 'Product';

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


    /* ============================================================ */
    /* SECTION 3: VARIANT POPUP                                      */
    /* ============================================================ */

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
        if (variantImage) variantImage.src = card.querySelector(".product-img")?.src || '';
        if (variantTitle) variantTitle.textContent = card.querySelector(".product-title")?.textContent || '';
        if (qtyInput) qtyInput.value = 1;

        const originalSelect = form.querySelector(".variant-select");
        if (originalSelect) {
            const popupSelect = originalSelect.cloneNode(true);
            popupSelect.id = "popup-variant-select";
            popupSelect.style.display = "block";

            if (variantOptions) {
                variantOptions.innerHTML = "";
                variantOptions.appendChild(popupSelect);
            }

            const selectedOption = popupSelect.options[popupSelect.selectedIndex];
            if (variantPrice && selectedOption) {
                variantPrice.textContent = selectedOption.dataset.price || '';
            }

            popupSelect.addEventListener("change", () => {
                originalSelect.value = popupSelect.value;
                form.querySelector('input[name="id"]').value = popupSelect.value;
                const option = popupSelect.options[popupSelect.selectedIndex];
                if (variantPrice && option) {
                    variantPrice.textContent = option.dataset.price || '';
                }
            });
        }

        if (variantPopup) variantPopup.classList.add("active");
        if (variantOverlay) variantOverlay.classList.add("active");
    }

    document.querySelectorAll(".select-variant-btn").forEach(button => {
        button.addEventListener("click", () => {
            const form = button.closest(".ajax-cart-form");
            if (form) openVariantPopup(form);
        });
    });

    function closeVariantPopup() {
        if (variantPopup) variantPopup.classList.remove("active");
        if (variantOverlay) variantOverlay.classList.remove("active");
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
        if (qtyInput) qtyInput.value = Number(qtyInput.value) + 1;
    });

    qtyMinus?.addEventListener("click", () => {
        if (qtyInput && Number(qtyInput.value) > 1) {
            qtyInput.value = Number(qtyInput.value) - 1;
        }
    });

    variantAddBtn?.addEventListener("click", async () => {
        const popupSelect = document.getElementById("popup-variant-select");
        if (!popupSelect) return;

        const variantId = popupSelect.value;
        const quantity = Number(qtyInput?.value || 1);

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
            const img = variantImage?.src || '';
            const title = variantTitle?.textContent || 'Product';
            openPopup(img, title, quantity);

        } catch (error) {
            console.error(error);
            alert("Unable to add product.");
        } finally {
            variantAddBtn.disabled = false;
            variantAddBtn.textContent = "Add to Cart";
        }
    });


    /* =========================================================================== */
    /* SECTION 4: PRODUCTS LOADER - SHOWING ALL PRODUCTS AFTER LINE ANIMATION */
    /* =========================================================================== */

    // Hide all products initially
    function hideAllProducts() {
        productCards.forEach((card) => {
            card.classList.remove('visible');
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.pointerEvents = 'none';
        });
    }

    // Show products one by one
    function showProductsOneByOne() {
        const visibleCards = document.querySelectorAll('.product-card[style*="display: block"]');
        const cardsToShow = visibleCards.length > 0 ? visibleCards : productCards;

        cardsToShow.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.style.pointerEvents = 'auto';
            }, 150 + (index * 100));
        });
    }

    // Reset products (hide again)
    function resetProducts() {
        productCards.forEach((card) => {
            card.classList.remove('visible');
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.pointerEvents = 'none';
        });
    }

    // Line animation with Promise (waits for completion)
    function runLineAnimationPromise() {
        return new Promise((resolve) => {
            if (!line) {
                console.warn('Line element not found!');
                resolve();
                return;
            }

            // Cancel existing animations
            line.getAnimations().forEach((a) => a.cancel());

            // Reset to full visible
            line.style.clipPath = 'inset(0 0 0 0)';

            // Force reflow
            void line.offsetWidth;

            // Start animation
            line.animate(
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

            // Wait for animation to complete (2 seconds)
            setTimeout(() => {
                resolve();
            }, 2100);
        });
    }

    // Main function - hides products, runs animation, shows products
    async function loadProductsWithAnimation() {
        resetProducts();
        await runLineAnimationPromise();
        showProductsOneByOne();
    }


    /* ============================================================ */
    /* INITIAL LOAD - PAGE LOAD PAR ANIMATION + PRODUCTS            */
    /* ============================================================ */

    // Pehle saare products hide karo
    hideAllProducts();

    // Some wait after animation + products load karo
    setTimeout(() => {
        loadProductsWithAnimation();
    }, 400);

    // Expose function globally for debugging
    window.loadProductsWithAnimation = loadProductsWithAnimation;

});