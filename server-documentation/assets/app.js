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
        file: 'chapters/06-portfolio-deploy-new.md',
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
        completed: true
    },
    {
        id: 'future-improvements',
        title: '10. Mejoras Futuras',
        subtitle: 'Ideas, roadmap y siguientes pasos',
        icon: 'fas fa-lightbulb',
        file: 'chapters/10-future-improvements.md',
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
    // Header clickable para volver al inicio
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) {
        headerTitle.addEventListener('click', showWelcomeScreen);
        headerTitle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') showWelcomeScreen();
        });
    }
    // Inicializar modo oscuro correctamente
    setupThemeOnLoad();
});

function setupThemeOnLoad() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
        darkMode = savedDarkMode === 'true';
    }
    applyTheme();
}

function applyTheme() {
    const themeIcon = document.getElementById('themeIcon');
    if (darkMode) {
        document.body.classList.remove('light-theme');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    } else {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

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
            <div class="nav-item flex items-center px-3 py-2 rounded-lg text-slate-300 hover:bg-blue-600/20 hover:text-blue-300 transition-all duration-200 cursor-pointer ${chapter.completed ? 'chapter-completed text-green-400' : 'chapter-pending text-slate-500'}" data-chapter="${chapter.id}">
                <i class="${chapter.icon} w-5 text-center mr-3"></i>
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
    const backBtn = document.getElementById('backButton');
    if (backBtn) backBtn.addEventListener('click', showWelcomeScreen);
    // Toggle tema
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', function() {
        darkMode = !darkMode;
        localStorage.setItem('darkMode', darkMode);
        applyTheme();
    });
    // Toggle búsqueda
    const searchBtn = document.getElementById('searchToggle');
    if (searchBtn) searchBtn.addEventListener('click', toggleSearch);
    // Navegación entre capítulos
    const prevBtn = document.getElementById('prevChapter');
    if (prevBtn) prevBtn.addEventListener('click', goToPreviousChapter);
    const nextBtn = document.getElementById('nextChapter');
    if (nextBtn) nextBtn.addEventListener('click', goToNextChapter);
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', performSearch);
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
            <div class="p-4 rounded-xl border-l-4 mb-6 bg-red-900/20 border-red-500 text-red-300">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <strong>Error cargando contenido:</strong> ${error.message}
                <br><br>
                <button onclick="loadMarkdownContent('${filePath}')" class="px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-slate-700 hover:bg-slate-600 text-slate-300 mt-2">
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

// toggleTheme ya no es necesario, se gestiona con applyTheme y el listener robusto

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
    // Implementación básica de notificaciones con Tailwind
    const notification = document.createElement('div');
    let colorClass = 'bg-blue-600';
    if (type === 'success') colorClass = 'bg-green-600';
    if (type === 'error') colorClass = 'bg-red-600';
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white ${colorClass}`;
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
