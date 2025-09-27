document.addEventListener("DOMContentLoaded", function() {

    // --- Animación de Fade-in al Desplazarse ---
    const fadeElems = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null, // el viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% del elemento debe ser visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Opcional: dejar de observar el elemento una vez que es visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElems.forEach(elem => {
        observer.observe(elem);
    });

    // --- Manejo del Formulario de Contacto (Ejemplo) ---
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Previene el envío real del formulario
            
            // Aquí iría la lógica para enviar el formulario (ej. con Fetch API, Axios, etc.)
            // Por ahora, solo mostramos una alerta.
            alert('Gracias por tu mensaje. Nos pondremos en contacto pronto.');

            // Limpia el formulario después del envío
            this.reset();
        });
    }

});