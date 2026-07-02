let allProducts = [];

//----  ---- Search Filter 
const seachFilter = document.querySelector(".search-filter");

//---- Sorting Filter ---- 
const sortFilter = document.querySelector(".sort-filter");

//---- Categories ----
const vendorCategories = document.querySelectorAll(".vendor-filter");

//---- Available Stock ---- 
const stockFilter = document.querySelectorAll(".stock-availability-filter");

//---- Price Range ----
const priceRange = document.querySelectorAll(".price-filter");

//---- Products ---- 
let products = [];

//---- Store main collection products ----
let originalProducts = [];

//---- Collections ----
const defaultCollection = window.location.pathname.split("/").pop();

function initializeProducts() {
    products = document.querySelectorAll(".product-card");
    originalProducts = [...products];
}

/*---------- Store actual collection when html/page has load ---------*/
document.addEventListener("DOMContentLoaded", async () => {
    initializeProducts();
    
    try {
        const response = await fetch("/products.json?limit=250");
        const data = await response.json();
        allProducts = data.products;
        console.log("Products loaded:", allProducts.length);
    } catch (error) {
        console.error("Error loading products:", error);
    }
});

/*------------ Object ------------*/
const filters = {
    search: "",
    sort: "",
    vendor: [],
    stock: "",
    price: []
};

/*------------ Search Filter -------------*/
seachFilter.addEventListener("input", (event) => {
    filters.search = event.target.value.toLowerCase().trim();
    applyAllFilters();
});

/*------------- Sort Filter ------------*/
sortFilter.addEventListener("change", (e) => {
    applySorting();
});

/*------------- Stock Available Filter --------------*/
stockFilter.forEach((item) => {
    item.addEventListener("change", (e) => {
        if (e.target.checked) {
            filters.stock = e.target.value;
        } else {
            filters.stock = "";
        }
        applyAllFilters();
    });
});

/*-------------- Price Range Filter --------------*/
priceRange.forEach((item) => {
    item.addEventListener("change", (e) => {
        if (e.target.checked) {
            filters.price.push(e.target.value);
        } else {
            filters.price = filters.price.filter((range) => {
                return range !== e.target.value;
            });
        }
        applyAllFilters();
    });
});

/*------------ Filter Vendor Categories ------------*/
vendorCategories.forEach((item) => {
    item.addEventListener("change", (e) => {
        if (e.target.checked) {
            filters.vendor.push(e.target.value);
        } else {
            filters.vendor = filters.vendor.filter((ven) => {
                return ven !== e.target.value;
            });
        }
        console.log("Vendor filters:", filters.vendor);
        applyAllFilters();
    });
});

/*---------- Main Filter Function ------------*/
function applyAllFilters() {
    // First, check if we have vendor filters - reload products if needed
    if (filters.vendor.length > 0) {
        loadProducts();
    } else {
        // Reset to original products if no vendor filter
        renderProducts(allProducts);
    }
    
    // Then apply other filters on the rendered products
    applyFilters();
}

/*---------- Load Products with Vendor Filter ------------*/
async function loadProducts() {
    let filteredProducts = [...allProducts];

    if (filters.vendor.length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
            if (!product.vendor) return false;
            const vendorHandle = product.vendor.toLowerCase().replace(/\s+/g, '-');
            return filters.vendor.includes(vendorHandle);
        });
    }

    renderProducts(filteredProducts);
}

/*---------- Render Products ------------*/
function renderProducts(productList) {
    const productGrid = document.querySelector(".product-grid");
    if (!productGrid) return;

    productGrid.innerHTML = "";

    if (productList.length === 0) {
        productGrid.innerHTML = `
            <div class="no-products">
                <p>No products found matching your filters.</p>
            </div>
        `;
        return;
    }

    productList.forEach((product) => {
        const variant = product.variants[0];
        const imageSrc = product.images[0]?.src || "";
        const comparePrice = variant.compare_at_price ? `₹${variant.compare_at_price}` : "";
        const price = variant.price ? `₹${variant.price}` : "₹0";
        const available = variant.available ? "true" : "false";

        productGrid.innerHTML += `
            <article
                class="product-card"
                data-title="${product.title.toLowerCase()}"
                data-price="${Number(variant.price) * 100 || 0}"
                data-stock="${available}"
                data-vendor="${product.vendor ? product.vendor.toLowerCase().replace(/\s+/g, '-') : ''}"
                data-created="${new Date(product.created_at).getTime()}">
                
                <div class="product-image">
                    <img src="${imageSrc}" alt="${product.title}">
                </div>

                <div class="product-info">
                    <span class="vendor">${product.vendor || 'Unknown'}</span>
                    <h3>${product.title}</h3>
                    <div class="price">
                        ${comparePrice ? `<span class="old-price">${comparePrice}</span>` : ''}
                        <span class="new-price">${price}</span>
                    </div>
                    <button class="cart-btn">Add To Cart</button>
                </div>
            </article>
        `;
    });

    // Update products array
    products = document.querySelectorAll(".product-card");
    originalProducts = [...products];
    
    // Update product count
    updateProductCount();
}

/*------------ Apply All Filters -----------*/
function applyFilters() {
    products.forEach((product) => {
        let visible = true;

        //---- Search Logic -----    
        if (filters.search && !product.dataset.title.includes(filters.search)) {
            visible = false;
        }

        //---- Stock Logic ----
        if (filters.stock) {
            const stock = product.dataset.stock;
            if (filters.stock !== stock) {
                visible = false;
            }
        }

        //---- Price Range Filter ---- 
        if (filters.price.length > 0 && visible) {
            const productPrice = Number(product.dataset.price);
            let priceMatch = false;

            filters.price.forEach((range) => {
                const [min, max] = range.split("-");
                
                if (max === "max") {
                    if (productPrice >= Number(min)) {
                        priceMatch = true;
                    }
                } else {
                    if (productPrice >= Number(min) && productPrice <= Number(max)) {
                        priceMatch = true;
                    }
                }
            });
            
            if (!priceMatch) {
                visible = false;
            }
        }

        //---- Vendor Filter (already applied in loadProducts, but double-check) ----
        if (filters.vendor.length > 0 && visible) {
            const productVendor = product.dataset.vendor;
            if (!filters.vendor.includes(productVendor)) {
                visible = false;
            }
        }

        //---- Update Display ----
        product.style.display = visible ? "block" : "none";
    });

    updateProductCount();
}

/*------------ Update Product Count ------------*/
function updateProductCount() {
    const productCountElement = document.getElementById('product-count');
    if (productCountElement) {
        const visibleProducts = document.querySelectorAll('.product-card[style*="display: block"]');
        const count = visibleProducts.length || document.querySelectorAll('.product-card:not([style*="display: none"])').length;
        productCountElement.textContent = count || 0;
    }
}

/*-------------Products Sorting --------------*/
function applySorting() {
    const productGrid = document.querySelector(".product-grid");
    if (!productGrid) return;

    // Get currently visible products
    let productArray = [...document.querySelectorAll(".product-card")]
        .filter(card => card.style.display !== "none");

    if (productArray.length === 0) {
        productArray = [...document.querySelectorAll(".product-card")];
    }

    //---- manual ----
    if (sortFilter.value === "manual") {
        productArray = [...originalProducts].filter(card => 
            card.style.display !== "none"
        );
    }

    //---- price-ascending ----
    if (sortFilter.value === "price-ascending") {
        productArray.sort((a, b) => {
            const priceA = Number(a.dataset.price);
            const priceB = Number(b.dataset.price);
            return priceA - priceB;
        });
    }

    //---- price-descending ----
    if (sortFilter.value === "price-descending") {
        productArray.sort((a, b) => {
            const priceA = Number(a.dataset.price);
            const priceB = Number(b.dataset.price);
            return priceB - priceA;
        });
    }

    //---- created-descending ----
    if (sortFilter.value === "created-descending") {
        productArray.sort((a, b) => {
            const createdA = Number(a.dataset.created);
            const createdB = Number(b.dataset.created);
            return createdB - createdA;
        });
    }

    //---- Update products on page ----
    productArray.forEach((item) => {
        productGrid.appendChild(item);
    });
}












