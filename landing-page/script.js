// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('.recursos-section, .ia-section, .contato-section').forEach(section => {
    sectionObserver.observe(section);
});

// ===== RECURSOS CARDS STAGGER ANIMATION =====
const recursosSection = document.querySelector('.recursos-section');
if (recursosSection) {
    const cards = recursosSection.querySelectorAll('.recurso-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }, 100);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => cardObserver.observe(card));
}

// ===== PARALLAX EFFECT ON DASHBOARD CARDS =====
const cards = document.querySelectorAll('.dashboard-card');
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
});

function animateCards() {
    cards.forEach((card, index) => {
        const speed = (index + 1) * 8;
        const x = (mouseX - 0.5) * speed;
        const y = (mouseY - 0.5) * speed;

        card.style.transform = `translate(${x}px, ${y}px)`;
    });

    requestAnimationFrame(animateCards);
}

animateCards();

// ===== CHAT DEMO ANIMATION =====
const chatMessages = document.querySelector('.chat-messages');
if (chatMessages) {
    const messages = chatMessages.querySelectorAll('.message');

    // Animate messages on scroll into view
    const chatObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                messages.forEach((msg, index) => {
                    setTimeout(() => {
                        msg.style.opacity = '1';
                        msg.style.transform = 'translateY(0)';
                    }, index * 300);
                });
            }
        });
    }, { threshold: 0.5 });

    if (chatMessages.closest('.ia-section')) {
        chatObserver.observe(chatMessages.closest('.ia-section'));
    }

    // Auto-scroll chat to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== BUTTON ACTIONS =====
const ctaButtons = document.querySelectorAll('.btn-cta, .btn-cta-large');
ctaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Scroll to contato section
        const contatoSection = document.querySelector('#contato');
        if (contatoSection) {
            contatoSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

const primaryButtons = document.querySelectorAll('.btn-primary');
primaryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Scroll to contato
        const contatoSection = document.querySelector('#contato');
        if (contatoSection) {
            contatoSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

const outlineButtons = document.querySelectorAll('.btn-outline');
outlineButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Redirect to login page (when implemented)
        alert('Redirecionando para login...');
        // window.location.href = '/login';
    });
});

// ===== NAVBAR SCROLL EFFECT =====
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.background = 'rgba(26, 26, 26, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'transparent';
        navbar.style.backdropFilter = 'none';
        navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ===== HERO ELEMENTS ANIMATION ON LOAD =====
window.addEventListener('load', () => {
    const heroElements = [
        document.querySelector('.hero-headline'),
        document.querySelector('.hero-text'),
        document.querySelector('.hero-subtext'),
        document.querySelector('.btn-cta')
    ];

    heroElements.forEach((el, index) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.8s ease';

            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 300 + (index * 150));
        }
    });

    // Animate dashboard cards
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 800 + (index * 200));
    });
});

// ===== PERFORMANCE: REDUCE MOTION FOR USERS WHO PREFER IT =====
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
    // Disable animations for users who prefer reduced motion
    document.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none';
        el.style.transition = 'none';
    });
}

// ===== CONSOLE BRANDING =====
console.log('%c🚀 ArenaAi Landing Page', 'font-size: 24px; font-weight: bold; color: #f04f28;');
console.log('%cGestão de Quadras Inteligente', 'font-size: 14px; color: #6b6b6b;');
console.log('%c\nInteressado em trabalhar conosco? Entre em contato!', 'font-size: 12px; color: #1a1a1a;');
