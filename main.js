// main.js - VERSIÓN FINAL CORREGIDA CON APAGADO FUNCIONAL

$(document).ready(function() {
    let highestZIndex = 100;

    // =================================================================
    // FUNCIONES AUXILIARES PARA LA BARRA DE TAREAS
    // =================================================================

    function createTaskbarTab(windowId, title) {
        if ($(`.taskbar-tab[data-target="#${windowId}"]`).length > 0) {
            return;
        }
        const tab = $(`<button class="taskbar-tab" data-target="#${windowId}">${title}</button>`);
        $('#taskbar-tabs').append(tab);
    }

    function removeTaskbarTab(windowId) {
        $(`.taskbar-tab[data-target="#${windowId}"]`).remove();
    }

    function updateTaskbarActiveState(windowId) {
        $('.taskbar-tab').removeClass('active');
        $(`.taskbar-tab[data-target="#${windowId}"]`).addClass('active');
    }

    // =================================================================
    // MANEJADORES DE EVENTOS PRINCIPALES (USANDO DELEGACIÓN)
    // =================================================================

    // 1. GESTIÓN DE VENTANAS: Traer al frente y activar su pestaña al hacer clic.
    $('#desktop').on('click', '.window', function() {
        // No aplicar a la ventana de apagado que está dentro del overlay
        if ($(this).closest('#shutdown-overlay').length) {
            return;
        }
        const windowId = $(this).attr('id');
        $('.window').removeClass('active');
        $(this).addClass('active');
        highestZIndex++;
        $(this).css('z-index', highestZIndex);
        updateTaskbarActiveState(windowId);
    });

    // 2. ABRIR VENTANAS PREDEFINIDAS desde los iconos del escritorio.
    $('.desktop-icon').on('dblclick', function() {
        const windowId = $(this).data('opens');
        const windowElement = $('#' + windowId);
        const title = $(this).data('title');
        
        windowElement.show();
        createTaskbarTab(windowId, title);
        windowElement.click();
    });
    
    // 3. CREAR Y ABRIR NUEVAS VENTANAS DE PROYECTOS desde "Mis Proyectos".
    $('#desktop').on('click', '.project-icon', function() {
        const projectUrl = $(this).data('url');
        const projectTitle = $(this).data('title');
        const projectDescription = $(this).data('description');
        const windowId = 'window-' + projectTitle.replace(/\s+/g, '-').toLowerCase();

        if ($('#' + windowId).length > 0) {
            $('#' + windowId).show().click();
            return;
        }
        
        const newWindow = `
            <div class="window" id="${windowId}" style="width: 850px; height: 800px; top: 100px; left: 200px;">
                <div class="title-bar">
                    <div class="title-bar-text">${projectTitle}</div>
                    <div class="title-bar-controls">
                        <button aria-label="Minimize" class="minimize-btn"></button>
                        <button aria-label="Maximize"></button>
                        <button aria-label="Close" class="close-btn"></button>
                    </div>
                </div>
                <div class="window-body project-window-body">
                    <div class="iframe-project-content">
                        <iframe src="${projectUrl}" frameborder="0"></iframe>
                    </div>
                    <div class="project-footer">
                        <h4>Descripción</h4>
                        <p>${projectDescription}</p>
                    </div>
                </div>
            </div>`;
        
        $('#desktop').append(newWindow);
        createTaskbarTab(windowId, projectTitle);

        $('#' + windowId).draggable({ 
            handle: '.title-bar', 
            containment: '#desktop', 
            stack: '.window', 
            start: function() { $(this).click(); }
        }).resizable({ 
            minHeight: 400, 
            minWidth: 500
        });

        $('#' + windowId).click();
    });

    // 4. CERRAR CUALQUIER VENTANA y eliminar su pestaña.
    $('#desktop').on('click', '.close-btn', function() {
        const window = $(this).closest('.window');
        const windowId = window.attr('id');
        window.hide();
        removeTaskbarTab(windowId);
    });
    
    // 5. MINIMIZAR CUALQUIER VENTANA (CON ANIMACIÓN Y RESETEO)
    $('#desktop').on('click', '.minimize-btn', function() {
        const window = $(this).closest('.window');
        const windowId = window.attr('id');
        const taskbarTab = $(`.taskbar-tab[data-target="#${windowId}"]`);

        if (window.hasClass('minimizing') || !taskbarTab.length) {
            return;
        }

        const windowOffset = window.offset();
        const tabOffset = taskbarTab.offset();
        const taskbarTop = $('#taskbar').offset().top;
        const windowCenterX = windowOffset.left + window.width() / 2;
        const windowCenterY = windowOffset.top + window.height() / 2;
        const tabCenterX = tabOffset.left + taskbarTab.width() / 2;
        const translateX = tabCenterX - windowCenterX;
        const translateY = taskbarTop - windowCenterY;

        window.css({ '--tx': translateX + 'px', '--ty': translateY + 'px' });
        window.addClass('minimizing');
        $(`.taskbar-tab[data-target="#${windowId}"]`).removeClass('active');

        setTimeout(function() {
            window.hide();
            window.removeClass('minimizing');
            window.css({ 'transform': '', 'opacity': '' });
        }, 300); 
    });

    // 6. RESTAURAR/ACTIVAR VENTANA DESDE LA BARRA DE TAREAS
    $('#taskbar-tabs').on('click', '.taskbar-tab', function() {
        const windowId = $(this).data('target');
        const window = $(windowId);

        if (!window.is(':visible')) {
            window.show();
        }
        
        window.click();
    });

    // =================================================================
    // ===== 7. MANEJADOR PARA EL MENÚ DE INICIO (FUNCIONAL) =====
    // =================================================================
    $('#start-menu').on('click', '.menu-item', function() {
        const windowId = $(this).data('opens');
        if (windowId) {
            const targetIcon = $(`.desktop-icon[data-opens="${windowId}"]`);
            if (targetIcon.length) {
                targetIcon.trigger('dblclick');
            }
            $('#start-menu').hide();
        }
    });

    // =================================================================
    // ===== 8. MANEJADOR PARA LOS BOTONES DE APAGADO (CORREGIDO) =====
    // =================================================================
    $('#start-menu').on('click', '.shutdown-btn', function() {
        $('#start-menu').hide();
        // **LA CORRECCIÓN CLAVE**: Forzamos el display a 'flex' para centrar el contenido
        // y luego usamos fadeIn para la animación de opacidad.
        $('#shutdown-overlay').css('display', 'flex').hide().fadeIn(250);
    });

    $('#close-shutdown-btn').on('click', function() {
        $('#shutdown-overlay').fadeOut(250);
    });

        // ===== 9. MANEJADOR PARA EL FORMULARIO DE CONTACTO (AJAX) =====
    // =================================================================
    $('#contact-form').on('submit', function(event) {
        // 1. Prevenir el envío tradicional del formulario
        event.preventDefault(); 

        const form = $(this);
        const submitButton = $('#submit-btn');
        const statusDiv = $('#form-status');
        const formData = form.serialize(); // Convierte los datos del form para el envío

        // 2. Deshabilitar el botón y mostrar estado de "Enviando"
        submitButton.prop('disabled', true);
        statusDiv.text('Enviando...').removeClass('success error');

        // 3. Realizar la petición AJAX al webhook de n8n
        $.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: formData,
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            success: function(response) {
                // 4. En caso de éxito
                statusDiv.text('¡Mensaje enviado! Gracias.').addClass('success');
                // Opcional: Deshabilitar todo el formulario para evitar reenvíos
                form.find('input, textarea').prop('disabled', true);
            },
            error: function() {
                // 5. En caso de error
                statusDiv.text('Error al enviar.').addClass('error');
                // Volver a habilitar el botón para que el usuario pueda reintentar
                submitButton.prop('disabled', false);
            }
        });
    });

    // =================================================================
    // CÓDIGO INICIAL Y OTRAS FUNCIONALIDADES
    // =================================================================

    $('.desktop-icon').draggable({ containment: '#desktop' });

    // Hacemos que todas las ventanas sean arrastrables y redimensionables, EXCEPTO la de apagado
    $('.window').not('#shutdown-overlay .window').draggable({ 
        handle: '.title-bar', 
        containment: '#desktop', 
        stack: '.window', 
        start: function() { $(this).click(); }
    }).resizable({ 
        minHeight: 150, 
        minWidth: 250 
    });

    $('.tab-bar').on('click', '.tab', function() {
        const targetId = $(this).data('target');
        $(this).addClass('active').siblings().removeClass('active');
        const content = $(this).closest('.window-body').find('.tab-content');
        content.find('#' + targetId).addClass('active').siblings().removeClass('active');
    });

    const startButton = $('#start-button');
    const startMenu = $('#start-menu');
    startButton.on('click', function(event) { 
        event.stopPropagation(); 
        startMenu.toggle(); 
    });
    $(document).on('click', function(event) { 
        if (startMenu.is(':visible') && !startMenu.is(event.target) && startMenu.has(event.target).length === 0) { 
            startMenu.hide(); 
        } 
    });

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        $('#taskbar-clock').text(hours + ':' + minutes + ' ' + ampm);
    }
    setInterval(updateClock, 1000);
    updateClock();
});