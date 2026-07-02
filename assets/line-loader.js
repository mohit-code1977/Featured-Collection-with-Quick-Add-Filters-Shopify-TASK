/*============================================================
  LINE LOADER + PRODUCTS 1 BY 1
  ============================================================*/

document.addEventListener("DOMContentLoaded", function () {

    /*------------- Elements Grab Karo -------------*/
    const lineLoader = document.getElementById('lineLoader');
    const lineLoaderFill = document.getElementById('lineLoaderFill');
    const productCards = document.querySelectorAll('.product-card');

    /*------------- Products Initial State -------------*/
    productCards.forEach(card => {
        card.classList.remove('visible');
    });

    /*------------- Line Animation Function (Slow) -------------*/
    function runLineAnimation(callback) {
        // Line show karo
        lineLoader.classList.add('active');
        lineLoader.classList.remove('hide');
        lineLoaderFill.style.width = '100%';
        lineLoaderFill.classList.remove('complete');

        // Force reflow
        void lineLoaderFill.offsetWidth;

        // 0.5 second baad shrink start (Right to Left)
        setTimeout(() => {
            lineLoaderFill.style.width = '0%';
            lineLoaderFill.classList.add('complete');
        }, 500);

        // Animation complete (3.5 second baad)
        setTimeout(() => {
            lineLoader.classList.remove('active');
            lineLoader.classList.add('hide');
            if (callback) callback();
        }, 3500);
    }

    /*------------- Products Load 1 by 1 -------------*/
    function loadProductsOneByOne() {
        productCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 200);
        });
    }

    /*------------- Page Load Par -------------*/
    // Filter bar pehle visible, phir line animation, phir products
    setTimeout(() => {
        runLineAnimation(() => {
            loadProductsOneByOne();
        });
    }, 600);

    // Fallback: 5 second baad force hide
    setTimeout(() => {
        if (!lineLoader.classList.contains('hide')) {
            lineLoader.classList.add('hide');
            loadProductsOneByOne();
        }
    }, 5000);

    console.log('🔧 Line Loader + Products Load Ready!');

    /*============================================================
      EXPOSE FUNCTION FOR VENDOR FILTER
      ============================================================*/

    window.reloadProductsWithLine = function(callback) {
        // Products hide
        productCards.forEach(card => {
            card.classList.remove('visible');
        });

        // Line animation chalao
        runLineAnimation(() => {
            // Products filter ke baad 1 by 1 show
            if (callback) callback();
        });
    };
});