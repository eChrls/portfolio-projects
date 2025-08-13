// Configuración y variables globales
const CHAPTERS = [
    {
        id: 'introduccion',
        title: '1. Introducción al Proyecto',
        subtitle: 'Objetivos, justificación y alcance',
        icon: 'fas fa-rocket',
        file: 'chapters/01-introduccion.md',
        completed: true
    },
    {
        id: 'hardware',
        title: '2. Especificaciones Hardware',
        subtitle: 'Orange Pi 5 Plus - Análisis y justificación',
        icon: 'fas fa-microchip',
        file: 'chapters/02-hardware-specs.md',
        completed: true
    },
    {
        id: 'ubuntu-setup',
        title: '3. Instalación Ubuntu Server',
        subtitle: 'Ubuntu Server 24.04 LTS ARM64',
        icon: 'fab fa-ubuntu',
        file: 'chapters/03-ubuntu-setup.md',
        completed: true
    },
    {
        id: 'network-security',
        title: '4. Red y Seguridad',
        subtitle: 'SSH, Fail2Ban, SSL/TLS',
        icon: 'fas fa-shield-alt',
        file: 'chapters/04-network-security.md',
        completed: true
    },
    {
        id: 'docker-services',
        title: '5. Servicios Docker',
        subtitle: 'Seafile, Portainer, MySQL',
        icon: 'fab fa-docker',
        file: 'chapters/05-docker-services.md',
        completed: true
    },
    {
        id: 'portfolio-deploy',
        title: '6. Despliegue Portfolio',
        subtitle: 'Apache, PHP 8.3, aplicación web',
        icon: 'fas fa-globe',
        file: 'chapters/06-portfolio-deploy.md',
        completed: true
    },
    {
        id: 'monitoring',
        title: '7. Monitorización',
        subtitle: 'Netdata, logs, métricas de sistema',
        icon: 'fas fa-chart-line',
        file: 'chapters/07-monitoring.md',
        completed: true
    },
    {
        id: 'troubleshooting',
        title: '8. Resolución de Problemas',
        subtitle: 'Errores comunes y soluciones',
        icon: 'fas fa-tools',
        file: 'chapters/08-troubleshooting.md',
        completed: true
    },
    {
        id: 'lessons-learned',
        title: '9. Lecciones Aprendidas',
        subtitle: 'Errores, decisiones y mejores prácticas',
        icon: 'fas fa-graduation-cap',
        file: 'chapters/09-lessons-learned.md',
        completed: false
    }
];

// Estado de la aplicación
let currentChapter = null;
let darkMode = true;
let searchVisible = false;

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupEventListeners();
    updateProgress();
    setupSearch();
    
    // Cargar capítulo desde URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const chapterParam = urlParams.get('chapter');
    if (chapterParam) {
        loadChapter(chapterParam);
    }
}

function setupNavigation() {
    const navigationMenu = document.getElementById('navigationMenu');
    navigationMenu.innerHTML = '';
    
    CHAPTERS.forEach((chapter, index) => {
        const navItem = document.createElement('li');
        navItem.innerHTML = `
            <div class="nav-item ${chapter.completed ? 'chapter-completed' : 'chapter-pending'}" data-chapter="${chapter.id}">
                <i class="${chapter.icon}"></i>
                <div class="flex-1">
                    <div class="font-medium">${chapter.title}</div>
                    <div class="text-xs text-slate-400">${chapter.subtitle}</div>
                </div>
                <div class="ml-2">
                    ${chapter.completed ? 
                        '<i class="fas fa-check-circle text-green-400"></i>' : 
                        '<i class="fas fa-circle text-slate-600"></i>'
                    }
                </div>
            </div>
        `;
        navigationMenu.appendChild(navItem);
    });
}

function setupEventListeners() {
    // Navegación de capítulos
    document.addEventListener('click', function(e) {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            const chapterId = navItem.dataset.chapter;
            loadChapter(chapterId);
        }
    });
    
    // Botón volver
    document.getElementById('backButton').addEventListener('click', showWelcomeScreen);
    
    // Toggle tema
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Toggle búsqueda
    document.getElementById('searchToggle').addEventListener('click', toggleSearch);
    
    // Navegación entre capítulos
    document.getElementById('prevChapter').addEventListener('click', goToPreviousChapter);
    document.getElementById('nextChapter').addEventListener('click', goToNextChapter);
    
    // Búsqueda
    document.getElementById('searchInput').addEventListener('input', performSearch);
    
    // Responsive sidebar
    setupResponsiveSidebar();
}

function loadChapter(chapterId) {
    const chapter = CHAPTERS.find(ch => ch.id === chapterId);
    if (!chapter) return;
    
    currentChapter = chapter;
    
    // Actualizar URL sin recargar página
    const url = new URL(window.location);
    url.searchParams.set('chapter', chapterId);
    window.history.pushState({}, '', url);
    
    // Mostrar contenido del capítulo
    showChapterContent();
    
    // Actualizar navegación activa
    updateActiveNavigation(chapterId);
    
    // Cargar contenido markdown
    loadMarkdownContent(chapter.file);
    
    // Actualizar información del capítulo
    updateChapterInfo(chapter);
}

function showWelcomeScreen() {
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('chapterContent').classList.add('hidden');
    currentChapter = null;
    
    // Limpiar URL
    const url = new URL(window.location);
    url.searchParams.delete('chapter');
    window.history.pushState({}, '', url);
    
    // Limpiar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
}

function showChapterContent() {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('chapterContent').classList.remove('hidden');
    document.getElementById('chapterContent').classList.add('fade-in');
}

function updateActiveNavigation(chapterId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-chapter="${chapterId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

async function loadMarkdownContent(filePath) {
    const contentContainer = document.getElementById('markdownContent');
    
    try {
        // Mostrar loading
        contentContainer.innerHTML = '<div class="flex items-center justify-center py-16"><div class="spinner"></div><span class="ml-2">Cargando contenido...</span></div>';
        
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const markdownText = await response.text();
        const htmlContent = marked.parse(markdownText);
        
        contentContainer.innerHTML = htmlContent;
        
        // Aplicar syntax highlighting
        Prism.highlightAllUnder(contentContainer);
        
        // Scroll al top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error cargando contenido:', error);
        contentContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <strong>Error cargando contenido:</strong> ${error.message}
                <br><br>
                <button onclick="loadMarkdownContent('${filePath}')" class="btn btn-secondary mt-2">
                    <i class="fas fa-redo mr-2"></i>Reintentar
                </button>
            </div>
        `;
    }
}

function updateChapterInfo(chapter) {
    const chapterIndex = CHAPTERS.findIndex(ch => ch.id === chapter.id);
    
    document.getElementById('chapterTitle').textContent = chapter.title;
    document.getElementById('chapterSubtitle').textContent = chapter.subtitle;
    document.getElementById('chapterNumber').textContent = `Capítulo ${chapterIndex + 1} de ${CHAPTERS.length}`;
    
    // Actualizar botones de navegación
    const prevButton = document.getElementById('prevChapter');
    const nextButton = document.getElementById('nextChapter');
    
    if (chapterIndex === 0) {
        prevButton.style.visibility = 'hidden';
    } else {
        prevButton.style.visibility = 'visible';
    }
    
    if (chapterIndex === CHAPTERS.length - 1) {
        nextButton.style.visibility = 'hidden';
    } else {
        nextButton.style.visibility = 'visible';
    }
}

function goToPreviousChapter() {
    if (!currentChapter) return;
    
    const currentIndex = CHAPTERS.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex > 0) {
        loadChapter(CHAPTERS[currentIndex - 1].id);
    }
}

function goToNextChapter() {
    if (!currentChapter) return;
    
    const currentIndex = CHAPTERS.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex < CHAPTERS.length - 1) {
        loadChapter(CHAPTERS[currentIndex + 1].id);
    }
}

function updateProgress() {
    const completedChapters = CHAPTERS.filter(ch => ch.completed).length;
    const totalChapters = CHAPTERS.length;
    const percentage = Math.round((completedChapters / totalChapters) * 100);
    
    document.getElementById('progressPercent').textContent = `${percentage}%`;
    document.getElementById('progressBar').style.width = `${percentage}%`;
}

function toggleTheme() {
    darkMode = !darkMode;
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (darkMode) {
        themeIcon.className = 'fas fa-moon';
        document.body.classList.remove('light-theme');
    } else {
        themeIcon.className = 'fas fa-sun';
        document.body.classList.add('light-theme');
    }
    
    localStorage.setItem('darkMode', darkMode);
}

function toggleSearch() {
    searchVisible = !searchVisible;
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    
    if (searchVisible) {
        searchContainer.classList.remove('hidden');
        searchInput.focus();
    } else {
        searchContainer.classList.add('hidden');
        searchInput.value = '';
        clearSearchResults();
    }
}

function setupSearch() {
    // Cargar tema guardado
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
        darkMode = savedDarkMode === 'true';
        if (!darkMode) {
            toggleTheme();
        }
    }
}

function performSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        clearSearchResults();
        return;
    }
    
    const results = CHAPTERS.filter(chapter => 
        chapter.title.toLowerCase().includes(query) ||
        chapter.subtitle.toLowerCase().includes(query)
    );
    
    showSearchResults(results, query);
}

function showSearchResults(results, query) {
    const navigationMenu = document.getElementById('navigationMenu');
    
    // Ocultar elementos que no coincidan
    document.querySelectorAll('.nav-item').forEach(item => {
        const chapterId = item.dataset.chapter;
        const chapter = CHAPTERS.find(ch => ch.id === chapterId);
        
        if (results.includes(chapter)) {
            item.parentElement.style.display = 'block';
            // Resaltar texto coincidente
            highlightSearchTerm(item, query);
        } else {
            item.parentElement.style.display = 'none';
        }
    });
}

function clearSearchResults() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.parentElement.style.display = 'block';
        // Limpiar resaltado
        clearHighlight(item);
    });
}

function highlightSearchTerm(element, term) {
    // Implementación básica de resaltado
    const textNodes = element.querySelectorAll('.font-medium, .text-xs');
    textNodes.forEach(node => {
        const text = node.textContent;
        const highlightedText = text.replace(
            new RegExp(`(${term})`, 'gi'),
            '<mark class="bg-yellow-400 text-black">$1</mark>'
        );
        if (highlightedText !== text) {
            node.innerHTML = highlightedText;
        }
    });
}

function clearHighlight(element) {
    const marks = element.querySelectorAll('mark');
    marks.forEach(mark => {
        mark.outerHTML = mark.textContent;
    });
}

function setupResponsiveSidebar() {
    // Solo para móviles - implementación básica
    if (window.innerWidth <= 768) {
        document.addEventListener('click', function(e) {
            const sidebar = document.getElementById('sidebar');
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isMenuButton = e.target.closest('#menuToggle');
            
            if (!isClickInsideSidebar && !isMenuButton && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// Utilidades adicionales
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Mostrar notificación de éxito
        showNotification('Código copiado al portapapeles', 'success');
    });
}

function showNotification(message, type = 'info') {
    // Implementación básica de notificaciones
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Exportar funciones principales para uso externo
window.OrangePiDocs = {
    loadChapter,
    showWelcomeScreen,
    toggleTheme,
    toggleSearch,
    CHAPTERS
};
