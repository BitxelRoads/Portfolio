document.addEventListener("DOMContentLoaded", function() {

    const fadeElems = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElems.forEach(elem => {
        observer.observe(elem);
    });


    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            

            alert('Gracias por tu mensaje. Nos pondremos en contacto pronto.');

            this.reset();
        });
    }

});
