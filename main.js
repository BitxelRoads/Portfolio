$(document).ready(function() {
    let highestZIndex = 100;
    let originalProjectsContent = null;
    let originalProjectsTitle = '';

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

    $('#desktop').on('click', '.window', function() {

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

    $('.desktop-icon').on('dblclick', function() {
        const windowId = $(this).data('opens');
        const windowElement = $('#' + windowId);
        const title = $(this).data('title');
        
        windowElement.show();
        createTaskbarTab(windowId, title);
        windowElement.click();

        if (window.matchMedia('(max-width: 768px)').matches) {
            if (windowElement.data('is-game')) {
                windowElement.css({ 'width': '90%', 'height': '80%', 'top': '5%', 'left': '5%' });
            }
            if (windowId === 'window-sobre-mi') {
                windowElement.css({ 'height': 'auto' });
            }
            if (windowId === 'window-navegador') {
                windowElement.css({ 'width': '100%', 'height': '100%', 'top': '0', 'left': '0' });
            }
        }
    });
    
    $('#desktop').on('click', '.project-icon', function() {
        const projectIcon = $(this);
        const projectsWindow = projectIcon.closest('#window-proyectos');

        // Check if on mobile and the icon is inside the "Mis Proyectos" window
        if (window.matchMedia('(max-width: 768px)').matches && projectsWindow.length) {
            // --- MOBILE-ONLY IN-WINDOW NAVIGATION ---
            const projectUrl = projectIcon.data('url');
            const projectTitle = projectIcon.data('title');
            const projectDescription = projectIcon.data('description');
            const windowBody = projectsWindow.find('.window-body');
            const titleBarText = projectsWindow.find('.title-bar-text');

            if (originalProjectsContent === null) {
                originalProjectsContent = windowBody.html();
                originalProjectsTitle = titleBarText.text();
            }

            const newProjectViewHTML = `
                <div class="project-header" style="padding: 5px; background-color: #f0f0f0; border-bottom: 1px solid #ccc; text-align: left; flex-shrink: 0;">
                    <button class="back-to-projects">&lt; Volver</button>
                </div>
                <div class="iframe-project-content">
                    <iframe src="${projectUrl}" frameborder="0"></iframe>
                </div>
                <div class="project-footer">
                    <h4>Descripción</h4>
                    <p>${projectDescription}</p>
                </div>
            `;

            titleBarText.text(projectTitle);
            windowBody.html(newProjectViewHTML).addClass('project-view-body');
            
            projectsWindow.css('position', 'fixed').animate({ height: '100vh', width: '100vw', top: '0', left: '0' }, 250);

        } else {
            // --- DESKTOP LOGIC (opens a new window) ---
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
        }
    });

    // This handler is for the mobile-only back button
    $('#desktop').on('click', '.back-to-projects', function() {
        const projectsWindow = $(this).closest('#window-proyectos');
        const windowBody = projectsWindow.find('.window-body');
        const titleBarText = projectsWindow.find('.title-bar-text');

        if (originalProjectsContent !== null) {
            windowBody.html(originalProjectsContent).removeClass('project-view-body');
            titleBarText.text(originalProjectsTitle);
        }
        
        projectsWindow.css({ position: 'absolute', height: 'auto', width: '', top: '', left: '' });
    });


    $('#desktop').on('click', '.close-btn', function() {
        const window = $(this).closest('.window');
        const windowId = window.attr('id');
        window.hide();
        removeTaskbarTab(windowId);
    });
    

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

    $('#taskbar-tabs').on('click', '.taskbar-tab', function() {
        const windowId = $(this).data('target');
        const window = $(windowId);

        if (!window.is(':visible')) {
            window.show();
        }
        
        window.click();
    });


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


    $('#start-menu').on('click', '.shutdown-btn', function() {
        $('#start-menu').hide();
        $('#shutdown-overlay').css('display', 'flex').hide().fadeIn(250);
    });

    $('#close-shutdown-btn').on('click', function() {
        $('#shutdown-overlay').fadeOut(250);
    });

    $('#contact-form').on('submit', function(event) {
        event.preventDefault(); 

        const form = $(this);
        const submitButton = $('#submit-btn');
        const statusDiv = $('#form-status');
        const formData = form.serialize(); 
        submitButton.prop('disabled', true);
        statusDiv.text('Enviando...').removeClass('success error');

        $.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: formData,
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            success: function(response) {

                statusDiv.text('¡Mensaje enviado! Gracias.').addClass('success');

                form.find('input, textarea').prop('disabled', true);
            },
            error: function() {

                statusDiv.text('Error al enviar.').addClass('error');

                submitButton.prop('disabled', false);
            }
        });
    });

    $('.desktop-icon').draggable({ containment: '#desktop' });
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