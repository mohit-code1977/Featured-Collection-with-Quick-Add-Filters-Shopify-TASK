/*============================================================
  LINE ANIMATION - LEFT TO RIGHT (FADE OUT)
  ============================================================*/

document.addEventListener("DOMContentLoaded", function () {

    /*------------- Elements Grab Karo -------------*/
    const lineLoader = document.getElementById('lineLoader');
    const lineLoaderFill = document.getElementById('lineLoaderFill');

    /*------------- Line Animation Function (Slow Fade Out) -------------*/
    function runLineAnimation(callback) {
        // Line show karo (Full width)
        lineLoader.classList.add('active');
        lineLoaderFill.style.width = '100%';
        lineLoaderFill.classList.remove('complete');

        // Force reflow (smooth transition ke liye)
        void lineLoaderFill.offsetWidth;

        // 1 second baad line fade out start
        setTimeout(() => {
            lineLoaderFill.style.width = '0%';
            lineLoaderFill.classList.add('complete');
        }, 300);

        // Animation complete (1.8 second baad)
        setTimeout(() => {
            lineLoader.classList.remove('active');
            if (callback) callback();
        }, 1800);
    }

    /*------------- Page Load Par Animation -------------*/
    setTimeout(() => {
        runLineAnimation(() => {
            console.log('✅ Line Animation Complete!');
        });
    }, 500);

    /*------------- Button Click Par Animation -------------*/
    const testBtn = document.getElementById('testBtn');
    if (testBtn) {
        testBtn.addEventListener('click', function() {
            runLineAnimation(() => {
                console.log('✅ Line Animation Complete (Button Click)!');
            });
        });
    }

    /*------------- Manual Control -------------*/
    window.runLine = runLineAnimation;

    console.log('🔧 Line Animation Loaded!');
    console.log('💡 Call: runLineAnimation(() => { console.log("Done!"); })');
});