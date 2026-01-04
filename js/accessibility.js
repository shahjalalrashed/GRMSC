$(function () {
    const $trigger = $('.access-trigger');
    const $panel = $('#accessPanel');
    const $overlay = $('#accessOverlay');
    const filterModes = ['low-saturation', 'monochrome', 'high-saturation'];
    const contrastModes = ['dark-contrast', 'light-contrast', 'high-contrast'];

    // 🟢 Store original colors on first load
    const originalTextColor = getComputedStyle(document.body).color;
    const originalBackgroundColor = getComputedStyle(document.body).backgroundColor;

    // 🟢 Store original colors of all headings
    const originalHeadingColors = {};
    $('h1, h2, h3, h4, h5, h6').each(function () {
        const key = getHeadingKey(this);
        originalHeadingColors[key] = getComputedStyle(this).color;
    });

    // 🟢 Store original font size (px)
    const originalFontSize = parseFloat(getComputedStyle(document.body).fontSize);

    // 🟢 Saved values
    let savedZoom = 100;              // % zoom
    let fontSizePercentStep = 0;      // % adjustment (+10%, +20%)
    let savedLineHeight = 1.5;        // unitless (1.5 default line height)
    let savedLetterSpacing = 0;       // px
    let savedTextColor = '';
    let savedTitleColor = '';
    let savedBackgroundColor = '';

    // Selectors for controls
    const $zoomMinus = $('.action-box-zoom .range__minus-button');
    const $zoomPlus = $('.action-box-zoom .range__plus-button');
    const $zoomBase = $('.action-box-zoom .range__base');

    const $fontSizeMinus = $('.action-box-fontSize .range__minus-button');
    const $fontSizePlus = $('.action-box-fontSize .range__plus-button');
    const $fontSizeBase = $('.action-box-fontSize .range__base');

    const $lineHeightMinus = $('.action-box-lineHeight .range__minus-button');
    const $lineHeightPlus = $('.action-box-lineHeight .range__plus-button');
    const $lineHeightBase = $('.action-box-lineHeight .range__base');

    const $letterSpacingMinus = $('.action-box-letterSpacing .range__minus-button');
    const $letterSpacingPlus = $('.action-box-letterSpacing .range__plus-button');
    const $letterSpacingBase = $('.action-box-letterSpacing .range__base');

    // 🟢 Open and close panel
    $trigger.on('click', function () {
        $panel.addClass('show').attr('aria-hidden', 'false');
        $overlay.addClass('show').attr('aria-hidden', 'false');
        $trigger.addClass('hidden').attr('aria-hidden', 'true');
        $panel.find('.action-box').first().focus();
        //trapTab('accessPanel');
    });

    function closePanel() {
        $panel.removeClass('show').attr('aria-hidden', 'true');
        $overlay.removeClass('show').attr('aria-hidden', 'true');
        $trigger.removeClass('hidden').attr('aria-hidden', 'false').focus();
        //$(window).off("keydown");
    }

    $overlay.on('click', closePanel);
    $panel.find('.btn-close').on('click', closePanel);
    $(document).on('keydown', function (e) {
        if (e.key == 'Escape' && $panel.hasClass('show')) {
            closePanel();
        }
    });


    // 🟢 Contrast toggle (ONLY ONE ACTIVE AT A TIME)
    $('.action-box').filter('#dark-contrast, #light-contrast, #high-contrast').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();

        const action = this.id;
        const $this = $(this);
        const isActive = $this.hasClass('active');

        // Deactivate all contrast modes
        $('body').removeClass(contrastModes.join(' '));
        contrastModes.forEach(mode => {
            $('#' + mode).removeClass('active').attr('aria-checked', 'false');
        });

        if (!isActive) {
            $('body').addClass(action);
            $this.addClass('active').attr('aria-checked', 'true');
        }

        saveSettings();
    });

    // 🟢 Filter toggles (multiple can be active)
    $('.action-box').filter('#low-saturation, #monochrome, #high-saturation').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const action = this.id;
        const $this = $(this);
        $('html').toggleClass(action);
        $this.toggleClass('active');
        $this.attr('aria-checked', $this.hasClass('active'));
        saveSettings();
    });

    initStopAnimationsToggle();

    $(document).ready(function () {
        // Save original justify-content for .d-flex elements without overwriting their classes later
        $('.d-flex').each(function (index) {
            const classes = ($(this).attr('class') || '').split(/\s+/);
            const justifyClass = classes.find(c => c.startsWith('justify-content-')) || '';
            $(this).data('original-justify', justifyClass);
        });
        applySettings();
        setTimeout(updateTriggerIcon, 50);
    });

    // 🟢 Reset all settings
    $('#resetSettings').on('click', function () {
        savedZoom = 100;
        fontSizePercentStep = 0;
        savedLineHeight = 1.5;
        savedLetterSpacing = 0;
        savedTextColor = '';
        savedTitleColor = '';
        savedBackgroundColor = '';
        textMagnifierActive = false;

        document.body.style.removeProperty('--accessibility-text-color');
        document.body.style.removeProperty('--accessibility-title-color');
        document.body.style.removeProperty('--accessibility-bg-color');
        document.body.classList.remove('accessibility-text-color', 'accessibility-title-color', 'accessibility-bg-color');
        $('body, body *').not('#accessOverlay, #accessPanel, #accessPanel *').removeClass('accessibility-bg-color');// Reset background color

        restoreOriginalHeadingColors();

        $textTooltip.hide();
        disableTextMagnifier();
        $('.action-box-magnifier').removeClass('active').attr('aria-checked', 'false');

        $('body').removeClass('highlight-titles highlight-links');
        $('.action-box-emphasizeTitles, .action-box-emphasizeLinks').removeClass('active').attr('aria-checked', 'false');

        $('html').removeClass('readable-font dyslexia-friendly');
        $('.action-box-readableFont, .action-box-dyslexiaFriendly').removeClass('active').attr('aria-checked', 'false');

        // Remove contrast and filter classes
        $('body').removeClass(contrastModes.join(' '));
        $('html').removeClass(filterModes.join(' '));

        // Reset contrast & filter buttons
        contrastModes.concat(filterModes).forEach(mode => {
            $('#' + mode).removeClass('active').attr('aria-checked', 'false');
        });

        // Reset color picker selections
        $('.color-picker__selection')
            .removeClass('active')
            .attr('aria-checked', 'false');

        // Remove Reading Mask and Guide
        removeReadingMask();
        removeReadingGuide();
        $('.action-box-readingMask, .action-box-readingGuide')
            .removeClass('active')
            .attr('aria-checked', 'false');

        // Reset Reading Mask / Guide flags
        readingMaskActive = false;
        readingGuideActive = false;

        // Remove Big Cursor
        $('body').removeClass('big-black-cursor big-white-cursor');
        $('.action-box-bigBlackCursor, .action-box-bigWhiteCursor')
            .removeClass('active')
            .attr('aria-checked', 'false');

        // Remove Hide Images
        $('html').removeClass('hide-images');
        $('.action-box-hideImages')
            .removeClass('active')
            .attr('aria-checked', 'false');

        // Remove stop animation styles and reset toggle
        toggleStopAnimations(false, false);
        $('html, body').removeClass('stop-animation');
        $('.action-box').removeClass('active').attr('aria-checked', 'false');

        applyZoom(savedZoom);
        applyFontSize(fontSizePercentStep);
        applyLineHeight(savedLineHeight);
        applyLetterSpacing(savedLetterSpacing);

        // Remove saved alignment from localStorage
        localStorage.removeItem('accessibility-text-align');

        // Restore original justify-content classes on all .d-flex (safe restore: only touch justify-content-*)
        $('.d-flex').each(function () {
            const originalJustify = $(this).data('original-justify') || '';
            $(this).removeClass('justify-content-start justify-content-center justify-content-end justify-content-between justify-content-around justify-content-sm-start justify-content-sm-center justify-content-sm-end');
            if (originalJustify) {
                $(this).addClass(originalJustify);
            }
        });

        // Reset alignment too
        $('html').removeClass('align-left align-center align-right');
        $('.action-box-textAlignLeft, .action-box-textAlignCenter, .action-box-textAlignRight')
            .removeClass('active')
            .attr('aria-checked', 'false');

        // Remove ASL cursor mode and hide tooltip
        document.documentElement.classList.remove('hndcursor');
        $('.action-box-htalkbtn').removeClass('active').attr('aria-checked', 'false');
        hideTooltip();

        localStorage.removeItem('accessibilitySettings');

        updateTriggerIcon();

        saveSettings();
    });

    function formatDiff(diff, unit = '%') {
        if (diff == 0) return 'Default';
        const sign = diff > 0 ? '+' : '';
        return `${sign}${diff}${unit}`;
    }

    // 🟢 Apply Zoom
    function applyZoom(value) {
        savedZoom = value;
        const scale = 1 + (savedZoom - 100) / 1000;
        const diff = savedZoom - 100;
        if ('zoom' in document.body.style) {
            document.documentElement.style.zoom = scale == 1 ? '' : scale.toFixed(3);
        } else {
            document.documentElement.style.transformOrigin = '0 0';
            document.documentElement.style.transform = scale == 1 ? '' : `scale(${scale.toFixed(3)})`;
        }
        $zoomBase.text(formatDiff(diff));
        saveSettings();
    }

    // 🟢 Apply Font Size
    const fontSizeStepPercent = 10; // Each click changes font size by 10%

    function applyFontSize(percentStep) {
        fontSizePercentStep = percentStep;
        const scale = 1 + (fontSizePercentStep / 100);
        const newFontSize = originalFontSize * scale;
        const $elements = $('body *')
            .not('#accessOverlay, #accessOverlay *')
            .not('#accessPanel, #accessPanel *')
            .not('img, svg, video, canvas, iframe, object, embed');
        if (percentStep == 0) {
            $elements.css('font-size', '');
            $fontSizeBase.text('Default');
        } else {
            $elements.css('font-size', newFontSize + 'px');
            const sign = percentStep > 0 ? '+' : '';
            $fontSizeBase.text(`${sign}${percentStep}%`);
        }
        saveSettings();
    }

    // 🟢 Apply Line Height
    function applyLineHeight(value) {
        savedLineHeight = value;
        const diff = Math.round((savedLineHeight - 1.5) * 100);
        const selector = `body, body *:not(#accessOverlay):not(#accessPanel):not(#accessPanel *):not(img):not(svg):not(video):not(canvas):not(iframe):not(object):not(embed)`;
        if (Math.abs(diff) < 1) {
            $(selector).css('line-height', '');
            $lineHeightBase.text('Default');
        } else {
            $(selector).css('line-height', savedLineHeight);
            $lineHeightBase.text(formatDiff(diff));
        }
        saveSettings();
    }

    // 🟢 Apply Letter Spacing
    function applyLetterSpacing(value) {
        const step = 0.5;
        savedLetterSpacing = Math.round(value / step) * step;
        const diff = savedLetterSpacing / step;
        const percent = diff * 10;
        const $elements = $('body *')
            .not('#accessOverlay, #accessOverlay *')
            .not('#accessPanel, #accessPanel *')
            .not('img, svg, video, canvas, iframe, object, embed');
        if (diff == 0) {
            $elements.css('letter-spacing', '');
            $letterSpacingBase.text('Default');
        } else {
            $elements.css('letter-spacing', `${savedLetterSpacing}px`);
            const sign = percent > 0 ? '+' : '';
            $letterSpacingBase.text(`${sign}${percent}%`);
        }
        saveSettings();
    }

    // 🟢 Button handlers
    function handleButtonClick($plusBtn, $minusBtn, applyFunc, step) {
        $plusBtn.on('click keydown', function (e) {
            if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            applyFunc((applyFunc.savedVal || 0) + step);
        });
        $minusBtn.on('click keydown', function (e) {
            if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            applyFunc((applyFunc.savedVal || 0) - step);
        });
    }
    applyZoom.savedVal = savedZoom;
    applyFontSize.savedVal = fontSizePercentStep;
    applyLineHeight.savedVal = savedLineHeight;
    applyLetterSpacing.savedVal = savedLetterSpacing;

    // Override functions to update savedVal
    const originalApplyZoom = applyZoom;
    applyZoom = function (val) {
        applyZoom.savedVal = val;
        originalApplyZoom(val);
    };
    const originalApplyFontSize = applyFontSize;
    applyFontSize = function (val) {
        applyFontSize.savedVal = val;
        originalApplyFontSize(val);
    };
    const originalApplyLineHeight = applyLineHeight;
    applyLineHeight = function (val) {
        applyLineHeight.savedVal = val;
        originalApplyLineHeight(val);
    };
    const originalApplyLetterSpacing = applyLetterSpacing;
    applyLetterSpacing = function (val) {
        applyLetterSpacing.savedVal = val;
        originalApplyLetterSpacing(val);
    };

    // Bind buttons with appropriate step values
    handleButtonClick($zoomPlus, $zoomMinus, applyZoom, 10);
    handleButtonClick($fontSizePlus, $fontSizeMinus, applyFontSize, fontSizeStepPercent);
    handleButtonClick($lineHeightPlus, $lineHeightMinus, applyLineHeight, 0.1);
    handleButtonClick($letterSpacingPlus, $letterSpacingMinus, applyLetterSpacing, 0.5);

    // 🟢 Apply color changes
    function applyColorChange(type, color) {
        if (type == 'textColor') {
            savedTextColor = color;
            document.body.style.setProperty('--accessibility-text-color', color);
            document.body.classList.add('accessibility-text-color');
            if (!savedTitleColor) restoreOriginalHeadingColors();
        } else if (type == 'titleColor') {
            savedTitleColor = color;
            document.body.style.setProperty('--accessibility-title-color', color);
            document.body.classList.add('accessibility-title-color');
            $('h1, h2, h3, h4, h5, h6').css('color', color);
        } else if (type == 'backgroundColor') {
            savedBackgroundColor = color;
            document.body.style.setProperty('--accessibility-bg-color', color);
            $('body, body *').not('#accessOverlay, #accessPanel, #accessPanel *').addClass('accessibility-bg-color');
        }

        // Update color picker UI
        const $picker = $(`[data-test="${type}"] .color-picker`);
        $picker.find('.color-picker__selection').removeClass('active').attr('aria-checked', 'false');
        $picker.find(`[data-test='${color}']`).addClass('active').attr('aria-checked', 'true');

        saveSettings();
    }

    $('.color-picker__selection').on('click', function () {
        const color = $(this).attr('data-test');
        const parentBox = $(this).closest('.action-box');
        const type = parentBox.attr('data-test');
        applyColorChange(type, color);
    });

    $('.color-picker__cancel').on('click', function () {
        const parentBox = $(this).closest('.action-box');
        const type = parentBox.attr('data-test');
        const $picker = parentBox.find('.color-picker');

        // 🔴 Remove active class from all color buttons
        $picker.find('.color-picker__selection')
            .removeClass('active')
            .attr('aria-checked', 'false');

        if (type == 'textColor') {
            savedTextColor = '';
            document.body.style.removeProperty('--accessibility-text-color');
            document.body.classList.remove('accessibility-text-color');

            // ✅ Restore original heading colors unless titleColor is active
            if (!savedTitleColor) {
                restoreOriginalHeadingColors();
            }
        }
        else if (type == 'titleColor') {
            savedTitleColor = '';
            document.body.style.removeProperty('--accessibility-title-color');
            document.body.classList.remove('accessibility-title-color');

            // ✅ Restore original heading colors
            restoreOriginalHeadingColors();
        }
        else if (type == 'backgroundColor') {
            savedBackgroundColor = '';
            document.body.style.removeProperty('--accessibility-bg-color');
            $('body, body *')
                .not('#accessOverlay, #accessPanel, #accessPanel *')
                .removeClass('accessibility-bg-color');
        }
        saveSettings();
    });

    // 🆕 Restore original heading colors
    function restoreOriginalHeadingColors() {
        $('h1, h2, h3, h4, h5, h6').each(function () {
            const key = getHeadingKey(this);
            const originalColor = originalHeadingColors[key] || '';
            if (!savedTitleColor) $(this).css('color', originalColor);
        });
    }
    // 🆕 Helper to generate unique keys for headings
    function getHeadingKey(el) {
        let key = el.tagName;
        if (el.id) key += `#${el.id}`;
        if (el.className) key += `.${el.className.trim().replace(/\s+/g, '.')}`;
        return key;
    }


    // --- ASL Cursor toggle & tooltip ---
    const tooltip = document.getElementById("asl-tooltip");
    const textBox = tooltip ? tooltip.querySelector(".text") : { textContent: '' };
    const aslLine = tooltip ? tooltip.querySelector(".asl-line") : null;
    const aslToggleBtn = document.querySelector(".action-box-htalkbtn");

    // Cache pseudo-element classes for fallback
    let pseudoElementClasses = new Set();
    function cachePseudoElementClasses() {
        pseudoElementClasses.clear();
        for (const sheet of document.styleSheets) {
            let rules;
            try { rules = sheet.cssRules; } catch { continue; }
            for (const rule of rules) {
                if (rule.selectorText?.endsWith("::before")) {
                    const match = rule.selectorText.match(/\.([^\s:]+)::before/);
                    if (match?.[1]) pseudoElementClasses.add(match[1]);
                }
            }
        }
    }
    cachePseudoElementClasses();

    const specialCharMap = {
        ".": "dot", ",": "comma", ";": "semicolon", ":": "colon", "?": "question", "!": "exclamation",
        "…": "ellipsis", "'": "apostrophe", "\"": "quote", "‘": "quote-open", "’": "quote-close",
        "“": "dquote-open", "”": "dquote-close", "(": "paren-open", ")": "paren-close",
        "[": "bracket-open", "]": "bracket-close", "{": "brace-open", "}": "brace-close",
        "<": "angle-open", ">": "angle-close", "+": "plus", "-": "minus", "×": "times",
        "÷": "divide", "*": "asterisk", "/": "slash", "=": "equals", "%": "percent", "&": "ampersand",
        "|": "pipe", "^": "caret", "~": "tilde", "`": "backtick", "@": "at", "#": "hash",
        "$": "dollar", "€": "euro", "£": "pound", "¥": "yen", "₨": "rupee", "_": "underscore"
    };

    const allowedChars = /[a-zA-Z0-9\u0980-\u09FF.,;:&$%\-\(\)\+=\/]/;

    function fallbackStyle(el, ch) {
        el.classList.add("fallback");
        el.textContent = ch;
    }

    function hideTooltip() {
        if (!tooltip) return;
        tooltip.style.display = "none";
        if (textBox) textBox.textContent = "";
        if (aslLine) aslLine.innerHTML = "";
    }

    function setActiveState(enabled) {
        if (enabled) {
            document.documentElement.classList.add("hndcursor");
            if (aslToggleBtn) {
                aslToggleBtn.setAttribute("aria-checked", "true");
                aslToggleBtn.classList.add("active");
            }
        } else {
            document.documentElement.classList.remove("hndcursor");
            if (aslToggleBtn) {
                aslToggleBtn.setAttribute("aria-checked", "false");
                aslToggleBtn.classList.remove("active");
            }
            hideTooltip();
        }
        saveSettings();
    }

    if (aslToggleBtn) {
        aslToggleBtn.addEventListener("click", () => {
            const enabled = !document.documentElement.classList.contains("hndcursor");
            setActiveState(enabled);
        });

        aslToggleBtn.addEventListener("keydown", e => {
            if (e.key == " " || e.key == "Enter") {
                e.preventDefault();
                const enabled = !document.documentElement.classList.contains("hndcursor");
                setActiveState(enabled);
            }
        });
    }

    // Tooltip logic on mousemove
    document.addEventListener("mousemove", e => {
        if (!document.documentElement.classList.contains("hndcursor") || !tooltip || !textBox || !aslLine) {
            hideTooltip();
            return;
        }

        let range;
        if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (pos) {
                range = document.createRange();
                range.setStart(pos.offsetNode, pos.offset);
                range.setEnd(pos.offsetNode, pos.offset);
            }
        }

        if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
            hideTooltip();
            return;
        }

        const text = range.startContainer.textContent;
        const offset = range.startOffset;
        const regexWord = /[a-zA-Z0-9\u0980-\u09FF.,;:!?&$%\-\(\)\+=\/'"“”‘’…]+/g;

        let word = "", match;
        while ((match = regexWord.exec(text))) {
            if (match.index <= offset && regexWord.lastIndex >= offset) {
                word = match[0];
                break;
            }
        }
        if (!word) {
            hideTooltip();
            return;
        }

        textBox.textContent = word;
        aslLine.innerHTML = "";

        for (const ch of word) {
            if (!allowedChars.test(ch) && !specialCharMap[ch]) continue;

            let box = document.createElement("div");
            box.className = "asl-box";

            if (ch == "্") {
                box.classList.add("asl-halant");
                box.textContent = "";
                aslLine.appendChild(box);
                continue;
            }

            if (/[a-zA-Z]/.test(ch)) {
                box.classList.add("asl-" + ch.toLowerCase());
            } else if (/\d/.test(ch)) {
                box.classList.add("asl-" + ch);
            } else if (/[\u0980-\u09FF]/.test(ch)) {
                box.classList.add("asl-" + ch);
            } else if (specialCharMap[ch]) {
                const cls = "asl-" + specialCharMap[ch];
                if (pseudoElementClasses.has(cls)) {
                    box.classList.add(cls);
                } else {
                    fallbackStyle(box, ch);
                }
            } else {
                fallbackStyle(box, ch);
            }

            aslLine.appendChild(box);
        }

        const maxX = window.innerWidth - tooltip.offsetWidth - 20;
        const maxY = window.innerHeight - tooltip.offsetHeight - 20;
        tooltip.style.top = Math.min(e.clientY + 20, maxY) + "px";
        tooltip.style.left = Math.min(e.clientX + 20, maxX) + "px";
        tooltip.style.display = "block";
    });

    document.addEventListener("mouseout", e => {
        if (!e.relatedTarget && !e.toElement) hideTooltip();
    });


    // 🆕 Text Magnifier
    let textMagnifierActive = false;
    const $textTooltip = $('#text-magnifier-tooltip');

    // Toggle Text Magnifier
    $('.action-box-magnifier').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const $this = $(this);
        textMagnifierActive = !textMagnifierActive;
        if (textMagnifierActive) {
            enableTextMagnifier();
        } else {
            disableTextMagnifier();
        }
        $this.toggleClass('active').attr('aria-checked', textMagnifierActive);
        saveSettings();
    });

    function enableTextMagnifier() {
        $(document).on('mousemove.textMagnifier', function (e) {
            const target = document.elementFromPoint(e.clientX, e.clientY);

            if ($(target).closest('#accessPanel').length) {
                $textTooltip.hide();
                return;
            }

            let range;
            if (document.caretPositionFromPoint) {
                const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
                if (pos) {
                    range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.setEnd(pos.offsetNode, pos.offset);
                }
            } else if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(e.clientX, e.clientY);
            }

            if (range && range.startContainer.nodeType == Node.TEXT_NODE) {
                const nodeText = range.startContainer.textContent;
                const offset = range.startOffset;

                const tempRange = document.createRange();
                tempRange.selectNodeContents(range.startContainer.parentNode);
                tempRange.setStart(range.startContainer, 0);
                tempRange.setEnd(range.startContainer, offset);

                const rects = tempRange.getClientRects();
                if (rects.length > 0) {
                    const currentLineTop = rects[rects.length - 1].top;

                    let lineText = '';
                    const words = nodeText.split(/\s+/);
                    let tempText = '';

                    for (const word of words) {
                        const testRange = document.createRange();
                        testRange.selectNodeContents(range.startContainer);
                        const wordStart = nodeText.indexOf(word, tempText.length);
                        const wordEnd = wordStart + word.length;

                        testRange.setStart(range.startContainer, wordStart);
                        testRange.setEnd(range.startContainer, wordEnd);

                        const wordRects = testRange.getClientRects();
                        if (
                            wordRects.length > 0 &&
                            Math.abs(wordRects[0].top - currentLineTop) < 2
                        ) {
                            lineText += word + ' ';
                        }
                        tempText += word + ' ';
                    }

                    if (lineText.trim()) {
                        $textTooltip.text(lineText.trim()).css({
                            top: e.clientY + 'px',
                            left: e.clientX + 'px',
                            display: 'block'
                        });
                        return;
                    }
                }
            }

            $textTooltip.hide();
        });
    }

    function disableTextMagnifier() {
        $textTooltip.hide();
        $(document).off('mousemove.textMagnifier');
    }

    // 🟢 Highlight Titles
    $('.action-box-emphasizeTitles').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const $this = $(this);
        const isActive = $this.hasClass('active');
        if (isActive) {
            $('body').removeClass('highlight-titles');
            $this.removeClass('active').attr('aria-checked', 'false');
        } else {
            $('body').addClass('highlight-titles');
            $this.addClass('active').attr('aria-checked', 'true');
        }
        saveSettings();
    });

    // 🟢 Highlight Links
    $('.action-box-emphasizeLinks').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const $this = $(this);
        const isActive = $this.hasClass('active');
        if (isActive) {
            $('body').removeClass('highlight-links');
            $this.removeClass('active').attr('aria-checked', 'false');
        } else {
            $('body').addClass('highlight-links');
            $this.addClass('active').attr('aria-checked', 'true');
        }
        saveSettings();
    });

    // 🆕 Readable Font Toggle
    $('.action-box-readableFont').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const $this = $(this);
        const isActive = $this.hasClass('active');
        $('html').toggleClass('readable-font', !isActive);
        $this.toggleClass('active').attr('aria-checked', !isActive);
        saveSettings();
    });

    // Dyslexia Friendly toggle
    $('.action-box-dyslexiaFriendly').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const $this = $(this);
        const isActive = $this.hasClass('active');
        $('html').toggleClass('dyslexia-friendly', !isActive);
        $this.toggleClass('active').attr('aria-checked', !isActive);
        saveSettings();
    });

    // Align Text
    function applyTextAlign(direction) {
        // Remove all alignment classes on html
        $('html').removeClass('align-left align-center align-right');

        // Add alignment class if valid direction
        if (direction == 'left') $('html').addClass('align-left');
        else if (direction == 'center') $('html').addClass('align-center');
        else if (direction == 'right') $('html').addClass('align-right');

        // Update button states exclusively
        $('.action-box-textAlignLeft').toggleClass('active', direction == 'left').attr('aria-checked', direction == 'left');
        $('.action-box-textAlignCenter').toggleClass('active', direction == 'center').attr('aria-checked', direction == 'center');
        $('.action-box-textAlignRight').toggleClass('active', direction == 'right').attr('aria-checked', direction == 'right');

        // Update .d-flex alignment classes accordingly (safe: only change justify-content-*)
        $('.d-flex').each(function () {
            // remove common justify-content-* classes
            $(this).removeClass('justify-content-start justify-content-center justify-content-end justify-content-between justify-content-around');

            if (direction === 'left') {
                $(this).addClass('justify-content-start');
            } else if (direction === 'center') {
                $(this).addClass('justify-content-center');
            } else if (direction === 'right') {
                $(this).addClass('justify-content-end');
            } else {
                // No alignment selected, restore original justify-content class if saved
                const originalJustify = $(this).data('original-justify');
                if (originalJustify) {
                    $(this).addClass(originalJustify);
                }
            }
        });

        // Save alignment in localStorage
        if (direction) {
            localStorage.setItem('accessibility-text-align', direction);
        } else {
            localStorage.removeItem('accessibility-text-align');
        }

        // Save overall settings (calls your existing saveSettings)
        saveSettings();
    }

    // Bind click & keydown events for toggles (handles keyboard accessibility)
    $('.action-box-textAlignLeft').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const isActive = $(this).hasClass('active');
        if (isActive) {
            applyTextAlign(null);
        } else {
            applyTextAlign('left');
        }
    });

    $('.action-box-textAlignCenter').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const isActive = $(this).hasClass('active');
        if (isActive) {
            applyTextAlign(null);
        } else {
            applyTextAlign('center');
        }
    });

    $('.action-box-textAlignRight').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const isActive = $(this).hasClass('active');
        if (isActive) {
            applyTextAlign(null);
        } else {
            applyTextAlign('right');
        }
    });


    // 🟢 Reading Mask
    let readingMaskActive = false;
    let readingMaskOverlay = null;

    function createReadingMask() {
        removeReadingGuide(); // Disable guide if active
        $('.action-box-readingGuide').removeClass('active').attr('aria-checked', 'false');
        readingGuideActive = false;

        if (!readingMaskOverlay) {
            readingMaskOverlay = document.createElement('div');
            readingMaskOverlay.className = 'reading-mask-overlay';
            document.body.appendChild(readingMaskOverlay);
            updateReadingMaskBand(window.innerHeight / 2);
            window.addEventListener('mousemove', onMouseMoveMask);
        }
        readingMaskActive = true;
    }

    function removeReadingMask() {
        if (readingMaskOverlay) {
            readingMaskOverlay.remove();
            readingMaskOverlay = null;
            window.removeEventListener('mousemove', onMouseMoveMask);
        }
        readingMaskActive = false;
    }

    function updateReadingMaskBand(centerY) {
        if (!readingMaskOverlay) return;

        const bandHeight = 120;
        const top = Math.max(0, centerY - bandHeight / 2);
        const bottom = Math.min(window.innerHeight, centerY + bandHeight / 2);

        readingMaskOverlay.style.clipPath = `polygon(
            0 0,
            100% 0,
            100% ${top}px,
            0 ${top}px,
            0 ${bottom}px,
            100% ${bottom}px,
            100% 100%,
            0 100%
        )`;
    }

    function onMouseMoveMask(e) {
        updateReadingMaskBand(e.clientY);
    }

    $('.action-box-readingMask').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();

        readingMaskActive = !readingMaskActive;

        if (readingMaskActive) {
            createReadingMask();
        } else {
            removeReadingMask();
        }

        $(this).toggleClass('active').attr('aria-checked', readingMaskActive);
        saveSettings();
    });

    // 🟢 Reading Guide
    let readingGuideActive = false;
    let readingGuideLine = null;

    function createReadingGuide() {
        removeReadingMask(); // Disable mask if active
        $('.action-box-readingMask').removeClass('active').attr('aria-checked', 'false');
        readingMaskActive = false;

        if (!readingGuideLine) {
            readingGuideLine = document.createElement('div');
            readingGuideLine.className = 'reading-guide-line';
            document.body.appendChild(readingGuideLine);

            const verticalLine = document.createElement('div');
            verticalLine.className = 'reading-guide-vertical';
            readingGuideLine.appendChild(verticalLine);

            window.addEventListener('mousemove', onMouseMoveGuide);
        }
        readingGuideActive = true;
    }

    function removeReadingGuide() {
        if (readingGuideLine) {
            readingGuideLine.remove();
            readingGuideLine = null;
            window.removeEventListener('mousemove', onMouseMoveGuide);
        }
        readingGuideActive = false;
    }

    function onMouseMoveGuide(e) {
        if (readingGuideLine) {
            readingGuideLine.style.top = e.clientY + 'px';
            readingGuideLine.style.left = e.clientX + 'px';
        }
    }

    $('.action-box-readingGuide').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();

        readingGuideActive = !readingGuideActive;

        if (readingGuideActive) {
            createReadingGuide();
        } else {
            removeReadingGuide();
        }

        $(this).toggleClass('active').attr('aria-checked', readingGuideActive);
        saveSettings();
    });

    // 🟢 Big Cursor toggles
    $('.action-box-bigBlackCursor, .action-box-bigWhiteCursor').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();

        const isBlack = $(this).hasClass('action-box-bigBlackCursor');
        const body = $('body');
        const isActive = $(this).hasClass('active');

        body.removeClass('big-black-cursor big-white-cursor');
        $('.action-box-bigBlackCursor, .action-box-bigWhiteCursor')
            .removeClass('active')
            .attr('aria-checked', 'false');

        if (!isActive) {
            if (isBlack) {
                body.addClass('big-black-cursor');
                $('.action-box-bigBlackCursor').addClass('active').attr('aria-checked', 'true');
            } else {
                body.addClass('big-white-cursor');
                $('.action-box-bigWhiteCursor').addClass('active').attr('aria-checked', 'true');
            }
        }

        saveSettings();
    });

    // 🆕 Hide Images toggle
    $('.action-box-hideImages').on('click keydown', function (e) {
        if (e.type == 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();

        const $this = $(this);
        const isActive = $this.hasClass('active');

        $('html').toggleClass('hide-images', !isActive);
        $this.toggleClass('active').attr('aria-checked', !isActive);

        saveSettings();
    });

    // Stop Animations toggle function
    function toggleStopAnimations(state = null, save = true) {
        const box = document.querySelector('.action-box-stopAnimations');
        if (!box) return;

        const current = box.getAttribute('aria-checked') == 'true';
        const isActive = state !== null ? state : !current;

        box.setAttribute('aria-checked', isActive);
        box.classList.toggle('active', isActive);
        document.documentElement.classList.toggle('stop-animation', isActive);
        document.body.classList.toggle('stop-animation', isActive);

        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (isActive) {
                video.pause();
            } else {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Autoplay might be blocked, ignore errors gracefully
                    });
                }
            }
        });

        if (save) {
            saveSettings();
        }
    }
    function initStopAnimationsToggle() {
        const box = document.querySelector('.action-box-stopAnimations');
        if (!box) return;

        box.addEventListener('click', () => {
            const current = box.getAttribute('aria-checked') == 'true';
            toggleStopAnimations(!current);
        });

        box.addEventListener('keydown', (e) => {
            if (e.key == 'Enter' || e.key == ' ') {
                e.preventDefault();
                const current = box.getAttribute('aria-checked') == 'true';
                toggleStopAnimations(!current);
            }
        });
    }

    function updateTriggerIcon() {
        // safe selection & no error if element missing on other pages
        const $icon = $('.access-trigger .active-actions-icon');
        if (!$icon.length) return; // nothing to update on this page

        const hasContrast = $('#dark-contrast').hasClass('active') ||
            $('#light-contrast').hasClass('active') ||
            $('#high-contrast').hasClass('active');

        const hasFilter = $('#low-saturation').hasClass('active') ||
            $('#monochrome').hasClass('active') ||
            $('#high-saturation').hasClass('active');

        const hasActiveSettings =
            savedTextColor ||
            savedTitleColor ||
            savedBackgroundColor ||
            savedZoom !== 100 ||
            fontSizePercentStep !== 0 ||
            savedLineHeight !== 1.5 ||
            savedLetterSpacing !== 0 ||
            (localStorage.getItem('accessibility-text-align') || '') !== '' ||
            hasContrast ||
            hasFilter ||
            $('.action-box-emphasizeTitles').hasClass('active') ||
            $('.action-box-emphasizeLinks').hasClass('active') ||
            $('html').hasClass('readable-font') ||
            $('.action-box-dyslexiaFriendly').hasClass('active') ||
            $('.action-box-readingMask').hasClass('active') ||
            $('.action-box-readingGuide').hasClass('active') ||
            $('body').hasClass('big-black-cursor') ||
            $('body').hasClass('big-white-cursor') ||
            $('html').hasClass('hide-images') ||
            $('.action-box-stopAnimations').hasClass('active') ||
            textMagnifierActive ||
            $('html').hasClass('hndcursor');

        $icon.attr('hidden', !hasActiveSettings);
    }

    // 🟢 Save & Load Settings   
    function saveSettings() {
        const stopAnimBox = document.querySelector('.action-box-stopAnimations');
        const stopAnimation = stopAnimBox ? (stopAnimBox.getAttribute('aria-checked') == 'true') : false;
        const aslCursorActive = document.documentElement.classList.contains('hndcursor');
        const settings = {
            textColor: savedTextColor || '',
            titleColor: savedTitleColor || '',
            backgroundColor: savedBackgroundColor || '',
            textMagnifier: textMagnifierActive,
            highlightTitles: $('.action-box-emphasizeTitles').hasClass('active'),
            highlightLinks: $('.action-box-emphasizeLinks').hasClass('active'),
            readableFont: $('html').hasClass('readable-font'),
            dyslexiaFriendly: $('.action-box-dyslexiaFriendly').hasClass('active'),
            zoom: savedZoom,
            fontSizePercentStep: fontSizePercentStep,
            lineHeight: savedLineHeight,
            letterSpacing: savedLetterSpacing,
            textAlign: localStorage.getItem('accessibility-text-align') || '',
            darkContrast: $('#dark-contrast').hasClass('active'),
            lightContrast: $('#light-contrast').hasClass('active'),
            highContrast: $('#high-contrast').hasClass('active'),
            lowSaturation: $('#low-saturation').hasClass('active'),
            monochrome: $('#monochrome').hasClass('active'),
            highSaturation: $('#high-saturation').hasClass('active'),
            readingMask: $('.action-box-readingMask').hasClass('active'),
            readingGuide: $('.action-box-readingGuide').hasClass('active'),
            bigBlackCursor: $('body').hasClass('big-black-cursor'),
            bigWhiteCursor: $('body').hasClass('big-white-cursor'),
            hideImages: $('html').hasClass('hide-images'),
            stopAnimation: stopAnimation,
            aslCursorActive: aslCursorActive,
        };
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
        updateTriggerIcon();
    }

    function applySettings() {

        let settings = {};
        try { settings = JSON.parse(localStorage.getItem('accessibilitySettings')) || {}; } catch { settings = {}; }

        // Contrast and filter
        contrastModes.forEach(mode => { if (settings[camelCase(mode)]) { $('body').addClass(mode); $('#' + mode).addClass('active').attr('aria-checked', 'true'); } });
        filterModes.forEach(mode => { if (settings[camelCase(mode)]) { $('html').addClass(mode); $('#' + mode).addClass('active').attr('aria-checked', 'true'); } });

        // Colors
        if (settings.textColor) applyColorChange('textColor', settings.textColor);
        if (settings.titleColor) applyColorChange('titleColor', settings.titleColor);
        if (settings.backgroundColor) applyColorChange('backgroundColor', settings.backgroundColor);

        // Toggles
        if (settings.textMagnifier) { textMagnifierActive = true; $('.action-box-magnifier').addClass('active').attr('aria-checked', 'true'); enableTextMagnifier(); }
        setActiveState(settings.aslCursorActive);
        if (settings.highlightTitles) $('body').addClass('highlight-titles');
        $('.action-box-emphasizeTitles').toggleClass('active', !!settings.highlightTitles).attr('aria-checked', !!settings.highlightTitles);
        if (settings.highlightLinks) $('body').addClass('highlight-links');
        $('.action-box-emphasizeLinks').toggleClass('active', !!settings.highlightLinks).attr('aria-checked', !!settings.highlightLinks);
        $('html').toggleClass('readable-font', !!settings.readableFont);
        $('.action-box-readableFont').toggleClass('active', !!settings.readableFont).attr('aria-checked', !!settings.readableFont);
        $('html').toggleClass('dyslexia-friendly', !!settings.dyslexiaFriendly);
        $('.action-box-dyslexiaFriendly').toggleClass('active', !!settings.dyslexiaFriendly).attr('aria-checked', !!settings.dyslexiaFriendly);

        // Alignment (safe restore: only touch justify-content-*)
        const savedAlign = localStorage.getItem('accessibility-text-align');
        if (savedAlign) applyTextAlign(savedAlign);
        else {
            // restore stored justify-content for .d-flex elements (safe: don't overwrite other classes)
            $('.d-flex').each(function () {
                const originalJustify = $(this).data('original-justify') || '';
                $(this).removeClass('justify-content-start justify-content-center justify-content-end justify-content-between justify-content-around');
                if (originalJustify) $(this).addClass(originalJustify);
            });
            $('html').removeClass('align-left align-center align-right');
            $('.action-box-textAlignLeft, .action-box-textAlignCenter, .action-box-textAlignRight')
                .removeClass('active')
                .attr('aria-checked', 'false');
        }

        applyZoom(settings.zoom || 100);
        applyFontSize(settings.fontSizePercentStep || 0);
        applyLineHeight(settings.lineHeight || 1.5);
        applyLetterSpacing(settings.letterSpacing || 0);


        // Reading Mask
        if (settings.readingMask) {
            createReadingMask();
            $('.action-box-readingMask').addClass('active').attr('aria-checked', 'true');
        }

        // Reading Guide
        if (settings.readingGuide) {
            createReadingGuide();
            $('.action-box-readingGuide').addClass('active').attr('aria-checked', 'true');
        }

        // Big Cursor
        if (settings.bigBlackCursor) {
            $('body').addClass('big-black-cursor');
            $('.action-box-bigBlackCursor').addClass('active').attr('aria-checked', 'true');
        } else if (settings.bigWhiteCursor) {
            $('body').addClass('big-white-cursor');
            $('.action-box-bigWhiteCursor').addClass('active').attr('aria-checked', 'true');
        }

        // Hide Images
        if (settings.hideImages) {
            $('html').addClass('hide-images');
            $('.action-box-hideImages').addClass('active').attr('aria-checked', 'true');
        }

        // Apply Stop Animation toggle based on saved settings
        if (settings.stopAnimation) {
            toggleStopAnimations(true, true);
            $('.action-box-stopAnimations').addClass('active').attr('aria-checked', 'true');
        } else {
            toggleStopAnimations(false, true);
        } 

        setTimeout(() => updateTriggerIcon(), 50);
    }

    function camelCase(str) {
        return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    }
    function getFontKey(el) {
        let key = el.tagName;
        if (el.id) key += `#${el.id}`;
        if (typeof el.className == 'string' && el.className.trim()) {
            key += `.${el.className.trim().replace(/\s+/g, '.')}`;
        }
        return key;
    }
    applySettings(); // ✅ Apply saved settings
});
