// ZenQOJ keeps useful contest information visible while removing comparison
// signals and testcase spoilers. Selectors are intentionally header-driven so
// the extension tolerates QOJ markup changes and dynamically-built tables.

(() => {
    'use strict';

    const path = window.location.pathname;
    const isProblemsPage = /^\/problems\/?$/.test(path);
    const isContestStandings = /^\/contest\/[^/]+\/standings(?:\/external)?\/?$/.test(path);
    const verdictNumberPattern = /\b(?:pre)?test(?:case)?\s*#?\s*\d+\b/gi;

    if (isProblemsPage) {
        document.documentElement.classList.add('zen-qoj-problems-page');
    }
    if (isContestStandings) {
        document.documentElement.classList.add('zen-qoj-standings-page');
    }

    const normalizedText = element =>
        (element?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

    const exactHeaderAliases = {
        rating: ['rating', 'rating change', 'new rating', 'rank'],
        statistics: [
            'accepted', 'solved', 'submissions', 'submitters', 'success rate',
            'acceptance rate', 'ac count', 'submission count'
        ]
    };

    function headerMatches(text, aliases) {
        return aliases.some(alias => text === alias || text.startsWith(`${alias} `));
    }

    function hideElement(element) {
        if (element) {
            element.classList.add('zen-qoj-hidden');
        }
    }

    function neutralizeUsernames(root = document) {
        root.querySelectorAll('.uoj-username, .uoj-honor, [data-user-color]').forEach(element => {
            element.classList.add('zen-qoj-username');
            element.style.removeProperty('color');
            element.style.removeProperty('text-shadow');
        });
    }

    function hideColumnsByHeader(table, aliases) {
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) return;

        const headers = Array.from(headerRow.children);
        const indexes = headers
            .map((header, index) => headerMatches(normalizedText(header), aliases) ? index : -1)
            .filter(index => index !== -1);

        if (!indexes.length) return;

        table.querySelectorAll('tr').forEach(row => {
            Array.from(row.children).forEach((cell, index) => {
                if (indexes.includes(index)) hideElement(cell);
            });
        });
    }

    function hideRatingsAndStatistics() {
        document.querySelectorAll('table').forEach(table => {
            hideColumnsByHeader(table, exactHeaderAliases.rating);

            if (isProblemsPage || table.closest('#standings') === null) {
                hideColumnsByHeader(table, exactHeaderAliases.statistics);
            }
        });

        document.querySelectorAll('.list-group-item, .card, .panel, section').forEach(block => {
            const heading = block.querySelector(
                ':scope > .list-group-item-heading, :scope > .card-header, :scope > .panel-heading, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5'
            );
            const text = normalizedText(heading);

            if (
                text === 'rating' ||
                text === 'rating changes' ||
                text === 'contribution' ||
                text === 'top solved' ||
                text === 'top contributors' ||
                text.includes('rating changes')
            ) {
                hideElement(block);
            }
        });

        document.querySelectorAll('h1, h2, h3, h4, h5').forEach(heading => {
            const text = normalizedText(heading);
            if (text === 'top solved' || text === 'top contributors') {
                hideElement(heading.closest('.row') || heading.closest('[class*="col-"]') || heading);
            }
        });

        hideElement(document.getElementById('rating-plot'));

        document.querySelectorAll('a[href*="/ranklist"], a[href*="sort=rating"]').forEach(link => {
            link.removeAttribute('href');
            link.classList.add('zen-qoj-disabled-link');
        });

        document.querySelectorAll('label').forEach(label => {
            if (normalizedText(label) === 'show statistics') hideElement(label.closest('.checkbox') || label);
        });

        document.querySelectorAll('a[href$="/statistics"]').forEach(link => hideElement(link));

        document.querySelectorAll('nav a[href$="/submissions"], .navbar a[href$="/submissions"]').forEach(link => {
            hideElement(link.closest('li') || link);
        });
    }

    function getShortVerdict(text) {
        const value = text.replace(/\s+/g, ' ').trim().toLowerCase();
        if (!value) return null;

        const mappings = [
            [/^(ac|accepted|accepted!)\b/, 'AC'],
            [/^(wa|wrong answer)\b/, 'WA'],
            [/^(tle|tl|time limit exceeded)\b/, 'TLE'],
            [/^(mle|ml|memory limit exceeded)\b/, 'MLE'],
            [/^(re|runtime error)\b/, 'RE'],
            [/^(ce|compile error|compilation error)\b/, 'CE'],
            [/^(ole|output limit exceeded)\b/, 'OLE'],
            [/^(pe|presentation error)\b/, 'PE'],
            [/^(jf|judgement failed|judgment failed)\b/, 'JF'],
            [/^(waiting|waiting rejudge|queued|in queue)\b/, 'QUEUED'],
            [/^(judging|running|testing|compiling|compilation)\b/, 'JUDGING'],
            [/^(partially correct|partial result|partial)\b/, 'PARTIAL'],
            [/^(skipped)\b/, 'SKIPPED']
        ];

        for (const [pattern, shortVerdict] of mappings) {
            if (pattern.test(value)) return shortVerdict;
        }
        return null;
    }

    function sanitizeTextContainer(container, safeClass) {
        if (!container) return;

        const text = normalizedText(container);
        if (!text) {
            container.classList.add(safeClass);
            return;
        }

        const shortVerdict = getShortVerdict(text);
        if (shortVerdict) {
            const target = container.querySelector('a, .uoj-status-details-text-div') || container;
            if (target.textContent.trim() !== shortVerdict) {
                target.textContent = shortVerdict;
            }
            container.querySelectorAll('[title]').forEach(element => element.removeAttribute('title'));
            container.removeAttribute('title');
            container.classList.add(safeClass);
            return;
        }

        if (verdictNumberPattern.test(text)) {
            verdictNumberPattern.lastIndex = 0;
            if (container.textContent.trim() !== 'JUDGING') {
                container.textContent = 'JUDGING';
            }
        }
        verdictNumberPattern.lastIndex = 0;
        container.classList.add(safeClass);
    }

    function sanitizeSubmissionTables() {
        document.querySelectorAll('table').forEach(table => {
            const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
            if (!headerRow) return;

            const headers = Array.from(headerRow.children).map(normalizedText);
            const resultIndex = headers.findIndex(text =>
                ['result', 'verdict', 'status'].includes(text)
            );
            if (resultIndex === -1) return;

            table.classList.add('zen-qoj-submissions');
            table.querySelectorAll('tbody tr').forEach(row => {
                const cell = row.children[resultIndex];
                if (cell) sanitizeTextContainer(cell, 'zen-qoj-verdict-safe');
            });
        });

        document.querySelectorAll('tr[id^="status_details_"], .uoj-status-details-text-div').forEach(element => {
            sanitizeTextContainer(element, 'zen-qoj-status-safe');
        });
    }

    function cleanContestStandings() {
        if (!isContestStandings) return;

        document.querySelectorAll('#standings table, #standings-table').forEach(table => {
            table.classList.add('zen-qoj-standings');
            const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
            if (!headerRow) {
                table.classList.add('zen-qoj-standings-ready');
                return;
            }

            const headers = Array.from(headerRow.children);
            const problemIndexes = headers
                .map((header, index) => {
                    const rawText = (header.textContent || '').replace(/\s+/g, ' ').trim();
                    const isProblem = Boolean(header.querySelector('a[href*="/problem/"]')) ||
                        /^[A-Z][0-9]?(?:$|[\s(])/.test(rawText);
                    return isProblem ? index : -1;
                })
                .filter(index => index !== -1);

            table.querySelectorAll('tr').forEach(row => {
                Array.from(row.children).forEach((cell, index) => {
                    if (problemIndexes.includes(index)) hideElement(cell);
                });
            });

            table.classList.add('zen-qoj-standings-ready');
        });
    }

    function hideRatingNotices() {
        document.querySelectorAll('.alert, .toast, .jGrowl-notification, .modal-content').forEach(notice => {
            const text = normalizedText(notice);
            if (text.includes('rating change') || text.includes('new rating')) hideElement(notice);
        });
    }

    function runZenCleanup() {
        neutralizeUsernames();
        hideRatingsAndStatistics();
        sanitizeSubmissionTables();
        cleanContestStandings();
        hideRatingNotices();
    }

    let cleanupQueued = false;
    function queueCleanup() {
        if (cleanupQueued) return;
        cleanupQueued = true;
        queueMicrotask(() => {
            cleanupQueued = false;
            runZenCleanup();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runZenCleanup, { once: true });
    } else {
        runZenCleanup();
    }

    new MutationObserver(queueCleanup).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });
})();
